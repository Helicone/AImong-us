import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/aimongus/lobby";
import StarBackground from "../components/games/aimongus/star";
import JoiningGame from "../components/games/aimongus/joining-game";
import CreatingGame from "../components/games/aimongus/creating-game";

export default function Home() {
  return (
    <div>
      <Head>
        <title>AImong Us</title>
        <meta name="description" content="Vote out the bot..." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainWrapper title="AImong Us">
        <CreatingGame />
        <StarBackground />
      </MainWrapper>
    </div>
  );
}
