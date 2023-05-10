import { GameStateProps } from "../pages/game";
import { Chat } from "./chat";

import React from "react";
import { Row } from "./layout/row";

export function GameIslandWrapper(
  props: GameStateProps<any> & { children: React.ReactNode }
) {
  const { children, game } = props;
  const players = game.players;
  const msgs = props.game.messages;
  return (
    <Row className="w-full justify-center mx-auto z-10 gap-4">
      <div className="w-full bg-violet-950 px-5 py-2 rounded-2xl max-w-lg">
        <div>{children}</div>
      </div>
      <div className="sm:inline-block hidden">
        <Chat {...props} />
      </div>
    </Row>
    // </div>
  );
}
