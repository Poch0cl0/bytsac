import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bytsac_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const notificationApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page);
    if (params.tipo) searchParams.append("tipo", params.tipo);
    if (params.estado) searchParams.append("estado", params.estado);

    const query = searchParams.toString();
    return api.get(`/notifications${query ? `?${query}` : ""}`);
  },

  getUnreadCount: () => api.get("/notifications/unread-count"),

  markAsRead: (id) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch("/notifications/read-all"),

  getPreferences: () => api.get("/notifications/preferences"),

  updatePreferences: (preferences) =>
    api.patch("/notifications/preferences", preferences),
};

export default api;
