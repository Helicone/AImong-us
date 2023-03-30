export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col w-full flex-1 text-center min-h-screen justify-between">
      <h1 className="text-center text-4xl font-bold w-full dark:bg-black bg-white py-5 border-b px-5">
        <div className="">
          <div className="flex  md:flex-row w-full justify-between items-center">
            <div className="text-center w-full">AI Turing Chat</div>
          </div>
        </div>
      </h1>
      {children}
      <div className="w-full pb-5 pt-2 dark:bg-black bg-white flex flex-col gap-3 justify-center items-center">
        <div className="flex flex-row gap-5">
          <a href="https://twitter.com/valyr_ai">
            <i>twitter</i>
          </a>
          <a href="https://github.com/PromptZero/valyr-chat">
            <i>github</i>
          </a>
          <a href="https://discord.gg/2TkeWdXNPQ">
            <i>discord</i>
          </a>
        </div>
      </div>
    </main>
  );
}
