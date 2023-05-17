import clsx from "clsx";
import { GameStateProps } from "../pages/game";

import { useEffect, useRef, useState } from "react";
import {
  BASE_BUTTON_CLASSNAME,
  INPUT_CLASSNAME,
  PINK_BUTTON,
} from "../lib/common-classes";
import { Col } from "./layout/col";
import { Row } from "./layout/row";

export function Chat(props: GameStateProps<any>) {
  const [message, setMessage] = useState("");
  const [isShifted, setIsShifted] = useState(false);
  const msgs = props.game.messages;
  const chatContainerRef = useRef<
    HTMLDivElement & { scrollTop: number; scrollHeight: number }
  >(null);
  useEffect(() => {
    // Scroll to bottom whenever messages are updated
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [msgs]);

  function getPlayer(id: number) {
    return props.game.players.find((player) => player.random_unique_id === id);
  }
  return (
    <Col className="justify-end p-4 h-[70vh] w-80 bg-violet-950 rounded-2xl ">
      <Col ref={chatContainerRef} className="gap-1 h-full overflow-auto pb-10">
        {msgs.map((msg, i) => {
          const player = getPlayer(msg.sender);
          if (player?.random_unique_id === props.game.me) {
            return (
              <Row className="items-center gap-2 w-full justify-end" key={i}>
                <div className="bg-blue-800 rounded-lg rounded-br-none py-2 px-4">
                  {msg.message}
                </div>
                {/* <div className="text-xl">{player?.emoji}</div> */}
              </Row>
            );
          }
          const isNextSame = msgs[i + 1]?.sender === msg.sender;
          const isLastSame = msgs[i - 1]?.sender === msg.sender;
          return (
            <Row className="items-center gap-2" key={i}>
              <Col className="h-full justify-end">
                {isNextSame ? (
                  <div className="w-9"></div>
                ) : (
                  <>
                    <Col className="text-xl rounded-full h-9 w-9 bg-blue-500 justify-center items-center mb-5">
                      {player?.emoji}
                    </Col>
                  </>
                )}
              </Col>
              <Col className="gap-1">
                {!isLastSame && (
                  <div className="text-xs text-slate-400">
                    {player?.username}
                  </div>
                )}
                <div className="bg-slate-700 rounded-lg rounded-bl-none py-2 px-4">
                  {msg.message}
                </div>
              </Col>
            </Row>
          );
        })}
      </Col>
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
          className={clsx(PINK_BUTTON, BASE_BUTTON_CLASSNAME)}
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
