import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/aimongus/lobby";
import StarBackground from "../components/games/aimongus/star";
import JoiningGame from "../components/games/aimongus/joining-game";

export default function Home() {
  return (
    <div>
      <Head>
        <title>AImong Us</title>
        <meta name="description" content="Vote out the bot..." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainWrapper title="AImong Us">
        <JoiningGame />
        <StarBackground />
      </MainWrapper>
    </div>
  );
}
