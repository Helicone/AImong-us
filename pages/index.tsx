/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { v4 as uuidv4 } from "uuid";
import { promptsDB } from "./api/log";
import { CiTwitter } from "react-icons/ci";
import { BiCopy } from "react-icons/bi";
import { BiUndo } from "react-icons/bi";
import { useRouter } from "next/router";
import { Result } from "../lib/result";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";

function LoadingSpinner() {
  return (
    <div role="status">
      <svg
        aria-hidden="true"
        className="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-300"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface IChatMessage {
  id: string;
  message: string;
  image_prompt: string | null;
}

interface IChatMessageResponse {
  id: string;
  request: string;
  response: string;
}

interface IChatMessageOpenAI {
  message: string;
}

export default function Home() {
  const router = useRouter();
  const { id } = router.query;

  const [chatHistory, setChatHistory] = useState<IChatMessageResponse[]>([]);

  const [error, setError] = useState("");
  const [chatImageLookup, setChatImageLookup] = useState<
    Record<string, string>
  >({});

  const [loggedInDB, setLoggedInDb] = useState<Record<string, boolean>>({});
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shifted, setShifted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [chatHistory]);

  async function requestPrompt(body: {
    prompt: string;
    lastId?: string;
  }): Promise<IChatMessageOpenAI> {
    console.log("HELLO REQUESsadfdsaTIasdfdsaN");
    const { error, data }: Result<string, string> = await (
      await fetch("/api/gpt3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    ).json();

    if (error !== null) {
      throw new Error(error);
    }

    return { message: data };
  }

  async function logCurrentSpot({
    requestId,
    currentInput,
    responseMessage,
    rootId,
  }: {
    requestId: string;
    currentInput: string;
    responseMessage: string;
    rootId: string;
  }) {
    const body: promptsDB = {
      id: requestId,
      input: currentInput,
      image_url: "No image",
      image_prompt: "No image",
      response_without_image: "N/A",
      response_message: responseMessage,
      last_id:
        chatHistory.length === 0
          ? null
          : chatHistory[chatHistory.length - 1].id,
      root_id: rootId,
    };
    await fetch("/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    setLoggedInDb((prev) => ({ ...prev, [requestId]: true }));
  }

  async function getResponse(onLogComplete: () => void): Promise<void> {
    const requestId = uuidv4();
    const lastId =
      chatHistory.length === 0
        ? undefined
        : chatHistory[chatHistory.length - 1].id;
    const rootId = chatHistory.length === 0 ? requestId : chatHistory[0].id;
    const chatGPT3Data = await requestPrompt({
      prompt: currentInput,
      lastId,
    });

    setChatHistory((prev) => [
      ...prev,
      {
        request: currentInput,
        response: chatGPT3Data.message,
        id: requestId,
      },
    ]);

    logCurrentSpot({
      requestId,
      currentInput,
      responseMessage: chatGPT3Data.message,
      rootId,
    });
    onLogComplete();
  }

  function submitRequestToBackend() {
    setError("");
    setIsLoading(true);
    setCurrentInput("");
    getResponse(() => setIsLoading(false)).catch((e) => {
      setIsLoading(false);
      console.log("error", e);
      setError(`Error getting: ${JSON.stringify(e)}`);
    });
  }

  if (id) {
    localStorage.clear();
    fetch("/api/history?id=" + id)
      .then((res) => res.json())
      .then((data: promptsDB[]) => {
        setChatHistory(
          data.map((item) => ({
            id: item.id,
            request: item.input,
            response: item.response_message,
          }))
        );
        setChatImageLookup(
          data.reduce((acc, item) => {
            acc[item.id] = item.image_url;
            return acc;
          }, {} as { [key: string]: string })
        );
        setLoggedInDb(
          data.reduce((acc, item) => {
            acc[item.id] = true;
            return acc;
          }, {} as { [key: string]: boolean })
        );
        router.push("/", undefined, { shallow: true });

        console.log(data);
      });

    return (
      <div className="dark:bg-black dark:text-slate-200 h-screen flex flex-col gap-10 p-10">
        Loading... {id}
        <button
          onClick={() => {
            router.push("/", undefined, { shallow: true });
          }}
          className="w-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="dark:bg-black dark:text-slate-200">
      <Head>
        <title>Valyr Chat</title>
        <meta name="description" content="AI generated stories" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Make a text box that always stays on the bottom tailwind*/}
      <main className="flex flex-col w-full flex-1 text-center min-h-screen ">
        <h1 className="fixed top-0 text-center text-4xl font-bold w-full dark:bg-black bg-white py-5 border-b">
          Valyr Chat
          {error && (
            <div className="text-red-500 text-sm font-bold">{error}</div>
          )}
        </h1>
        <div className="flex flex-col-reverse w-full flex-1 text-center my-40 overflow-auto gap-5 justify-center items-center">
          {chatHistory
            .slice()
            .reverse()
            .map((chatMessage) => (
              <div
                key={chatMessage.id}
                className="flex flex-col w-5/6 whitespace-pre-wrap text-left border-2 p-5 justify-center items-center"
              >
                <div className="overflow-auto w-full flex flex-col gap-5">
                  <div className="border-b pb-3">{chatMessage.request}</div>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter language={match[1]}>
                            {children as string}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-slate-400" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {chatMessage.response}
                  </ReactMarkdown>
                </div>

                <div className="flex flex-row justify-end items-end w-full">
                  {loggedInDB[chatMessage.id] ? (
                    <div className="flex flex-row w-full justify-end mt-2">
                      <div className="flex flex-row gap-3">
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `https://chat.valyrai.com?id=${chatMessage.id}`
                            );
                          }}
                        >
                          <BiCopy size={24} />
                        </div>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${
                            `My chat history with Valyr Chat! ` +
                            "https://chat.valyrai.com?id=" +
                            chatMessage.id
                          }`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <CiTwitter size={24} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <LoadingSpinner />
                  )}
                </div>
              </div>
            ))}
        </div>
        <div className="fixed bottom-0 w-full pb-5 pt-2 dark:bg-black bg-white flex flex-col gap-3 justify-center items-center">
          <div className="flex flex-row justify-center gap-2 mx-auto w-full">
            <textarea
              disabled={isLoading}
              className="w-1/2 h-30 border-2 bg-transparent px-2 border-black dark:border-slate-200 resize-none"
              placeholder={
                chatHistory.length === 0
                  ? "Ask away!"
                  : isLoading
                  ? "Loading... "
                  : "Enter one of the options (A, B, C, D) or type in your own response"
              }
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyUp={(k) => {
                if (k.key === "Shift") {
                  setShifted(false);
                }
              }}
              onKeyDown={(k) => {
                if (k.key === "Shift") {
                  setShifted(true);
                } else if (k.key === "Enter" && !shifted) {
                  k.preventDefault();
                  submitRequestToBackend();
                }
              }}
            />
            <button
              disabled={isLoading}
              className="w-20 h-20 border-2 border-black dark:border-slate-200"
              onClick={() => {
                submitRequestToBackend();
              }}
            >
              {isLoading ? (
                <div className="flex flex-col justify-center items-center">
                  <LoadingSpinner />
                </div>
              ) : (
                "Send"
              )}
            </button>
          </div>
          <div className="flex flex-row gap-5">
            <a href="https://twitter.com/justinstorre">
              <i>twitter</i>
            </a>
            <a href="https://github.com/PromptZero/valyr-chat">
              <i>github</i>
            </a>
            <a href="https://discord.gg/2TkeWdXNPQ">
              <i>discord</i>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
