import axios from "axios";
import { CSRF } from "../utils/csrf";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 5000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Skip CSRF token for login and register requests
    const isAuthRequest =
      config.url === "/auth/login" || config.url === "/auth/register";

    // Add CSRF token to all non-GET requests except auth requests
    if (config.method !== "get" && !isAuthRequest) {
      // Try to get CSRF token from cookie first (for browsers that support it)
      let csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1];

      // If not found in cookie, try localStorage
      if (!csrfToken) {
        csrfToken = CSRF.getToken();
      }

      if (csrfToken) {
        console.log("Using CSRF token:", csrfToken);
        config.headers["X-CSRF-Token"] = csrfToken;
      } else {
        console.warn("No CSRF token found for request:", config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Update CSRF token if provided in response (check both case variations)
    const csrfToken =
      response.headers["x-csrf-token"] || response.headers["X-CSRF-Token"];
    if (csrfToken) {
      console.log("Received CSRF token from server:", csrfToken);
      CSRF.setToken(csrfToken);
    } else {
      console.log(
        "No CSRF token in response headers:",
        Object.keys(response.headers)
      );
    }
    return response;
  },
  (error) => {
    // Handle CSRF errors
    if (error.response?.status === 403) {
      const csrfError = CSRF.handleError(error);
      return Promise.reject(csrfError);
    }

    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/SignIn")) {
        window.location.href = "/SignIn";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: async (email, password) => {
    try {
      console.log("Making login request...");
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);

      const { user, token } = response.data;
      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set CSRF token from response header
      const csrfToken = response.headers["x-csrf-token"];
      if (csrfToken) {
        CSRF.setToken(csrfToken);
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to sign in. Please check your credentials.");
    }
  },

  register: async (userData) => {
    try {
      console.log("Making registration request...");
      const response = await api.post("/auth/register", userData);
      console.log("Registration response:", response.data);

      // Extract token and user data from response
      const { token, user, message } = response.data;

      // If the user object is not directly in the response but nested in the "user" field
      const userObject = user || response.data.user;

      if (!token || !userObject) {
        console.error(
          "Invalid registration response structure:",
          response.data
        );
        // Try to extract user data from the response if it's in a different format
        if (response.data && response.data.id) {
          // If the user data is directly in the response
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(response.data));
          return { user: response.data, token };
        }
        throw new Error(
          "Invalid response from server: missing token or user data"
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userObject));
      return { user: userObject, token, message };
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to register. Please try again.");
    }
  },

  logout: async () => {
    try {
      console.log("Making logout request...");
      const response = await api.post("/auth/logout");
      console.log("Logout response:", response.data);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the server request fails, clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to logout. Please try again.");
    }
  },

  getProfile: async () => {
    try {
      console.log("Making getProfile request...");
      const response = await api.get("/auth/profile");
      console.log("Profile response:", response.data);

      const { user } = response.data;
      if (!user) {
        throw new Error("Invalid profile response");
      }

      localStorage.setItem("user", JSON.stringify(user));
      return response.data;
    } catch (error) {
      console.error("GetProfile error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get profile. Please try again.");
    }
  },

  getUserGoals: async () => {
    try {
      console.log("Fetching user goals...");
      const response = await api.get("/user/goals");
      console.log("User goals response:", response.data);

      if (!response.data.goals) {
        throw new Error("Invalid goals response");
      }

      return response.data.goals;
    } catch (error) {
      console.error("Get user goals error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get user goals. Please try again.");
    }
  },

  updateUserGoals: async (goals) => {
    try {
      console.log("Updating user goals...", goals);
      const response = await api.put("/user/goals", goals);
      console.log("Update goals response:", response.data);

      return response.data.goals;
    } catch (error) {
      console.error("Update goals error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to update user goals. Please try again.");
    }
  },
};

export const foodEntryAPI = {
  // Add a new food entry
  addFoodEntry: async (foodEntry) => {
    try {
      // Validate required fields are present
      const requiredFields = [
        "foodId",
        "name",
        "amount",
        "date",
        "calories",
        "protein",
        "carbs",
        "fat",
      ];
      let missingFields = [];

      requiredFields.forEach((field) => {
        if (foodEntry[field] === undefined) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        console.error(`Missing required fields: ${missingFields.join(", ")}`);
        if (foodEntry.fats !== undefined && !foodEntry.fat) {
          console.warn('Found "fats" field but "fat" is required. Fixing...');
          foodEntry.fat = foodEntry.fats;
        }
      }

      // Create a sanitized copy to ensure field names match backend expectations
      const sanitizedEntry = {
        foodId: foodEntry.foodId,
        name: foodEntry.name,
        amount: foodEntry.amount,
        date: foodEntry.date,
        calories: foodEntry.calories,
        protein: foodEntry.protein,
        carbs: foodEntry.carbs,
        fat: foodEntry.fat || foodEntry.fats, // Ensure we use the right field name
      };

      console.log(
        "Adding food entry with payload:",
        JSON.stringify(sanitizedEntry)
      );
      console.log("DEBUG: fat value:", sanitizedEntry.fat);

      const response = await api.post("/consumed-foods", sanitizedEntry);
      console.log("Food entry added successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding food entry:", error);
      console.error("Request payload was:", JSON.stringify(foodEntry));
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to add food entry. Please try again.");
    }
  },

  // Get food entries for a specific date
  getDailyEntries: async (date) => {
    try {
      console.log(`Fetching daily entries for date: ${date}`);
      const response = await api.get(`/consumed-foods/daily?date=${date}`);
      console.log("Daily entries response:", response.data);

      // If null is returned, treat it as an empty array
      if (!response.data) {
        console.warn(
          "Backend returned null for daily entries, using empty array instead"
        );
        return [];
      }

      // Ensure response.data is an array
      if (!Array.isArray(response.data)) {
        console.error("Non-array response for daily entries:", response.data);
        return [];
      }

      const mappedEntries = response.data.map((entry) => {
        // Ensure we have a valid entry date
        let entryDate = entry.entry_date;
        let timestamp = "";

        try {
          // Parse the entry date to a proper timestamp
          if (entryDate) {
            const date = new Date(entryDate);
            if (!isNaN(date.getTime())) {
              timestamp = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          }
        } catch (err) {
          console.error("Error parsing entry date:", err, entryDate);
        }

        // If timestamp still empty, generate a fallback
        if (!timestamp) {
          timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        return {
          id: entry.id,
          name: entry.food_name,
          amount: entry.quantity,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat, // This is correct - backend sends 'fat' in JSON
          calories: entry.calories,
          date: new Date(entry.entry_date),
          timestamp: timestamp,
          grams: entry.quantity, // Add grams field for consistency
        };
      });

      console.log("Mapped entries for frontend:", mappedEntries);
      return mappedEntries;
    } catch (error) {
      console.error("Error in getDailyEntries:", error);
      console.error("Response:", error.response?.data);
      console.error("Status:", error.response?.status);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get daily entries. Please try again.");
    }
  },

  // Get daily nutrition summary
  getDailyNutrition: async (date) => {
    try {
      const response = await api.get(`/consumed-foods/nutrition?date=${date}`);
      return {
        total_calories: response.data.total_calories || 0,
        total_protein: response.data.total_protein || 0,
        total_carbs: response.data.total_carbs || 0,
        total_fats: response.data.total_fats || 0,
      };
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get daily nutrition. Please try again.");
    }
  },

  // Delete a food entry
  deleteFoodEntry: async (entryId) => {
    try {
      await api.delete(`/consumed-foods/${entryId}`);
      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to delete food entry. Please try again.");
    }
  },

  // Get nutrition history for a date range
  getNutritionHistory: async (startDate, endDate) => {
    try {
      console.log(
        `Requesting nutrition history from ${startDate} to ${endDate}`
      );

      // Always set combineData=true to ensure today's entries are included
      // This tells the backend to include both daily_entries and today's consumed_foods
      const url = `/consumed-foods/history?startDate=${startDate}&endDate=${endDate}&combineData=true`;
      console.log("Full API request URL:", API_URL + url);

      const response = await api.get(url);

      // Log the response for debugging
      console.log("Nutrition history response status:", response.status);
      console.log("Nutrition history response data:", response.data);

      // Handle empty or null response
      if (!response.data) {
        console.warn("Empty nutrition history response, returning empty array");
        return [];
      }

      // If not an array, try to handle it gracefully
      if (!Array.isArray(response.data)) {
        console.warn("Non-array nutrition history response:", response.data);

        // If it's an object with a data property that is an array, use that
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log("Using nested data array instead");
          return response.data.data.map((entry) => ({
            date: entry.date,
            total_calories: Number(entry.total_calories || 0),
            total_protein: Number(entry.total_protein || 0),
            total_carbs: Number(entry.total_carbs || 0),
            total_fats: Number(entry.total_fats || 0),
          }));
        }

        return [];
      }

      // Process the data to ensure proper format and no null values
      const processedData = response.data.map((entry) => ({
        date: entry.date,
        total_calories: Number(entry.total_calories || 0),
        total_protein: Number(entry.total_protein || 0),
        total_carbs: Number(entry.total_carbs || 0),
        total_fats: Number(entry.total_fats || 0),
      }));

      console.log("Processed nutrition history data:", processedData);
      return processedData;
    } catch (error) {
      console.error("Error fetching nutrition history:", error);
      console.error("Response data:", error.response?.data);
      console.error("Status:", error.response?.status);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get nutrition history. Please try again.");
    }
  },
};

// Food API endpoints
export const foodAPI = {
  searchFoods: async (query) => {
    const response = await api.get(`/foods/search?q=${query}`);
    return response.data;
  },
  getFoodDetails: async (id) => {
    const response = await api.get(`/foods/${id}`);
    return response.data;
  },
};

// Dietitian API endpoints
export const dietitianAPI = {
  getDietitians: async () => {
    const response = await api.get("/dietitians");
    return response.data;
  },
  getDietitian: async (id) => {
    const response = await api.get(`/dietitians/${id}`);
    return response.data;
  },
  requestConsultation: async (dietitianId, data) => {
    const response = await api.post(
      `/dietitians/${dietitianId}/consultations`,
      data
    );
    return response.data;
  },
};

// Admin API endpoints
export const adminAPI = {
  getUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },
  updateUser: async (userId, data) => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
};

// Utility function to fetch a new CSRF token
export const fetchCSRFToken = async () => {
  try {
    console.log("Fetching new CSRF token...");

    // Make a GET request to the dedicated CSRF token endpoint
    const response = await axios.get(`${API_URL}/auth/csrf`, {
      withCredentials: true,
    });

    // Check if we got a CSRF token in the response
    const csrfToken =
      response.headers["x-csrf-token"] || response.headers["X-CSRF-Token"];

    if (csrfToken) {
      console.log("Successfully fetched new CSRF token:", csrfToken);
      CSRF.setToken(csrfToken);
      return true;
    } else {
      console.error(
        "No CSRF token in response headers:",
        Object.keys(response.headers)
      );
      return false;
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return false;
  }
};

export default api;
