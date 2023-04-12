use serde::{Deserialize, Serialize};

use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(Serialize, Deserialize, Debug)]

pub enum ClientResponse {
    Lobby(LobbyResponses),
    InGame(InGameClientResponses),
}

#[derive(TS)]
#[ts(export)]
#[derive(Serialize, Deserialize, Debug)]
pub enum LobbyResponses {
    StartGame,
}

#[derive(TS)]
#[ts(export)]
#[derive(Serialize, Deserialize, Debug)]
pub enum InGameClientResponses {}
