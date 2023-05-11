import { GameStateProps } from "../../../pages/game";
import { Col } from "../../layout/col";
import { AnswerCard, AnswerCardResult } from "../../shared/answerCard";

interface AnswerProps {
  votingResult: GameStateProps<"Reviewing">["game"]["game_state"]["content"]["results"][number];
}

function BotAnswer(props: AnswerProps) {
  const { votingResult } = props;

  // const voteArray = Array(voteCount).fill(0);
  // const avatar = getAvatar(props.answer.player_id, props.room_code);

  return <div className="relative">{votingResult.answer.answer}</div>;
}

export default function VotingResults(props: GameStateProps<"Reviewing">) {
  const { game, sendMessage } = props;

  const currentQuestion = game.game_state.content.question;

  const botResult = game.game_state.content.bot_ids
    .map((botId) => {
      const result = game.game_state.content.results.find(
        (result) => result.answerer === botId
      );
      if (!result) {
        return null;
      }
      return result;
    })
    .at(0);
  const playerAnswers = game.game_state.content.results.filter(
    (result) => result.answerer !== botResult?.answerer
  );

  if (!currentQuestion) {
    return <div>Game not found</div>;
  }
  if (!botResult) {
    return <div>Bot result not found</div>;
  }
  type Player = GameStateProps<"Voting">["game"]["players"][number];
  function getPlayer(playerId: number): Player | null {
    const player = game.players.find(
      (player) => player.random_unique_id === playerId
    );
    if (!player) {
      return null;
    }
    if (player.emoji === "undefined") {
      return {
        ...player,
        emoji: "👤",
      };
    }
    return player;
  }

  const maxPoints = Math.max(...game.players.map((player) => player.score));

  const winner = game.players.find((player) => player.score === maxPoints);

  return (
    <Col className=" gap-5 justify-between h-full">
      <div>
        {game.game_state.content.is_game_over ? (
          <div className="text-2xl font-semibold font-mono w-full flex flex-col items-center text-center">
            Game over!
            {winner && (
              <div>
                {winner.emoji} {winner.username} wins!
              </div>
            )}
          </div>
        ) : (
          <div className="text-2xl font-semibold font-mono w-full flex flex-col items-center text-center">
            Round over!
          </div>
        )}
      </div>
      <div className="text-xl font-semibold font-mono w-full flex flex-col items-center text-center">
        <div className="max-w-lg   p-5 rounded-lg bg-">{currentQuestion}</div>
      </div>

      <Col className="gap-16">
        <AnswerCardResult
          answer={botResult.answer}
          isBot
          player={getPlayer(botResult.answerer)!}
          playersWhoVoted={
            botResult.players_who_voted
              .map(getPlayer)
              .filter((player) => player !== null) as Player[]
          }
        />
        {playerAnswers
          .map((answer) => ({
            ...answer,
            player: getPlayer(answer.answerer)!,
          }))
          .sort((a, b) => b.player.score - a.player.score)
          .map((result, i) => (
            <AnswerCardResult
              answer={result.answer}
              player={result.player}
              maxPoints={maxPoints}
              playersWhoVoted={
                result.players_who_voted
                  .map(getPlayer)
                  .filter((player) => player !== null) as Player[]
              }
              points={result.points}
              key={i}
            />
          ))}
      </Col>
      {!game.game_state.content.is_game_over && (
        <div className="flex flex-col items-center w-full gap-2">
          <div>
            Players ready:{" "}
            {game.game_state.content.number_of_players_ready ?? 0} /{" "}
            {game.number_of_players}
          </div>
          <button
            className="w-full bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded font-"
            onClick={() => {
              sendMessage("ReadyForNextTurn");
            }}
          >
            Ready for next turn
          </button>
        </div>
      )}
    </Col>
  );
}
