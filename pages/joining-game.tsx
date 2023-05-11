import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import Lobby from "../components/games/aimongus/lobby";
import StarBackground from "../components/games/aimongus/star";
import { useEffect, useState } from "react";
import { useLocalStorage } from "../lib/hooks/useLocalStorage";
import { PLAYER_NAMES } from "../lib/constants";
import { EMOJIS } from "../lib/emojis";
import { useRouter } from "next/router";
import { Col } from "../components/layout/col";
import { ProfilePicker } from "../components/games/aimongus/profile-picker";
import {
  BASE_BUTTON_CLASSNAME,
  INPUT_CLASSNAME,
  PINK_BUTTON,
} from "../lib/common-classes";
import clsx from "clsx";

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
      </MainWrapper>
    </div>
  );
}

export function JoiningGame() {
  const [username, setUsername] = useLocalStorage<string>(
    "user_name",
    "",
    (setStored) => {
      setStored(PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]);
    }
  );
  const router = useRouter();
  const roomIdFromUrl = router.query.room_id as string;
  const [roomId, setRoomId] = useState(roomIdFromUrl ?? "");
  useEffect(() => {
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [roomIdFromUrl]);
  const [selectedEmoji, setSelectedEmoji] = useLocalStorage<string | null>(
    "user_emoji",
    null,
    (setStored) => {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      setStored(randomEmoji);
    }
  );

  return (
    <Col className="items-center w-full z-10">
      <Col className=" max-w-lg w-full gap-4 text-center mt-20 p-8 rounded-lg shadow-lg  text-white bg-violet-950">
        <h1 className="text-xl text-white mb-4">Find the bot or die</h1>
        <ProfilePicker
          selectedEmoji={selectedEmoji}
          setSelectedEmoji={setSelectedEmoji}
          username={username}
          setUsername={setUsername}
        />
        <Col className="gap-0.5">
          <input
            type="text"
            placeholder="Game ID"
            className={INPUT_CLASSNAME}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <div className="text-xs text-slate-300 select-none text-left">
            Game ID
          </div>
        </Col>
        <button
          className={clsx(PINK_BUTTON, BASE_BUTTON_CLASSNAME, "w-full")}
          disabled={
            !roomId || roomId.length != 4 || !username || username.length < 1
          }
          onClick={() => {
            console.log("play AImong Us");
            router.push(
              "/game?room_id=" +
                roomId +
                "&username=" +
                username +
                "&emoji=" +
                selectedEmoji
            );
          }}
        >
          Join Game
        </button>
      </Col>
    </Col>
  );
}
