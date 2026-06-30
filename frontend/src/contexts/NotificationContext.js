import React, { createContext, useCallback, useEffect, useState } from "react";
import { notificationApi } from "services/api";

export const NotificationContext = createContext(null);

const POLLING_INTERVAL = 30000;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState({
    aviso_comercial: true,
    seguimiento: true,
  });
  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Error al obtener conteo de notificaciones", error);
    }
  }, []);

  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await notificationApi.getAll(params);
      setNotifications(params.page > 1 ? (prev) => [...prev, ...data.data] : data.data);
      return data;
    } catch (error) {
      console.error("Error al obtener notificaciones", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data } = await notificationApi.getPreferences();
      setPreferences(data);
      return data;
    } catch (error) {
      console.error("Error al obtener preferencias", error);
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  const updatePreferences = useCallback(async (nextPreferences) => {
    setPreferencesLoading(true);
    try {
      const { data } = await notificationApi.updatePreferences(nextPreferences);
      setPreferences(data.preferences);
      return data;
    } catch (error) {
      console.error("Error al actualizar preferencias", error);
      throw error;
    } finally {
      setPreferencesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    preferences,
    loading,
    preferencesLoading,
    fetchNotifications,
    fetchUnreadCount,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    updatePreferences,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
