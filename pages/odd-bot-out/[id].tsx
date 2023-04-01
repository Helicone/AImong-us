/* eslint-disable @next/next/no-img-element */
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import ActiveGame from "../../components/games/oddBotOut/activeGame";
import FindingPlayers from "../../components/games/oddBotOut/findingPlayers";
import LoggedInFlow from "../../components/loggedInFlow";
import LoggedOutFlow from "../../components/loggedOutFlow";
import { MainWrapper } from "../../components/mainWrapper";
import { NUM_PLAYERS } from "../../lib/constants";
import { GameResponse } from "../api/odd-bot-out/game";

export default function Home() {
  const user = useUser();

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
    return <div>Loading...</div>;
  }
  const stateMap = {
    finding_players: () => <FindingPlayers game={game} />,
    active: () => <ActiveGame game={game} />,
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
