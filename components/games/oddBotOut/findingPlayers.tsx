import clsx from "clsx";
import { NUM_PLAYERS } from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { Spacer } from "../../layout/spacer";
import Lottie from "react-lottie";
import { IoPersonCircle } from "react-icons/io5";
import searching from "../../../public/lottie/finding.json";
import { ClientGameState } from "../../../backstab/bindings/ClientGameState";
import { ClientGameStateView } from "../../../backstab/bindings/ClientGameStateView";
import { MyClientGameStateView } from "../../../backstab/bindings/ExtractClientState";
import { GameStateProps } from "../../../pages/game";

export default function FindingPlayers(props: GameStateProps<"Lobby">) {
  const { game, sendMessage } = props;

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
      {game.game_state.content.is_host && (
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
      )}

      <div className="text-sm right-0 bottom-0">
        {game.number_of_players} / {NUM_PLAYERS}
      </div>
      <div>INVITE PLAYER</div>
      <div>http://localhost:3000/game?room_id={game.room_code}</div>
    </Col>
  );
}
