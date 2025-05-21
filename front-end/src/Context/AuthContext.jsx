import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../API/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Initialize from localStorage if available
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app load
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem("token");
      console.log("Checking login status, token exists:", !!token);

      if (!token) {
        console.log("No token found, setting loading to false");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching user profile...");
        const response = await authAPI.getProfile();
        console.log("Profile response:", response);

        if (response && response.user) {
          setCurrentUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
        } else {
          throw new Error("Invalid profile response");
        }
      } catch (err) {
        console.error("Error checking login status:", err);
        // Only clear auth data if it's an authentication error
        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setCurrentUser(null);
        } else {
          // For other errors, keep the existing user data
          console.warn("Profile fetch failed but keeping existing user data");
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []); // Empty dependency array to run only once on mount

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      console.log("Attempting login...");
      const response = await authAPI.login(email, password);
      console.log("Login response:", response);

      if (response && response.user) {
        setCurrentUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return response.user;
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("Attempting logout...");
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setCurrentUser(null);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      console.log("Attempting registration...");
      const response = await authAPI.register(userData);
      console.log("Registration response:", response);

      if (response && response.user) {
        console.log("Setting current user from registration:", response.user);
        setCurrentUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));

        // Ensure token is stored if it's in the response
        if (response.token) {
          localStorage.setItem("token", response.token);
        }

        return response;
      } else {
        console.error("Invalid registration response structure:", response);
        throw new Error("Invalid registration response");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.error || err.message || "Registration failed"
      );
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
