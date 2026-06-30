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
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),

  getUnreadCount: () => api.get("/notifications/unread-count"),

  markAsRead: (id) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch("/notifications/read-all"),
};

export const renewalPredictionApi = {
  getAll: () => api.get("/subscriptions/renewal-predictions"),

  getSummary: () =>
    api.get("/subscriptions/renewal-predictions", {
      params: { summary_only: 1 },
    }),

  getOne: (subscriptionId) =>
    api.get(`/subscriptions/${subscriptionId}/renewal-prediction`),
};

export default api;