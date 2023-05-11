/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/aimongus/lobby";
import useNotification from "../components/notification/useNotification";
import StarBackground from "../components/games/aimongus/star";

export default function Home() {
  return (
    <div>
      <Head>
        <title>AImong Us</title>
        <meta name="description" content="Vote out the bot..." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainWrapper title="AImong Us">
        <Lobby />
        <StarBackground />
      </MainWrapper>
    </div>
  );
}
