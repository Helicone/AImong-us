import { GameStateProps } from "../pages/game";

import { useState } from "react";

export function Chat(props: GameStateProps<any>) {
  const [message, setMessage] = useState("");
  const [isShifted, setIsShifted] = useState(false);
  const msgs = props.game.messages;
  function getPlayerUserName(id: number) {
    return props.game.players.find((player) => player.random_unique_id === id)
      ?.username;
  }
  return (
    <div className="flex flex-col h-full justify-end pb-2">
      {msgs.map((msg, i) => (
        <div key={i} className="whitespace-pre-wrap overflow-auto break-all">
          {getPlayerUserName(msg.sender)}: {msg.message}
        </div>
      ))}
      <div className="flex flex-row max-w-md gap-2">
        <textarea
          rows={1}
          name="answer"
          id="answer"
          className="pl-3 resize-none block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-md sm:leading-6"
          placeholder="Chat"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isShifted) {
              e.preventDefault();
              props.sendMessage({
                SendChat: message,
              });
              setMessage("");
            }
            if (e.key === "Shift") {
              setIsShifted(true);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === "Shift") {
              setIsShifted(false);
            }
          }}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            props.sendMessage({
              SendChat: message,
            });
            setMessage("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
