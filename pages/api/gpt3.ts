import type { NextApiRequest, NextApiResponse } from "next";
import { Result } from "../../lib/result";
import { getHistory } from "./history";
const { OPENAI_API_KEY } = process.env;

function getStartingPrompt(input: string): string {
  return `
You are a chat assistant called Valyr Chat, a free alternative to chatGPT, created by researchers at valyrai.com. You are an extremely well-educated individual and have the ability to explain anything. Please give your feedback in the form of markdown, please make sure code is within a code block. Make sure all the code is well formatted. I will send you something and you can respond. 
If any of the responses contain Zoophilia, Necrophilia, Pedophilia, or any other illegal activity, terminate the conversation.
Today's date is in UTC is ${new Date().toUTCString()}.
It is okay to be unsure of the answer, please just say so, or ask for clarification.
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
      prompt: `${prompt}`,
      max_tokens: 1024,
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
      .replace("<end-response>", "")
      .replaceAll("```", "\n```")
      .replaceAll("\n\n", "\n")
      .replaceAll("\n\n", "\n");
  }

  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<string, string>>
) {
  const { prompt, lastId } = req.body;
  console.log("Got request", req.body);
  if (!prompt) {
    console.log(req.body);
    res.status(400).json({
      error: "No prompt provided",
      data: null,
    });
    return;
  }

  if (lastId) {
    const { error, data } = await getHistory(lastId);
    if (error !== null) {
      res.status(400).json({ data: null, error });
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
        .map(
          (item) =>
            `<user>${item.input}<end-user>\n\n<response>${item.response_message}<end-response>\n\n`
        )
        .join("");
    const context = `${ogContext}<user>${prompt}<end-user>\n\n`;
    console.log("Context", context);
    const completion = await getOpenAICompletion(context);
    console.log("Completion", completion);
    if (completion) {
      res.status(200).json({ data: completion, error: null });
    } else {
      res.status(500).json({ error: "Error, completion failed", data: null });
    }
  } else {
    const completion = await getOpenAICompletion(getStartingPrompt(prompt));
    if (completion) {
      res.status(200).json({ data: completion, error: null });
    } else {
      res.status(500).json({ error: "Error, completion failed", data: null });
    }
  }
}
