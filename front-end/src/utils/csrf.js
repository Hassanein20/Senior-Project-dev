// CSRF token utility functions
export const CSRF = {
  // Get CSRF token from localStorage
  getToken: () => {
    return localStorage.getItem("csrf_token");
  },

  // Set CSRF token in localStorage
  setToken: (token) => {
    console.log("Setting CSRF token in localStorage:", token);
    localStorage.setItem("csrf_token", token);
  },

  // Validate CSRF token
  validateToken: (token) => {
    return token && token.length > 0;
  },

  // Handle CSRF errors
  handleError: (error) => {
    if (error.response?.status === 403) {
      // Clear invalid token
      localStorage.removeItem("csrf_token");

      // Return a user-friendly error message
      return {
        error: true,
        message: "Session expired. Please try again.",
        shouldRetry: true,
      };
    }
    return {
      error: true,
      message: error.message || "An error occurred. Please try again.",
      shouldRetry: false,
    };
  },
};
