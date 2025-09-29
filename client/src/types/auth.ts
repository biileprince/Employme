// Authentication-related types
export type UserRole = "JOB_SEEKER" | "EMPLOYER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isVerified: boolean;
  hasProfile?: boolean;
  profile?: object | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
