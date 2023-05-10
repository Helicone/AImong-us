/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/aimongus/lobby";
import StarBackground from "../components/games/aimongus/star";
import useNotification from "../components/notification/useNotification";

export default function Home() {
  const { setNotification } = useNotification();
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
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded z-10"
          onClick={() => {
            setNotification({
              title: "LIGMA",
              variant: "success",
            });
          }}
        >
          LOOK NOTIFICATION
        </button>
      </MainWrapper>
    </div>
  );
}
