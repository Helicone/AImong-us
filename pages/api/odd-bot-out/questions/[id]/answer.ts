import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS } from "../../../../../lib/constants";
import { supabaseServer } from "../../../../../lib/supabaseServer";

async function submitAnswer(
  user_id: string,
  question_id: string,
  answer: string
) {
  return await supabaseServer
    .rpc("submit_answer", {
      p_answer_text: answer,
      p_question_id: parseInt(question_id),
      p_user_id: user_id,
    })
    .select("*")
    .single();
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type AnswerResponse =
  | UnwrapPromise<ReturnType<typeof submitAnswer>>["data"]
  | undefined;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnswerResponse>
) {
  const supabase = createServerSupabaseClient({ req, res });
  const { id: questionId } = req.query;
  const { answer } = req.body;
  console.log("BODY", req.body);
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!questionId || !answer || !userId) {
    console.error(
      "missing questionId, answer, or userId",
      questionId,
      answer,
      userId
    );
    res.status(401).json(undefined);
    return;
  }

  const { data: answerResponse, error } = await submitAnswer(
    userId,
    questionId as string,
    answer
  );
  if (error !== null) {
    console.error(error);
    res.status(404).json(undefined);
    return;
  }
  res.status(200).json(answerResponse);
}
