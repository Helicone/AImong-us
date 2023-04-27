#![feature(decl_macro)]
#[macro_use]
extern crate rocket;

use futures::stream::SplitSink;
use objects::client_to_server::ClientResponse;
use objects::server_to_client::{ClientGameState, ClientGameStateView};
use objects::server_to_server::ServerMessage;
use rocket::{response::status::BadRequest, State};

mod objects;

use ws::stream::DuplexStream;
use ws::Message;

use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex, RwLock};

struct SessionsMap(RwLock<HashMap<SessionUuid, Arc<Mutex<Session>>>>);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ClientIdentity(pub u128);

type SessionUuid = u128;

struct Turn {
    question: String,
    started_at: std::time::SystemTime,
    answers: Vec<Option<String>>,
    votes: Vec<Option<u8>>,
}

impl Turn {
    fn new(num_players: usize) -> Self {
        Self {
            question: "How many TODOs could a TODO do if a TODO could do TODOs?".to_string(),
            started_at: std::time::SystemTime::now(),
            answers: vec![None; num_players],
            votes: vec![None; num_players],
        }
    }
}

enum GameStage {
    NotStarted,
    Answering,
    Voting,
    Reviewing,
    GameOver,
}

struct Session {
    room_code: u128,
    creator_identity: ClientIdentity,
    players: Vec<ClientIdentity>,
    broadcast: async_broadcast::Sender<ServerMessage>,
    turns: Vec<Turn>,
    stage: GameStage,
}

impl Session {
    fn new_with_creator(
        creator_identity: ClientIdentity,
        room_code: u128,
    ) -> (Self, async_broadcast::Receiver<ServerMessage>) {
        let (sender, receiver) = async_broadcast::broadcast(1);
        (
            Self {
                room_code,
                creator_identity,
                players: vec![creator_identity],
                broadcast: sender,
                turns: vec![],
                stage: GameStage::NotStarted,
            },
            receiver,
        )
    }

    fn add_player(&mut self, identity: ClientIdentity) {
        if self
            .players
            .iter()
            .filter(|i| i.0 == identity.0)
            .next()
            .is_none()
        {
            self.players.push(identity);
        }
    }

    fn get_game_state_view(&self, identity: ClientIdentity) -> ClientGameStateView {
        match self.stage {
            GameStage::NotStarted => ClientGameStateView {
                number_of_players: self.players.len() as u8,
                game_state: ClientGameState::Lobby {
                    is_host: identity == self.creator_identity,
                },
                current_turn: self.turns.len() as u8,
                me: self.player_index(&identity) as u8,
                room_code: self.room_code,
            },
            GameStage::Answering => {
                let turn = self.current_turn();
                ClientGameStateView {
                    game_state: ClientGameState::Answering {
                        question: turn.question.clone(),
                        started_at: turn
                            .started_at
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                        you_voted: turn.answers[self.player_index(&identity)].is_some(),
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.player_index(&identity) as u8,
                    room_code: self.room_code,
                }
            }
            GameStage::Voting => {
                let turn = self.current_turn();
                ClientGameStateView {
                    game_state: ClientGameState::Voting {
                        answers: turn
                            .answers
                            .iter()
                            .enumerate()
                            .map(|(i, a)| objects::server_to_client::Answer {
                                answer: a.clone().unwrap_or("".to_string()),
                                player_id: i as u8,
                                votes: turn
                                    .votes
                                    .iter()
                                    .filter_map(|v| *v)
                                    .filter(|v| *v as usize == i)
                                    .count() as u8,
                            })
                            .collect(),
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.player_index(&identity) as u8,
                    room_code: self.room_code,
                }
            }
            GameStage::Reviewing => todo!(),
            GameStage::GameOver => todo!(),
        }
    }

    fn current_turn(&self) -> &Turn {
        let i = self.turns.len() - 1;
        &self.turns[i]
    }

    fn current_turn_mut(&mut self) -> &mut Turn {
        let i = self.turns.len() - 1;
        &mut self.turns[i]
    }

    fn player_index(&self, identity: &ClientIdentity) -> usize {
        self.players
            .iter()
            .position(|p| p == identity)
            .expect("client identity missing from players")
    }
}

#[rocket::async_trait]
impl<'v> rocket::form::FromFormField<'v> for ClientIdentity {
    fn from_value(field: rocket::form::ValueField<'v>) -> rocket::form::Result<'v, Self> {
        match u128::from_str(field.value) {
            Ok(identity) => Ok(ClientIdentity(identity)),
            Err(_) => Err(rocket::form::Error::validation(
                "could not parse client identity",
            ))?,
        }
    }

    fn default() -> Option<Self> {
        None
    }
}

// NOTE: all requests should include a `X-Identity` header with a persistent identity generated by
// the client.

/// Creates a new session and sends the random code to the client.
/// Once created, client subscribes to the session's websocket.
#[get("/create-room?<identity>")]
fn create_room(
    identity: ClientIdentity,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> ws::Channel<'static> {
    let random_code: u128 = rand::random();
    let (session, receiver) = Session::new_with_creator(identity, random_code);
    let session = Arc::new(Mutex::new(session));
    sessions
        .0
        .write()
        .unwrap()
        .insert(random_code, Arc::clone(&session));

    manage_game_socket(ws, identity, session, receiver)
}

/// Joins an existing session using its random code.
/// Once joined, client subscribes to the session's websocket.
#[get("/join-room?<identity>&<room>")]
fn join_room(
    identity: ClientIdentity,
    room: String,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> Result<ws::Channel<'static>, BadRequest<String>> {
    let random_code = match u128::from_str(&room) {
        Ok(code) => code,
        Err(_) => return Err(BadRequest("couldn't parse room ID".to_string())),
    };
    let sessions = sessions.0.read().unwrap();
    if let Some(session) = sessions.get(&random_code) {
        let receiver;
        {
            let mut session = session.lock().unwrap();
            println!("adding player");
            println!("current players: {:#?}", session.players);
            session.add_player(identity);
            receiver = session.broadcast.new_receiver();
        }
        Ok(manage_game_socket(
            ws,
            identity,
            Arc::clone(session),
            receiver,
        ))
    } else {
        return Err(BadRequest("session does not exist".to_string()));
    }
}
impl TryFrom<Message> for ClientResponse {
    type Error = serde_json::Error;

    fn try_from(message: Message) -> serde_json::Result<Self> {
        use serde::de::Error;
        match message {
            Message::Text(text) => serde_json::from_str(&text),
            _ => Err(serde_json::Error::custom("Invalid message format")),
        }
    }
}

fn manage_game_socket(
    ws: ws::WebSocket,
    identity: ClientIdentity,
    session: Arc<Mutex<Session>>,
    receiver: async_broadcast::Receiver<ServerMessage>,
) -> ws::Channel<'static> {
    use rocket::futures::StreamExt;

    ws.channel(move |stream| {
        Box::pin(async move {
            let _identity = identity;
            let session = session;

            let broadcast = {
                let session = session.lock().unwrap();
                session.broadcast.clone()
            };

            // Send new game state to all clients, including this one
            broadcast.broadcast(ServerMessage).await.unwrap();

            let (mut sink, stream) = stream.split();

            let mut events_stream = futures::stream_select!(
                stream.map(|e| UnifiedStreamResult::FromWs(e)),
                receiver.map(|e| UnifiedStreamResult::FromServer(e))
            );

            while let Some(message) = events_stream.next().await {
                handle_incoming_message(identity, message, &session, &mut sink).await;
            }

            Ok(())
        })
    })
}

enum UnifiedStreamResult {
    FromWs(Result<Message, ws::result::Error>),
    FromServer(ServerMessage),
}

async fn handle_incoming_message(
    identity: ClientIdentity,
    message: UnifiedStreamResult,
    session: &Arc<Mutex<Session>>,
    sink: &mut SplitSink<DuplexStream, Message>,
) {
    use rocket::futures::SinkExt;
    match message {
        UnifiedStreamResult::FromWs(m) => {
            let p_result: Result<ClientResponse, _> = m.unwrap().try_into();
            if let Ok(p_result) = p_result {
                handle_client_message(identity, p_result, session.clone(), sink).await;
            } else {
                println!("Error parsing p_result: {:?}", p_result);
                let _ = sink.send(Message::Text("Ran into error".to_owned())).await;
            }
        }
        UnifiedStreamResult::FromServer(m) => {
            handle_server_message(identity, m, session.clone(), sink).await;
        }
    }
}

async fn handle_server_message(
    identity: ClientIdentity,
    m: ServerMessage,
    session: Arc<Mutex<Session>>,
    sink: &mut SplitSink<DuplexStream, Message>,
) {
    use rocket::futures::SinkExt;
    println!("server message:");

    let game_state = {
        let session = session.lock().unwrap();
        session.get_game_state_view(identity)
    };

    // type safety 😎
    assert!(matches!(m, ServerMessage));

    let _ = sink
        .send(Message::Text(serde_json::to_string(&game_state).unwrap()))
        .await;
}

async fn handle_client_message(
    identity: ClientIdentity,
    message: ClientResponse,
    session: Arc<Mutex<Session>>,
    _sink: &mut SplitSink<DuplexStream, Message>, // TODO use for sending error responses
) {
    let broadcast = match message {
        ClientResponse::StartGame => {
            let mut session = session.lock().unwrap();
            if session.creator_identity != identity {
                // TODO send an error instead of silently exiting
                return;
            }
            let num_players = session.players.len();
            session.stage = GameStage::Answering;
            session.turns.push(Turn::new(num_players));
            session.broadcast.clone()
        }
        ClientResponse::SubmitAnswer(answer) => {
            let mut session = session.lock().unwrap();
            let player_index = session.player_index(&identity);
            let turn = session.current_turn_mut();
            if turn.answers[player_index].is_some() {
                // TODO send an error instead of silently exiting
                return;
            }
            turn.answers[player_index] = Some(answer);
            if turn.answers.iter().all(|answer| answer.is_some()) {
                session.stage = GameStage::Voting;
            }
            session.broadcast.clone()
        }
        ClientResponse::SubmitVote(vote) => {
            let mut session = session.lock().unwrap();
            if vote as usize >= session.players.len() {
                // TODO send an error instead of silently exiting
                return;
            }
            let player_index = session.player_index(&identity);
            let turn = session.current_turn_mut();
            turn.votes[player_index] = Some(vote);
            session.broadcast.clone()
        }
    };
    // Send new game state to all clients, including this one
    broadcast.broadcast(ServerMessage).await.unwrap();
}

#[rocket::launch]
fn rocket() -> _ {
    let sessions = SessionsMap(RwLock::new(HashMap::new()));
    rocket::build()
        .manage(sessions)
        .mount("/", routes![create_room, join_room])
}
