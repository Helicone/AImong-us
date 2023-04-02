import { Col } from "./layout/col";

interface MainWrapperProps {
  children: React.ReactNode;
  title: string;
}

export function MainWrapper(props: MainWrapperProps) {
  const { children, title } = props;
  return (
    <main className="flex flex-col w-full flex-1 min-h-screen justify-between bg-violet-50">
      <h1 className="text-center w-full py-2 border-b px-5 font-mono">
        <div className="">
          <div className="flex md:flex-row w-full justify-between items-center">
            <div className="text-center w-full">{title}</div>
          </div>
        </div>
      </h1>
      <Col className="grow px-6 py-4">{children}</Col>
      <div className="w-full pb-5 pt-2 flex flex-col gap-3 justify-center items-center">
        <div className="flex flex-row gap-5">
          <a href="https://twitter.com/valyr_ai">
            <i>Twitter</i>
          </a>
          <a href="https://github.com/PromptZero/valyr-chat">
            <i>Github</i>
          </a>
          <a href="https://discord.gg/2TkeWdXNPQ">
            <i>Discord</i>
          </a>
        </div>
      </div>
    </main>
  );
}
