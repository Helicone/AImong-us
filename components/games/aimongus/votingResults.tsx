import { useState } from "react";
import {
  NUM_PLAYERS,
  PLAYER_NAMES,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameStateProps } from "../../../pages/game";

export default function VotingResults(props: GameStateProps<"Reviewing">) {
  const { game } = props;

  const currentQuestion = game.game_state.content.question;
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  const eliminated = game.game_state.content.eliminated;
  console.log(eliminated);

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div>The results are in!</div>
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion}</div>
        <div>
          {eliminated ? (
            eliminated.map((player: number | boolean, idx) => (
              <div key={idx}>
                {PLAYER_NAMES[idx]} was {player == false ? "not " : ""}{" "}
                eliminated
              </div>
            ))
          ) : (
            <p className="text-base">Nobody was eliminated...</p>
          )}
        </div>
        Hello
      </div>
    </div>
  );
}
