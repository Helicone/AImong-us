import { useState } from "react";
import {
  NUM_PLAYERS,
  TOTAL_TIME_TO_ANSWER_QUESTION,
} from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";

interface ActiveGameProps {
  game: NonNullable<GameResponse>;
}
export default function ActiveGame(props: ActiveGameProps) {
  const { game } = props;

  const currentQuestion = game.questions[0];

  const timeLeft =
    TOTAL_TIME_TO_ANSWER_QUESTION -
    (Date.now() - new Date(currentQuestion.created_at!).getTime());

  const stateColor = (game_state: string) => {
    switch (game_state) {
      case "finding_players":
        return "bg-yellow-600";
      case "active":
        return "bg-green-600";
      case "finished":
        return "bg-red-600";
      default:
        return "bg-red-600";
    }
  };
  const [answer, setAnswer] = useState<string>("");

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div className="flex flex-row justify-between col-span-2">
        <div className="flex flex-row">
          <div
            className={
              "align-start p-2 text-white font-bold rounded-lg " +
              stateColor(game.game_state)
            }
          >
            {game.game_state}
          </div>
          <p className="p-2">
            {game.player_count} / {NUM_PLAYERS} Players Joined
          </p>
        </div>
        <div className="flex flex-col">{Math.ceil(timeLeft / 1000)}s left!</div>
      </div>
      <div className="flex flex-col col-span-2">
        <div>
          <label
            htmlFor="answer"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            {game.questions[0].question}
          </label>
          <div className="mt-2">
            <textarea
              rows={4}
              name="answer"
              id="answer"
              className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-md sm:leading-6"
              defaultValue={"..."}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
        </div>
        <button
          className="bg-gray-600 text-white p-2 w-full hover:opacity-90"
          onClick={() => {
            // Stuff here for testing
          }}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}
