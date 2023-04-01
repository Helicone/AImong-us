export default function Classic() {
  return (
    <div className="flex flex-col gap-5 items-center">
      <div className="flex flex-col gap-3 justify-center items-center w-full">
        <div className="flex flex-row justify-between max-w-2xl w-full">
          <div className="bg-red-500 text-white rounded-md h-64 w-64 text-sm font-bold bg-opacity-50 flex flex-col justify-center items-center">
            <div className="flex flex-col">
              <div className="text-9xl">🕵️</div>
              <button
                className="bg-gray-500 text-white rounded-md text-sm font-bold bg-opacity-50 flex flex-col justify-center items-center"
                onClick={() => {
                  setChatHistory([]);
                }}
              >
                <div className="text-2xl">Detective</div>
              </button>
            </div>
          </div>
          <div className="bg-blue-500 text-white rounded-md h-64 w-64 text-sm font-bold bg-opacity-50 flex flex-col justify-center items-center">
            <div className="flex flex-col">
              <div className="text-9xl">🤖</div>
              <button
                className="bg-gray-500 text-white rounded-md text-sm font-bold bg-opacity-50 flex flex-col justify-center items-center"
                onClick={() => {
                  setChatHistory([]);
                }}
              >
                <div className="text-2xl">Sabotage</div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-full bg-gray-700 max-w-5xl w-full">
        Leaderboard goes here
        <table className="w-full">
          <thead>
            <tr>
              <th className="border px-4 py-2">Rank</th>
              <th className="border px-4 py-2">Username</th>
              <th className="border px-4 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2">1</td>
              <td className="border px-4 py-2">Valyr</td>
              <td className="border px-4 py-2">100</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
