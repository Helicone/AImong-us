import { useEffect, useState } from "react";
import { MyClientGameStateView } from "../../../aimongus_types/bindings/ExtractClientState";
import {
  NUM_PLAYERS,
  NUM_QUESTIONS_PER_GAME,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameStateProps } from "../../../pages/game";
import { Timer } from "./timer";

export default function QuestionAnswering(props: GameStateProps<"Answering">) {
  const { game, sendMessage } = props;

  const [answer, setAnswer] = useState<string>("");

  const currentQuestion = game.game_state.content.question;
  console.log("game", game);
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div>
        {" "}
        Question {game.current_turn}/{NUM_QUESTIONS_PER_GAME}
      </div>
      <div className="flex flex-row justify-between col-span-2">
        <div className="flex flex-row">
          <p className="p-2">
            {game.number_of_players} / {NUM_PLAYERS} Players Joined
          </p>
        </div>
      </div>
      <div className="flex flex-col col-span-2">
        <div>
          <label
            htmlFor="answer"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            {currentQuestion}
          </label>
          <div className="mt-2">
            <textarea
              rows={4}
              name="answer"
              id="answer"
              className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-md sm:leading-6"
              defaultValue={"..."}
              value={answer}
              onChange={(e) => {
                if (e.target.value.length > 160) return;
                setAnswer(e.target.value);
              }}
            />
            <p className="mt-2 text-sm text-gray-500">{answer.length}/160</p>
          </div>
        </div>
        <button
          className="bg-gray-600 text-white p-2 w-full hover:opacity-90"
          onClick={() => {
            sendMessage({
              SubmitAnswer: answer,
            });
          }}
        >
          Submit Answer
        </button>
      </div>
      <div>
        <Timer
          totalTime={TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS * 1000}
          timeStarted={new Date(
            Number(game.game_state.content.started_at)
          ).getTime()}
        />
      </div>
    </div>
  );
}
