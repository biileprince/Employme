// Global types for the application

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string>;
      };
    };
  }
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  createdAt: Date;
  updatedAt: Date;
  jobSeeker?: JobSeeker;
  employer?: Employer;
}

export interface JobSeeker {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL' | 'EXECUTIVE';
  education?: string;
  resume?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employer {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  website?: string;
  description?: string;
  companySize?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  isRemote: boolean;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experience?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL' | 'EXECUTIVE';
  salaryMin?: number;
  salaryMax?: number;
  deadline?: Date;
  isActive: boolean;
  employerId: string;
  employer: Employer;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingData {
  role: 'JOB_SEEKER' | 'EMPLOYER';
  firstName: string;
  lastName: string;
  imageUrl?: string;
  // Job Seeker fields
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL' | 'EXECUTIVE';
  education?: string;
  // Employer fields
  companyName?: string;
  industry?: string;
  website?: string;
  companyDescription?: string;
  companySize?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}
