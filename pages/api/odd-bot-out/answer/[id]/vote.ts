import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../../../lib/supabaseServer";

async function castVote(user_id: string, answer_id: string) {
  return await supabaseServer
    .rpc("cast_vote", {
      p_player_id: user_id,
      p_answer_id: parseInt(answer_id),
    })
    .select("*")
    .single();
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type AnswerResponse =
  | UnwrapPromise<ReturnType<typeof castVote>>["data"]
  | undefined;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnswerResponse>
) {
  const supabase = createServerSupabaseClient({ req, res });
  const { id: answerId } = req.query;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!answerId || !userId) {
    console.error("missing answer, or userId", answerId, userId);
    res.status(401).json(undefined);
    return;
  }

  console.log(await castVote(userId, answerId as string));
  res.status(200).json(undefined);
}
