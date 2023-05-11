import { GameStateProps } from "../pages/game";
import { Chat } from "./chat";

import React from "react";
import { Row } from "./layout/row";
import { Col } from "./layout/col";

export function GameIslandWrapper(
  props: GameStateProps<any> & { children: React.ReactNode }
) {
  const { children, game } = props;
  const players = game.players;
  const msgs = props.game.messages;
  return (
    <Row className="w-full justify-center mx-auto z-10 gap-4">
      <Col className="w-full bg-violet-950 px-8 py-4 rounded-2xl max-w-lg  h-[calc(100vh-3.5rem)] sm:h-[70vh]">
        {children}
      </Col>
      <div className="sm:inline-block hidden">
        <Chat {...props} />
      </div>
    </Row>
  );
}
