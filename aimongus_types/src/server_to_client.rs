use serde::Deserialize;
use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct ClientGameStateView {
    pub number_of_players: u8,
    pub current_turn: u8,
    pub game_state: ClientGameState,
    pub me: u8,
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
        answers: Vec<Answer>,
        votes: Vec<Option<u8>>,
    },
    Reviewing {
        started_at: u64,
        question: String,
        answers: Vec<Answer>,
        votes: Vec<Option<u8>>,
        // true if a bot was eliminated
        eliminated: Option<(u8, bool)>,
    },
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone, Deserialize, Debug)]
pub struct Answer {
    pub answer: String,
    pub player_id: u8,
}
