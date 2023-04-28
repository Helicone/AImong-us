import Lottie from "react-lottie";
import { NUM_PLAYERS } from "../../../lib/constants";
import { GameStateProps } from "../../../pages/game";
import searching from "../../../public/lottie/finding.json";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";

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

      <div className="text-sm right-0 bottom-0">
        {game.number_of_players} / {NUM_PLAYERS}
      </div>
    </Col>
  );
}
