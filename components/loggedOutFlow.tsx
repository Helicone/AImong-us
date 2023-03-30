import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function LoggedOutFlow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const client = useSupabaseClient();

  return (
    <div className="flex flex-col items-center w-full">
      <div className=" flex flex-col max-w-lg w-full gap-2">
        You must be logged in to access this page.
        <div className=" flex flex-row justify-between items-center gap-3">
          <label className="text-white">Email</label>
          <input
            type="email"
            value={email}
            className="border-2 border-white bg-black text-white p-2 w-full"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            client.auth.signInWithOtp({ email });
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
