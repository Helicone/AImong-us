import { NUM_PLAYERS } from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";

interface FindingPlayersProps {
  game: GameResponse;
}
export default function FindingPlayers(props: FindingPlayersProps) {
  const { game } = props;
  return (
    <div>
      <div>
        <div>{game?.game_state}</div>
        <div>
          {game?.player_count} / {NUM_PLAYERS} Players Joined
          {game?.questions.length}
        </div>
      </div>
    </div>
  );
}
