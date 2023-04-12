use super::server_to_client::ClientIdentity;

#[derive(Clone)]
pub enum ServerMessage {
    RefreshGameScreen(ServerGameStateView),
    NewPlayerJoined(NewPlayerJoined),
}

#[derive(Clone, Copy)]
pub struct NewPlayerJoined {
    pub total_players: u8,
}

#[derive(Clone)]
pub struct ServerGameStateView {
    pub players: Vec<ClientIdentity>,
}
