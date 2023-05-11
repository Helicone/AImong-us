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
import { MyClientGameStateView } from "../../../aimongus_types/bindings/ExtractClientState";
import useNotification from "../../notification/useNotification";

function FindingPlayersHost(props: GameStateProps<"Lobby">) {
  const { game, sendMessage } = props;
  let playerText =
    game.number_of_players === 1
      ? "No players joined"
      : `${game.number_of_players - 1} player ${
          game.number_of_players - 1 > 1 ? "s" : ""
        } joined`;

  return (
    <Col className="h-full items-center gap-6 relative justify-between">
      {game && (
        <Row className={"w-full justify-end"}>
          <RoomCodeButton game={game} />
        </Row>
      )}
      <div className="text-sm min-h-[20rem]">{playerText}</div>

      {game.game_state.content.is_host ? (
        <button
          className={clsx(PRIMARY_BUTTON_CLASSNAME, "w-full text-xl")}
          onClick={() => {
            sendMessage("StartGame");
          }}
        >
          Start game
        </button>
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

function RoomCodeButton(props: { game: MyClientGameStateView<"Lobby"> }) {
  const { game } = props;
  const { setNotification } = useNotification();
  return (
    <button
      className={clsx(PRIMARY_BUTTON_CLASSNAME)}
      onClick={() => {
        navigator.clipboard.writeText(
          "http://localhost:3000/game?room_id=" + game.room_code
        );
        setNotification({
          title: "Copied to clipboard",
          variant: "success",
        });
      }}
    >
      <div className="flex flex-col">
        <div className="text-sm">Room Code</div>
        <div className="text-2xl font-bold">{game.room_code}</div>
      </div>
    </button>
  );
}

function Wrapper(
  props: GameStateProps<"Lobby"> & {
    children: React.ReactNode;
  }
) {
  const { game, sendMessage } = props;

  return <>{props.children}</>;
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
