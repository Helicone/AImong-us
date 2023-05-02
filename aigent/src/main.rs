//! A simple example of hooking up stdin/stdout to a WebSocket stream.
//!
//! This example will connect to a server specified in the argument list and
//! then forward all data read on stdin to the server, printing out all data
//! received on stdout.
//!
//! Note that this is not currently optimized for performance, especially around
//! buffer management. Rather it's intended to show an example of working with a
//! client.
//!
//! You can use this example together with the `server` example.

use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use std::{env, sync::Arc};

use aimongus_types::client_to_server::ClientResponse;
use aimongus_types::server_to_client::{ClientGameState, ClientGameStateView};
use futures_channel::mpsc::UnboundedSender;
use futures_util::SinkExt;
use futures_util::{future, pin_mut, stream::SplitSink, StreamExt};
use rand::Rng;
use reqwest::Url;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::Mutex,
};
use tokio_tungstenite::{
    connect_async, tungstenite::protocol::Message, MaybeTlsStream, WebSocketStream,
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Choice {
    message: ChatMessage,
    finish_reason: String,
    index: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct Usage {
    prompt_tokens: i32,
    completion_tokens: i32,
    total_tokens: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    id: String,
    object: String,
    created: i64,
    model: String,
    usage: Usage,
    choices: Vec<Choice>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: i32,
}

#[derive(Debug)]
struct Session {
    voting_thread_spawned: AtomicBool,
}

impl Session {
    fn new() -> Self {
        Session {
            voting_thread_spawned: AtomicBool::new(false),
        }
    }
}

async fn call_openai(request: ApiRequest) -> Result<ApiResponse, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://oai.hconeai.com/v1/chat/completions")
        .bearer_auth(env::var("OPENAI_API_KEY").unwrap())
        .header("Content-Type", "application/json")
        .header("OpenAI-Organization", "")
        .body(serde_json::to_string(&request).unwrap())
        .send();

    let resp = &resp.await?.text().await?;

    let api_response: ApiResponse = serde_json::from_str(resp).map_err(|e| {
        format!(
            "Failed to parse response from OpenAI: {}, resp: {}",
            e, resp
        )
    })?;
    return Ok(api_response);
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    //Arg 1 = Room code
    //Arg 2 = AI code

    let room_code: String = env::args()
        .nth(1)
        .unwrap_or_else(|| panic!("this program requires at least two arguments"));

    let ai_code: String = env::args()
        .nth(2)
        .unwrap_or_else(|| panic!("this program requires at least two arguments"));

    let mut rng = rand::thread_rng();
    let identity: u128 = rng.gen();
    let mut base_url: String = "ws://127.0.0.1:8000/join-room?identity=".to_owned();
    //Unhinged programmer moment
    base_url.push_str(identity.to_string().as_str());
    base_url.push_str("&room=");
    base_url.push_str(&room_code);
    base_url.push_str("&aikey=");
    base_url.push_str(&ai_code);
    println!("{}", base_url);
    let url: Url = url::Url::parse(&base_url).unwrap();
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");
    println!("WebSocket handshake has been successfully completed");

    let (write, read) = ws_stream.split();

    let write = Arc::new(Mutex::new(write));

    let session = Arc::new(Session::new());

    let ws_to_stdout = {
        read.for_each(move |message| {
            let write = Arc::clone(&write);
            let session = Arc::clone(&session);
            async move {
                let server_msg =
                    serde_json::from_str::<ClientGameStateView>(&message.unwrap().to_string())
                        .unwrap();

                let server_msg_clone = server_msg.clone();
                handle_server_message(&mut *write.lock().await, server_msg_clone, session).await;
            }
        })
    };

    pin_mut!(ws_to_stdout);
    ws_to_stdout.await;
    return Ok(());
}

async fn handle_server_message(
    write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    message: ClientGameStateView,
    session: Arc<Session>,
) {
    println!("Received a message: {:?}", message);
    match message {
        ClientGameStateView {
            game_state:
                ClientGameState::Answering {
                    started_at,
                    question,
                    you_voted,
                },
            ..
        } => {
            // println!("Received a message: {:?}", message);
            let api_response = call_openai(ApiRequest {
                model: "gpt-3.5-turbo".to_string(),
                messages: vec![ChatMessage {
                    role: "system".to_string(),
                    content: format!(
                        r#""I am running an experiment to test if a user can determine the difference between and human and a robot. Your goal is to convince me that you are a human. I will ask you a question and you are to respond in the most convincing way that you are a human. Do things extremely human-like, such as using bad grammar and casual conversation like "lol". Also, try to play dumb.

Rules:
- Keep your answer below 160 character

{}?"#,
                        question),
                }],
                temperature: 1.0,
                max_tokens: 100,
            })
            .await;
            if let Ok(api_response) = api_response {
                let _ = (*write)
                    .send(Message::Text(
                        serde_json::to_string(&ClientResponse::SubmitAnswer(
                            api_response.choices[0].message.content.clone(),
                        ))
                        .unwrap(),
                    ))
                    .await;
            } else {
                println!("Failed to call OpenAI {:?}", api_response);
            }
        }
        ClientGameStateView {
            game_state: ClientGameState::Lobby { .. },
            ..
        } => {
            println!("We are in the lobby");
        }
        ClientGameStateView {
            game_state: ClientGameState::Voting { .. },
            ..
        } => {
            if !session.voting_thread_spawned.swap(true, Ordering::SeqCst) {
                let session_clone = Arc::clone(&session);

                thread::spawn(move || {
                    while session_clone.voting_thread_spawned.load(Ordering::SeqCst) {
                        println!("hello");
                        thread::sleep(Duration::from_secs(1));
                    }
                });
            }
        }
        ClientGameStateView {
            game_state: ClientGameState::Reviewing { .. },
            ..
        } => {
            session.voting_thread_spawned.store(false, Ordering::SeqCst);
        }

        _ => todo!(),
    }
}
