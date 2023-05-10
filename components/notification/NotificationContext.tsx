import { createContext, ReactNode, useState } from "react";

const ALERT_TIME = 3000;
type NotificationVariants = "success" | "info" | "error";

interface NotificationContextProps {
  variant: NotificationVariants;
  title: string;
  setNotification: (_: {
    title: string;
    variant: NotificationVariants;
  }) => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  variant: "success",
  title: "",
  setNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = (props: NotificationProviderProps) => {
  const { children } = props;
  const [title, setTitle] = useState("");
  // const [description, setDescription] = useState("");
  const [variant, setVariant] = useState<NotificationVariants>("success");

  const setNotification = ({
    title,
    variant,
  }: {
    title: string;
    variant: NotificationVariants;
  }) => {
    console.log("setNotification", title, variant);
    setTitle(title);
    // setDescription(description);
    setVariant(variant);

    setTimeout(() => {
      setTitle("");
      // setDescription("");
      setVariant("success");
    }, ALERT_TIME);
  };

  return (
    <NotificationContext.Provider
      value={{
        title,
        // description,
        variant,
        setNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
