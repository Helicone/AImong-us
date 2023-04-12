use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone)]
pub struct ClientGameStateView {
    pub number_of_players: u8,
    pub game_state: ClientGameState,
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone)]
#[serde(tag = "state", content = "content")]
pub enum ClientGameState {
    Lobby { is_host: bool },
    InGame(InGameClientGameState),
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize, Clone)]
pub struct InGameClientGameState {
    pub players: Vec<u128>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ClientIdentity(pub u128);
