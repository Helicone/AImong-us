import { useState } from "react";
import { GameStateProps } from "../../../pages/game";
import { getAvatar } from "../../avatars";

interface AnswerProps {
  answer: GameStateProps<"Voting">["game"]["game_state"]["content"]["answers"][number];
  isMe: boolean;
  onClick: () => void;
  room_code: string;
}
function Answer(props: AnswerProps) {
  const avatar = getAvatar(props.answer.player_id, props.room_code);

  return (
    <div className="relative">
      <button
        className={`flex flex-col items-center justify-center w-full ${
          props.isMe ? "bg-gray-200" : "bg-white"
        } p-5 rounded-xl shadow-md`}
        onClick={props.onClick}
      >
        <div className="flex flex-row justify-between w-full items-center">
          <div className="flex flex-col items-start">
            <div className="text-2xl">{props.answer.answer}</div>
            <div className="text-sm">
              {avatar.name}
              {props.isMe ? " (You)" : ""}
            </div>
          </div>
          <div className="text-xl">{avatar.emoji}</div>
        </div>
      </button>
      <div className="absolute top-0 ">
        {props.answer.votes
          .map((vote, i) => ({
            player: i,
            vote: vote,
          }))
          .filter((vote) => vote !== null)
          .filter((vote) => vote.vote === props.answer.player_id)
          .map((vote, i) => (
            <div
              className={`flex flex-row items-center justify-center w-full bg-green-200 p-1 rounded-xl shadow-md`}
              key={i}
            >
              <div className="text-lg">
                {getAvatar(vote.player, props.room_code).emoji}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function Voting(props: GameStateProps<"Voting">) {
  const { game, sendMessage } = props;

  const currentQuestion = "TODO GET QUESTION FROM BACKEND";
  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  console.log(game);
  const answersToVoteOn = game.game_state.content.answers.filter(
    (answer) => answer.player_id !== game.me
  );

  return (
    <div className="grid grid-cols-2 w-full max-w-3xl mx-auto justify-between">
      <div className="flex flex-col col-span-2 gap-5">
        <div>{currentQuestion}</div>
        <div>{getAvatar(game.me, game.room_code).emoji}</div>
        <div className="flex flex-col max-w-md gap-5">
          {game.game_state.content.answers.map((answer, i) => (
            <Answer
              answer={answer}
              isMe={answer.player_id === game.me}
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
    </div>
  );
}
