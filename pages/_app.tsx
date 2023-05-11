import "../styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NotificationProvider } from "../components/notification/NotificationContext";
import { Notification } from "../components/notification/Notification";
import StarBackground from "../components/games/aimongus/star";

const queryClient = new QueryClient();
export default function App({ Component, pageProps }: AppProps) {
  if (typeof window !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <Notification />
          <StarBackground />
          <Component {...pageProps} />
        </NotificationProvider>
      </QueryClientProvider>
    </>
  );
}
