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
import { useQuery } from "@tanstack/react-query";
import { PublicRoom } from "../aimongus_types/bindings/PublicRoom";
import { Row } from "../components/layout/row";

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

  const publicRooms = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await fetch(`backstab/public-rooms`);
      return res.json() as Promise<PublicRoom[]>;
    },
  });

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
      <Col className="text-center mt-4 bg-violet-950 p-4 rounded-lg shadow-lg text-white max-w-lg w-full">
        <h1 className="text-xl text-white mb-4">Public rooms</h1>
        <Col
          className="gap-2 overflow-x-auto"
          style={{ maxHeight: "calc(100vh - 400px)" }}
        >
          {publicRooms.data?.map((room) => (
            <Row
              key={room.room_code}
              className="flex items-center justify-between p-2 rounded-lg bg-violet-900"
            >
              <button
                className={clsx(
                  PINK_BUTTON,
                  BASE_BUTTON_CLASSNAME,
                  " max-w-sm text-left"
                )}
                onClick={() => {
                  console.log("play AImong Us");
                  router.push(
                    "/game?room_id=" +
                      room.room_code +
                      "&username=" +
                      username +
                      "&emoji=" +
                      selectedEmoji
                  );
                }}
              >
                Join
              </button>

              <div className="flex items-center gap-2">
                <div className="text-md">{room.room_code}</div>
              </div>
              <div className="">
                {room.number_of_players} {" Players"}
              </div>
            </Row>
          ))}
        </Col>
      </Col>
    </Col>
  );
}
