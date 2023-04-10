/* eslint-disable @next/next/no-img-element */
import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import QuestionAnswering from "../../components/games/oddBotOut/questionAnswering";
import FindingPlayers from "../../components/games/oddBotOut/findingPlayers";
import Voting from "../../components/games/oddBotOut/voting";
import LoggedInFlow from "../../components/loggedInFlow";
import LoggedOutFlow from "../../components/loggedOutFlow";
import { MainWrapper } from "../../components/mainWrapper";
import { NUM_PLAYERS } from "../../lib/constants";
import { GameStates } from "../../lib/states";
import { GameResponse } from "../api/odd-bot-out/game";
import VotingResults from "../../components/games/oddBotOut/votingResults";

export default function Home() {
  const user = useUser();
  const supabase = useSupabaseClient();

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["odd-bot-out", "game"],
    queryFn: async () => {
      const res = await fetch("/api/odd-bot-out/game");
      return res.json() as Promise<GameResponse>;
    },
  });
  const router = useRouter();
  if (!gameLoading && game?.game_id) {
    if (router.query.id !== game.game_id) {
      router.push("/odd-bot-out/" + game.game_id);
    }
  }
  if (!game) {
    return (
      <div>
        Loading... try logging out and back in if you are stuck here
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              supabase.auth
                .signOut()
                .then(console.log)
                .then(() => router.push("/"));
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }
  const stateMap: {
    [key in GameStates]: () => JSX.Element;
  } = {
    finding_players: () => <FindingPlayers game={game} />,
    starting_game: () => <div>Starting game...</div>,
    questions: () => <QuestionAnswering game={game} />,
    voting: () => <Voting game={game} />,
    voting_results: () => <VotingResults game={game} />,
    game_over: () => <div>Game over</div>,
    needs_question: () => <div>Needs question</div>,
    should_continue: () => <div>Should continue</div>,
  };

  if (game?.game_state && !(game.game_state in stateMap)) {
    return <div>Game state not found</div>;
  }

  const GameState = stateMap[game!.game_state as keyof typeof stateMap];

  return (
    <div>
      <MainWrapper title="Odd Bot Out">
        <GameState />
      </MainWrapper>
    </div>
  );
}
