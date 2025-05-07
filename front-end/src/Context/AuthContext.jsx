import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../API/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app load
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          // Validate the stored user with a profile request
          const response = await authAPI.getProfile();
          setCurrentUser(response.data);
        }
      } catch (err) {
        // If token is invalid, clear localStorage
        localStorage.removeItem("user");
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const user = response.data.user;

      // Store user in localStorage (but NOT the token if using HTTP-only cookies)
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      await authAPI.register(userData);
      // After registration, log the user in
      return login(userData.email, userData.password);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      // Always clear local storage and state, even if API call fails
      localStorage.removeItem("user");
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
