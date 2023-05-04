use std::collections::HashMap;

use rand::Rng;
use serde::Deserialize;
use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct ClientGameStateView {
    pub number_of_players: u8,
    pub current_turn: u8,
    pub game_state: ClientGameState,
    pub me: SessionId,
    pub room_code: String,
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
    },
    Voting {
        started_at: u64,
        question: String,
        answers: HashMap<SessionId, Answer>,
    },
    Reviewing {
        started_at: u64,
        question: String,
        answers: HashMap<SessionId, Answer>,
        number_of_players_ready: u8,
    },
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Answer {
    pub answer: String,
    pub number_of_votes: u8,
    pub players_who_voted: Vec<Player>,
    pub is_me: bool,
    pub answer_id: SessionId,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Player {
    pub random_unique_id: SessionId,
    pub is_bot: bool,
    pub score: u32,
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
