import clsx from "clsx";
import { NUM_PLAYERS } from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { Spacer } from "../../layout/spacer";
import Lottie from "react-lottie";
import { IoPersonCircle } from "react-icons/io5";
import searching from "../../../public/lottie/finding.json";
interface FindingPlayersProps {
  game: NonNullable<GameResponse>;
}

export default function FindingPlayers(props: FindingPlayersProps) {
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
      <div className="text-xl">
        {game?.game_state == "find"}Finding players...
      </div>
      <div className="text-sm right-0 bottom-0">
        {game?.player_count} / {NUM_PLAYERS}
      </div>
    </Col>
  );
}
