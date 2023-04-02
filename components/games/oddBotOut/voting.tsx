import { useState } from "react";
import {
  NUM_PLAYERS,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";

interface VotingProps {
  game: NonNullable<GameResponse>;
}
export default function Voting(props: VotingProps) {
  const { game } = props;
  const [answer, setAnswer] = useState<string>("");

  const currentQuestion = game.questions[0];
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  console.log(game);

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      Voting
      {currentQuestion.answers.map((answer, i) => (
        <div className="flex flex-col col-span-2" key={i}>
          {answer.player}
        </div>
      ))}
    </div>
  );
}
