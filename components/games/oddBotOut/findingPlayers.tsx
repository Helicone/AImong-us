import clsx from "clsx";
import { NUM_PLAYERS } from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { Spacer } from "../../layout/spacer";
import Lottie from "react-lottie";
import searching from "../../../public/lottie/finding.json";
interface FindingPlayersProps {
  game: NonNullable<GameResponse>;
}

export default function FindingPlayers(props: FindingPlayersProps) {
  const { game } = props;
  return (
    <Col className="h-full">
      <Col className="items-center gap-2">
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
            height={200}
            width={200}
            isStopped={false}
            isPaused={false}
            style={{
              color: "#6366f1",
              pointerEvents: "none",
              background: "transparent",
            }}
          />
        </Row>
        <div className="text-xl">Finding players...</div>
        <div className="text-sm right-0 bottom-0">
          {game?.player_count} / {NUM_PLAYERS}
        </div>
      </Col>
      <Spacer h={6} />
      <Col className="gap-4 mx-4">
        {Array.from({ length: NUM_PLAYERS }).map((_, i) => (
          <MysteryAvatar key={i} isFound={i < game?.player_count} />
        ))}
      </Col>
    </Col>
  );
}

export function MysteryAvatar(props: { isFound: boolean }) {
  const { isFound } = props;
  const avatarClass = clsx(
    "transition-colors",
    isFound ? "bg-gray-600" : "bg-gray-300 animate-pulse"
  );
  return (
    <Row className="gap-3 items-center">
      <div className={clsx("w-8 h-8 rounded-full", avatarClass)} />
      <div className={clsx(" grow h-4 ", avatarClass)} />
    </Row>
  );
}
