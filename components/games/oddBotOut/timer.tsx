import { useEffect, useState } from "react";

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

  function getLoadingEmoji() {
    if (percentage > 30) return "🤔";
    if (percentage > 0.5) return "😱";
    return "🤯";
  }

  return (
    <div>
      <div className="flex flex-row">
        <div className="flex flex-row w-full h-2 bg-gray-200 rounded-xl items-center">
          <div
            className="h-full bg-green-500 rounded-xl"
            style={{ width: `${percentage}%` }}
          />

          <div className="text-5xl">{getLoadingEmoji()}</div>
        </div>
      </div>
      {percentage > 0 && (
        <div className="flex flex-row items-center">
          <div className="text-2xl">{Math.ceil(timeLeft / 1000)}</div>
          <div className="text-xl">s</div>
        </div>
      )}
    </div>
  );
}
