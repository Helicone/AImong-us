import { GameResponse } from "../../../pages/api/odd-bot-out/game";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import Lottie from "react-lottie";
import check from "../../../public/lottie/check.json";
import { Spacer } from "../../layout/spacer";
import { NUM_PLAYERS } from "../../../lib/constants";
import clsx from "clsx";

interface StartingGameProps {
  game: NonNullable<GameResponse>;
}

const PLAYERS_PER_ROW = 3;

export default function startingGame(props: StartingGameProps) {
  const { game } = props;
  return (
    <Col className="h-full items-center">
      <Row className="justify-center">
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: check,
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
      <div className="text-xl">Starting game...</div>
      <div className="text-sm right-0 bottom-0">Your players</div>
      <Spacer h={6} />
      <Row className="max-w-sm w-full overflow flex-wrap justify-center items-center">
        {game.players.map((player) => (
          <Player key={player.index} player={player} />
        ))}
      </Row>
    </Col>
  );
}

export function Player(props: { player: player }) {
  const { isFound } = props;
  const avatarClass = clsx(
    "transition-colors",
    isFound ? "text-gray-600" : "text-gray-200 animate-pulse"
  );
  return (
    <Col className="gap-3 items-center w-1/3 my-3">
      <div className={clsx("w-20 h-20 rounded-full", avatarClass)} />
    </Col>
  );
}
