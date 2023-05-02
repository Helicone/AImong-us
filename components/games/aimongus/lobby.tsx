import { useRouter } from "next/router";
import { useState } from "react";

export default function Lobby() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

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
                router.push("/game?room_id=" + roomId);
              }}
            >
              Join Game
            </button>
          </div>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-800"
            onClick={() => {
              console.log("play AImong Us");
              router.push("/game?get_new_game=true");
            }}
          >
            + Create Game
          </button>
        </div>
      </div>
    </div>
  );
}
