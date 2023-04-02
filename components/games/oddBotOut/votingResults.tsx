import { useState } from "react";
import {
  NUM_PLAYERS,
  PLAYER_NAMES,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";

interface VotingResultsProps {
  game: NonNullable<GameResponse>;
}
export default function VotingResults(props: VotingResultsProps) {
  const { game } = props;
  const [answer, setAnswer] = useState<string>("");

  const currentQuestion = game.questions[game.questions.length - 1];
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  console.log(game);

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div>The results are in</div>
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion.question}</div>
        {currentQuestion.answers
          .sort((a, b) => b.vote_count! - a.vote_count!)
          .map((a, i) => (
            <div
              className={`${
                a.answer === answer ? "bg-blue-500" : "bg-gray-200"
              } p-2 rounded`}
              key={i}
            >
              <div>
                {
                  PLAYER_NAMES[
                    game.players.findIndex(
                      (player) =>
                        player.randomPlayerNumber === a.random_player_number
                    )
                  ]
                }
              </div>
              {a.answer}
              <div>Vote count: {a.vote_count}</div>
            </div>
          ))}
        Hello
      </div>
    </div>
  );
}
