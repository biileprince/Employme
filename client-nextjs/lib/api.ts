// API Client for Next.js - Centralized fetch wrapper with token management
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
const SERVER_BASE_URL = API_BASE_URL.replace("/api", "");

// Utility function to format image URLs
export const formatImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${SERVER_BASE_URL}${url}`;
  return `${SERVER_BASE_URL}/${url}`;
};

// API response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Request configuration
interface RequestConfig {
  method: HttpMethod;
  data?: Record<string, unknown> | FormData | null;
  headers?: Record<string, string>;
}

// ApiClient class for centralized API calls
class ApiClient {
  private token: string | null = null;
  private pendingRequests = new Map<string, Promise<ApiResponse>>();

  constructor() {
    // Initialize token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const { method, data, headers = {} } = config;

    // Request deduplication for GET requests
    if (method === "GET") {
      const requestKey = `${method}:${endpoint}`;
      if (this.pendingRequests.has(requestKey)) {
        return this.pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const requestHeaders: Record<string, string> = { ...headers };

    // Ensure token is loaded from localStorage if not already set
    if (!this.token && typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        this.token = storedToken;
      }
    }

    // Add authorization header if token exists
    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    // Set content type for JSON payloads
    if (data && !(data instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: "include",
      cache: "no-store", // Disable caching to always fetch fresh data
    };

    // Add body for POST, PUT, PATCH
    if (data && method !== "GET") {
      requestOptions.body =
        data instanceof FormData ? data : JSON.stringify(data);
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, requestOptions);
        const result = await response.json();

        if (!response.ok) {
          // Handle 401 Unauthorized - clear token
          if (response.status === 401) {
            this.setToken(null);
          }

          return {
            success: false,
            message: result.message || "Request failed",
            error: result.error,
          } as ApiResponse<T>;
        }

        return result as ApiResponse<T>;
      } catch (error) {
        console.error("API request error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Network error",
        } as ApiResponse<T>;
      } finally {
        // Remove from pending requests
        if (method === "GET") {
          this.pendingRequests.delete(`${method}:${endpoint}`);
        }
      }
    })();

    // Store in pending requests for GET
    if (method === "GET") {
      this.pendingRequests.set(`${method}:${endpoint}`, requestPromise);
    }

    return requestPromise;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: Record<string, unknown> | FormData
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", data });
  }

  async put<T>(
    endpoint: string,
    data?: Record<string, unknown> | FormData
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", data });
  }

  async patch<T>(
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", data });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export API_BASE_URL for other uses
export { API_BASE_URL, SERVER_BASE_URL };

// API Endpoints
export const userAPI = {
  createProfile: (data: Record<string, unknown>) => {
    const role = data.role as string;
    const endpoint =
      role === "JOB_SEEKER"
        ? "/users/profile/job-seeker"
        : "/users/profile/employer";
    return apiClient.post(endpoint, data);
  },
  updateProfile: (data: Record<string, unknown>) => {
    const role = data.role as string;
    const endpoint =
      role === "JOB_SEEKER"
        ? "/users/profile/job-seeker"
        : "/users/profile/employer";
    return apiClient.put(endpoint, data);
  },
  getProfile: () => apiClient.get("/users/me"),
};

export const attachmentAPI = {
  upload: (files: File[], type: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("type", type);
    return apiClient.post("/attachments/upload", formData);
  },
};

export const authAPI = {
  completeSocialAuth: (data: { role: string; email: string }) =>
    apiClient.post("/auth/complete-social-auth", data),
};
