import { ClientGameState } from "../aimongus_types/bindings/ClientGameState";
import { ClientGameStateView } from "../aimongus_types/bindings/ClientGameStateView";
import StarBackground from "./games/aimongus/star";
import { Col } from "./layout/col";

import { BsDiscord, BsGithub } from "react-icons/bs";

interface MainWrapperProps {
  children: React.ReactNode;
  title: string;
  game?: ClientGameStateView;
}

import React from "react";
import { Row } from "./layout/row";

export function MainWrapper(props: MainWrapperProps) {
  const { children, title, game } = props;
  return (
    <main className="w-screen h-screen bg-black">
      <div className="z-10 text-white">
        <Col className="w-full bg-violet-950 items-center">
          <Row className="w-full justify-between  z-10 max-w-2xl">
            <div></div>
            <h1
              className="text-center w-full py-2 px-5 z-10 hover:opacity-80 cursor-pointer"
              onClick={() => window.open("/", "_self")}
            >
              <div className="text-center w-full text-md font-mono">
                AImong.us (alpha)
              </div>
            </h1>
            <Row className="gap-2">
              <BsDiscord
                className=" text-white z-10  h-10 hover:opacity-80 cursor-pointer"
                onClick={() =>
                  window.open("https://discord.gg/hySsN9KCSt", "_blank")
                }
              />
              {/* <BsGithub
                className=" text-white z-10  h-10 hover:opacity-80 cursor-pointer"
                onClick={() => window.open("", "_blank")}
              /> */}
            </Row>
          </Row>
        </Col>
        <Col className="grow p-2 sm:px-6 sm:py-4 z-10">{children}</Col>
      </div>
    </main>
  );
}
