import { useEffect, useState } from "react";
import { Row } from "../../layout/row";
import clsx from "clsx";

export function Timer(props: { totalTime: number; timeStarted: number }) {
  const { totalTime, timeStarted } = props;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(totalTime - (Date.now() - timeStarted));
    }, 10);
    return () => clearInterval(interval);
  }, [totalTime, timeStarted]);

  let percentage = (timeLeft / totalTime) * 100;
  percentage = Math.max(0, Math.min(100, percentage));

  return (
    <Row className="flex flex-row w-full bg-slate-600 justify-start">
      <div
        className={clsx(
          percentage > 30
            ? " bg-teal-500"
            : percentage > 10
            ? "bg-yellow-500"
            : "bg-red-500",
          "h-2",
          "transition-all"
        )}
        style={{ width: `${percentage}%` }}
      />
    </Row>
  );
}
