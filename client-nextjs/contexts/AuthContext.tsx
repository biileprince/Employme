"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import type { User, UserRole } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: UserRole
  ): Promise<void>;
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

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for social auth success in URL parameters
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get("token");
          const socialAuth = urlParams.get("social");

          if (token && socialAuth) {
            // Set token and fetch user data
            apiClient.setToken(token);

            // Clear the URL parameters
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } else {
            // Ensure token is loaded from localStorage
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
              apiClient.setToken(storedToken);
            }
          }
        }

        // Only fetch user if we have a token
        if (apiClient.getToken()) {
          const response = await apiClient.get<{ user: User }>("/auth/me");
          if (response.success && response.data) {
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.log("User not authenticated", error);
        // Clear invalid token
        apiClient.setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        user: User;
        token: string;
      }>("/auth/login", { email, password });

      if (response.success && response.data) {
        setUser(response.data.user);
        // Set the token in the API client
        if (response.data.token) {
          apiClient.setToken(response.data.token);
        }
      } else {
        throw new Error(response.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = "JOB_SEEKER"
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        user: User;
        message: string;
      }>("/auth/register", {
        email,
        password,
        firstName,
        lastName,
        role,
      });

      if (!response.success) {
        throw new Error(response.message || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.post("/auth/logout", {});
      setUser(null);
      apiClient.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (code: string) => {
    const response = await apiClient.post<{
      user: User;
      token: string;
    }>("/auth/verify-email", { code });

    if (response.success && response.data) {
      setUser(response.data.user);
      if (response.data.token) {
        apiClient.setToken(response.data.token);
      }
    } else {
      throw new Error(response.message || "Verification failed");
    }
  };

  const resendVerificationCode = async (email: string) => {
    const response = await apiClient.post("/auth/resend-verification", {
      email,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to resend verification code");
    }
  };

  const forgotPassword = async (email: string) => {
    const response = await apiClient.post("/auth/forgot-password", { email });

    if (!response.success) {
      throw new Error(response.message || "Failed to send reset code");
    }
  };

  const resetPassword = async (code: string, newPassword: string) => {
    const response = await apiClient.post("/auth/reset-password", {
      code,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to reset password");
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get<{ user: User }>("/auth/me");
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
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
