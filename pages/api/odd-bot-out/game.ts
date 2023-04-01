import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { NUM_PLAYERS } from "../../../lib/constants";
import { supabaseServer } from "../../../lib/supabaseServer";

async function getActiveGame(user_id: string) {
  return await supabaseServer
    .rpc("find_or_create_active_game", {
      p_user: user_id,
      p_num_players: NUM_PLAYERS,
    })
    .select("*")
    .single();
}

const listOfQuestions = [
  "What is your favorite color?",
  "What is your favorite food?",
  "What is your favorite animal?",
  "What is your favorite movie?",
  "What is your favorite song?",
];

async function getQuestions(gameId: string) {
  return await supabaseServer
    .from("questions")
    .select("*")
    .filter("game", "eq", gameId)
    .order("created_at", { ascending: true });
}

export type Questions = NonNullable<
  UnwrapPromise<ReturnType<typeof getQuestions>>["data"]
>;

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ActiveGameType = ReturnType<typeof getActiveGame>;

export type GameResponse =
  | (UnwrapPromise<ActiveGameType>["data"] & {
      questions: Questions;
    })
  | undefined;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameResponse>
) {
  console.log("fetching game");
  const supabase = createServerSupabaseClient({ req, res });
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  if (!userId) {
    res.status(401).json(undefined);
    return;
  }
  const { data: game, error } = await getActiveGame(userId);

  if (error !== null) {
    res.status(404).json(undefined);
    return;
  }
  let questions = (await getQuestions(game.game_id)).data ?? [];
  if (game.player_count === NUM_PLAYERS && questions.length === 0) {
    const randomQuestion =
      listOfQuestions[Math.floor(Math.random() * listOfQuestions.length)];
    const { data: question, error: questionError } = await supabaseServer
      .from("questions")
      .insert([{ question: randomQuestion, game: game.game_id }]);
    if (questionError !== null) {
      res.status(500).json(undefined);
      return;
    }
    questions = (await getQuestions(game.game_id)).data ?? [];
  }
  res.status(200).json({
    ...game,
    questions: questions,
  });
}
