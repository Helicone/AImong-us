import { createContext, ReactNode, useState } from "react";

const ALERT_TIME = 3000;
type NotificationVariants = "success" | "info" | "error";

interface NotificationContextProps {
  variant: NotificationVariants;
  title: string;
  description: string;
  setNotification: (_: {
    title: string;
    variant: NotificationVariants;
    description?: string;
  }) => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  variant: "success",
  title: "",
  description: "",
  setNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = (props: NotificationProviderProps) => {
  const { children } = props;
  const [title, setTitle] = useState("");
  const [variant, setVariant] = useState<NotificationVariants>("success");
  const [description, setDescription] = useState("");

  const setNotification = ({
    title,
    variant,
    description = "",
  }: {
    title: string;
    variant: NotificationVariants;
    description?: string;
  }) => {
    console.log("setNotification", title, variant);
    setTitle(title);
    setDescription(description);
    setVariant(variant);

    setTimeout(() => {
      setTitle("");
      setDescription("");
      setVariant("success");
    }, ALERT_TIME);
  };

  return (
    <NotificationContext.Provider
      value={{
        title,
        description,
        variant,
        setNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
