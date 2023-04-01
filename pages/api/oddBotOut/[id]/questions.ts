import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../../lib/supabaseServer";

async function getQuestions(gameId: string) {
  return await supabaseServer
    .from("questions")
    .select("*")
    .filter("game", "eq", gameId);
}

const listOfQuestions = [
  "What is your favorite color?",
  "What is your favorite food?",
  "What is your favorite animal?",
  "What is your favorite movie?",
  "What is your favorite song?",
];

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Questions = UnwrapPromise<ReturnType<typeof getQuestions>>;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Questions>
) {
  const { id: gameId } = req.query;
  const questions = await getQuestions(gameId as string);
  if (questions.error !== null) {
    res.status(404).json(questions);
    return;
  }
  res.status(200).json(questions);
}
