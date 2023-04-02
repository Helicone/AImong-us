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
    <div className="flex flex-col max-w-2xl content-center">
      <div className="flex flex-row justify-between col-span-2">
        <div className="flex flex-col">
          <div
            className={
              "align-start p-2 text-white font-bold rounded-lg " +
              stateColor(game.game_state)
            }
          >
            {game.game_state}
          </div>
          {game.player_count} / {NUM_PLAYERS} Players Joined
        </div>
        <div className="flex flex-col">{timeLeft}</div>
      </div>
      <div className="flex flex-col">
        <div>{game.questions[0].question}</div>
      </div>
      <div>
        <input
          type="text"
          className="border-2 border-white bg-black text-white p-2 w-full"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          className="border-2 border-gray-800 bg-gray-600 text-white p-2 w-full hover:opacity-90"
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
