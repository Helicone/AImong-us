import { useEffect, useState } from "react";
import { MyClientGameStateView } from "../../../aimongus_types/bindings/ExtractClientState";

import { GameStateProps } from "../../../pages/game";
import { Timer } from "./timer";
import { Col } from "../../layout/col";
import {
  BASE_BUTTON_CLASSNAME,
  INPUT_CLASSNAME,
  VIOLET_BUTTON,
} from "../../../lib/common-classes";
import clsx from "clsx";
import { Row } from "../../layout/row";

const MAX_LENGTH_ANSWER = 1200;
const ms = 1000;

export default function QuestionAnswering(props: GameStateProps<"Answering">) {
  const { game, sendMessage } = props;

  const [answer, setAnswer] = useState<string>("");

  const currentQuestion = game.game_state.content.question;
  console.log("game", game);
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  return (
    <Col className="h-full justify-between">
      <Col className="flex flex-col col-span-2 gap-6 text-left">
        <div className="font-mono">Question {game.current_turn}</div>
        <div className="text-2xl font-semibold">{currentQuestion}</div>
        <Col className="gap-1">
          <textarea
            rows={5}
            name="answer"
            id="answer"
            className={clsx(INPUT_CLASSNAME)}
            placeholder="Answer. Try to convince people you are NOT a bot!"
            value={answer}
            onChange={(e) => {
              if (e.target.value.length > MAX_LENGTH_ANSWER) return;
              setAnswer(e.target.value);
            }}
          />
          <Row className="w-full justify-end text-sm text-slate-500">
            {answer.length}/{MAX_LENGTH_ANSWER}
          </Row>
        </Col>
      </Col>
      <Timer
        totalTime={game.game_state.content.allowed_time * ms}
        timeStarted={new Date(
          Number(game.game_state.content.started_at)
        ).getTime()}
      />
      <button
        disabled={answer.length === 0}
        className={clsx(VIOLET_BUTTON, BASE_BUTTON_CLASSNAME)}
        onClick={() => {
          sendMessage({
            SubmitAnswer: answer,
          });
        }}
      >
        Submit Answer
      </button>
    </Col>
  );
}
