import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { GameResponse } from "../pages/api/odd-bot-out/game";

export default function LoggedInFlow() {
  const client = useSupabaseClient();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col max-w-lg w-full gap-2">
        <button
          className="border-2 border-gray-800 bg-gray-600 text-white p-2 w-full hover:opacity-90"
          onClick={() => {
            console.log("play odd bot out");
            fetch("/api/odd-bot-out/game?get_new_game=true")
              .then((res) => {
                console.log("RES", res);
                return res;
              })
              .then((res) => res.json() as Promise<GameResponse>)
              .then((res) => {
                if (res?.game_id) {
                  router.push("/odd-bot-out/" + res.game_id);
                }
              });
          }}
        >
          Play Odd Bot Out
        </button>
        <button
          disabled={true}
          className="border-2 border-gray-800 bg-gray-600 text-white p-2 w-full disabled:opacity-50 disabled:pointer-events-none"
        >
          Play Turing Chat (coming soon)
        </button>
      </div>
    </div>
  );
}
