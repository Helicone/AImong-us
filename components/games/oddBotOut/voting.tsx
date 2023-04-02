import { useState } from "react";
import {
  NUM_PLAYERS,
  PLAYER_NAMES,
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
      <div>Voting</div>
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion.question}</div>

        {currentQuestion.answers.map((answer, i) => (
          <div className="" key={i}>
            <div className="flex flex-row gap-2">
              <div>
                {
                  PLAYER_NAMES[
                    game.players.findIndex(
                      (player) => player.player === answer.player
                    )
                  ]
                }
              </div>
              <div>{":"}</div>
              <div>{answer.answer}</div>
            </div>
            <div>
              <button
                className="border-2 border-gray-800 bg-gray-600 text-white p-2  hover:opacity-90"
                onClick={() => {
                  fetch(`/api/odd-bot-out/answer/${answer.id}/vote`);
                }}
              >
                Vote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
