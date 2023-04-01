import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function LoggedInFlow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const client = useSupabaseClient();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col max-w-lg w-full gap-2">
        <button className="border-2 border-gray-800 bg-gray-600 text-white p-2 w-full hover:opacity-90">
          Play Odd Bot Out
        </button>
        <button
          disabled={true}
          className="border-2 border-gray-800 bg-gray-600 text-white p-2 w-full disabled:opacity-50 disabled:pointer-events-none"
        >
          Play Turing Chat (coming soon)
        </button>
      </div>
    </div>
  );
}
