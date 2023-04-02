import { useState } from "react";
import {
  NUM_PLAYERS,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameStates } from "../../../lib/states";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";

interface QuestionAnsweringProps {
  game: NonNullable<GameResponse>;
}
export default function QuestionAnswering(props: QuestionAnsweringProps) {
  const { game } = props;
  const [answer, setAnswer] = useState<string>("");

  const currentQuestion = game.questions[game.questions.length - 1];
  console.log(game);
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  const timeLeft =
    TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS -
    (Date.now() - new Date(currentQuestion.created_at!).getTime());

  const colorMap: { [key in GameStates]: string } = {
    finding_players: "bg-yellow-600",
    needs_question: "bg-yellow-600",
    questions: "bg-green-600",
    voting: "bg-green-600",
    voting_results: "bg-green-600",
    should_continue: "bg-green-600",
    game_over: "bg-red-600",
  };

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div className="flex flex-row justify-between col-span-2">
        <div className="flex flex-row">
          <div
            className={
              "align-start p-2 text-white font-bold rounded-lg " +
              colorMap[game.game_state as GameStates]
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
            {currentQuestion.question}
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
            fetch(
              "/api/odd-bot-out/questions/" + currentQuestion.id + "/answer",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ answer }),
              }
            ).then((res) => {
              console.log("SET ANSWER", res);
            });
          }}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}
