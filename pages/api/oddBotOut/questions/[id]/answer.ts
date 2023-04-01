import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../../../lib/supabaseServer";

async function submitAnswer(
  questionId: string,
  answer: string,
  user_id: string
) {
  const questionIdAsNumber = parseInt(questionId as string);

  return await supabaseServer.rpc("submit_answer", {
    p_answer_text: answer,
    p_question_id: questionIdAsNumber,
    p_user_id: user_id,
  });
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Answer = UnwrapPromise<ReturnType<typeof submitAnswer>> | undefined;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Answer>
) {
  const supabase = createServerSupabaseClient({ req, res });
  const { id: questionId } = req.query;
  const { answer } = req.body;

  if (answer === undefined) {
    res.status(400).json(undefined);
    return;
  }

  const user = await supabase.auth.getUser();
  const user_id = user.data.user?.id;

  if (!user_id) {
    res.status(401).json(undefined);
    return;
  }

  const answerResult = await submitAnswer(
    questionId as string,
    answer,
    user_id
  );

  if (answerResult.error !== null) {
    res.status(500).json(answerResult);
    return;
  }

  res.status(200).json(answerResult);
}
