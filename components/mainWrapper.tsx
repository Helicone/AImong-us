import { ClientGameState } from "../aimongus_types/bindings/ClientGameState";
import { ClientGameStateView } from "../aimongus_types/bindings/ClientGameStateView";
import StarBackground from "./games/aimongus/star";
import { Col } from "./layout/col";

interface MainWrapperProps {
  children: React.ReactNode;
  title: string;
  game?: ClientGameStateView;
}

import React from "react";

export function MainWrapper(props: MainWrapperProps) {
  const { children, title, game } = props;
  return (
    <main className="w-screen h-screen bg-black">
      <div className="z-10 text-white">
        <h1 className="text-center w-full py-2 px-5 z-10 bg-violet-950">
          <div className="text-center w-full text-md font-mono">AImong.us</div>
        </h1>
        <Col className="grow p-2 sm:px-6 sm:py-4 z-10">{children}</Col>
      </div>
    </main>
  );
}
