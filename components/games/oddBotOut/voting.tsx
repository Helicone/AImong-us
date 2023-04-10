import clsx from "clsx";
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

  const currentQuestion = game.questions[game.questions.length - 1];
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  console.log(game);

  const playersThatDidNotAnswer = game.players.filter(
    (player) =>
      !currentQuestion.answers.find(
        (answer) => answer.random_player_number === player.randomPlayerNumber
      )
  );

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div>Voting</div>
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion.question}</div>
        <div>
          {playersThatDidNotAnswer.map((player) => (
            <div key={player.randomPlayerNumber}>
              {PLAYER_NAMES[player.index]} did not answer
            </div>
          ))}
        </div>

        {currentQuestion.answers.map((answer, i) => (
          <div className="" key={i}>
            <div className="flex flex-row gap-2">
              <div>
                {
                  PLAYER_NAMES[
                    game.players.findIndex(
                      (player) =>
                        player.randomPlayerNumber ===
                        answer.random_player_number
                    )
                  ]
                }
              </div>
              <div>{":"}</div>
              <div>{answer.answer}</div>
            </div>
            <div>
              <button
                className={clsx(
                  "border-2 border-gray-800 bg-gray-600 text-white p-2  hover:opacity-90",
                  answer.random_player_number === game.me && "bg-red-300"
                )}
                onClick={() => {
                  fetch(`/api/odd-bot-out/answer/${answer.id}/vote`);
                }}
                disabled={answer.random_player_number === game.me}
              >
                {answer.random_player_number === game.me
                  ? "this is you"
                  : "Vote"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
