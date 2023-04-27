use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone)]
pub struct ClientGameStateView {
    pub number_of_players: u8,
    pub current_turn: u8,
    pub game_state: ClientGameState,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone)]
#[serde(tag = "state", content = "content")]
pub enum ClientGameState {
    Lobby {
        is_host: bool,
    },
    Answering {
        question: String,
        started_at: u64,
        you_voted: bool,
    },
    Voting {
        answers: Vec<Answer>,
    },
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone)]
pub struct Answer {
    pub answer: String,
    pub player_id: u8,
}
