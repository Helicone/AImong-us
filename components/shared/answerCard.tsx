import { useState } from "react";
import { GameStateProps } from "../../pages/game";
import clsx from "clsx";

interface AnswerProps {
  answer: GameStateProps<"Voting">["game"]["game_state"]["content"]["answers"][number];
  onClick?: () => void;
  room_code?: string;
}
export function AnswerCard(props: AnswerProps) {
  const { answer, onClick, room_code } = props;

  const canClick = !answer.is_me;

  return (
    <div className="relative">
      <div
        className={clsx(
          `flex flex-col items-center justify-center w-full  p-5 border rounded-xl d`,
          canClick
            ? "cursor-pointer hover:bg-gray-200 shadow-sm"
            : "bg-gray-200"
        )}
        onClick={() => canClick && onClick && onClick()}
      >
        <div className="flex flex-row justify-between w-full items-center">
          <div className="flex flex-col items-start">
            <div className="text-xl">{props.answer.answer}</div>
            <div className="text-sm">
              {/* {avatar.name} */}
              {answer.is_me ? " (You)" : ""}
            </div>
          </div>
          {/* <div className="text-xl">{avatar.emoji}</div> */}
        </div>
      </div>
      <div className="absolute -bottom-5 right-0 flex flex-row gap-2">
        {}
        {Array(answer.number_of_votes)
          .fill(0)
          .map((vote, i) => (
            <div
              className={`flex flex-row items-center justify-center w-full bg-gray-500 p-1 rounded-xl shadow-md`}
              key={i}
            >
              <div className="text-xl h-7">🪓</div>
            </div>
          ))}
      </div>
    </div>
  );
}

interface AnswerPropsResult {
  answer: GameStateProps<"Voting">["game"]["game_state"]["content"]["answers"][number];
  player: GameStateProps<"Voting">["game"]["players"][number];
  playersWhoVoted?: GameStateProps<"Voting">["game"]["players"][number][];
  isBot?: boolean;
  maxPoints?: number;
  points?: GameStateProps<"Reviewing">["game"]["game_state"]["content"]["results"][number]["points"];
}
export function AnswerCardResult(props: AnswerPropsResult) {
  const { answer, isBot, player, maxPoints, playersWhoVoted, points } = props;

  const canClick = !answer.is_me;
  const emoji = player.emoji === "undefined" ? "👤" : player.emoji;

  const percentagePoints = Math.round((player.score / (maxPoints ?? 0)) * 100);
  return (
    <div className="relative">
      {!isBot && (
        <div>
          <div
            className={clsx(
              "flex flex-row justify-start items-center border-2 p-2 w-full gap-2 text-sm rounded-t-xl",
              "text-gray-300"
            )}
          >
            <div className="w-full">
              <div
                className={clsx(
                  `bg-indigo-700 top-0 left-0 h-2 flex-grow-0 rounded-full`
                )}
                style={{ width: `${percentagePoints}%` }}
              ></div>
            </div>

            <div>{player.score}</div>
            <i className="text-xs text-gray-300">Points</i>
          </div>
          <div
            className={clsx(
              "flex flex-row justify-start items-center border-l-2 border-r-2 p-2 w-full gap-2 text-sm",
              "text-gray-300"
            )}
          >
            {(points?.guessing_the_bot ?? 0) > 0 && (
              <div>+ {points?.guessing_the_bot} for guessing the bot</div>
            )}
            {(points?.not_thinking_you_are_the_bot ?? 0) > 0 && (
              <div>
                + {points?.not_thinking_you_are_the_bot} for not acting like a
                bot
              </div>
            )}
          </div>
        </div>
      )}
      <div
        className={clsx(
          `flex flex-col items-center justify-center w-full  p-5 border rounded-b-xl d`,
          isBot && "rounded-t-xl",
          canClick
            ? "cursor-pointer hover:bg-gray-200 shadow-sm"
            : "bg-gray-200"
        )}
      >
        <div className="flex flex-row justify-start w-full items-center gap-3">
          <div className="flex-shrink-0 relative w-24 h-20 border-2 rounded-md flex flex-col items-center justify-end pb-2">
            <div className="text-3xl">{emoji}</div>
            <div className="text-xs bottom-0 whitespace-nowrap">
              {player.username}
            </div>
            <div className="text-xs bottom-0 whitespace-nowrap">
              {answer.is_me ? " (You)" : ""}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <div className="text-xl">{props.answer.answer}</div>
            <div className="text-sm">{/* {avatar.name} */}</div>
          </div>
          {/* <div className="text-xl">{avatar.emoji}</div> */}
        </div>
      </div>
      <div className="absolute -bottom-5 right-0 flex flex-row gap-2">
        {playersWhoVoted?.map((player, i) => (
          <div
            className={`opacity-60 flex flex-row w-24 items-center justify-center bg-blue-200 p-1 rounded-xl shadow-md`}
            key={i}
          >
            <div className="flex-shrink-0 relative  rounded-md flex flex-col items-center justify-end p-1">
              <div className="text-xl">{player.emoji}</div>
              <div className="text-xs whitespace-nowrap">{player.username}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
