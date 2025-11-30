// Auth types matching backend

export type UserRole = "JOB_SEEKER" | "EMPLOYER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  hasProfile: boolean;
  profile: Record<string, unknown> | null;
  imageUrl?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

export interface CompleteSocialAuthRequest {
  role: UserRole;
  email: string;
}
