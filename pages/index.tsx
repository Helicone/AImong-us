/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/aimongus/lobby";

export default function Home() {
  return (
    <div
      className="w-screen h-screen"
      style={{
        backgroundColor: "black",
        backgroundImage: `radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 9px),
radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 9px),
radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 10px),
radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 10px)`,
        backgroundSize: "550px 550px, 350px 350px, 250px 250px, 150px 150px",
        backgroundPosition: "0 0, 40px 60px, 130px 270px, 70px 100px",
      }}
    >
      <Head>
        <title>AImong Us</title>
        <meta name="description" content="Vote out the bot..." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <WebSocketComponent /> */}

      <MainWrapper title="AImong Us">
        <Lobby />
      </MainWrapper>
    </div>
  );
}
