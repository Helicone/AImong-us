import { useState } from "react";
import {
  NUM_PLAYERS,
  PLAYER_NAMES,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameStateProps } from "../../../pages/game";

export default function VotingResults(props: GameStateProps<"Reviewing">) {
  const { game, sendMessage } = props;

  const currentQuestion = game.game_state.content.question;
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div>The results are in!</div>
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion}</div>
        <div></div>
        Number of players ready:{" "}
        {game.game_state.content.number_of_players_ready ?? 0} /{" "}
        {game.number_of_players}
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              sendMessage("ReadyForNextTurn");
            }}
          >
            Ready for next turn
          </button>
        </div>
      </div>
    </div>
  );
}
