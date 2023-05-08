import EmojiPicker from "emoji-picker-react";

import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";
import { Modal } from "../../modal";
import { EMOJIS } from "../../../lib/emojis";
import { useLocalStorage } from "../../../lib/hooks/useLocalStorage";
import { PLAYER_NAMES } from "../../../lib/constants";

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
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col max-w-lg w-full gap-2 text-center mt-20 bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Find the bot or die 🔪
        </h1>
        <div className="flex flex-col justify-between items-center gap-3">
          <div className="flex flex-row">
            <input
              type="text"
              placeholder="Game ID"
              className="border-2 border-gray-800 bg-gray-100 text-gray-800 p-2 w-full rounded-md focus:outline-none focus:border-purple-500"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded-md ml-2 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={() => {
                console.log("play AImong Us");
                router.push(
                  "/game?room_id=" + roomId + "&username=" + username
                );
              }}
            >
              Join Game
            </button>
          </div>
          <div>
            <div className="flex flex-row gap-2">
              <Modal open={showEmojiPicker} setOpen={setShowEmojiPicker}>
                <EmojiPicker
                  onEmojiClick={(e, emojiObject) => {
                    setSelectedEmoji(e.emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </Modal>
              <button
                className="text-xl border-2 border-black text-white px-4 py-2 rounded-md ml-2 hover:bg-gray-900 "
                onClick={() => setShowEmojiPicker(true)}
              >
                {selectedEmoji}
              </button>

              <input
                type="text"
                placeholder="Username"
                className="border-2 border-gray-800 bg-gray-100 text-gray-800 p-2 w-full rounded-md focus:outline-none focus:border-green-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                className="text-xl border-2 border-black text-white px-4 py-2 rounded-md hover:bg-gray-900 "
                onClick={() => {
                  setSelectedEmoji(
                    EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
                  );
                  setUsername(
                    PLAYER_NAMES[
                      Math.floor(Math.random() * PLAYER_NAMES.length)
                    ]
                  );
                }}
              >
                🎲
              </button>
            </div>
          </div>
          {!!roomId || (
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-800"
              onClick={() => {
                console.log("play AImong Us");
                router.push(
                  `/game?get_new_game=true&username=${username}&emoji=${selectedEmoji}`
                );
              }}
            >
              + Create Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
