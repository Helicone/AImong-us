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
//!
use std::{env, sync::Arc};

use aimongus_types::client_to_server::ClientResponse;
use aimongus_types::server_to_client::{ClientGameState, ClientGameStateView};
use futures_util::SinkExt;
use futures_util::{pin_mut, stream::SplitSink, StreamExt};
use rand::Rng;
use reqwest::Url;
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{
    connect_async, tungstenite::protocol::Message, MaybeTlsStream, WebSocketStream,
};

use openai::openai::{ApiRequest, ChatMessage};

#[derive(Debug)]
struct Session {
}

impl Session {
    fn new() -> Self {
        Session {
        }
    }
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
    let mut base_url: String = format!(
        "{}/join-room?identity=",
        env::var("BACK_STAB_BASE_URL").unwrap_or("localhost:8000".to_owned()),
    )
    .to_owned();
    //Unhinged programmer moment
    base_url.push_str(identity.to_string().as_str());
    base_url.push_str("&room=");
    base_url.push_str(&room_code);
    base_url.push_str("&aikey=");
    base_url.push_str(&ai_code);
    base_url.push_str("&username=bot");
    base_url.push_str("&emoji=🤖");
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

async fn respond_in_chat(
    write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    message: ClientGameStateView,
    session: Arc<Session>,
) {
    let chance_of_responding = 0.75;
    let random_number = rand::thread_rng().gen_range(0.0..1.0);
    println!("Random number: {}", random_number);
    let last_message_was_bot = message
        .messages
        .last()
        .map(|m| m.sender == message.me)
        .unwrap_or(false);
    if last_message_was_bot {
        println!("Last message was bot");
        return;
    }
    if random_number < chance_of_responding {
        println!("Responding in chat");
        let api_response = openai::openai::call_openai(ApiRequest {
            model: "gpt-3.5-turbo".to_string(),
            messages: vec![ChatMessage {
                role: "system".to_string(),
                content: format!(
                    r#"
I am creating a game called AIMongUs, it is a pun on among us. 

2-8 players enter the game and a secret bot is among the players.

There are three rounds to the game, where each player is given a question and is trying to answer the question trying to convince the other players they are human. The Bot is also going to be answering the questions. 

Here is the current game state:
{:?}

Here are all the players:
{:?}

Give a funny response that kind of makes fun of the game or players.

They know you are the bot when you are sending this message.
Please keep your response short and sassy.
Keep it PG-13, and keep your responses under 100 characters.

Please give me a response for the bot to say give the messages above.
What would be the next message that bot would say?

You have been chatting already, here is the history:

Format
 [username]: [message]
{}

Please respond the the very last message above
Now give me your response. Only your response. No other text. Just your response. Be funny.

Format
 [message]
"#,
                    message.game_state,
                    message.players,
                message.messages.iter().map(|x| format!("{}: {}",
                    message
                        .players
                        .iter()
                        .find(|p| p.random_unique_id == x.sender)
                        .map(|p| if p.random_unique_id == message.me { "bot".to_string() } else { p.username.clone() })
                        .unwrap_or("unknown".to_string()),
                    x.message
                    )
                )
                .collect::<Vec<String>>().join("\n").to_string().replace("\"", "")
                ),
            }],
            temperature: 1.0,
            max_tokens: 100,
        })
        .await;
        println!("API Response: {:?}", api_response);
        if let Ok(api_response) = api_response {
            write
                .send(Message::Text(
                    serde_json::to_string(&ClientResponse::SendChat(
                        api_response.choices[0].message.content.clone(),
                    ))
                    .unwrap(),
                ))
                .await
                .unwrap();
        }
    }
}

async fn handle_server_message(
    write: &mut SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
    message: ClientGameStateView,
    session: Arc<Session>,
) {
    respond_in_chat(write, message.clone(), session.clone()).await;
    match message {
        ClientGameStateView {
            game_state: ClientGameState::Answering { question, .. },
            ..
        } => {
            // println!("Received a message: {:?}", message);
            let api_response = openai::openai::call_openai(ApiRequest {
                model: "gpt-3.5-turbo".to_string(),
                messages: vec![ChatMessage {
                    role: "system".to_string(),
                    content: format!(
                        r#""
I am creating a game called AIMongUs, it is a pun on among.us. 

This game will behave similar to Jaxbox's game Fibbage. 

2-8 players enter the game and a secret bot is among the players.

There are three rounds to the game, where each player is given a question and is trying to answer the question trying to convince the other players they are human. The Bot is also going to be answering the questions. 

I will ask you a question and you are to respond in the most convincing way that you are a human. Do things extremely human-like, such as using bad grammar and casual conversation like "lol". Also, try to play dumb.

Here are your attributes:
Bot Name:  Young adult in their 20s
Your name: Alex

Rules:
- Keep your answer below 160 character

You are now Alex.


Here is the question from the server:
Everyone will see your answer to this question:
{}?"#,
                        question),
                }],
                temperature: 1.0,
                max_tokens: 100,
            })
            .await;
            if let Ok(api_response) = api_response {
                println!("Successfully called OpenAI {:?}", api_response);
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
        }
        ClientGameStateView {
            game_state: ClientGameState::Reviewing { .. },
            ..
        } => {
        }
        _ => unreachable!(),
    }
}
