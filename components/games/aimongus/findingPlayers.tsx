import { useState } from "react";
import Lottie from "react-lottie";
import { NUM_PLAYERS } from "../../../lib/constants";
import { GameStateProps } from "../../../pages/game";
import searching from "../../../public/lottie/finding.json";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { CgRowLast } from "react-icons/cg";
import { PRIMARY_BUTTON_CLASSNAME } from "../../../lib/common-classes";
import clsx from "clsx";

function FindingPlayersHost(props: GameStateProps<"Lobby">) {
  const { game, sendMessage } = props;
  let playerText =
    game.number_of_players === 1
      ? "No players joined"
      : `${game.number_of_players - 1} player ${
          game.number_of_players - 1 > 1 ? "s" : ""
        } joined`;

  return (
    <Col className="h-full items-center gap-6 relative">
      {game && (
        <button
          className={clsx(PRIMARY_BUTTON_CLASSNAME, "absolute right-0 top-4")}
          onClick={() => {
            navigator.clipboard.writeText(
              "http://localhost:3000/game?room_id=" + game.room_code
            );
          }}
        >
          <div className="flex flex-col">
            <div className="text-sm">Room Code</div>
            <div className="text-2xl font-bold">{game.room_code}</div>
          </div>
        </button>
      )}
      <div className="text-sm right-0 bottom-0">{playerText}</div>

      {game.game_state.content.is_host ? (
        <div className="text-xl">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              sendMessage("StartGame");
            }}
          >
            Start game
          </button>
        </div>
      ) : (
        <div className="text-xl">Waiting for host to start game</div>
      )}
    </Col>
  );
}

function FindingPlayersPlayer(props: GameStateProps<"Lobby">) {
  const { game } = props;
  return (
    <Col className="h-full items-center">
      <Row className="justify-center">
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: searching,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid slice",
            },
          }}
          height={150}
          width={150}
          isStopped={false}
          isPaused={false}
          style={{
            color: "#6366f1",
            pointerEvents: "none",
            background: "transparent",
          }}
        />
      </Row>
      <div className="text-xl"></div>
      <div className="text-xl text-center">Waiting for host to start game</div>
    </Col>
  );
}

function Wrapper(
  props: GameStateProps<"Lobby"> & {
    children: React.ReactNode;
  }
) {
  const { game, sendMessage } = props;

  return <div>{props.children}</div>;
}

export default function FindingPlayers(props: GameStateProps<"Lobby">) {
  const { game } = props;

  if (game.game_state.content.is_host) {
    return (
      <Wrapper {...props}>
        <FindingPlayersHost {...props} />
      </Wrapper>
    );
  } else {
    return (
      <Wrapper {...props}>
        <FindingPlayersPlayer {...props} />
      </Wrapper>
    );
  }
}
