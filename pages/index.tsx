/* eslint-disable @next/next/no-img-element */
import { useUser } from "@supabase/auth-helpers-react";
import Head from "next/head";
import LoggedInFlow from "../components/loggedInFlow";
import LoggedOutFlow from "../components/loggedOutFlow";
import { MainWrapper } from "../components/mainWrapper";

import React, { useState, useEffect } from "react";

function WebSocketComponent() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8000/echo");

    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };

    newSocket.onmessage = (event) => {
      console.log(`Received message: ${event.data}`);
      setResponse(event.data);
    };

    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    socket.send(message);
    setMessage("");
  };

  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
      <div>{response}</div>
    </div>
  );
}

export default function Home() {
  const user = useUser();
  return (
    <div className="bg-cyan-100">
      <Head>
        <title>AI Turing Chat</title>
        <meta name="description" content={"ARE YOU SMARTER THAN A BOT"} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <WebSocketComponent />
      <MainWrapper title="GPT-4 & Friends">
        {user ? <LoggedInFlow /> : <LoggedOutFlow />}
      </MainWrapper>
    </div>
  );
}
