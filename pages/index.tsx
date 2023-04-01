/* eslint-disable @next/next/no-img-element */
import { useUser } from "@supabase/auth-helpers-react";
import Head from "next/head";
import LoggedInFlow from "../components/LoggedinFlow";
import LoggedOutFlow from "../components/loggedOutFlow";
import { MainWrapper } from "../components/mainWrapper";

export default function Home() {
  const user = useUser();
  return (
    <div>
      <Head>
        <title>AI Turing Chat</title>
        <meta name="description" content={"ARE YOU SMARTER THAN A BOT"} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainWrapper>{user ? <LoggedInFlow /> : <LoggedOutFlow />}</MainWrapper>
    </div>
  );
}
