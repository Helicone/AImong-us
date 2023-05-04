import { useState } from "react";
import { GameStateProps } from "../../../pages/game";
import { getAvatar } from "../../avatars";
import { Timer } from "./timer";
import { TIME_ALLOWANCE_VOTING_RESULTS_SECONDS } from "../../../lib/constants";

interface AnswerProps {
  answer: GameStateProps<"Voting">["game"]["game_state"]["content"]["answers"][number];
  onClick: () => void;
  room_code: string;
}
function Answer(props: AnswerProps) {
  const { answer, onClick, room_code } = props;

  const voteArray = Array(voteCount).fill(0);
  // const avatar = getAvatar(props.answer.player_id, props.room_code);

  return (
    <div className="relative">
      <button
        className={`flex flex-col items-center justify-center w-full ${
          answer.is_me ? "bg-gray-200" : "bg-white"
        } p-5 rounded-xl shadow-md`}
        onClick={props.onClick}
        disabled={answer.is_me}
      >
        <div className="flex flex-row justify-between w-full items-center">
          <div className="flex flex-col items-start">
            <div className="text-2xl">{props.answer.answer}</div>
            <div className="text-sm">
              {/* {avatar.name} */}
              {answer.is_me ? " (You)" : ""}
            </div>
          </div>
          {/* <div className="text-xl">{avatar.emoji}</div> */}
        </div>
      </button>
      <div className="absolute top-0 flex flex-row gap-2">
        {}
        {Array(answer.number_of_votes)
          .fill(0)
          .map((vote, i) => (
            <div
              className={`flex flex-row items-center justify-center w-full bg-green-200 p-1 rounded-xl shadow-md`}
              key={i}
            >
              <div className="text-lg h-10">
                {/* {getAvatar(vote.player, props.room_code).emoji} */}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function Voting(props: GameStateProps<"Voting">) {
  const { game, sendMessage } = props;

  const currentQuestion = game.game_state.content.question;
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  console.log(game);

  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion}</div>
        <div className="flex flex-col max-w-md gap-5">
          {game.game_state.content.answers.map((answer, i) => (
            <Answer
              answer={answer}
              onClick={() => {
                if (answer.player_id !== game.me) {
                  sendMessage({
                    SubmitVote: answer.player_id,
                  });
                } else {
                  console.log("You can't vote for yourself!");
                }
              }}
              room_code={game.room_code}
              key={i}
            />
          ))}
        </div>
      </div>
      <div>
        <Timer
          totalTime={TIME_ALLOWANCE_VOTING_RESULTS_SECONDS * 1000}
          timeStarted={new Date(
            Number(game.game_state.content.started_at)
          ).getTime()}
        />
      </div>
    </div>
  );
}
