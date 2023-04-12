import { useEffect, useState } from "react";

type MessageHandler = (message: string) => void;

export const useWebsocket = (
  url: string,
  onMessageReceived: MessageHandler
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket(url);

    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };

    newSocket.onmessage = (event) => {
      console.log(`Received message: ${event.data}`);
      onMessageReceived(event.data);
    };

    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url, onMessageReceived]);

  const sendMessage = (message: string) => {
    if (socket) {
      socket.send(message);
    }
  };

  return { sendMessage };
};
