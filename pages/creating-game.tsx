import Head from "next/head";
import { MainWrapper } from "../components/mainWrapper";

import { useRouter } from "next/router";
import { useState } from "react";
import { ProfilePicker } from "../components/games/aimongus/profile-picker";
import StarBackground from "../components/games/aimongus/star";
import { Col } from "../components/layout/col";
import { PLAYER_NAMES } from "../lib/constants";
import { EMOJIS } from "../lib/emojis";
import { useLocalStorage } from "../lib/hooks/useLocalStorage";
import { Toggle } from "../components/toggle";
import { TinyLabel } from "../components/tinylabel";

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

export function CreatingGame() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useLocalStorage<string>(
    "user_name",
    "",
    (setStored) => {
      setStored(PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]);
    }
  );
  const router = useRouter();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
        <Col className="gap-1 text-left">
          <Toggle onChange={() => {}} />
          <TinyLabel text="Public" />
        </Col>

        <button
          className="bg-teal-600 text-white px-6 py-2 mt-4 rounded-md hover:bg-teal-500"
          onClick={() => {
            console.log("play AImong Us");
            router.push(
              `/game?get_new_game=true&username=${username}&emoji=${selectedEmoji}`
            );
          }}
        >
          + Create Game
        </button>
      </Col>
    </Col>
  );
}
