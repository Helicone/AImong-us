#[macro_use]
extern crate rocket;

use aimongus_types::client_to_server::ClientResponse;
use aimongus_types::server_to_client::{self};
use aimongus_types::server_to_client::{ClientGameState, ClientGameStateView, SessionId};
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
use std::time::{SystemTime, UNIX_EPOCH};
use std::{env, str};

struct SessionsMap(RwLock<HashMap<RoomCode, Arc<Mutex<Session>>>>);

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct ClientIdentity(pub u128);

#[derive(Eq, Hash, PartialEq, Clone)]
struct RoomCode([u8; 4]);

const TURN_COUNT: u8 = 3;
const ANSWERING_TIMEOUT_SECS: u32 = 60;
const VOTING_TIMEOUT_SECS: u32 = 10;
const MS_BETWEEN_CHAT_MESSAGES: u128 = 500;
const POINTS_FOR_CORRECT_GUESS: u32 = 1000;
const POINTS_FOR_NOT_BEING_GUESSED: u32 = 200;

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

#[derive(Clone, Debug)]
struct Answer {
    answerer: ClientIdentity,
    answer: String,
    answer_id: SessionId,
}

impl Answer {
    fn new(answerer: ClientIdentity, answer: String) -> Self {
        let answer_id = SessionId::new();
        Self {
            answerer,
            answer,
            answer_id,
        }
    }

    fn to_view(&self, session: &Session, identity: ClientIdentity) -> server_to_client::Answer {
        server_to_client::Answer {
            answer: self.answer.clone(),
            number_of_votes: session
                .current_turn()
                .as_ref()
                .unwrap()
                .votes
                .iter()
                .filter(|(_, v)| **v == self.answerer)
                .count() as u8,
            is_me: self.answerer == identity,
            answer_id: self.answer_id,
        }
    }
}

#[derive(Clone, Debug)]
struct Turn {
    question: String,
    started_at: std::time::SystemTime,
    voting_started_at: Option<std::time::SystemTime>,
    reviewing_started_at: Option<std::time::SystemTime>,
    answers: HashMap<ClientIdentity, Answer>,
    // Votee -> Answerer
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

    fn answers_view(
        &self,
        client: ClientIdentity,
        players: &Vec<Player>,
    ) -> HashMap<server_to_client::SessionId, server_to_client::Answer> {
        self.answers
            .iter()
            .map(|(i, a)| {
                (
                    players
                        .iter()
                        .find(|p| p.identity == a.answerer)
                        .unwrap()
                        .session_id
                        .clone(),
                    aimongus_types::server_to_client::Answer {
                        answer: a.answer.clone(),
                        number_of_votes: self.votes.iter().filter(|(_, v)| **v == *i).count() as u8,
                        is_me: a.answerer == client,
                        answer_id: a.answer_id,
                    },
                )
            })
            .collect()
    }

    fn get_answer(&self, answer_id: SessionId) -> Option<&Answer> {
        self.answers
            .iter()
            .find(|(_, a)| a.answer_id == answer_id)
            .map(|(_, a)| a)
    }
}

enum GameStage {
    NotStarted,
    Answering,
    Voting,
    Reviewing,
    GameOver,
}

#[derive(Clone, Debug)]
struct ChatMessage {
    sender: SessionId,
    time_sent: SystemTime,
    chat_message: String,
}

impl From<ChatMessage> for server_to_client::ChatMessage {
    fn from(message: ChatMessage) -> Self {
        Self {
            sender: message.sender,
            time_sent: message
                .time_sent
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis(),
            message: message.chat_message.clone(),
        }
    }
}

struct Session {
    room_code: RoomCode,
    creator_identity: ClientIdentity,
    players: Vec<Player>,
    broadcast: async_broadcast::Sender<ServerMessage>,
    turns: Vec<Turn>,
    stage: GameStage,
    aikey: SessionId,
    messages: Vec<ChatMessage>,
}

#[derive(Clone, Debug)]
struct Player {
    // Random id that is only unique within this session for this user
    session_id: SessionId,
    identity: ClientIdentity,
    score: u32,
    is_bot: bool,
    username: String,
    last_message_sent: SystemTime,
    is_host: bool,
    emoji: String,
}

impl Player {
    fn new(
        identity: ClientIdentity,
        is_bot: bool,
        username: String,
        is_host: bool,
        emoji: String,
    ) -> Self {
        Player {
            session_id: SessionId::new(),
            identity: identity,
            score: 0,
            is_bot,
            username,
            last_message_sent: SystemTime::now(),
            is_host,
            emoji,
        }
    }
}

impl From<Player> for server_to_client::Player {
    fn from(player: Player) -> Self {
        Self {
            random_unique_id: player.session_id,
            score: player.score,
            username: player.username,
            is_host: player.is_host,
            emoji: player.emoji,
        }
    }
}

impl Session {
    fn player_count(&self) -> usize {
        self.players.len()
    }

    fn all_answered(&self) -> bool {
        self.players
            .iter()
            .all(|p| self.has_client_answered(p.identity))
    }

    fn has_client_answered(&self, client_identity: ClientIdentity) -> bool {
        self.current_turn()
            .unwrap()
            .answers
            .contains_key(&client_identity)
    }

    fn has_client_voted(&self, client_identity: ClientIdentity) -> bool {
        self.current_turn()
            .unwrap()
            .votes
            .contains_key(&client_identity)
    }

    fn is_ready_for_next_turn(&self, client_identity: ClientIdentity) -> bool {
        self.current_turn()
            .unwrap()
            .ready_for_next_turn
            .contains(&client_identity)
    }

    fn get_ai_players(&self) -> Vec<&Player> {
        self.players.iter().filter(|p| p.is_bot).collect()
    }

    fn new_with_creator(
        room_code: &RoomCode,
        creator: Player,
    ) -> (Self, async_broadcast::Receiver<ServerMessage>) {
        let (sender, receiver) = async_broadcast::broadcast(1);
        (
            Self {
                room_code: room_code.clone(),
                creator_identity: creator.identity.clone(),
                players: vec![creator],
                broadcast: sender,
                turns: vec![],
                stage: GameStage::NotStarted,
                aikey: SessionId::new(),
                messages: vec![],
            },
            receiver,
        )
    }

    fn add_player(
        &mut self,
        identity: ClientIdentity,
        is_ai: bool,
        username: String,
        emoji: String,
    ) {
        if self
            .players
            .iter()
            .filter(|p| p.identity.0 == identity.0)
            .next()
            .is_none()
        {
            let player = Player::new(identity, is_ai, username, false, emoji);
            self.players.push(player);
        }
    }

    fn non_bot_players(&self) -> Vec<&Player> {
        self.players.iter().filter(|p| p.is_bot == false).collect()
    }

    fn get_player(&self, identity: ClientIdentity) -> Option<&Player> {
        self.players
            .iter()
            .filter(|p| p.identity == identity)
            .next()
    }

    fn players_who_voted_for_bot(&self) -> Vec<&Player> {
        self.current_turn()
            .unwrap()
            .votes
            .iter()
            .filter(|(_, v)| self.get_player(**v).unwrap().is_bot)
            .filter_map(|(v, _)| self.get_player(*v))
            .collect()
    }

    fn votes_view(&self, identity: ClientIdentity) -> Vec<server_to_client::VoteResult> {
        self.players
            .iter()
            .filter_map(
                |&Player {
                     identity: player_identity,
                     session_id,
                     ..
                 }|
                 -> Option<server_to_client::VoteResult> {
                    let current_turn = self.current_turn()?;
                    return Some(server_to_client::VoteResult {
                        answer: current_turn
                            .answers
                            .get(&player_identity)?
                            .clone()
                            .to_view(&self, identity),
                        answerer: session_id.clone(),
                        players_who_voted: current_turn
                            .votes
                            .iter()
                            .filter(|(_, v)| *v == &player_identity)
                            .filter_map(|(v, _)| self.get_player(*v).map(|p| p.session_id))
                            .collect(),
                        points: {
                            let guessed_the_bot = self
                                .players_who_voted_for_bot()
                                .iter()
                                .any(|p| p.identity == player_identity);

                            let did_someone_vote_for_you = current_turn
                                .votes
                                .iter()
                                .any(|(_, v)| v == &player_identity);
                            server_to_client::Points {
                                guessing_the_bot: if guessed_the_bot {
                                    POINTS_FOR_CORRECT_GUESS
                                } else {
                                    0
                                },
                                not_thinking_you_are_the_bot: if !did_someone_vote_for_you {
                                    POINTS_FOR_NOT_BEING_GUESSED
                                } else {
                                    0
                                },
                            }
                        },
                    });
                },
            )
            .collect()
    }

    fn get_inner_game_state_view(&self, identity: ClientIdentity) -> ClientGameState {
        let turn = self.current_turn();
        match (&self.stage, turn) {
            (GameStage::NotStarted, _) => ClientGameState::Lobby {
                is_host: identity == self.creator_identity,
            },
            (GameStage::Answering, Some(turn)) => ClientGameState::Answering {
                question: turn.question.clone(),
                started_at: turn
                    .started_at
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
                you_answered: turn.answers.contains_key(&identity),
                allowed_time: ANSWERING_TIMEOUT_SECS,
            },
            (GameStage::Voting, Some(turn)) => ClientGameState::Voting {
                question: turn.question.clone(),
                started_at: turn
                    .voting_started_at
                    .unwrap()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
                answers: turn.answers_view(identity, &self.players),
                allowed_time: VOTING_TIMEOUT_SECS,
            },
            (GameStage::Reviewing, Some(turn)) => ClientGameState::Reviewing {
                is_game_over: self.turns.len() == TURN_COUNT as usize,
                question: turn.question.clone(),
                started_at: turn
                    .reviewing_started_at
                    .unwrap()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
                results: self.votes_view(identity),
                number_of_players_ready: turn.ready_for_next_turn.len() as u8,
                bot_ids: self
                    .get_ai_players()
                    .iter()
                    .map(|p| p.session_id.clone())
                    .collect(),
            },
            (GameStage::GameOver, _) => todo!(),
            _ => panic!("Invalid game state"),
        }
    }

    fn get_game_state_view(&self, identity: ClientIdentity) -> ClientGameStateView {
        ClientGameStateView {
            turn_count: TURN_COUNT,
            number_of_players: self.non_bot_players().len() as u8,
            players: self
                .players
                .clone()
                .iter()
                .map(|p| server_to_client::Player::from(p.clone()))
                .collect(),
            game_state: self.get_inner_game_state_view(identity),
            current_turn: self.turns.len() as u8,
            me: self.player(&identity).unwrap().session_id.clone(),
            room_code: self.room_code.to_string(),
            messages: self
                .messages
                .clone()
                .iter()
                .map(|m| server_to_client::ChatMessage::from(m.clone()))
                .collect(),
        }
    }

    fn current_turn(&self) -> Option<&Turn> {
        self.turns.last()
    }

    fn current_turn_mut(&mut self) -> Option<&mut Turn> {
        self.turns.last_mut()
    }

    fn player(&self, identity: &ClientIdentity) -> Option<&Player> {
        self.players
            .iter()
            .filter(|p| p.identity == *identity)
            .next()
    }

    fn get_player_mut(&mut self, identity: &ClientIdentity) -> &mut Player {
        self.players
            .iter_mut()
            .find(|p| p.identity == *identity)
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
#[get("/create-room?<identity>&<username>&<emoji>")]
fn create_room(
    identity: ClientIdentity,
    username: String,
    emoji: String,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> ws::Channel<'static> {
    let room_code = RoomCode::new();
    let (session, receiver) = Session::new_with_creator(
        &room_code,
        Player::new(identity, false, username, true, emoji),
    );
    // println!("New session created with AI code: {}", session.aikey);

    // Spawn bot
    let url = env::var("AIGENT_BASE_URL").unwrap();
    let client = reqwest::Client::new();
    let params = [
        ("room_id", format!("{}", session.room_code)),
        ("aicode", format!("{}", session.aikey.0)),
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
#[get("/join-room?<identity>&<room>&<username>&<aikey>&<emoji>")]
fn join_room(
    identity: ClientIdentity,
    room: RoomCode,
    username: String,
    emoji: String,
    aikey: Option<u32>,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> Result<ws::Channel<'static>, BadRequest<String>> {
    let room_code = room;
    let sessions = sessions.0.read().unwrap();
    if let Some(session) = sessions.get(&room_code) {
        let receiver;
        {
            let mut session = session.lock().unwrap();

            let is_ai = aikey.map(|key| key == session.aikey.0).unwrap_or(false);

            println!("adding player, is_ai={}", is_ai);
            println!("current players: {:#?}", session.players);
            session.add_player(identity, is_ai, username, emoji);
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
        locked_session.current_turn_mut().unwrap().voting_started_at =
            Some(std::time::SystemTime::now());
        let async_session = Arc::clone(&session);
        let turn_number = locked_session.turns.len() - 1;
        tokio::task::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(VOTING_TIMEOUT_SECS.into())).await;
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
        {
            let turn = locked_session.current_turn_mut().unwrap();
            turn.reviewing_started_at = Some(std::time::SystemTime::now());
        }
        let players_who_voted_for_bot = locked_session
            .players_who_voted_for_bot()
            .iter()
            .map(|p| p.identity.clone())
            .collect::<Vec<_>>();

        let turn = locked_session.current_turn().map(|t| t.clone()).unwrap();
        for player in locked_session.players.iter_mut() {
            let player_identity = player.identity.clone();
            let guessed_the_bot = players_who_voted_for_bot.contains(&player_identity);

            let did_someone_vote_for_you = turn.votes.iter().any(|(_, v)| v == &player_identity);
            if !did_someone_vote_for_you {
                player.score = player.score + POINTS_FOR_NOT_BEING_GUESSED
            }
            if guessed_the_bot {
                player.score = player.score + POINTS_FOR_CORRECT_GUESS
            }
        }

        locked_session.stage = GameStage::Reviewing;

        locked_session.broadcast.clone()
    };

    // Send new game state to all clients
    broadcast.broadcast(ServerMessage).await.unwrap();
}

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
                // TODO only creator can start game
                return;
            }
            locked_session.stage = GameStage::Answering;
            locked_session.turns.push(Turn::new());
            let async_session = Arc::clone(&session);
            let turn_number = locked_session.turns.len() - 1;
            tokio::task::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(
                    ANSWERING_TIMEOUT_SECS.into(),
                ))
                .await;
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
            if locked_session.has_client_answered(identity) {
                // TODO send an error instead of silently exiting
                return;
            }
            locked_session
                .current_turn_mut()
                .unwrap()
                .answers
                .insert(identity, Answer::new(identity, answer));

            if locked_session.all_answered() {
                locked_session.stage = GameStage::Voting;
                locked_session.current_turn_mut().unwrap().voting_started_at =
                    Some(std::time::SystemTime::now());
                let async_session = Arc::clone(&session);
                let turn_number = locked_session.turns.len() - 1;
                tokio::task::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_secs(
                        VOTING_TIMEOUT_SECS.into(),
                    ))
                    .await;
                    end_voting(async_session, turn_number).await;
                });
            }
            locked_session.broadcast.clone()
        }
        ClientResponse::SubmitVote { answer_id } => {
            let mut session = session.lock().unwrap();
            if !matches!(session.stage, GameStage::Voting) {
                // TODO send an error instead of silently exiting
                return;
            }

            let answerer = session
                .current_turn()
                .unwrap()
                .get_answer(answer_id)
                .map(|a| a.answerer);

            if let Some(answerer) = answerer {
                session
                    .current_turn_mut()
                    .unwrap()
                    .votes
                    .insert(identity, answerer);
                session.broadcast.clone()
            } else {
                // TODO send an error instead of silently exiting
                println!("answerer not found");
                return;
            }
        }
        ClientResponse::ReadyForNextTurn => {
            let mut locked_session = session.lock().unwrap();
            if !matches!(locked_session.stage, GameStage::Reviewing) {
                // TODO send an error instead of silently exiting
                return;
            }

            if locked_session.is_ready_for_next_turn(identity) {
                // TODO send an error instead of silently exiting
                return;
            }
            locked_session
                .current_turn_mut()
                .unwrap()
                .ready_for_next_turn
                .insert(identity);

            let ready_count = locked_session
                .current_turn()
                .unwrap()
                .ready_for_next_turn
                .len();

            if (ready_count as f32) / locked_session.player_count() as f32 >= 0.5 {
                let turn_number = locked_session.turns.len();
                locked_session.stage = GameStage::Answering;
                locked_session.turns.push(Turn::new());
                let async_session = Arc::clone(&session);
                tokio::task::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_secs(
                        ANSWERING_TIMEOUT_SECS.into(),
                    ))
                    .await;
                    end_answering(async_session, turn_number).await;
                });
            }
            locked_session.broadcast.clone()
        }
        ClientResponse::SendChat(chat_message) => {
            let mut locked_session = session.lock().unwrap();
            let player = locked_session.get_player(identity);
            if player.is_none() {
                // TODO send an error instead of silently exiting
                return;
            }

            let session_id = player.unwrap().session_id.clone();
            let last_sent = player.unwrap().last_message_sent;

            let now = SystemTime::now();

            if last_sent.duration_since(UNIX_EPOCH).unwrap().as_millis() + MS_BETWEEN_CHAT_MESSAGES
                > now.duration_since(UNIX_EPOCH).unwrap().as_millis()
            {
                return;
            }

            if chat_message.len() == 0 {
                return;
            }

            locked_session.messages.push(ChatMessage {
                sender: session_id,
                time_sent: SystemTime::now(),
                chat_message: chat_message,
            });
            let mut player = locked_session.get_player_mut(&identity);
            player.last_message_sent = now;

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
