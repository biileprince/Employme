// API configuration and utilities
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace("/api", "");

// Utility function to ensure URLs are properly formatted
export const formatImageUrl = (url: string): string => {
  if (!url) return "";

  // If URL is already absolute, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If URL starts with /, prepend server base URL
  if (url.startsWith("/")) {
    return `${SERVER_BASE_URL}${url}`;
  }

  // Otherwise, assume it's a relative path and prepend server base URL
  return `${SERVER_BASE_URL}/${url}`;
};

// API response type
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Request data type
type RequestData =
  | Record<string, unknown>
  | FormData
  | CreateJobData
  | UpdateProfileData
  | null;

// Job data types
interface CreateJobData {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  isRemote: boolean;
  jobType: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}

// API client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private pendingRequests: Map<string, Promise<ApiResponse<unknown>>> =
    new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("auth_token");
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  // Make API request with deduplication
  private async request<T>(
    endpoint: string,
    method: HttpMethod = "GET",
    data?: RequestData
  ): Promise<ApiResponse<T>> {
    // Create a unique key for request deduplication
    const requestKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;

    // If the same request is already pending, return that promise
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include", // Include cookies in requests
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    const requestPromise = (async () => {
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch(url, config);

          // Handle rate limiting with exponential backoff
          if (response.status === 429) {
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
              console.warn(`Rate limited. Retrying in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              retryCount++;
              continue;
            } else {
              throw new Error("Too many requests. Please try again later.");
            }
          }

          // Check if response is ok first
          if (!response.ok) {
            // Handle non-JSON error responses
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const result = await response.json();
              console.log("API Error Response:", result); // Add detailed logging
              console.log("Validation errors:", result.errors); // Log specific validation errors

              // Create error with validation details if available
              const error = new Error(
                result.message ||
                  `API request failed with status ${response.status}`
              );
              // Attach validation errors if present
              if (result.errors) {
                Object.assign(error, { errors: result.errors });
              }
              throw error;
            } else {
              // Non-JSON response (like plain text error messages)
              const text = await response.text();
              throw new Error(
                `API request failed: ${response.status} - ${text}`
              );
            }
          }

          const result = await response.json();
          return result;
        } catch (error) {
          if (
            retryCount >= maxRetries ||
            !(error instanceof Error) ||
            !error.message.includes("fetch")
          ) {
            console.error("API request error:", error);
            throw error;
          }

          // Network error, retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          console.warn(`Network error. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount++;
        }
      }

      throw new Error("Request failed after maximum retries");
    })().finally(() => {
      // Remove from pending requests when complete
      this.pendingRequests.delete(requestKey);
    });

    // Store the promise to prevent duplicate requests
    this.pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET");
  }

  // POST request
  async post<T>(endpoint: string, data?: RequestData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", data);
  }

  // PUT request
  async put<T>(endpoint: string, data?: RequestData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", data);
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    data?: RequestData
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PATCH", data);
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE");
  }

  // File upload request
  async uploadFiles<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      return result;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Specific API methods for different resources
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post("/auth/login", credentials),

  register: (userData: {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  }) => apiClient.post("/auth/register", userData),

  logout: () => apiClient.post("/auth/logout"),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),
};

export const jobsAPI = {
  getAll: (params?: URLSearchParams | Record<string, string | number>) => {
    let endpoint = "/jobs";
    if (params) {
      if (params instanceof URLSearchParams) {
        endpoint = `/jobs?${params.toString()}`;
      } else {
        // Convert object to URLSearchParams
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });
        endpoint = `/jobs?${searchParams.toString()}`;
      }
    }
    return apiClient.get(endpoint);
  },

  getById: (id: string) => apiClient.get(`/jobs/${id}`),

  create: (jobData: CreateJobData) => apiClient.post("/jobs", jobData),

  update: (id: string, jobData: Partial<CreateJobData>) =>
    apiClient.put(`/jobs/${id}`, jobData),

  delete: (id: string) => apiClient.delete(`/jobs/${id}`),

  // Employer-specific job management
  getMyJobs: () => apiClient.get("/jobs/my-jobs"),

  updateJobStatus: (id: string, status: string) => {
    // Map status to database fields
    const updateData: { isActive?: boolean; [key: string]: unknown } = {};

    switch (status) {
      case "ACTIVE":
        updateData.isActive = true;
        break;
      case "PAUSED":
      case "CLOSED":
        updateData.isActive = false;
        break;
      default:
        updateData.isActive = true;
    }

    return apiClient.put(`/jobs/${id}`, updateData);
  },

  createJob: (jobData: Record<string, unknown>) =>
    apiClient.post("/jobs", jobData),

  deleteJob: (id: string) => apiClient.delete(`/jobs/${id}`),
};

// Saved jobs API endpoints
export const savedJobsAPI = {
  getSavedJobs: () => apiClient.get("/saved-jobs"),

  saveJob: (jobId: string) => apiClient.post("/saved-jobs/save", { jobId }),

  unsaveJob: (jobId: string) => apiClient.post("/saved-jobs/remove", { jobId }),
};
export const applicationsAPI = {
  apply: (jobId: string, coverLetter?: string, attachmentIds?: string[]) =>
    apiClient.post("/applications/apply", {
      jobId,
      coverLetter,
      attachmentIds,
    }),

  getMyApplications: () => apiClient.get("/applications/my-applications"),

  getJobApplications: (jobId: string) =>
    apiClient.get(`/applications/job/${jobId}`),

  getEmployerApplications: () => apiClient.get("/applications/employer"),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/applications/${id}/status`, { status }),

  applyToJob: (jobId: string, applicationData: Record<string, unknown>) =>
    apiClient.post(`/applications/apply/${jobId}`, applicationData),

  scheduleInterview: (
    applicationId: string,
    interviewData: {
      scheduledDate: string;
      scheduledTime: string;
      description?: string;
      location?: string;
      isVirtual?: boolean;
      meetingLink?: string;
    }
  ) =>
    apiClient.post(
      `/applications/${applicationId}/schedule-interview`,
      interviewData
    ),

  getInterviews: (applicationId: string) =>
    apiClient.get(`/applications/${applicationId}/interviews`),

  updateInterview: (
    interviewId: string,
    interviewData: {
      scheduledDate?: string;
      scheduledTime?: string;
      description?: string;
      location?: string;
      meetingLink?: string;
      status?: string;
    }
  ) => apiClient.put(`/interviews/${interviewId}`, interviewData),

  deleteInterview: (interviewId: string) =>
    apiClient.delete(`/interviews/${interviewId}`),
};

export const userAPI = {
  getProfile: () => apiClient.get("/users/me"),

  me: () => apiClient.get("/users/me"), // Alias for getProfile

  updateProfile: (profileData: UpdateProfileData) =>
    apiClient.put("/users/me", profileData),

  updateEmployerProfile: (profileData: Record<string, unknown>) =>
    apiClient.put("/users/profile/employer", profileData),

  updateJobSeekerProfile: (profileData: Record<string, unknown>) =>
    apiClient.put("/users/profile/job-seeker", profileData),

  createJobSeekerProfile: (profileData: Record<string, unknown>) =>
    apiClient.post("/users/profile/job-seeker", profileData),

  createEmployerProfile: (profileData: Record<string, unknown>) =>
    apiClient.post("/users/profile/employer", profileData),

  createProfile: (profileData: Record<string, unknown>) => {
    // Determine which profile creation endpoint to use based on role
    if (profileData.role === "EMPLOYER") {
      return apiClient.post("/users/profile/employer", profileData);
    } else {
      return apiClient.post("/users/profile/job-seeker", profileData);
    }
  },

  getCandidates: () => apiClient.get("/users/candidates"),

  completeOnboarding: (profileData: Record<string, unknown>) => {
    // Alias for createProfile
    if (profileData.role === "EMPLOYER") {
      return apiClient.post("/users/profile/employer", profileData);
    } else {
      return apiClient.post("/users/profile/job-seeker", profileData);
    }
  },
};

// Attachment API endpoints
export const attachmentAPI = {
  upload: (files: File[], entityType: string, entityId?: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (entityType) {
      formData.append("entityType", entityType);
    }
    if (entityId) {
      formData.append("entityId", entityId);
    }

    return apiClient.uploadFiles("/attachments/upload", formData);
  },

  getByEntity: (entityType: string, entityId: string) =>
    apiClient.get(`/attachments/${entityType}/${entityId}`),

  delete: (attachmentId: string) =>
    apiClient.delete(`/attachments/${attachmentId}`),

  getById: (attachmentId: string) =>
    apiClient.get(`/attachments/${attachmentId}`),
};

// Admin API endpoints
export const adminAPI = {
  getStats: () => apiClient.get("/admin/stats"),

  // User management
  getAllUsers: (params?: URLSearchParams) =>
    apiClient.get(`/admin/users${params ? `?${params}` : ""}`),
  toggleUserStatus: (userId: string) =>
    apiClient.patch(`/admin/users/${userId}/toggle-status`),
  toggleUserVerification: (userId: string) =>
    apiClient.patch(`/admin/users/${userId}/toggle-verification`),
  deleteUser: (userId: string) => apiClient.delete(`/admin/users/${userId}`),

  // Job management
  getAllJobs: (params?: URLSearchParams) =>
    apiClient.get(`/admin/jobs${params ? `?${params}` : ""}`),
  manageJob: (jobId: string, action: string) =>
    apiClient.patch(`/admin/jobs/${jobId}`, { action }),
  deleteJob: (jobId: string) => apiClient.delete(`/admin/jobs/${jobId}`),

  // Application management
  getAllApplications: (params?: URLSearchParams) =>
    apiClient.get(`/admin/applications${params ? `?${params}` : ""}`),
  deleteApplication: (applicationId: string) =>
    apiClient.delete(`/admin/applications/${applicationId}`),

  // Admin creation
  createAdmin: (adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretKey: string;
  }) => apiClient.post("/admin/create-admin", adminData),

  // Admin profile
  getProfile: () => apiClient.get("/admin/profile"),
};

// Export default instance
export default apiClient;
