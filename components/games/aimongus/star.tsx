// components/Star.tsx

import React, { useEffect, useState } from "react";
import { CSSTransition } from "react-transition-group";

import clsx from "clsx";

interface StarProps {
  size: number;
  opacity: number;
  duration: number;
}

const Star: React.FC<StarProps> = ({ size, opacity, duration }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <CSSTransition
      in={isMounted}
      timeout={duration}
      classNames="star-animation"
      appear
    >
      <div
        className={clsx(
          "w-1 h-1 absolute bg-white rounded-full z-0",
          `opacity-${opacity * 10}`
        )}
        style={{
          animationDuration: `${duration}s`,
          width: size,
          height: size,
          top: `${Math.random() * 100}vh`,
          left: `${Math.random() * 100}vw`,
        }}
      ></div>
    </CSSTransition>
  );
};

const StarBackground: React.FC = () => {
  const numStars = 150;

  return (
    <div className="w-screen h-screen fixed top-0 left-0 overflow-hidden z-0">
      {Array.from({ length: numStars }).map((_, index) => (
        <Star
          key={index}
          size={Math.random() * 3}
          opacity={Math.random()}
          duration={Math.random() * 3 + 2}
        />
      ))}
    </div>
  );
};

export default StarBackground;
