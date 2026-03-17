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
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    // Cookie-based auth is primary; bearer token is kept only for compatibility.
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig,
    hasRetried = false,
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
          // Cookie-based refresh flow: try rotating session once on 401
          if (
            response.status === 401 &&
            !hasRetried &&
            endpoint !== "/auth/refresh"
          ) {
            const refreshed = await this.refreshSession();
            if (refreshed) {
              return this.request<T>(endpoint, config, true);
            }

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
    data?: Record<string, unknown> | FormData,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", data });
  }

  async put<T>(
    endpoint: string,
    data?: Record<string, unknown> | FormData,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", data });
  }

  async patch<T>(
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", data });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  private async refreshSession(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) return false;
        const result = (await response.json()) as ApiResponse;
        return !!result.success;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
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
  getSocketToken: () => apiClient.get<{ token: string }>("/auth/socket-token"),
};

export const adminAPI = {
  getStats: () => apiClient.get("/admin/stats"),

  // User management
  getAllUsers: (params?: URLSearchParams) =>
    apiClient.get(`/admin/users${params ? `?${params}` : ""}`),
  toggleUserStatus: (userId: string) =>
    apiClient.patch(`/admin/users/${userId}/toggle-status`, {}),
  toggleUserVerification: (userId: string) =>
    apiClient.patch(`/admin/users/${userId}/toggle-verification`, {}),
  deleteUser: (userId: string) => apiClient.delete(`/admin/users/${userId}`),

  // Employer verification management
  getAllEmployers: (params?: URLSearchParams) =>
    apiClient.get(`/admin/employers${params ? `?${params}` : ""}`),
  getPendingEmployers: () => apiClient.get("/admin/employers/pending"),
  verifyEmployer: (
    employerId: string,
    isVerified: boolean,
    rejectionReason?: string,
  ) =>
    apiClient.patch(`/admin/employers/${employerId}/verification`, {
      isVerified,
      rejectionReason,
    }),

  // Job management
  getAllJobs: (params?: URLSearchParams) =>
    apiClient.get(`/admin/jobs${params ? `?${params}` : ""}`),
  getPendingJobs: () => apiClient.get("/admin/jobs/pending"),
  manageJob: (jobId: string, action: string) =>
    apiClient.patch(`/admin/jobs/${jobId}`, { action }),
  deleteJob: (jobId: string) => apiClient.delete(`/admin/jobs/${jobId}`),

  // Application management
  getAllApplications: (params?: URLSearchParams) =>
    apiClient.get(`/admin/applications${params ? `?${params}` : ""}`),
  deleteApplication: (applicationId: string) =>
    apiClient.delete(`/admin/applications/${applicationId}`),

  // Newsletter management
  getNewsletterSubscriptions: (params?: URLSearchParams) =>
    apiClient.get(`/newsletter/subscriptions${params ? `?${params}` : ""}`),
  getNewsletterAnalytics: (days: number = 30) =>
    apiClient.get(`/newsletter/analytics?days=${days}`),
  deleteNewsletterSubscription: (subscriptionId: string) =>
    apiClient.delete(`/newsletter/subscriptions/${subscriptionId}`),
  exportNewsletterEmails: (status: string = "all") =>
    apiClient.get(`/newsletter/export?status=${status}`),

  // Admin creation
  createAdmin: (adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretKey: string;
  }) => apiClient.post("/admin/create-admin", adminData),
};

export const chatAPI = {
  // Get eligible contacts for messaging
  getEligibleContacts: () => apiClient.get("/chat/eligible-contacts"),

  // Get all conversations
  getConversations: () => apiClient.get("/chat/conversations"),

  // Get or create conversation with a specific user
  getOrCreateConversation: (participantId: string) =>
    apiClient.get(`/chat/conversations/${participantId}`),

  // Get messages in a conversation
  getMessages: (conversationId: string, page = 1, limit = 50) =>
    apiClient.get(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    ),

  // Send a message
  sendMessage: (
    conversationId: string,
    content: string,
    attachmentUrl?: string,
    attachmentType?: string,
  ) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      attachmentUrl,
      attachmentType,
    }),

  // Mark messages as read
  markAsRead: (conversationId: string) =>
    apiClient.patch(`/chat/conversations/${conversationId}/read`, {}),

  // Edit a message
  editMessage: (conversationId: string, messageId: string, content: string) =>
    apiClient.patch(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
      { content },
    ),

  // Delete a message
  deleteMessage: (conversationId: string, messageId: string) =>
    apiClient.delete(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
    ),

  // Delete conversation
  deleteConversation: (conversationId: string) =>
    apiClient.delete(`/chat/conversations/${conversationId}`),

  // Get unread count
  getUnreadCount: () => apiClient.get("/chat/unread-count"),
};

export interface JobAlertPayload {
  name: string;
  keywords?: string[];
  locations?: string[];
  jobTypes?: string[];
  categories?: string[];
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  isActive?: boolean;
}

export const jobAlertAPI = {
  getMyAlerts: () => apiClient.get("/job-alerts"),
  createAlert: (payload: JobAlertPayload) =>
    apiClient.post("/job-alerts", payload as unknown as Record<string, unknown>),
  updateAlert: (id: string, payload: Partial<JobAlertPayload>) =>
    apiClient.patch(`/job-alerts/${id}`, payload as unknown as Record<string, unknown>),
  deleteAlert: (id: string) => apiClient.delete(`/job-alerts/${id}`),

  getMyNotifications: (page = 1, limit = 20) =>
    apiClient.get(`/job-alerts/notifications?page=${page}&limit=${limit}`),
  markNotificationAsRead: (id: string) =>
    apiClient.patch(`/job-alerts/notifications/${id}/read`, {}),
  markAllNotificationsAsRead: () =>
    apiClient.patch("/job-alerts/notifications/read-all", {}),
};
