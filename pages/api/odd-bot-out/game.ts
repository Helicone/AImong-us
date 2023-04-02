import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  NUM_PLAYERS,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
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

async function getAnswers(question_id: number) {
  return supabaseServer
    .from("answers")
    .select("*")
    .filter("question", "eq", question_id);
}

export type Questions = (NonNullable<
  UnwrapPromise<ReturnType<typeof getQuestions>>["data"]
>[number] & {
  answers: NonNullable<UnwrapPromise<ReturnType<typeof getAnswers>>["data"]>;
})[];

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
  let hasQuestions = ((await getQuestions(game.game_id)).data ?? []).length > 0;
  let questions: Questions = [];
  if (game.player_count === NUM_PLAYERS && hasQuestions) {
    const randomQuestion =
      listOfQuestions[Math.floor(Math.random() * listOfQuestions.length)];
    const { data: question, error: questionError } = await supabaseServer
      .from("questions")
      .insert([{ question: randomQuestion, game: game.game_id }]);
    if (questionError !== null) {
      res.status(500).json(undefined);
      return;
    }
    questions = await Promise.all(
      ((await getQuestions(game.game_id)).data ?? []).map(async (question) => {
        return {
          ...question,
          answers: (await getAnswers(question.id)).data ?? [],
        };
      })
    );
    const currentQuestion = questions[questions.length - 1];
    const timeElapsed =
      Date.now() - new Date(currentQuestion.created_at!).getTime();

    const timeRemaining = TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS - timeElapsed;

    // if (timeRemaining < 0) {
  }

  res.status(200).json({
    ...game,
    questions: questions,
  });
}
