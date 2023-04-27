/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/oddBotOut/lobby";

export default function Home() {
  return (
    <div className="bg-cyan-100">
      <Head>
        <title>AI Turing Chat</title>
        <meta name="description" content={"ARE YOU SMARTER THAN A BOT"} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <WebSocketComponent /> */}
      <MainWrapper title="AImong Us">
        <Lobby />
      </MainWrapper>
    </div>
  );
}
