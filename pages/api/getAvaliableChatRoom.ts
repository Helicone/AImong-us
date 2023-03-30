// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../lib/supabaseServer";

type Data = {
  name: string;
};

async function getChatRooms() {
  const { data, error } = await supabaseServer
    .from("chat_rooms")
    .select("*")
    .order("id", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const supabase = createServerSupabaseClient({ req, res });
  const {
    query: { mode },
  } = req;

  if (mode === "detective") {
    res.status(200).json({ name: "John Doe" });
  } else if (mode === "sabotage") {
    res.status(200).json({ name: "John Doe" });
  }
}
