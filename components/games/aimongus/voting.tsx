import { useState } from "react";
import { GameStateProps } from "../../../pages/game";
import { getAvatar } from "../../avatars";
import { Timer } from "./timer";
import { AnswerCard } from "../../shared/answerCard";
import { Col } from "../../layout/col";

export default function Voting(props: GameStateProps<"Voting">) {
  const { game, sendMessage } = props;

  const currentQuestion = game.game_state.content.question;
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  console.log(game);

  return (
    <Col className="gap-5 items-center overflow-auto ">
      <div className="text-lg font-semibold font-mono w-full flex flex-col items-center text-center">
        <div className="max-w-lg p-5 rounded-lg">{currentQuestion}</div>
        <i className="font-light text-sm">Find the bot</i>
      </div>
      {game.game_state.content.you_voted ? (
        <div className="text-2xl font-semibold font-mono w-full flex flex-col items-center text-center">
          You voted!
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-md gap-10 overflow-auto">
          {Object.entries(game.game_state.content.answers).map(
            ([sessionId, answer]) => (
              <AnswerCard
                answer={answer}
                onClick={() => {
                  if (!answer.is_me) {
                    sendMessage({
                      SubmitVote: {
                        answer_id: answer.answer_id,
                      },
                    });
                  } else {
                    console.log("You can't vote for yourself!");
                  }
                }}
                room_code={game.room_code}
                key={answer.answer_id}
              />
            )
          )}
        </div>
      )}
      <Timer
        totalTime={game.game_state.content.allowed_time * 1000}
        timeStarted={new Date(
          Number(game.game_state.content.started_at)
        ).getTime()}
      />
    </Col>
  );
}
