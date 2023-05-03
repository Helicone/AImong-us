#[macro_use]
extern crate rocket;

use aimongus_types::client_to_server::ClientResponse;
use aimongus_types::server_to_client::{ClientGameState, ClientGameStateView};
use futures::stream::SplitSink;
use objects::server_to_server::ServerMessage;
use rand::Rng;
use rocket::{response::status::BadRequest, State};

mod objects;

use ws::stream::DuplexStream;
use ws::Message;

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::sync::{Arc, Mutex, RwLock};
use std::{env, str};

struct SessionsMap(RwLock<HashMap<RoomCode, Arc<Mutex<Session>>>>);

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
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
    answers: HashMap<ClientIdentity, String>,
    votes: HashMap<ClientIdentity, ClientIdentity>,
    ready_for_next_turn: HashSet<ClientIdentity>,
}

impl Turn {
    fn new() -> Self {
        Self {
            question: "How many TODOs could a TODO do if a TODO could do TODOs?".to_string(),
            started_at: std::time::SystemTime::now(),
            voting_started_at: None,
            reviewing_started_at: None,
            answers: HashMap::new(),
            votes: HashMap::new(),
            ready_for_next_turn: HashSet::new(),
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
    players: Vec<Player>,
    broadcast: async_broadcast::Sender<ServerMessage>,
    turns: Vec<Turn>,
    stage: GameStage,
    aikey: u128,
    ai_player: Option<ClientIdentity>,
}

#[derive(Debug, Clone)]
pub struct SessionId(pub u128);

impl SessionId {
    fn new() -> Self {
        let mut rng = rand::thread_rng();
        let random_u128: u128 = rng.gen();
        Self(random_u128)
    }
}
#[derive(Clone, Debug)]
struct Player {
    // Random id that is only unique within this session for this user
    session_id: SessionId,
    identity: ClientIdentity,
    score: u32,
}

impl Player {
    fn new(identity: ClientIdentity) -> Self {
        Player {
            session_id: SessionId::new(),
            identity: identity,
            score: 0,
        }
    }
}

impl Session {
    fn new_with_creator(
        creator_identity: ClientIdentity,
        room_code: &RoomCode,
    ) -> (Self, async_broadcast::Receiver<ServerMessage>) {
        let mut rng = rand::thread_rng();
        let random_u128: u128 = rng.gen();
        let (sender, receiver) = async_broadcast::broadcast(1);
        (
            Self {
                room_code: room_code.clone(),
                creator_identity,
                players: vec![Player::new(creator_identity)],
                broadcast: sender,
                turns: vec![],
                stage: GameStage::NotStarted,
                aikey: random_u128,
                ai_player: None,
            },
            receiver,
        )
    }

    fn add_player(&mut self, identity: ClientIdentity, is_ai: bool) {
        if self
            .players
            .iter()
            .filter(|p| p.identity.0 == identity.0)
            .next()
            .is_none()
        {
            let player = Player::new(identity);
            if is_ai {
                self.ai_player = Some(player.identity);
            }
            self.players.push(player);
        }
    }

    fn non_bot_players(&self) -> Vec<&Player> {
        self.players
            .iter()
            .filter(|p| p.identity != self.ai_player.unwrap_or(ClientIdentity(0)))
            .collect()
    }

    fn get_game_state_view(&self, identity: ClientIdentity) -> ClientGameStateView {
        match self.stage {
            GameStage::NotStarted => ClientGameStateView {
                number_of_players: self.non_bot_players().len() as u8,
                game_state: ClientGameState::Lobby {
                    is_host: identity == self.creator_identity,
                },
                current_turn: self.turns.len() as u8,
                me: self.get_player(&identity).session_id.0 as u128,
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
                        you_voted: turn.answers.contains_key(&identity),
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.get_player(&identity).session_id.0 as u128,
                    room_code: self.room_code.to_string(),
                }
            }
            GameStage::Voting => {
                let turn = self.current_turn();
                ClientGameStateView {
                    game_state: ClientGameState::Voting {
                        votes: turn
                            .votes
                            .iter()
                            .map(|(k, v)| {
                                (
                                    self.get_player(k).session_id.0,
                                    self.get_player(v).session_id.0,
                                )
                            })
                            .collect(),
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
                            .map(|(k, v)| {
                                (
                                    self.get_player(&k).session_id.0,
                                    aimongus_types::server_to_client::Answer {
                                        answer: v.clone(),
                                        player_id: k.0,
                                    },
                                )
                            })
                            .collect(),
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.get_player(&identity).session_id.0 as u128,
                    room_code: self.room_code.to_string(),
                }
            }
            GameStage::Reviewing => {
                let turn = self.current_turn();
                let answers = turn
                    .answers
                    .iter()
                    .map(|(k, v)| {
                        (
                            self.get_player(&k).session_id.0,
                            aimongus_types::server_to_client::Answer {
                                answer: v.clone(),
                                player_id: k.0,
                            },
                        )
                    })
                    .collect();
                ClientGameStateView {
                    game_state: ClientGameState::Reviewing {
                        question: turn.question.clone(),
                        started_at: turn
                            .reviewing_started_at
                            .unwrap()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                        votes: turn
                            .votes
                            .iter()
                            .map(|(k, v)| {
                                (
                                    self.get_player(k).session_id.0,
                                    self.get_player(v).session_id.0,
                                )
                            })
                            .collect(),
                        answers,
                        //eliminated,
                        number_of_players_ready: turn.ready_for_next_turn.len() as u8,
                    },
                    number_of_players: self.players.len() as u8,
                    current_turn: self.turns.len() as u8,
                    me: self.get_player(&identity).session_id.0 as u128,
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

    fn get_player(&self, identity: &ClientIdentity) -> &Player {
        self.players
            .iter()
            .find(|p| p.identity == *identity)
            .expect("client identity missing from players")
    }

    fn get_player_using_id(&self, id: u128) -> &Player {
        self.players
            .iter()
            .find(|p| p.session_id.0 == id)
            .expect("client identity missing from players")
    }

    fn get_player_mut(&mut self, identity: &ClientIdentity) -> &mut Player {
        self.players
            .iter_mut()
            .find(|p| p.identity == *identity)
            .expect("client identity missing from players")
    }

    fn get_player_using_id_mut(&mut self, id: u128) -> &mut Player {
        self.players
            .iter_mut()
            .find(|p| p.session_id.0 == id)
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
    println!("New session created with AI code: {}", session.aikey);

    // Spawn bot
    let url = env::var("AIGENT_BASE_URL").unwrap();
    let client = reqwest::Client::new();
    let params = [
        ("room_id", format!("{}", session.room_code)),
        ("aicode", format!("{}", session.aikey)),
    ];
    tokio::task::spawn(async move {
        let response = client.get(url).query(&params).send().await;
        println!("got response: {:?}", response);
    });

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
#[get("/join-room?<identity>&<room>&<aikey>")]
fn join_room(
    identity: ClientIdentity,
    room: RoomCode,
    aikey: Option<ClientIdentity>,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> Result<ws::Channel<'static>, BadRequest<String>> {
    let room_code = room;
    let sessions = sessions.0.read().unwrap();
    if let Some(session) = sessions.get(&room_code) {
        let receiver;
        {
            let mut session = session.lock().unwrap();
            let is_ai = match aikey {
                Some(key) => key.0 == session.aikey,
                None => false,
            };
            println!("adding player, is_ai={}", is_ai);
            println!("current players: {:#?}", session.players);
            session.add_player(identity, is_ai);
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
            let p_result: Result<ClientResponse, _> = m.as_ref().unwrap().try_into();
            if let Ok(p_result) = p_result {
                handle_client_message(identity, p_result, session.clone(), sink).await;
            } else {
                println!("Could not parse: {:?}", m);
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

async fn end_voting(session: Arc<Mutex<Session>>, turn_size: usize) {
    println!("ending voting");
    let broadcast = {
        let mut locked_session = session.lock().unwrap();

        if !matches!(locked_session.stage, GameStage::Voting) {
            // TODO handle this better
            return;
        }
        if locked_session.turns.len() - 1 > turn_size {
            // that turn already finished
            return;
        }
        let turn = locked_session.current_turn_mut();
        turn.reviewing_started_at = Some(std::time::SystemTime::now());
        let answer_clone = turn.answers.clone();
        drop(turn);
        let answers: HashMap<u128, aimongus_types::server_to_client::Answer> = answer_clone
            .iter()
            .map(|(k, v)| {
                (
                    locked_session.get_player_mut(&k).session_id.0,
                    aimongus_types::server_to_client::Answer {
                        answer: v.clone(),
                        player_id: k.0,
                    },
                )
            })
            .collect();

        {
            for a in answers {
                let mut player: &mut Player = locked_session.get_player_using_id_mut(a.0);
                player.score = player.score + 1;
            }
        }
        locked_session.stage = GameStage::Reviewing;

        locked_session.broadcast.clone()
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
    println!("client message: {:?}", message);
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
            locked_session.turns.push(Turn::new());
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
            let players: Vec<Player> = locked_session.players.clone();
            let turn = locked_session.current_turn_mut();
            if turn.answers.contains_key(&identity) {
                // TODO send an error instead of silently exiting
                return;
            }
            turn.answers.insert(identity, answer);

            if turn
                .answers
                .keys()
                .all(|id| players.iter().filter(|p| p.session_id.0 == id.0).count() > 0)
            {
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
            let mut locked_session = session.lock().unwrap();
            if !matches!(locked_session.stage, GameStage::Voting) {
                // TODO send an error instead of silently exiting
                return;
            }
            if vote as usize >= locked_session.players.len() {
                // TODO send an error instead of silently exiting
                return;
            }
            let target_identity = locked_session.get_player_using_id(vote).identity;
            locked_session
                .current_turn_mut()
                .votes
                .insert(identity, target_identity);
            locked_session.broadcast.clone()
        }
        ClientResponse::ReadyForNextTurn => {
            let mut locked_session = session.lock().unwrap();
            if !matches!(locked_session.stage, GameStage::Reviewing) {
                // TODO send an error instead of silently exiting
                return;
            }
            let turn_number = locked_session.players.len();
            let turn = locked_session.current_turn_mut();
            turn.ready_for_next_turn.insert(identity);
            if turn.ready_for_next_turn.iter().count() as f32 > turn.answers.len() as f32 * 0.50 {
                locked_session.stage = GameStage::Answering;
                locked_session.turns.push(Turn::new());
                let async_session = Arc::clone(&session);
                tokio::task::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_secs(ANSWERING_TIMEOUT_SECS))
                        .await;
                    end_answering(async_session, turn_number).await;
                });
            }
            locked_session.broadcast.clone()
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
