import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const useWebsocket = (url: string | null) => {
  const [response, setResponse] = useState("");
  const webhook = useQuery({
    queryKey: ["webhook", url],
    queryFn: async () => {
      console.log("Creating new websocket");
      if (!url) {
        return Promise.resolve(null);
      }

      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log("WebSocket connection established");
      };

      socket.onmessage = (event) => {
        console.log(`Received message: ${event.data}`);
        setResponse(event.data);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
      console.log("Setting socket", socket);

      return {
        socket,
      };
    },
  });

  const sendMessage = (message: string) => {
    if (webhook.data?.socket) {
      webhook.data.socket.send(message);
    }
  };

  return { sendMessage, response };
};
