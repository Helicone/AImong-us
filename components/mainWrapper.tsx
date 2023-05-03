import { ClientGameStateView } from "../aimongus_types/bindings/ClientGameStateView";
import { NUM_QUESTIONS_PER_GAME } from "../lib/constants";
import { Col } from "./layout/col";

interface MainWrapperProps {
  children: React.ReactNode;
  title: string;
  game?: ClientGameStateView;
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
      {game && (
        <h2 className="flex flex-row justify-between w-full py-2 border-b px-5 ">
          <div>
            Turn {game?.current_turn} / {NUM_QUESTIONS_PER_GAME}
          </div>
          <div>Hello</div>
          <div>{game?.number_of_players} players</div>
        </h2>
      )}
      <Col className="grow px-6 py-4">{children}</Col>
      <div className="w-full pb-5 pt-2 flex flex-col gap-3 justify-center items-center">
        <div className="flex flex-row gap-5">
          <a href="https://twitter.com/valyr_ai">
            <i>Twitter</i>
          </a>
          <a href="https://github.com/helicone/aimong-us">
            <i>Github</i>
          </a>
        </div>
      </div>
    </main>
  );
}
