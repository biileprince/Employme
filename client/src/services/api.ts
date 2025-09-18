// API configuration and utilities
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// API response type
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

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

  // Make API request
  private async request<T>(
    endpoint: string,
    method: HttpMethod = "GET",
    data?: RequestData
  ): Promise<ApiResponse<T>> {
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

    if (data && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "API request failed");
      }

      return result;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
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

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE");
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

  // Saved jobs methods
  getSavedJobs: () => apiClient.get("/saved-jobs"),

  saveJob: (jobId: string) => apiClient.post("/saved-jobs", { jobId }),

  unsaveJob: (jobId: string) => apiClient.delete(`/saved-jobs/${jobId}`),
};

export const applicationsAPI = {
  apply: (jobId: string, coverLetter?: string) =>
    apiClient.post("/applications", { jobId, coverLetter }),

  getMyApplications: () => apiClient.get("/applications/my-applications"),

  getJobApplications: (jobId: string) =>
    apiClient.get(`/applications/job/${jobId}`),

  getEmployerApplications: () => apiClient.get("/applications/employer"),

  updateStatus: (id: string, status: string) =>
    apiClient.put(`/applications/${id}/status`, { status }),

  applyToJob: (jobId: string, applicationData: Record<string, unknown>) =>
    apiClient.post(`/applications/apply/${jobId}`, applicationData),
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

// Export default instance
export default apiClient;
