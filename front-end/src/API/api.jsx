import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Get CSRF token from cookie
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.split("=")[1];

  // Add CSRF token to headers if it exists
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle CSRF token error
      if (
        error.response.status === 403 &&
        error.response.data.error === "CSRF token invalid"
      ) {
        // Redirect to login page or show error message
        window.location.href = "/SignIn";
      }
      // Handle unauthorized error
      else if (error.response.status === 401) {
        localStorage.removeItem("user");
        window.location.href = "/SignIn";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/user/profile"),
};

export const foodAPI = {
  searchFood: (query) => api.get(`/food/search?query=${query}`),
  addFoodEntry: (entry) => api.post("/food/entry", entry),
  getDailyEntries: (date) => api.get(`/food/entries/${date}`),
  getWeeklyStats: () => api.get("/food/stats/weekly"),
};

export const dietitianAPI = {
  getAvailableDietitians: () => api.get("/dietitians"),
  subscribeToDietitian: (dietitianId) =>
    api.post(`/dietitians/${dietitianId}/subscribe`),
  getDietitianClients: () => api.get("/dietitian/clients"),
  provideFeedback: (userId, feedback) =>
    api.post(`/dietitian/client/${userId}/feedback`, { feedback }),
};

export const adminAPI = {
  getUsers: () => api.get("/admin/users"),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  getSystemStats: () => api.get("/admin/stats"),
};

export default api;
