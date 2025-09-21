import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../services/api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
  isVerified: boolean;
  hasProfile: boolean;
  profile: Record<string, unknown> | null; // Allow flexible profile structure
  imageUrl?: string; // Add optional imageUrl property
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: "include", // Include cookies for JWT
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "An error occurred");
    }

    return data;
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiCall("/auth/me");
        if (data.success) {
          setUser(data.data.user);
        }
      } catch (error) {
        console.log("User not authenticated");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        setUser(data.data.user);
        // Set the token in the API client
        if (data.data.token) {
          apiClient.setToken(data.data.token);
        }
        return data;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role = "JOB_SEEKER"
  ) => {
    setIsLoading(true);
    try {
      const data = await apiCall("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName, lastName, role }),
      });

      if (data.success) {
        // Don't set user immediately as email needs verification
        return data;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiCall("/auth/logout", {
        method: "POST",
      });
      setUser(null);
      // Remove the token from the API client
      apiClient.removeToken();
    } catch (error) {
      // Still clear user on client side even if server call fails
      setUser(null);
      apiClient.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (code: string) => {
    const data = await apiCall("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ code }),
    });

    if (data.success) {
      // Auto-login user after successful verification
      setUser(data.data.user);
      // Set the token in the API client
      if (data.data.token) {
        apiClient.setToken(data.data.token);
      }
    }
    return data;
  };

  const resendVerificationCode = async (email: string) => {
    return await apiCall("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const forgotPassword = async (email: string) => {
    return await apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (code: string, newPassword: string) => {
    return await apiCall("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ code, newPassword }),
    });
  };

  const refreshUser = async () => {
    try {
      const data = await apiCall("/auth/me");
      if (data.success) {
        setUser(data.data.user);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
