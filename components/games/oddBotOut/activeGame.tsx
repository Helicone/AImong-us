import {
  NUM_PLAYERS,
  TOTAL_TIME_TO_ANSWER_QUESTION,
} from "../../../lib/constants";
import { GameResponse } from "../../../pages/api/odd-bot-out/game";

interface ActiveGameProps {
  game: NonNullable<GameResponse>;
}
export default function ActiveGame(props: ActiveGameProps) {
  const { game } = props;

  const currentQuestion = game.questions[0];

  const timeLeft = TOTAL_TIME_TO_ANSWER_QUESTION - (Date.now() - game);
  return (
    <div>
      <div>
        <div>{game?.game_state}</div>
        <div>
          {game?.player_count} / {NUM_PLAYERS} Players Joined
          {game?.questions[0].question}
        </div>
      </div>
    </div>
  );
}
