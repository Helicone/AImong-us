import { ClientGameState } from "../aimongus_types/bindings/ClientGameState";
import { ClientGameStateView } from "../aimongus_types/bindings/ClientGameStateView";
import { NUM_QUESTIONS_PER_GAME } from "../lib/constants";
import { GameStateProps } from "../pages/game";
import { Chat } from "./chat";
import Star from "./games/aimongus/star";
import { Col } from "./layout/col";

import React, { useState } from "react";

export function GameIslandWrapper(
  props: GameStateProps<any> & { children: React.ReactNode }
) {
  const { children, game } = props;
  const players = game.players;
  const msgs = props.game.messages;
  return (
    <div className="w-full flex flex-col items-center z-10">
      <div className="flex flex-row gap-3 h-full w-full max-w-5xl">
        <div className="bg-slate-200 px-5 text-center rounded-2xl">
          Players
          <div className="text-left">
            {players.map((player) => (
              <div key={player.random_unique_id}>
                {player.emoji} : {player.username}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-grow">
          <div className="w-full bg-slate-200 px-5 py-2 rounded-2xl">
            <div>{children}</div>
          </div>
        </div>
        <div className="h-[70vh] max-w-lg bg-slate-200 px-5 rounded-2xl">
          <Chat {...props} />
        </div>
      </div>
    </div>
  );
}
