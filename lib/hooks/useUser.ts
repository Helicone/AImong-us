import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const useUser = (): number | null => {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userUUID");

    if (storedUserId) {
      setUserId(+storedUserId);
    } else {
      const newUserId = Math.floor(Math.random() * 100000000000000000);
      localStorage.setItem("userUUID", newUserId.toString());
      setUserId(newUserId);
    }
  }, []);

  return userId;
};

export default useUser;
