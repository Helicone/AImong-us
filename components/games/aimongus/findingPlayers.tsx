import { useState } from "react";
import Lottie from "react-lottie";
import { NUM_PLAYERS } from "../../../lib/constants";
import { GameStateProps } from "../../../pages/game";
import searching from "../../../public/lottie/finding.json";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { CgRowLast } from "react-icons/cg";

const Toggle = ({ onChange }: { onChange: (isToggled: boolean) => void }) => {
  const [isToggled, setIsToggled] = useState(false);

  const handleClick = () => {
    setIsToggled(!isToggled);
    onChange(!isToggled);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-12 h-7 bg-gray-300 rounded-full shadow-inner focus:outline-none transition-all duration-300 ${
        isToggled ? "bg-green-400" : ""
      }`}
    >
      <span
        className={`absolute w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 left-0 bottom-1
         ${isToggled ? "translate-x-6" : "translate-x-1"}`}
      ></span>
    </button>
  );
};

function FindingPlayersHost(props: GameStateProps<"Lobby">) {
  const { game, sendMessage } = props;
  let playerText =
    game.number_of_players === 1
      ? "No players joined"
      : `${game.number_of_players - 1} player ${
          game.number_of_players - 1 > 1 ? "s" : ""
        } joined`;

  return (
    <Col className="h-full items-center gap-6">
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
