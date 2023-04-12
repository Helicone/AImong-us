import { useEffect, useState, useRef, useCallback } from "react";

export type Channel = {
  send: (message: string) => void;
  subscribe: (callback: (message: string) => void) => void;
};

export const useChannel = (url: string): Channel => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const subscribers = useRef<Set<(message: string) => void>>(new Set());

  useEffect(() => {
    const newSocket = new WebSocket(url);

    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };

    newSocket.onmessage = (event) => {
      console.log(`Received message: ${event.data}`);
      handleMessageReceived(event.data);
    };

    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url]);

  const handleMessageReceived = useCallback((message: string) => {
    subscribers.current.forEach((callback) => callback(message));
  }, []);

  const send = (message: string) => {
    if (socket) {
      socket.send(message);
    }
  };

  const subscribe = (callback: (message: string) => void) => {
    subscribers.current.add(callback);

    return () => {
      subscribers.current.delete(callback);
    };
  };

  return { send, subscribe };
};
