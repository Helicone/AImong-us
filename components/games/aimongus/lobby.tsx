import clsx from "clsx";
import { useRouter } from "next/router";
import { useState } from "react";
import Lottie from "react-lottie";
import { PRIMARY_BUTTON_CLASSNAME } from "../../../lib/common-classes";
import { PLAYER_NAMES } from "../../../lib/constants";
import { EMOJIS } from "../../../lib/emojis";
import { useLocalStorage } from "../../../lib/hooks/useLocalStorage";
import searching from "../../../public/lottie/little-robot.json";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
export default function Lobby() {
  const router = useRouter();

  return (
    <Col className="items-center w-full z-10">
      <Col className=" max-w-lg w-full gap-4 text-center mt-20 p-8 rounded-lg shadow-lg  text-white bg-violet-950">
        <h1 className="text-xl text-white mb-4">Find the bot or die</h1>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: searching,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid slice",
            },
          }}
          height={200}
          width={200}
          isStopped={false}
          isPaused={false}
          style={{
            color: "#6366f1",
            pointerEvents: "none",
            background: "transparent",
          }}
        />
        <Row className="gap-3">
          <button
            className={clsx(PRIMARY_BUTTON_CLASSNAME, "w-1/2")}
            onClick={() => {
              console.log("joining game");
              router.push("/joining-game");
            }}
          >
            Join Game
          </button>
          <button
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-500 w-1/2"
            onClick={() => {
              console.log("creating game");
              router.push("/creating-game");
            }}
          >
            + Create Game
          </button>
        </Row>
      </Col>
    </Col>
  );
}
