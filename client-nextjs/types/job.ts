// Job types matching backend response structure

export interface Employer {
  companyName: string;
  logoUrl: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  user?: {
    firstName: string;
    lastName: string;
    imageUrl: string | null;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  fileType: string;
  fileSize: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  category: string;
  location: string;
  isRemote: boolean;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experience: "ENTRY_LEVEL" | "MID_LEVEL" | "SENIOR_LEVEL" | "EXECUTIVE";
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string;
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  employer: Employer;
  attachments?: Attachment[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface JobsResponse {
  jobs: Job[];
  pagination: Pagination;
}

export interface JobResponse {
  job: Job;
}

// Filter types for job search
export interface JobFilters {
  page?: number;
  limit?: number;
  category?: string;
  experience?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  search?: string;
}

// Application types
export interface Application {
  id: string;
  jobId: string;
  jobSeekerId: string;
  coverLetter: string;
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  createdAt: string;
  updatedAt: string;
  job?: Job;
  attachments?: Attachment[];
}

export interface ApplicationResponse {
  application: Application;
}
