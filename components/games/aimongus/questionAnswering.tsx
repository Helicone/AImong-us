import { useEffect, useState } from "react";
import { MyClientGameStateView } from "../../../aimongus_types/bindings/ExtractClientState";

import { GameStateProps } from "../../../pages/game";
import { Timer } from "./timer";
import { Col } from "../../layout/col";
import {
  BASE_BUTTON_CLASSNAME,
  INPUT_CLASSNAME,
  PINK_BUTTON,
} from "../../../lib/common-classes";
import clsx from "clsx";
import { Row } from "../../layout/row";

const MAX_LENGTH_ANSWER = 1200;
const ms = 1000;

export default function QuestionAnswering(props: GameStateProps<"Answering">) {
  const { game, sendMessage } = props;

  const [answer, setAnswer] = useState<string>("");

  const currentQuestion = game.game_state.content.question;
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }

  return (
    <Col className="h-full gap-6">
      <div className="font-mono">Question {game.current_turn}</div>
      <div className="text-2xl font-semibold">{currentQuestion}</div>
      <i className="font-light ">
        Trick the other players into thinking you are the bot
      </i>
      {game.game_state.content.you_answered ? (
        <>
          <div className="text-2xl font-semibold">Answer captured!</div>
          <Timer
            totalTime={game.game_state.content.allowed_time * ms}
            timeStarted={new Date(
              Number(game.game_state.content.started_at)
            ).getTime()}
            className={"bottom-0 w-full"}
          />
        </>
      ) : (
        <>
          <Col className="gap-1 flex-grow">
            <textarea
              name="answer"
              id="answer"
              className={clsx(INPUT_CLASSNAME, "flex flex-grow resize-none")}
              placeholder="Answer. Try to convince people you ARE a bot!"
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
          <Col className="relative">
            <button
              disabled={answer.length === 0}
              className={clsx(
                "bg-pink-600 hover:bg-pink-500",
                BASE_BUTTON_CLASSNAME
              )}
              onClick={() => {
                sendMessage({
                  SubmitAnswer: answer,
                });
              }}
            >
              Submit Answer
            </button>
            <Timer
              totalTime={game.game_state.content.allowed_time * ms}
              timeStarted={new Date(
                Number(game.game_state.content.started_at)
              ).getTime()}
              className={"absolute bottom-0 w-full"}
            />
          </Col>
        </>
      )}
    </Col>
  );
}
