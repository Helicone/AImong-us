import clsx from "clsx";
import { GameStateProps } from "../pages/game";

import { useState } from "react";
import {
  INPUT_CLASSNAME,
  PRIMARY_BUTTON_CLASSNAME,
} from "../lib/common-classes";
import { Col } from "./layout/col";
import { Row } from "./layout/row";

export function Chat(props: GameStateProps<any>) {
  const [message, setMessage] = useState("");
  const [isShifted, setIsShifted] = useState(false);
  const msgs = props.game.messages;
  function getPlayerUserName(id: number) {
    return props.game.players.find((player) => player.random_unique_id === id)
      ?.username;
  }
  return (
    <Col className="justify-end p-4 h-[70vh] w-80 bg-violet-950 rounded-2xl ">
      {msgs.map((msg, i) => (
        <div key={i} className="overflow-auto">
          {getPlayerUserName(msg.sender)}: {msg.message}
        </div>
      ))}
      <Row className="gap-2">
        <textarea
          rows={1}
          name="answer"
          id="answer"
          className={clsx("resize-none block w-full", INPUT_CLASSNAME)}
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
          className={PRIMARY_BUTTON_CLASSNAME}
          onClick={() => {
            props.sendMessage({
              SendChat: message,
            });
            setMessage("");
          }}
        >
          Send
        </button>
      </Row>
    </Col>
  );
}
