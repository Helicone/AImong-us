import { ClientGameState } from "../aimongus_types/bindings/ClientGameState";
import { ClientGameStateView } from "../aimongus_types/bindings/ClientGameStateView";
import { NUM_QUESTIONS_PER_GAME } from "../lib/constants";
import { Col } from "./layout/col";

interface MainWrapperProps {
  children: React.ReactNode;
  title: string;
  game?: ClientGameStateView;
}

const headerInfo: {
  [T in ClientGameState["state"]]?: {
    title: string;
    subtitle: string;
  };
} = {
  Answering: {
    title: "Answering",
    subtitle: "Convince other players you are human",
  },
  Voting: {
    title: "Voting",
    subtitle: "Find the AI",
  },
};

function GameHeader(props: MainWrapperProps) {
  const data =
    props.game?.game_state.state && headerInfo[props.game?.game_state.state];
  if (!data) {
    return null;
  }
  const { title, subtitle } = data;
  return (
    <div className="flex flex-col gap-1 items-center">
      <h1 className="text-3xl font-semibold font-mono flex flex-col items-center text-center">
        {title}
      </h1>
      <h2 className="text-sm font-semibold font-mono flex flex-col items-center text-center">
        ({subtitle})
      </h2>
    </div>
  );
}

export function MainWrapper(props: MainWrapperProps) {
  const { children, title, game } = props;
  return (
    <main className="flex flex-col w-full flex-1 justify-between">
      <h1 className="text-center w-full py-2 border-b px-5 ">
        <div className="">
          <div className="flex md:flex-row w-full justify-between items-center">
            <div className="text-center w-full"></div>
            <div className="text-center w-full text-5xl font-mono text-white">
              AImong.us
            </div>
            <div className="w-full text-right">
              {game && (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "http://localhost:3000/game?room_id=" + game.room_code
                    );
                  }}
                >
                  <div className="flex flex-col">
                    <div className="text-sm">Room Code</div>
                    <div className="text-2xl">{game.room_code}</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </h1>
      {game && game?.game_state.state !== "Lobby" && (
        <h2 className="flex flex-row justify-between w-full py-2 border-b px-5 items-center ">
          <div>
            Turn {game?.current_turn} / {NUM_QUESTIONS_PER_GAME}
          </div>
          <GameHeader {...props} />
          <div>{game?.number_of_players} players</div>
        </h2>
      )}
      <Col className="grow px-6 py-4">{children}</Col>
    </main>
  );
}
