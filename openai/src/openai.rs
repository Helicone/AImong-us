use std::env;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Choice {
    pub message: ChatMessage,
    pub finish_reason: String,
    pub index: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Usage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub usage: Usage,
    pub choices: Vec<Choice>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: f32,
    pub max_tokens: i32,
}

pub async fn call_openai(request: ApiRequest) -> Result<ApiResponse, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    println!(
        "Helicone auth: {}",
        env::var("HELICONE_AUTH").unwrap_or("".to_string())
    );
    let resp = client
        .post("https://oai.hconeai.com/v1/chat/completions")
        .bearer_auth(env::var("OPENAI_API_KEY").unwrap())
        .header("Content-Type", "application/json")
        .header("OpenAI-Organization", "")
        .header("Helicone-Cache-Enabled", "true")
        .header("Helicone-Cache-Bucket-Max-Size", 20)
        .header(
            "Helicone-Auth",
            format!(
                "Bearer {}",
                env::var("HELICONE_AUTH").unwrap_or("".to_string())
            ),
        )
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
