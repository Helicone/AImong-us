/* eslint-disable @next/next/no-img-element */

import Head from "next/head";
import LoggedInFlow from "../components/loggedInFlow";
import LoggedOutFlow from "../components/loggedOutFlow";
import { MainWrapper } from "../components/mainWrapper";

import React, { useState, useEffect } from "react";
import Lobby from "../components/games/oddBotOut/lobby";
import { useRouter } from "next/router";
import { GameStates } from "../lib/states";
import FindingPlayers from "../components/games/oddBotOut/findingPlayers";
import QuestionAnswering from "../components/games/oddBotOut/questionAnswering";
import Voting from "../components/games/oddBotOut/voting";
import VotingResults from "../components/games/oddBotOut/votingResults";
import useUser from "../lib/hooks/useUser";
import { useWebsocket } from "../lib/hooks/useWebhook";
import { Channel, useChannel } from "../lib/hooks/usChannel";
import { ClientGameStateView } from "../backstab/bindings/ClientGameStateView";
import { ClientResponse } from "../backstab/bindings/ClientResponse";
import { MyClientGameStateView } from "../backstab/bindings/ExtractClientState";
import { ClientGameState } from "../backstab/bindings/ClientGameState";

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
      InGame: (props) => <QuestionAnswering {...props} />,
    };

    const GameState = stateMap[gameState.game_state.state];

    return (
      <div>
        <MainWrapper title="Odd Bot Out">
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
