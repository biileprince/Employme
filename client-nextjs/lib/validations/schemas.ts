import { z } from "zod";

// ============================================
// Common Schemas & Utilities
// ============================================

export const phoneRegex = /^\d{9,15}$/;
export const countryCodeRegex = /^\+\d{1,4}$/;

// Sanitize string to prevent XSS
const sanitizeString = (val: string) =>
  val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();

// Common string field with sanitization
export const safeString = (minLength = 1, maxLength = 500) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} character(s)`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .transform(sanitizeString);

// Email validation
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(255, "Email is too long")
  .transform((val) => val.toLowerCase().trim());

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Optional URL
export const optionalUrl = z
  .string()
  .url("Invalid URL")
  .max(2048, "URL is too long")
  .optional()
  .or(z.literal(""));

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: safeString(1, 100),
    lastName: safeString(1, 100),
    role: z.enum(["JOB_SEEKER", "EMPLOYER"], {
      errorMap: () => ({ message: "Please select a valid role" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

// ============================================
// Job Seeker Profile Schema
// ============================================

export const jobSeekerProfileSchema = z.object({
  firstName: safeString(1, 100),
  lastName: safeString(1, 100),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const now = new Date();
        const minAge = new Date(
          now.getFullYear() - 16,
          now.getMonth(),
          now.getDate(),
        );
        return date <= minAge;
      },
      { message: "You must be at least 16 years old" },
    ),
  location: safeString(0, 200).optional().nullable(),
  bio: safeString(0, 2000).optional().nullable(),
  skills: z
    .array(safeString(1, 100))
    .max(50, "Maximum 50 skills allowed")
    .default([]),
  experience: z
    .enum(["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL", "EXECUTIVE", ""])
    .optional()
    .nullable(),
  education: z
    .enum([
      "HIGH_SCHOOL",
      "DIPLOMA",
      "BACHELOR",
      "MASTER",
      "PHD",
      "PROFESSIONAL",
      "OTHER",
      "",
    ])
    .optional()
    .nullable(),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  countryCode: z
    .string()
    .regex(countryCodeRegex, "Invalid country code")
    .default("+233"),
  isProfilePublic: z.boolean().default(true),
  cvUrl: optionalUrl.nullable(),
  profileImageUrl: optionalUrl.nullable(),
});

export type JobSeekerProfileInput = z.infer<typeof jobSeekerProfileSchema>;

// ============================================
// Employer Profile Schema
// ============================================

export const employerProfileSchema = z.object({
  companyName: safeString(2, 200),
  companyDescription: safeString(0, 5000).optional().nullable(),
  industry: safeString(1, 100).optional().nullable(),
  companySize: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", ""])
    .optional()
    .nullable(),
  location: safeString(0, 200).optional().nullable(),
  website: optionalUrl.nullable(),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  countryCode: z
    .string()
    .regex(countryCodeRegex, "Invalid country code")
    .default("+233"),
  logoUrl: optionalUrl.nullable(),
});

export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;

// ============================================
// Job Posting Schema
// ============================================

export const jobPostingSchema = z.object({
  title: safeString(5, 200),
  description: safeString(50, 10000),
  requirements: safeString(20, 5000).optional().nullable(),
  responsibilities: safeString(20, 5000).optional().nullable(),
  location: safeString(2, 200),
  jobType: z.enum(
    ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"],
    { errorMap: () => ({ message: "Please select a valid job type" }) },
  ),
  experienceLevel: z.enum(
    ["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL", "EXECUTIVE"],
    { errorMap: () => ({ message: "Please select experience level" }) },
  ),
  industry: safeString(1, 100),
  salaryMin: z
    .number()
    .min(0, "Salary cannot be negative")
    .max(10000000, "Salary is too high")
    .optional()
    .nullable(),
  salaryMax: z
    .number()
    .min(0, "Salary cannot be negative")
    .max(10000000, "Salary is too high")
    .optional()
    .nullable(),
  skills: z
    .array(safeString(1, 100))
    .min(1, "At least one skill is required")
    .max(30, "Maximum 30 skills allowed"),
  benefits: z
    .array(safeString(1, 200))
    .max(20, "Maximum 20 benefits")
    .default([]),
  deadline: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) > new Date();
      },
      { message: "Deadline must be in the future" },
    ),
  isActive: z.boolean().default(true),
});

export type JobPostingInput = z.infer<typeof jobPostingSchema>;

// ============================================
// Job Application Schema
// ============================================

export const jobApplicationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required").max(100),
  coverLetter: safeString(0, 5000).optional().default(""),
  attachmentIds: z.array(z.string().max(100)).max(10, "Maximum 10 attachments"),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;

// ============================================
// File Upload Validation
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const imageFileSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  type: z.string().refine((type) => ALLOWED_IMAGE_TYPES.includes(type), {
    message: "Only JPEG, PNG, GIF, and WebP images are allowed",
  }),
});

export const documentFileSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  type: z.string().refine((type) => ALLOWED_DOCUMENT_TYPES.includes(type), {
    message: "Only PDF, DOC, DOCX, and TXT files are allowed",
  }),
});

// ============================================
// Application Status Update Schema
// ============================================

export const applicationStatusSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required").max(100),
  status: z.enum(
    ["PENDING", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"],
    { errorMap: () => ({ message: "Invalid status" }) },
  ),
});

export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;

// ============================================
// Interview Scheduling Schema
// ============================================

export const interviewSchema = z.object({
  applicationId: z.string().min(1).max(100),
  scheduledAt: z.string().refine(
    (val) => {
      const date = new Date(val);
      return date > new Date();
    },
    { message: "Interview must be scheduled in the future" },
  ),
  duration: z
    .number()
    .min(15, "Minimum duration is 15 minutes")
    .max(480, "Maximum duration is 8 hours"),
  type: z.enum(["IN_PERSON", "PHONE", "VIDEO"], {
    errorMap: () => ({ message: "Invalid interview type" }),
  }),
  location: safeString(0, 500).optional().nullable(),
  notes: safeString(0, 2000).optional().nullable(),
});

export type InterviewInput = z.infer<typeof interviewSchema>;

// ============================================
// Search/Filter Schema
// ============================================

export const jobSearchSchema = z.object({
  query: safeString(0, 200).optional(),
  location: safeString(0, 200).optional(),
  jobType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE", ""])
    .optional(),
  experienceLevel: z
    .enum(["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL", "EXECUTIVE", ""])
    .optional(),
  industry: safeString(0, 100).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(15),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate data and return result with errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return { success: false, errors };
}

/**
 * Format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}
