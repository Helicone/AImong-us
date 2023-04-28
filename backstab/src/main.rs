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

struct SessionsMap(RwLock<HashMap<RoomCode, Arc<Mutex<Session>>>>);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ClientIdentity(pub u128);

#[derive(Eq, Hash, PartialEq, Clone)]
struct RoomCode([u8; 4]);

impl std::fmt::Display for RoomCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for c in self.0.iter() {
            write!(f, "{}", char::from(*c))?;
        }
        Ok(())
    }
}

impl RoomCode {
    pub fn new() -> Self {
        use rand::Rng;
        const MAX_ROOM_CODE: usize = 26usize.pow(5) - 1;
        let num = rand::thread_rng().gen_range(0..MAX_ROOM_CODE);
        let mut code_chars = [0u8; 4];
        for i in 0..4 {
            code_chars[i] = (num % 26usize.pow(i as u32 + 1) / 26usize.pow(i as u32)) as u8 + 65;
        }
        Self(code_chars)
    }

    pub fn from_str(s: &str) -> Result<Self, ()> {
        if s.len() != 4 || !s.chars().all(|c| c >= 'A' && c <= 'Z') {
            return Err(());
        }
        let mut room_code = [0u8; 4];
        room_code.copy_from_slice(s.to_ascii_uppercase().as_bytes());
        let this = RoomCode(room_code);
        assert!(this.is_valid());
        Ok(this)
    }

    fn is_valid(&self) -> bool {
        self.0.iter().all(|b| *b >= b'A' && *b <= b'Z')
    }
}

#[rocket::async_trait]
impl<'v> rocket::form::FromFormField<'v> for RoomCode {
    fn from_value(field: rocket::form::ValueField<'v>) -> rocket::form::Result<'v, Self> {
        match RoomCode::from_str(field.value) {
            Ok(this) => Ok(this),
            Err(_) => Err(rocket::form::Error::validation("couldn't parse room ID"))?,
        }
    }

    fn default() -> Option<Self> {
        None
    }
}

struct Turn {
    question: String,
    started_at: std::time::SystemTime,
    voting_started_at: Option<std::time::SystemTime>,
    reviewing_started_at: Option<std::time::SystemTime>,
    answers: Vec<Option<String>>,
    votes: Vec<Option<u8>>,
}

impl Turn {
    fn new(num_players: usize) -> Self {
        Self {
            question: "How many TODOs could a TODO do if a TODO could do TODOs?".to_string(),
            started_at: std::time::SystemTime::now(),
            voting_started_at: None,
            reviewing_started_at: None,
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
    room_code: RoomCode,
    creator_identity: ClientIdentity,
    players: Vec<ClientIdentity>,
    broadcast: async_broadcast::Sender<ServerMessage>,
    turns: Vec<Turn>,
    stage: GameStage,
}

impl Session {
    fn new_with_creator(
        creator_identity: ClientIdentity,
        room_code: &RoomCode,
    ) -> (Self, async_broadcast::Receiver<ServerMessage>) {
        let (sender, receiver) = async_broadcast::broadcast(1);
        (
            Self {
                room_code: room_code.clone(),
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
                room_code: self.room_code.to_string(),
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
                    room_code: self.room_code.to_string(),
                }
            }
            GameStage::Voting => {
                let turn = self.current_turn();
                ClientGameStateView {
                    game_state: ClientGameState::Voting {
                        votes: turn.votes.clone(),
                        question: turn.question.clone(),
                        started_at: turn
                            .voting_started_at
                            .unwrap()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                        answers: turn
                            .answers
                            .iter()
                            .enumerate()
                            .map(|(i, a)| objects::server_to_client::Answer {
                                answer: a.clone().unwrap_or("".to_string()),
                                player_id: i as u8,
                            })
                            .collect(),
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.player_index(&identity) as u8,
                    room_code: self.room_code.to_string(),
                }
            }
            GameStage::Reviewing => {
                let turn = self.current_turn();
                let answers = turn
                    .answers
                    .iter()
                    .enumerate()
                    .map(|(i, a)| objects::server_to_client::Answer {
                        answer: a.clone().unwrap_or("".to_string()),
                        player_id: i as u8,
                    })
                    .collect::<Vec<_>>();
                let mut votecounts = vec![0; self.players.len()];
                for v in turn.votes.iter().filter_map(|v| *v) {
                    votecounts[v as usize] += 1;
                }
                let max = votecounts.iter().max();
                let eliminated = max.and_then(|max| {
                    let first_max_pos = votecounts.iter().position(|count| *count == *max).unwrap();
                    let has_second_max = votecounts[first_max_pos + 1..].contains(max);
                    if has_second_max {
                        None
                    } else {
                        Some((votecounts[first_max_pos], false))
                    }
                });
                ClientGameStateView {
                    game_state: ClientGameState::Reviewing {
                        question: turn.question.clone(),
                        started_at: turn
                            .reviewing_started_at
                            .unwrap()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                        votes: turn.votes.clone(),
                        answers,
                        eliminated,
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.player_index(&identity) as u8,
                    room_code: self.room_code.to_string(),
                }
            }
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
            Ok(identity) => Ok(Self(identity)),
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
    let room_code = RoomCode::new();
    let (session, receiver) = Session::new_with_creator(identity, &room_code);
    let session = Arc::new(Mutex::new(session));
    sessions
        .0
        .write()
        .unwrap()
        .insert(room_code, Arc::clone(&session));

    manage_game_socket(ws, identity, session, receiver)
}

/// Joins an existing session using its random code.
/// Once joined, client subscribes to the session's websocket.
#[get("/join-room?<identity>&<room>")]
fn join_room(
    identity: ClientIdentity,
    room: RoomCode,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> Result<ws::Channel<'static>, BadRequest<String>> {
    let room_code = room;
    let sessions = sessions.0.read().unwrap();
    if let Some(session) = sessions.get(&room_code) {
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

async fn end_answering(session: Arc<Mutex<Session>>, turn: usize) {
    let broadcast = {
        let mut locked_session = session.lock().unwrap();
        if !matches!(locked_session.stage, GameStage::Answering) {
            return;
        }
        if locked_session.turns.len() - 1 > turn {
            // that turn already finished
            return;
        }
        locked_session.stage = GameStage::Voting;
        locked_session.current_turn_mut().voting_started_at = Some(std::time::SystemTime::now());
        let async_session = Arc::clone(&session);
        let turn_number = locked_session.turns.len() - 1;
        tokio::task::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(VOTING_TIMEOUT_SECS)).await;
            end_voting(async_session, turn_number).await;
        });
        locked_session.broadcast.clone()
    };

    // Send new game state to all clients
    broadcast.broadcast(ServerMessage).await.unwrap();
}

async fn end_voting(session: Arc<Mutex<Session>>, turn: usize) {
    let broadcast = {
        let mut session = session.lock().unwrap();
        if !matches!(session.stage, GameStage::Voting) {
            return;
        }
        if session.turns.len() - 1 > turn {
            // that turn already finished
            return;
        }
        session.stage = GameStage::Reviewing;
        session.current_turn_mut().reviewing_started_at = Some(std::time::SystemTime::now());
        session.broadcast.clone()
    };

    // Send new game state to all clients
    broadcast.broadcast(ServerMessage).await.unwrap();
}

const ANSWERING_TIMEOUT_SECS: u64 = 10;
const VOTING_TIMEOUT_SECS: u64 = 10;

async fn handle_client_message(
    identity: ClientIdentity,
    message: ClientResponse,
    session: Arc<Mutex<Session>>,
    _sink: &mut SplitSink<DuplexStream, Message>, // TODO use for sending error responses
) {
    let broadcast = match message {
        ClientResponse::StartGame => {
            let mut locked_session = session.lock().unwrap();
            if !matches!(locked_session.stage, GameStage::NotStarted) {
                // TODO send an error instead of silently exiting
                return;
            }
            if locked_session.creator_identity != identity {
                // TODO send an error instead of silently exiting
                return;
            }
            let num_players = locked_session.players.len();
            locked_session.stage = GameStage::Answering;
            locked_session.turns.push(Turn::new(num_players));
            let async_session = Arc::clone(&session);
            let turn_number = locked_session.turns.len() - 1;
            tokio::task::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(ANSWERING_TIMEOUT_SECS)).await;
                end_answering(async_session, turn_number).await;
            });
            locked_session.broadcast.clone()
        }
        ClientResponse::SubmitAnswer(answer) => {
            let mut locked_session = session.lock().unwrap();
            if !matches!(locked_session.stage, GameStage::Answering) {
                // TODO send an error instead of silently exiting
                return;
            }
            let player_index = locked_session.player_index(&identity);
            let turn = locked_session.current_turn_mut();
            if turn.answers[player_index].is_some() {
                // TODO send an error instead of silently exiting
                return;
            }
            turn.answers[player_index] = Some(answer);
            if turn.answers.iter().all(|answer| answer.is_some()) {
                locked_session.stage = GameStage::Voting;
                locked_session.current_turn_mut().voting_started_at =
                    Some(std::time::SystemTime::now());
                let async_session = Arc::clone(&session);
                let turn_number = locked_session.turns.len() - 1;
                tokio::task::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_secs(VOTING_TIMEOUT_SECS)).await;
                    end_voting(async_session, turn_number).await;
                });
            }
            locked_session.broadcast.clone()
        }
        ClientResponse::SubmitVote(vote) => {
            let mut session = session.lock().unwrap();
            if !matches!(session.stage, GameStage::Voting) {
                // TODO send an error instead of silently exiting
                return;
            }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_room_code_validity() {
        for _ in 0..5000 {
            let i = RoomCode::new();
            assert!(i.is_valid());
        }
    }
}
