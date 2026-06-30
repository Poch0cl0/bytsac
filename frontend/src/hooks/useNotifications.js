import { useContext } from "react";
import { NotificationContext } from "contexts/NotificationContext";

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications debe usarse dentro de NotificationProvider");
  }

  return context;
}
