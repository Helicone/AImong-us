use serde::{Deserialize, Serialize};

use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(Serialize, Deserialize, Debug)]
pub enum ClientResponse {
    StartGame,
    SubmitAnswer(String),
}
