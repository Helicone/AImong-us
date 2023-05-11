import clsx from "clsx";
import { MyClientGameStateView } from "../../../aimongus_types/bindings/ExtractClientState";
import {
  BASE_BUTTON_CLASSNAME,
  PINK_BUTTON,
  TEAL_BUTTON,
} from "../../../lib/common-classes";
import { GameStateProps } from "../../../pages/game";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import useNotification from "../../notification/useNotification";

export default function FindingPlayers(props: GameStateProps<"Lobby">) {
  const { game, sendMessage } = props;
  const { setNotification } = useNotification();

  return (
    <Col className="h-full items-center gap-6 relative justify-between">
      <Col className="h-full w-full gap-6">
        {game && (
          <Row className={"w-full justify-end"}>
            <RoomCodeButton game={game} />
          </Row>
        )}
        <div className="text-xl text-center">Waiting on players...</div>
        <Row className="gap-4 justify-center flex-wrap overflow-y-auto">
          {game &&
            game.players.length > 0 &&
            game.players.map((player) => (
              <Col key={player.random_unique_id} className="text-center gap-1">
                <Col className="h-20 w-20 items-center justify-center text-6xl rounded-full bg-gradient-to-bl bg-gradient from-slate-600 to-slate-400 ">
                  {player.emoji}
                </Col>
                <div>{player.username}</div>
              </Col>
            ))}
        </Row>
      </Col>
      {game.game_state.content.is_host && (
        <button
          className={clsx(TEAL_BUTTON, BASE_BUTTON_CLASSNAME, "w-full text-xl")}
          onClick={() => {
            if (!game.players.find((player) => player.is_bot)) {
              setNotification({
                title: "No bot found",
                description:
                  "please contact us on discord to help resolve this issue",
                variant: "error",
              });
              return;
            }
            if (game.players.length <= 2) {
              setNotification({
                title: "Not enough players",
                variant: "error",
              });
            } else {
              sendMessage("StartGame");
            }
          }}
        >
          Start game
        </button>
      )}
    </Col>
  );
}

function RoomCodeButton(props: { game: MyClientGameStateView<"Lobby"> }) {
  const { game } = props;
  const { setNotification } = useNotification();
  return (
    <button
      className={clsx(PINK_BUTTON, BASE_BUTTON_CLASSNAME)}
      onClick={() => {
        navigator.clipboard.writeText(
          "http://localhost:3000/joining-game?room_id=" + game.room_code
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
