import type { NextApiRequest, NextApiResponse } from "next";
import { getHistory } from "./history";
const { OPENAI_API_KEY } = process.env;

function getStartingPrompt(input: string): string {
  return `
You are a chat assistant called freeChatGPT. You are an extremely well-educated individual and have the ability to explain anything. Please give your feedback in the form of markdown, please make sure code is within a code block. I will send you something and you can respond. 
Here is an example format of a thread
<user>{input}<end-user>
<response>{ouput}<end-response>
<user>{input}<end-user>
<response>{ouput}<end-response>

Let's begin!
  
<user>${input}<end-user>
`;
}

const oaiBase = "https://oai.valyrai.com/v1";
const oaiURL = (endpoint: string, model: string) =>
  `${oaiBase}/engines/${model}/${endpoint}`;

export async function getOpenAICompletion(
  prompt: string
): Promise<string | undefined> {
  let response = await fetch(oaiURL("completions", "text-davinci-003"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "User-ID": "1",
    },
    body: JSON.stringify({
      prompt: `\n<user>${prompt}<end-user>`,
      max_tokens: 256,
      temperature: 0.7,
      frequency_penalty: 1.0,
      presence_penalty: 1.0,
      logprobs: 1,
    }),
  });

  if (response.status === 200) {
    let json = await response.json();
    if (json.error) {
      console.log(json.error);
      return undefined;
    }
    console.log(json);
    return (json.choices[0].text as string)
      .replace("<response>", "")
      .replace("<end-response>", "");
  }

  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    message: string;
  }>
) {
  const { prompt, lastId } = req.body;
  if (!prompt) {
    console.log(req.body);
    res.status(400).json({
      message: "No prompt provided",
    });
    return;
  }

  if (lastId) {
    const { error, data } = await getHistory(lastId);
    if (error !== null) {
      res.status(400).json({ message: error });
      return;
    }
    const ogContext =
      `${getStartingPrompt(data[0].input)}\n\n${data[0].response_message}\n\n` +
      // Grab the last 10 responses
      data
        .slice(1)
        .reverse()
        .slice(0, 10)
        .reverse()
        .map((item) => `${item.input}\n\n${item.response_message}\n\n`)
        .join("");
    const context = `${ogContext}${prompt}\n\n`;
    console.log("Context", context);
    const completion = await getOpenAICompletion(context);
    console.log("Completion", completion);
    if (completion) {
      res.status(200).json({ message: completion });
    } else {
      res.status(500).json({ message: "Error" });
    }
  } else {
    const completion = await getOpenAICompletion(getStartingPrompt(prompt));
    if (completion) {
      res.status(200).json({ message: completion });
    } else {
      res.status(500).json({ message: "Error" });
    }
  }
}
