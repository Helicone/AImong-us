/* eslint-disable @next/next/no-img-element */

import { MainWrapper } from "../components/mainWrapper";

import { useRouter } from "next/router";
import { useState } from "react";

import { ClientGameState } from "../aimongus_types/bindings/ClientGameState";
import { ClientGameStateView } from "../aimongus_types/bindings/ClientGameStateView";
import { ClientResponse } from "../aimongus_types/bindings/ClientResponse";
import { MyClientGameStateView } from "../aimongus_types/bindings/ExtractClientState";
import FindingPlayers from "../components/games/aimongus/findingPlayers";
import QuestionAnswering from "../components/games/aimongus/questionAnswering";
import Voting from "../components/games/aimongus/voting";
import VotingResults from "../components/games/aimongus/votingResults";
import useUser from "../lib/hooks/useUser";
import { useWebsocket } from "../lib/hooks/useWebhook";

export interface GameStateProps<T extends ClientGameState["state"]> {
  game: MyClientGameStateView<T>;
  sendMessage: (message: ClientResponse) => void;
}
function GameIsolateChannel({
  sendMessage,
  response,
}: {
  sendMessage: (message: ClientResponse) => void;
  response: string;
}) {
  try {
    const gameState: ClientGameStateView = JSON.parse(response);
    const stateMap: {
      [K in ClientGameState["state"]]: (
        props: GameStateProps<K>
      ) => JSX.Element;
    } = {
      Lobby: (props) => <FindingPlayers {...props} />,
      Answering: (props) => <QuestionAnswering {...props} />,
      Voting: (props) => <Voting {...props} />,
      Reviewing: (props) => <VotingResults {...props} />,
    };

    const GameState = stateMap[gameState.game_state.state];
    if (!GameState) {
      return <div>Unknown game state: {gameState.game_state.state}</div>;
    }

    return (
      <div>
        <MainWrapper title="AImong Us" game={gameState}>
          <GameState game={gameState as any} sendMessage={sendMessage} />
        </MainWrapper>
      </div>
    );
  } catch (e) {
    return (
      <div>
        error
        {JSON.stringify(e)}
        Websocket response: {JSON.stringify(response)}
        TODO... ask the backend for a new game state object if we get here
      </div>
    );
  }
}

function Game({ websocketAddress }: { websocketAddress: string }) {
  const [response, setResponse] = useState("");
  const { sendMessage } = useWebsocket(websocketAddress, setResponse);
  return (
    <GameIsolateChannel
      sendMessage={(e) => sendMessage(JSON.stringify(e))}
      response={response}
    />
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const user = useUser();
  if (!user) {
    return <div>Not logged in</div>;
  }

  if (router.query.get_new_game == "true") {
    return (
      <Game
        websocketAddress={`ws://localhost:8000/create-room?identity=${user}`}
      />
    );
  } else if (router.query.room_id) {
    return (
      <Game
        websocketAddress={`ws://localhost:8000/join-room?identity=${user}&room=${router.query.room_id}`}
      />
    );
  } else {
    return <div>I dont know how we got here... ummm abort</div>;
  }
}
