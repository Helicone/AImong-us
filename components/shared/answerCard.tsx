import { useState } from "react";
import { GameStateProps } from "../../pages/game";
import clsx from "clsx";
import { Row } from "../layout/row";
import { Col } from "../layout/col";
import { Grid } from "../layout/grid";

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
          `flex flex-col items-center justify-center w-full  p-5 border rounded-xl`,
          canClick
            ? "cursor-pointer hover:bg-violet-700 shadow-sm"
            : "bg-violet-800"
        )}
        onClick={() => canClick && onClick && onClick()}
      >
        <div className="flex flex-row justify-between w-full items-center">
          <div className="flex flex-col items-start">
            <div className="text">{props.answer.answer}</div>
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
        {/* {Array(answer.number_of_votes)
          .fill(0)
          .map((vote, i) => (
            <div
              className={`flex flex-row items-center justify-center w-full bg-gray-500 p-1 rounded-xl shadow-md`}
              key={i}
            >
              <div className="text-xl h-7">🪓</div>
            </div>
          ))} */}
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

  const first = player.score === maxPoints;
  const emoji = player.emoji === "undefined" ? "👤" : player.emoji;

  const percentagePoints = Math.round((player.score / (maxPoints ?? 0)) * 100);
  const totalPointsThisRound =
    (points?.guessing_the_bot ?? 0) + (points?.tricking_players ?? 0);

  return (
    <Grid className="grid-cols-6">
      <Col className="col-span-1 items-center justify-end gap-2">
        <Col className="text-xl rounded-full h-9 w-9 bg-blue-500 justify-center items-center">
          {emoji}
        </Col>
        {!isBot && <i className="text-xs text-gray-500">{player.score} pts</i>}
      </Col>
      <Col className="w-full col-span-5">
        <div className="text-xs text-slate-400">{player.username}</div>
        <div className=" bg-violet-900 w-full p-2 flex-grow rounded-lg relative px-4 py-2 rounded-bl-none">
          {props.answer.answer}

          {!isBot && (
            <Row className="absolute -top-3 z-10 right-0 gap-2">
              {(points?.guessing_the_bot ?? 0) > 0 && (
                <div className="bg-green-300 opacity-70 px-3 py-1 rounded-full">
                  <Row className="justify-center gap-3">
                    <div className="text-xs text-green-700 font-bold">
                      +{points?.guessing_the_bot}
                    </div>
                    <i className={`text-xs text-gray-500 font-light`}>
                      Bot detected
                    </i>
                  </Row>
                </div>
              )}
              {/* {(points?.tricking_players ?? 0) > 0 && (
                <div className="bg-green-300 opacity-70 px-3 py-1 rounded-full">
                  <Col>
                    <div className="text-lg text-green-700 font-bold">
                      +{points?.tricking_players}
                    </div>
                    <i className={`text-xs text-gray-500 font-light`}>
                      Trickster
                    </i>
                  </Col>
                </div>
              )} */}
            </Row>
          )}
          {!isBot && playersWhoVoted && playersWhoVoted.length > 0 && (
            <div className="absolute -bottom-3 z-10 right-0">
              <Row className="bg-green-700 rounded-full text-xs px-2 py-1 gap-2">
                + {points?.tricking_players ?? 0} Tricked
                {playersWhoVoted?.map((player, i) => (
                  <div key={i}>{player.emoji}</div>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Col>
    </Grid>
  );
}
