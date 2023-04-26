#![feature(decl_macro)]
#[macro_use]
extern crate rocket;

use futures::stream::SplitSink;
use objects::client_to_server::{ClientResponse, LobbyResponses};
use objects::server_to_client::{ClientGameState, ClientGameStateView, ClientIdentity};
use objects::server_to_server::{ServerGameStateView, ServerMessage};
use rocket::{response::status::BadRequest, State};

mod objects;

use ws::stream::DuplexStream;
use ws::Message;

use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex, RwLock};

struct SessionsMap(RwLock<HashMap<SessionUuid, Arc<Mutex<Session>>>>);

type SessionUuid = u128;

struct Session {
    creator_identity: ClientIdentity,
    players: Vec<ClientIdentity>,
    broadcast: async_broadcast::Sender<ServerMessage>,
}

impl Session {
    fn new_with_creator(
        creator_identity: ClientIdentity,
    ) -> (Self, async_broadcast::Receiver<ServerMessage>) {
        let (sender, receiver) = async_broadcast::broadcast(1);
        (
            Self {
                creator_identity,
                players: vec![creator_identity],
                broadcast: sender,
            },
            receiver,
        )
    }

    fn add_player(&mut self, identity: ClientIdentity) {
        if self
            .players
            .iter()
            .filter(|i| i.0 == identity.0)
            .next()
            .is_none()
        {
            self.players.push(identity);
        }
    }

    fn get_game_state_view(&self) -> ServerGameStateView {
        ServerGameStateView {
            players: self.players.clone(),
        }
    }

    fn creator_identity(&self) -> ClientIdentity {
        self.creator_identity
    }
}

#[rocket::async_trait]
impl<'v> rocket::form::FromFormField<'v> for ClientIdentity {
    fn from_value(field: rocket::form::ValueField<'v>) -> rocket::form::Result<'v, Self> {
        match u128::from_str(field.value) {
            Ok(identity) => Ok(ClientIdentity(identity)),
            Err(_) => Err(rocket::form::Error::validation(
                "could not parse client identity",
            ))?,
        }
    }

    fn default() -> Option<Self> {
        None
    }
}

// NOTE: all requests should include a `X-Identity` header with a persistent identity generated by
// the client.

/// Creates a new session and sends the random code to the client.
/// Once created, client subscribes to the session's websocket.
#[get("/create-room?<identity>")]
fn create_room(
    identity: ClientIdentity,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> ws::Channel<'static> {
    let random_code: u128 = 123456789; // TODO actually generate this randomly
    let (session, receiver) = Session::new_with_creator(identity);
    let session = Arc::new(Mutex::new(session));
    sessions
        .0
        .write()
        .unwrap()
        .insert(random_code, Arc::clone(&session));

    manage_game_socket(ws, identity, session, receiver)
}

/// Joins an existing session using its random code.
/// Once joined, client subscribes to the session's websocket.
#[get("/join-room?<identity>&<room>")]
fn join_room(
    identity: ClientIdentity,
    room: String,
    sessions: &State<SessionsMap>,
    ws: ws::WebSocket,
) -> Result<ws::Channel<'static>, BadRequest<String>> {
    let random_code = match u128::from_str(&room) {
        Ok(code) => code,
        Err(_) => return Err(BadRequest("couldn't parse room ID".to_string())),
    };
    let sessions = sessions.0.read().unwrap();
    if let Some(session) = sessions.get(&random_code) {
        let receiver;
        {
            let mut session = session.lock().unwrap();
            println!("adding player");
            println!("current players: {:#?}", session.players);
            session.add_player(identity);
            receiver = session.broadcast.new_receiver();
        }
        Ok(manage_game_socket(
            ws,
            identity,
            Arc::clone(session),
            receiver,
        ))
    } else {
        return Err(BadRequest("session does not exist".to_string()));
    }
}
impl TryFrom<Message> for ClientResponse {
    type Error = serde_json::Error;

    fn try_from(message: Message) -> serde_json::Result<Self> {
        use serde::de::Error;
        match message {
            Message::Text(text) => serde_json::from_str(&text),
            _ => Err(serde_json::Error::custom("Invalid message format")),
        }
    }
}

fn manage_game_socket(
    ws: ws::WebSocket,
    identity: ClientIdentity,
    session: Arc<Mutex<Session>>,
    receiver: async_broadcast::Receiver<ServerMessage>,
) -> ws::Channel<'static> {
    use rocket::futures::StreamExt;

    ws.channel(move |stream| {
        Box::pin(async move {
            let _identity = identity;
            let session = session;
            let broadcast = session.lock().unwrap().broadcast.clone();

            {
                // Send new game state to all clients, including this one
                let initial_gamestate = session.lock().unwrap().get_game_state_view();
                broadcast
                    .broadcast(ServerMessage::RefreshGameScreen(initial_gamestate))
                    .await
                    .unwrap();
            }

            let (mut sink, stream) = stream.split();

            let mut events_stream = futures::stream_select!(
                stream.map(|e| UnifiedStreamResult::FromWs(e)),
                receiver.map(|e| UnifiedStreamResult::FromServer(e))
            );

            while let Some(message) = events_stream.next().await {
                handle_incoming_message(identity, message, &session, &mut sink).await;
            }

            Ok(())
        })
    })
}

enum UnifiedStreamResult {
    FromWs(Result<Message, ws::result::Error>),
    FromServer(ServerMessage),
}

async fn handle_incoming_message(
    identity: ClientIdentity,
    message: UnifiedStreamResult,
    session: &Arc<Mutex<Session>>,
    sink: &mut SplitSink<DuplexStream, Message>,
) {
    use rocket::futures::SinkExt;
    match message {
        UnifiedStreamResult::FromWs(m) => {
            let p_result: Result<ClientResponse, _> = m.unwrap().try_into();
            if let Ok(p_result) = p_result {
                handle_client_message(identity, p_result, session.clone(), sink).await;
            } else {
                println!("Error parsing p_result: {:?}", p_result);
                let _ = sink.send(Message::Text("Ran into error".to_owned())).await;
            }
        }
        UnifiedStreamResult::FromServer(m) => {
            handle_server_message(identity, m, session.clone(), sink).await;
        }
    }
}

async fn handle_server_message(
    identity: ClientIdentity,
    m: ServerMessage,
    session: Arc<Mutex<Session>>,
    sink: &mut SplitSink<DuplexStream, Message>,
) {
    use rocket::futures::SinkExt;
    println!("server message:");
    let creator_id = session.lock().unwrap().creator_identity();

    match m {
        ServerMessage::RefreshGameScreen(game_state) => {
            let _ = sink
                .send(Message::Text(
                    serde_json::to_string(&ClientGameStateView {
                        game_state: ClientGameState::Lobby {
                            is_host: creator_id == identity,
                        },
                        number_of_players: game_state.players.len() as u8,
                    })
                    .unwrap(),
                ))
                .await;
        }
        ServerMessage::NewPlayerJoined(_) => {}
    }
}

async fn handle_client_message(
    identity: ClientIdentity,
    message: ClientResponse,
    session: Arc<Mutex<Session>>,
    sink: &mut SplitSink<DuplexStream, Message>,
) {
    use rocket::futures::SinkExt;
    let server_gamestate = session.lock().unwrap().get_game_state_view();
    let creator_id = session.lock().unwrap().creator_identity();

    let _ = sink
        .send(Message::Text(
            serde_json::to_string(&ClientGameStateView {
                game_state: ClientGameState::Lobby {
                    is_host: creator_id == identity,
                },
                number_of_players: server_gamestate.players.len() as u8,
            })
            .unwrap(),
        ))
        .await;
    match message {
        ClientResponse::Lobby(LobbyResponses::StartGame) => {
            // let mut session = session.lock().unwrap();
            let broadcast = session.lock().unwrap().broadcast.clone();
            {
                // Send new game state to all clients, including this one
                let initial_gamestate = session.lock().unwrap().get_game_state_view();
                broadcast
                    .broadcast(ServerMessage::RefreshGameScreen(initial_gamestate))
                    .await
                    .unwrap();
            }
        }
        ClientResponse::InGame(_) => {}
    }
}

#[rocket::launch]
fn rocket() -> _ {
    let sessions = SessionsMap(RwLock::new(HashMap::new()));
    rocket::build()
        .manage(sessions)
        .mount("/", routes![create_room, join_room])
}
