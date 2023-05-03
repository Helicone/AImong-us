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
    pub me: u128,
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
        you_voted: bool,
    },
    Voting {
        started_at: u64,
        question: String,
        answers: HashMap<u128, Answer>,
        votes: HashMap<u128, u128>,
    },
    Reviewing {
        started_at: u64,
        question: String,
        answers: HashMap<u128, Answer>,
        votes: HashMap<u128, u128>,
        // true if a bot was eliminated
        //eliminated: Option<(u8, bool)>,
        number_of_players_ready: u8,
    },
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Answer {
    pub answer: String,
    pub player_id: u128,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct SessionId(pub u128);

impl SessionId {
    pub fn new() -> Self {
        let mut rng = rand::thread_rng();
        let random_u128: u128 = rng.gen();
        Self(random_u128)
    }
}
