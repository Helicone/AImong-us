use std::collections::HashMap;

use rand::Rng;
use serde::Deserialize;
use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct ClientGameStateView {
    pub number_of_players: u8,
    pub players: Vec<Player>,
    pub current_turn: u8,
    pub game_state: ClientGameState,
    pub turn_count: u8,
    pub me: SessionId,
    pub room_code: String,
    pub messages: Vec<ChatMessage>,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
#[serde(tag = "state", content = "content")]
pub enum ClientGameState {
    Lobby {
        is_host: bool,
    },
    Answering {
        started_at: u64,
        question: String,
        you_answered: bool,
        allowed_time: u32,
    },
    Voting {
        started_at: u64,
        question: String,
        answers: HashMap<SessionId, Answer>,
        allowed_time: u32,
        you_voted: bool,
    },
    Reviewing {
        is_game_over: bool,
        started_at: u64,
        question: String,
        results: Vec<VoteResult>,
        number_of_players_ready: u8,
        bot_ids: Vec<SessionId>,
    },
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct VoteResult {
    pub answerer: SessionId,
    pub answer: Answer,
    pub players_who_voted: Vec<SessionId>,
    pub points: Points,
}
#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Points {
    pub guessing_the_bot: u32,
    pub tricking_players: u32,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Answer {
    pub answer: String,
    pub number_of_votes: u8,
    pub is_me: bool,
    pub answer_id: SessionId,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Player {
    pub random_unique_id: SessionId,
    pub score: u32,
    pub username: String,
    pub emoji: String,
    pub is_host: bool,
    pub is_bot: bool,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Copy, Deserialize, Debug, PartialEq, Eq, Hash)]
pub struct SessionId(pub u32);

impl SessionId {
    pub fn new() -> Self {
        let mut rng = rand::thread_rng();
        let random_u128: u32 = rng.gen();
        Self(random_u128)
    }
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug, PartialEq, Eq, Hash)]
pub struct ChatMessage {
    pub sender: SessionId,
    pub time_sent: u128,
    pub message: String,
}

#[derive(TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize)]
pub struct PublicRoom {
    pub room_code: String,
    pub number_of_players: u8,
}
