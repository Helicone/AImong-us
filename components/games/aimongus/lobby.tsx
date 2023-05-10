import EmojiPicker from "emoji-picker-react";

import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";
import { Modal } from "../../modal";
import { EMOJIS } from "../../../lib/emojis";
import { useLocalStorage } from "../../../lib/hooks/useLocalStorage";
import { PLAYER_NAMES } from "../../../lib/constants";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { CgDice5 } from "react-icons/cg";

export default function Lobby() {
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
        <input
          type="text"
          placeholder="Game ID"
          className="border-2 border-transparent bg-violet-900 w-full rounded-md focus:outline-none focus:border-pink-500 px-4 py-2"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <div>
          <Row className=" w-full relative gap-3">
            <Modal open={showEmojiPicker} setOpen={setShowEmojiPicker}>
              <EmojiPicker
                onEmojiClick={(e, emojiObject) => {
                  setSelectedEmoji(e.emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </Modal>
            <button
              className="text-3xl w-14 rounded-full bg-gradient-to-bl bg-gradient from-slate-600 to-slate-400 border-2 border-slate-400 hover:border-pink-500 transition-all"
              onClick={() => setShowEmojiPicker(true)}
            >
              {selectedEmoji}
            </button>

            <input
              type="text"
              placeholder="Username"
              className="border-2 border-transparent bg-violet-900 w-full rounded-md focus:outline-none focus:border-pink-500 px-4 py-2"
              value={username}
              onChange={(e) =>
                e.target.value.length < 10 && setUsername(e.target.value)
              }
            />
            <button
              className="absolute right-2 top-2 opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => {
                setSelectedEmoji(
                  EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
                );
                setUsername(
                  PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]
                );
              }}
            >
              <CgDice5 className="h-6 w-6" />
            </button>
          </Row>
        </div>
        <button
          className="bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
          disabled={
            !roomId || roomId.length < 4 || !username || username.length < 1
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
        <Row className="items-center my-4 opacity-80">
          <hr className="w-full" />
          <span className="mx-4">OR</span>
          <hr className="w-full" />
        </Row>
        <button
          className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-500"
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
