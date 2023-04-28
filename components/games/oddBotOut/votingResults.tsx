import { useState } from "react";
import {
  NUM_PLAYERS,
  PLAYER_NAMES,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";
import { GameStateProps } from "../../../pages/game";

interface VotingResultsProps {
  game: NonNullable<GameResponse>;
}
export default function VotingResults(props: GameStateProps<"Reviewing">) {
  const { game } = props;

  const currentQuestion = game.game_state.content.question;
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div>The results are in</div>
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion}</div>
        <div>
          {game.game_state.content.eliminated ?? "NO ONE ELIMINATED TIE"}
        </div>
        Hello
      </div>
    </div>
  );
}
