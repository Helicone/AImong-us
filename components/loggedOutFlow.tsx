import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function LoggedOutFlow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [didSendEmail, setDidSendEmail] = useState(false);
  const client = useSupabaseClient();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col max-w-lg w-full gap-2 text-center">
        You must be logged in to access this page.
        <div className="flex flex-row justify-between items-center gap-3">
          <label className="text-white">Email</label>
          <input
            type="email"
            value={email}
            className="border-2 border-gray-700 p-2 w-full"
            placeholder="john@doe.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="border-2 border-gray-800 bg-gray-600 text-white p-2 w-1/2 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            disabled={didSendEmail}
            onClick={() => {
              client.auth.signInWithOtp({ email });
              setDidSendEmail(true);
            }}
          >
            {didSendEmail ? "Email sent!" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
