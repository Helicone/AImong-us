use serde::Deserialize;
use ts_rs::TS;

pub type RandomUniqueId = u128;

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct ClientGameStateView {
    pub number_of_players: u8,
    pub current_turn: u8,
    pub game_state: ClientGameState,
    pub me: RandomUniqueId,
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
        answers: Vec<Answer>,
    },
    Reviewing {
        started_at: u64,
        question: String,
        answers: Vec<Answer>,
        // true if a bot was eliminated
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
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Player {
    pub random_unique_id: RandomUniqueId,
    pub is_bot: bool,
    pub score: u32,
}
