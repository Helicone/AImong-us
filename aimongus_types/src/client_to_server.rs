use crate::server_to_client::SessionId;
use serde::{Deserialize, Serialize};

use ts_rs::TS;

#[derive(TS)]
#[ts(export)]
#[derive(Serialize, Deserialize, Debug)]
pub enum ClientResponse {
    StartGame,
    SubmitAnswer(String),
    SubmitVote { answer_id: SessionId },
    ReadyForNextTurn,
    SendChat(String),
    SetQuestions(Vec<String>),
}

#[cfg(feature = "server")]
use ws::Message;

#[cfg(feature = "server")]
impl TryFrom<&Message> for ClientResponse {
    type Error = serde_json::Error;

    fn try_from(message: &Message) -> serde_json::Result<Self> {
        use serde::de::Error;
        match message {
            Message::Text(text) => serde_json::from_str(&text),
            _ => Err(serde_json::Error::custom("Invalid message format")),
        }
    }
}
