import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function LoggedInFlow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const client = useSupabaseClient();

  return (
    <div className="flex flex-col items-center w-full">
      <div className=" flex flex-col max-w-lg w-full gap-2">
        Choose a game to play.
        <button className="border-2 border-white bg-black text-white p-2 w-full">
          Turing Chat (coming soon)
        </button>
        <button className="border-2 border-white bg-black text-white p-2 w-full">
          OddBotOut
        </button>
      </div>
    </div>
  );
}
