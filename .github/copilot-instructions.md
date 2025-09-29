# Employ.me Copilot Instructions

This is a full-stack job platform targeting Ghana's job market with React/TypeScript frontend and Express/Prisma backend.

## Quick Start Commands

```bash
# Backend setup (Terminal 1)
cd server && npm run dev          # Starts on :5001 with tsx watch
npm run db:studio                 # Prisma Studio on :5555

# Frontend setup (Terminal 2)
cd client && npm run dev          # Starts on :5173 with Vite HMR

# Database operations
cd server
npm run db:push                   # Push schema changes (dev)
npm run db:migrate                # Create migrations (prod)
npm run db:seed                   # Populate with sample data
```

## Architecture Overview

**Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4.1 + Framer Motion + React Icons
**Backend**: Express + TypeScript + Prisma + PostgreSQL + Socket.io + Cloudinary
**Authentication**: JWT tokens with role-based access (JOB_SEEKER, EMPLOYER, ADMIN)

### Current Tech Stack (Updated Jan 2025)

**Frontend Dependencies:**

- React 19.1.1 with React Router DOM 7.8.2
- TypeScript 5.8.3 with strict type checking
- Vite 7.1.2 as build tool and dev server
- Tailwind CSS 4.1.13 with @tailwindcss/vite plugin
- Framer Motion 12.23.12 for animations
- React Icons 5.5.0 for consistent iconography
- Axios 1.11.0 for HTTP requests (alongside fetch API)

**Backend Dependencies:**

- Express 4.18.2 with TypeScript support via tsx
- Prisma 5.22.0 as ORM with PostgreSQL
- JWT authentication with bcryptjs password hashing
- Cloudinary 1.41.0 for file uploads
- Express Validator 7.2.1 for request validation
- Multer for multipart form handling
- Nodemailer 6.10.1 for email services

### Key Project Structure

```
client/src/
├── pages/             # Feature-organized pages
│   ├── auth/          # Login, signup, onboarding
│   ├── employer/      # Employer dashboard, job management
│   ├── job-seeker/    # Job seeker dashboard, applications
│   └── jobs/          # Public job listings and details
├── components/        # Reusable UI components
│   ├── auth/          # Auth-specific components
│   ├── common/        # Shared components (Header, Footer)
│   ├── features/      # Feature-specific components
│   └── ui/            # Base UI components
├── contexts/          # React contexts (AuthContext)
├── services/          # API client and service functions
└── layouts/           # Page layouts

server/src/
├── controllers/       # Business logic handlers
├── routes/            # Express route definitions
├── middleware/        # Auth, validation, error handling
└── prisma/           # Database schema and migrations
```

## Database Schema (Prisma)

### Core Models & Relationships

```typescript
// User -> Profile (one-to-one based on role)
User { role: UserRole }
├── JobSeeker (role === 'JOB_SEEKER')
├── Employer (role === 'EMPLOYER')
└── Admin (role === 'ADMIN')

// Job Application Flow
Job (employer) ← Application → JobSeeker
Job ← SavedJob → JobSeeker (many-to-many)

// File Management
User/Job/Application → Attachment (one-to-many)
```

### Detailed Model Structure

#### User Model (Central Authentication)

```typescript
model User {
  id: String @id @default(cuid())           // CUID for unique IDs
  email: String @unique                     // Primary login identifier
  password: String                          // Hashed password
  role: UserRole @default(JOB_SEEKER)      // Determines profile type
  isActive: Boolean @default(true)          // Soft delete flag
  isVerified: Boolean @default(false)       // Email verification status

  // Profile Relations (one-to-one based on role)
  jobSeeker: JobSeeker?                     // Only if role === JOB_SEEKER
  employer: Employer?                       // Only if role === EMPLOYER
  admin: Admin?                             // Only if role === ADMIN

  // File Management
  attachments: Attachment[]                 // User's uploaded files
  socialAccounts: SocialAccount[]           // OAuth connections
}
```

#### JobSeeker Profile

```typescript
model JobSeeker {
  userId: String @unique                    // Foreign key to User
  skills: String[]                          // Array of skill strings
  experience: ExperienceLevel?              // Career level
  applications: Application[]               // Job applications
  savedJobs: SavedJob[]                     // Bookmarked jobs

  // Contact Information
  phone: String?
  countryCode: String?                      // For international numbers
}
```

#### Employer Profile

```typescript
model Employer {
  userId: String @unique                    // Foreign key to User
  companyName: String                       // Required business name
  isVerified: Boolean @default(false)       // Manual verification flag
  jobs: Job[]                               // Posted job listings

  // Company Details
  industry: String?
  companySize: String?                      // e.g., "10-50 employees"
  founded: Int?                             // Year founded
}
```

#### Job Model (Core Business Entity)

```typescript
model Job {
  employerId: String                        // Foreign key to Employer
  requirements: String[]                    // Array of job requirements
  benefits: String[]                        // Array of job benefits
  category: JobCategory @default(OTHER)     // Industry categorization
  experience: ExperienceLevel?              // Required experience level

  // Salary Information
  salaryMin: Int?                           // Minimum salary
  salaryMax: Int?                           // Maximum salary

  // Status & Analytics
  isActive: Boolean @default(true)          // Job posting status
  isFeatured: Boolean @default(false)       // Premium placement
  viewCount: Int @default(0)                // Analytics tracking

  // Relations
  applications: Application[]               // Job applications
  savedJobs: SavedJob[]                     // User bookmarks
  attachments: Attachment[]                 // Job-related files
}
```

#### Application Model (Core Business Logic)

```typescript
model Application {
  jobId: String                             // Foreign key to Job
  jobSeekerId: String                       // Foreign key to JobSeeker
  status: ApplicationStatus @default(PENDING)
  coverLetter: String?                      // Optional cover letter
  attachments: Attachment[]                 // Resume, portfolio files

  @@unique([jobId, jobSeekerId])           // Prevents duplicate applications
}
```

### Key Enums & Values

```typescript
enum UserRole {
  JOB_SEEKER    // Default role for job seekers
  EMPLOYER      // Company representatives
  ADMIN         // Platform administrators
}

enum ApplicationStatus {
  PENDING       // Initial state
  REVIEWED      // Employer has viewed
  SHORTLISTED   // Moved to interview stage
  REJECTED      // Application declined
  HIRED         // Successful application
}

enum JobType {
  FULL_TIME     // Standard employment
  PART_TIME     // Reduced hours
  CONTRACT      // Fixed-term work
  INTERNSHIP    // Student/entry positions
  FREELANCE     // Project-based work
}

enum ExperienceLevel {
  ENTRY_LEVEL   // 0-2 years experience
  MID_LEVEL     // 2-5 years experience
  SENIOR_LEVEL  // 5+ years experience
  EXECUTIVE     // Leadership positions
}

enum JobCategory {
  TECHNOLOGY, FINANCE, HEALTHCARE, EDUCATION, MARKETING,
  SALES, DESIGN, ENGINEERING, OPERATIONS, HUMAN_RESOURCES,
  LEGAL, CUSTOMER_SERVICE, MANUFACTURING, CONSULTING,
  MEDIA, GOVERNMENT, NON_PROFIT, AGRICULTURE, CONSTRUCTION,
  HOSPITALITY, TRANSPORTATION, RETAIL, REAL_ESTATE,
  TELECOMMUNICATIONS, OTHER
}
```

### Cascade Delete Behavior

```typescript
// User deletion cascades to all related records
User → JobSeeker/Employer/Admin (CASCADE)
User → SocialAccount (CASCADE)
User → Attachment (CASCADE)

// Job deletion removes all applications and saved jobs
Job → Application (CASCADE)
Job → SavedJob (CASCADE)
Job → Attachment (CASCADE)

// Application deletion removes associated attachments
Application → Attachment (CASCADE)
```

### Critical Query Patterns

```typescript
// Always include role-specific profile when fetching users
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    jobSeeker: true,
    employer: true,
    admin: true,
  },
});

// Include job and employer data for applications
const applications = await prisma.application.findMany({
  where: { jobSeekerId },
  include: {
    job: {
      include: { employer: true },
    },
    attachments: true,
  },
});

// Employer job listings with application counts
const jobs = await prisma.job.findMany({
  where: { employerId },
  include: {
    _count: { select: { applications: true } },
    applications: {
      include: { jobSeeker: true },
    },
  },
});

// Prevent duplicate applications with unique constraint
try {
  await prisma.application.create({
    data: { jobId, jobSeekerId, coverLetter },
  });
} catch (error) {
  if (error.code === "P2002") {
    throw new AppError("You have already applied to this job", 400);
  }
}
```

### Database Connection Best Practices

```typescript
// Single Prisma instance with connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Transaction handling for related data
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.jobSeeker.create({
    data: { userId: user.id, ...profileData },
  });
});
```

## Frontend Component Patterns

### Component Composition Strategy

```typescript
// Feature-based organization with barrel exports
import { Dashboard, MyApplications } from "../pages/job-seeker";
import { Button, PhoneInput } from "../components/ui";
import { Header, Footer } from "../components/common";
```

### UI Component Architecture

```typescript
// Standardized component prop patterns
interface ComponentProps extends HTMLAttributes<HTMLElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}

// Base styling system with Tailwind CSS
const baseStyles =
  "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
```

### Design System Patterns

```typescript
// Consistent size variations
const sizeStyles = {
  sm: "text-sm px-4 py-2",
  md: "text-base px-6 py-3",
  lg: "text-lg px-8 py-4",
};

// Brand color variants using CSS custom properties
const variantStyles = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl",
  outline:
    "border-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent",
  ghost: "bg-transparent hover:bg-muted hover:text-foreground",
};
```

### Form Component Patterns

```typescript
// Standardized input components with error handling
<PhoneInput
  countryCode={countryCode}
  phoneNumber={phone}
  onCountryCodeChange={setCountryCode}
  onPhoneNumberChange={setPhone}
  label="Phone Number"
  required
  error={errors.phone}
  className="mb-4"
/>;

// Consistent form validation display
{
  error && (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
      <p className="text-red-600">{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );
}
```

### Loading State Patterns

```typescript
// Integrated loading states in components
<Button variant="primary" size="lg" isLoading={submitting} fullWidth>
  {isLoading ? (
    <div className="flex items-center justify-center gap-2">
      <div className="wave-loader">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <span>Submit Application</span>
    </div>
  ) : (
    "Submit Application"
  )}
</Button>
```

### File Upload Patterns

```typescript
// File upload validation and handling
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files) return;

  Array.from(files).forEach((file) => {
    // Validate file type
    const isValidFile =
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "text/plain";

    if (!isValidFile) {
      alert("Please upload PDF, DOC, DOCX, or TXT files only.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB.");
      return;
    }

    const fileUpload: FileUpload = {
      file,
      preview: URL.createObjectURL(file),
      type: file.name.toLowerCase().includes("cover")
        ? "cover_letter"
        : "resume",
    };

    setUploadedFiles((prev) => [...prev, fileUpload]);
  });

  // Always reset file input after processing
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

// File removal with cleanup
const removeFile = (index: number) => {
  setUploadedFiles((prev) => {
    const newFiles = [...prev];
    URL.revokeObjectURL(newFiles[index].preview); // Prevent memory leaks
    newFiles.splice(index, 1);
    return newFiles;
  });
};
```

### Modal and Form Component Patterns

```typescript
// Modal with progress steps and file management
const JobApplicationModal = ({
  isOpen,
  onClose,
  job,
  onApplicationSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step icon helper
  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <HiDocumentText className="w-5 h-5" />;
      case 2:
        return <HiUpload className="w-5 h-5" />;
      case 3:
        return <HiUser className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <HiX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress steps indicator */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {getStepIcon(step)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
```

### Animation Patterns (Framer Motion)

```typescript
// Consistent page transitions
<motion.div
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8 }}
>
  {/* Page content */}
</motion.div>

// List item animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
  {/* List item content */}
</motion.div>
```

### Theme System (Tailwind CSS 4.1)

```css
/* Design tokens defined in index.css */
@theme {
  /* Primary colors (brand slate) */
  --color-primary-500: #64748b;
  --color-primary-800: #1e293b; /* Base primary */

  /* Secondary colors (tech green) */
  --color-secondary-500: #22c55e; /* Base secondary */

  /* Neutral colors (brand blue) */
  --color-neutral-500: #0ea5e9; /* Base neutral */

  /* Semantic light mode tokens */
  --color-background: #ffffff;
  --color-foreground: #000000;
  --color-card: #ffffff;
  --color-popover: #ffffff;
}

/* Dark mode variants */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #000000;
    --color-foreground: #ffffff;
    --color-card: #000000;
    --color-popover: #000000;
  }
}
```

### Icon Integration Pattern (CRITICAL: Always Use React Icons)

```typescript
// React Icons with consistent sizing - NEVER use SVG icons or emojis
import { MdPhone, MdEmail, MdWork, MdLocationOn, MdAttachMoney } from "react-icons/md";
import { HiX, HiUpload, HiDocumentText, HiUser } from "react-icons/hi";
import { MdAttachFile, MdDelete, MdCheckCircle, MdBusiness } from "react-icons/md";

// Standard icon usage in components - consistent sizing and positioning
<MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />

// Icon usage in buttons and interactive elements
<Button variant="outline" className="flex items-center gap-2">
  <MdAttachFile className="w-4 h-4" />
  Upload Resume
</Button>

// Homepage feature icons - use Material Design icons consistently
<div className="flex items-center mb-4">
  <MdLocationOn className="w-8 h-8 text-primary mr-3" />
  <span>Location-based job search</span>
</div>
```

### Component Export Strategy

```typescript
// ui/index.ts - Barrel exports for clean imports
export { default as Button } from "./Button";
export { default as PhoneInput } from "./PhoneInput";
export { default as ThemeToggle } from "./ThemeToggle";

// Feature-specific component groups
export * from "./auth";
export * from "./common";
export * from "./features";
```

## API Response Handling

### Standardized Response Structure

```typescript
// All API responses follow this pattern
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

// Frontend error handling pattern
try {
  const response = await jobsAPI.getAll();
  if (response.success) {
    setJobs(response.data.jobs);
  } else {
    throw new Error(response.message || "Unknown error");
  }
} catch (err) {
  console.error("Failed to fetch jobs:", err);
  // Always handle empty states gracefully
  setJobs([]);
  setError("Failed to load jobs. Please try again.");
}
```

### API Client Architecture

```typescript
// Centralized HTTP client with automatic token management and request deduplication
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private pendingRequests: Map<string, Promise<ApiResponse<unknown>>> =
    new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  // Image URL formatting utility
  formatImageUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const serverBaseUrl = this.baseURL.replace("/api", "");
    return url.startsWith("/")
      ? `${serverBaseUrl}${url}`
      : `${serverBaseUrl}/${url}`;
  }

  private async request<T>(
    endpoint: string,
    method: HttpMethod = "GET",
    data?: RequestData
  ): Promise<ApiResponse<T>> {
    // Request deduplication to prevent duplicate API calls
    const requestKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;

    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {};

    // Handle FormData vs JSON content
    if (!(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (data) {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const requestPromise = fetch(url, config)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          // Handle 401 unauthorized by clearing token
          if (response.status === 401) {
            this.removeToken();
          }
          throw new Error(result.message || `HTTP ${response.status}`);
        }

        return result;
      })
      .catch((error) => {
        console.error(`API ${method} ${endpoint} error:`, error);
        throw error;
      })
      .finally(() => {
        this.pendingRequests.delete(requestKey);
      });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }
}
```

### Feature-Organized API Endpoints

```typescript
// Organized by business domain for maintainability
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post("/auth/login", credentials),
  register: (userData: RegisterData) =>
    apiClient.post("/auth/register", userData),
  logout: () => apiClient.post("/auth/logout"),
  verifyEmail: (code: string) => apiClient.post("/auth/verify-email", { code }),
  resendVerification: (email: string) =>
    apiClient.post("/auth/resend-verification", { email }),
  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (code: string, newPassword: string) =>
    apiClient.post("/auth/reset-password", { code, newPassword }),
  refreshUser: () => apiClient.get("/auth/me"),
};

export const jobsAPI = {
  getAll: (params?: URLSearchParams) =>
    apiClient.get(`/jobs${params ? `?${params}` : ""}`),
  getById: (id: string) => apiClient.get(`/jobs/${id}`),
  create: (jobData: CreateJobData) => apiClient.post("/jobs", jobData),
  update: (id: string, jobData: Partial<CreateJobData>) =>
    apiClient.put(`/jobs/${id}`, jobData),
  delete: (id: string) => apiClient.delete(`/jobs/${id}`),
  getCategories: () => apiClient.get("/jobs/categories"),
  getFeatured: () => apiClient.get("/jobs/featured"),
};

export const applicationsAPI = {
  getByJobSeeker: () => apiClient.get("/applications/job-seeker"),
  getByEmployer: () => apiClient.get("/applications/employer"),
  apply: (jobId: string, coverLetter?: string) =>
    apiClient.post("/applications", { jobId, coverLetter }),
  updateStatus: (id: string, status: string) =>
    apiClient.put(`/applications/${id}/status`, { status }),
  withdraw: (id: string) => apiClient.delete(`/applications/${id}`),
};

export const savedJobsAPI = {
  getSaved: () => apiClient.get("/saved-jobs"),
  saveJob: (jobId: string) => apiClient.post("/saved-jobs", { jobId }),
  unsaveJob: (jobId: string) => apiClient.delete(`/saved-jobs/${jobId}`),
  checkSaved: (jobId: string) => apiClient.get(`/saved-jobs/check/${jobId}`),
};

export const attachmentAPI = {
  upload: (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    return apiClient.post("/attachments/upload", formData);
  },
  getUserAttachments: () => apiClient.get("/attachments/my-attachments"),
  getAttachments: (entityType: string, entityId: string) =>
    apiClient.get(`/attachments/${entityType}/${entityId}`),
  delete: (id: string) => apiClient.delete(`/attachments/${id}`),
};

export const userAPI = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (profileData: UpdateProfileData) =>
    apiClient.put("/users/profile", profileData),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.post("/users/avatar", formData);
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put("/users/change-password", { currentPassword, newPassword }),
};
```

### Backend Error Patterns

```typescript
// Custom error class for operational errors
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage in controllers
throw new AppError("Job not found", 404);
throw new AppError("You have already applied to this job", 400);
throw new AppError("Unauthorized access", 401);

// Async wrapper for error handling
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Controller pattern with catchAsync
export const getJobs = catchAsync(async (req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    include: { employer: true },
  });

  res.status(200).json({
    success: true,
    data: { jobs, count: jobs.length },
  });
});

// Express Request extension for auth
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
        imageUrl?: string;
        profile?: any;
      };
      userId?: string;
    }
  }
}

// Authentication middleware pattern
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from Authorization header or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError("Access denied. No token provided.", 401);
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { jobSeeker: true, employer: true, admin: true },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found or deactivated", 404);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as "JOB_SEEKER" | "EMPLOYER" | "ADMIN",
      profile: user.jobSeeker || user.employer || user.admin || null,
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
    };

    next();
  } catch (error) {
    next(error);
  }
};
```

### Graceful Empty State Handling

```typescript
// Backend: Always return success with empty arrays
if (!applications.length) {
  return res.status(200).json({
    success: true,
    data: {
      applications: [],
      pagination: { total: 0, page: 1, pages: 0 },
    },
    message: "No applications found",
  });
}

// Frontend: Handle empty states in UI
const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await applicationsAPI.getByJobSeeker();
        if (response.success) {
          setApplications(response.data.applications || []);
        }
      } catch (err) {
        setError("Failed to load applications");
        setApplications([]); // Ensure empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No applications yet</p>
        <Button variant="primary" onClick={() => navigate("/jobs")}>
          Browse Jobs
        </Button>
      </div>
    );
  }

  return (
    <div>
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
};
```

### Authentication Flow Integration

```typescript
// Login flow with token management
const handleLogin = async (credentials: LoginCredentials) => {
  try {
    const response = await authAPI.login(credentials);

    if (response.success && response.data.token) {
      // Set token for subsequent requests
      apiClient.setToken(response.data.token);

      // Update auth context
      setUser(response.data.user);
      setIsAuthenticated(true);

      // Redirect based on role
      const redirectPath =
        response.data.user.role === "EMPLOYER"
          ? "/employer/dashboard"
          : "/job-seeker/dashboard";
      navigate(redirectPath);
    }
  } catch (error) {
    setError("Invalid credentials. Please try again.");
  }
};

// Auth Context Interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
  isVerified: boolean;
  hasProfile: boolean;
  profile: Record<string, unknown> | null;
  imageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Protected route pattern
const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: UserRole;
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### Error Boundary Pattern

```typescript
// Global error boundary for API failures
class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("API Error Boundary caught an error:", error, errorInfo);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            We're sorry, but something went wrong. Please try refreshing the
            page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Environment Setup

### Backend Environment (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/employme"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Email (Mailtrap for dev)
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="your-mailtrap-user"
EMAIL_PASS="your-mailtrap-password"

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Server Configuration
NODE_ENV="development"
PORT=5000
CORS_ORIGIN="http://localhost:5173"
```

### Frontend Environment (.env)

```bash
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Optional: Environment-specific settings
VITE_APP_NAME="Employ.me"
VITE_ENVIRONMENT="development"
```

### Database Connection Patterns

```typescript
// Prisma client configuration with connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection health check
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Graceful shutdown handling
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("🔌 Database disconnected");
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### Development Workflow Setup

```typescript
// Server configuration with environment-based settings
const app = express();

// CORS configuration for development
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Environment-specific middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // HTTP request logging
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});
```

### Database Migration Management

```bash
# Development workflow
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes (dev only)
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with sample data

# Production workflow
npm run db:migrate     # Create and apply migrations
npm run db:deploy      # Deploy migrations (production)
npm run db:reset       # Reset database (dev only)

# Useful Prisma commands
npx prisma migrate dev --name add_new_feature
npx prisma migrate reset
npx prisma db seed
npx prisma studio
```

### Error Handling Configuration

```typescript
// Global error handler middleware
const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error details:", err);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Prisma errors
  if (err.code === "P2002") {
    const message = "Duplicate field value entered";
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please log in again";
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
```

### File Upload Configuration (Cloudinary)

```typescript
// Cloudinary configuration
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File upload utility
export const uploadToCloudinary = async (
  file: Buffer,
  folder: string,
  resourceType: "image" | "raw" = "image"
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `employme/${folder}`,
          resource_type: resourceType,
          allowed_formats:
            resourceType === "image"
              ? ["jpg", "jpeg", "png", "gif"]
              : ["pdf", "doc", "docx"],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(file);
  });
};
```

### Authentication Configuration

```typescript
// JWT configuration
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Cookie configuration for JWT
const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "7") * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};
```

### Socket.IO Configuration

```typescript
// Socket.IO setup with CORS
import { Server as SocketIOServer } from "socket.io";

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user.id;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});
```

### Package.json Scripts Configuration

```json
// Backend package.json scripts
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}

// Frontend package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### Local Development Setup Commands

```bash
# Initial setup
git clone <repository-url>
cd employme

# Backend setup
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:generate
npm run db:push
npm run db:seed
npm run dev

# Frontend setup (new terminal)
cd client
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Full stack running
# Backend: http://localhost:5001
# Frontend: http://localhost:5173
# Prisma Studio: http://localhost:5555 (npm run db:studio)
```

## Critical Patterns for Immediate Productivity

### 1. API Client Pattern (Essential)

```typescript
// services/api.ts - All API calls use centralized client with auto token management
import { authAPI, jobsAPI, applicationsAPI } from "../services/api";

const response = await jobsAPI.getAll();
if (response.success) {
  setJobs(response.data.jobs); // Always check success before using data
}
```

### 2. Authentication Flow

- JWT stored in localStorage via `apiClient.setToken()` in AuthContext
- All components use `useAuth()` hook for user state
- Protected routes check role: `<ProtectedRoute requiredRole="EMPLOYER">`
- Backend middleware: `authMiddleware` → `req.user` populated

### 3. Component Organization

```typescript
// Feature-based imports using barrel exports
import { Dashboard, MyApplications } from "../pages/job-seeker";
import { Button, PhoneInput } from "../components/ui";
import { Header } from "../components/common";
```

### 4. Database Patterns

```typescript
// Always include related profile data when fetching users
const user = await prisma.user.findUnique({
  where: { id },
  include: { jobSeeker: true, employer: true, admin: true },
});

// Prevent duplicate applications with unique constraint
await prisma.application.create({
  data: { jobId, jobSeekerId, coverLetter },
}); // Throws P2002 error if duplicate
```

### 5. File Upload Pattern

- Multer → local `/server/uploads/` → Cloudinary (production)
- Frontend: FormData with `attachmentAPI.upload(files)`
- Always validate file types: PDF, DOC, DOCX, images

## Role-Based Access & Routes

### Job Seekers (`JOB_SEEKER`)

- Dashboard: `/job-seeker/dashboard` - applications, saved jobs
- Pages: `/jobs` (browse), `/jobs/:id/apply` (application modal)

### Employers (`EMPLOYER`)

- Dashboard: `/employer/dashboard` - posted jobs, applications
- Job management: Create/edit via modals, view applicant CVs

### Common Patterns

- Role-specific redirects after login in `AuthContext`
- Each role has dedicated layout: `JobSeekerDashboardLayout`, `EmployerDashboardLayout`
- API routes are role-protected via middleware

## Troubleshooting Common Issues

### "API calls failing after login"

- Check if `apiClient.setToken()` called in AuthContext login method
- Verify backend `authMiddleware` sets `req.user`

### "Database connection issues"

- Ensure `DATABASE_URL` in server/.env matches running PostgreSQL
- Run `cd server && npm run db:push` to sync schema

### "File uploads not working"

- Check server/uploads/ directory exists (created automatically)
- Verify Cloudinary env vars for production uploads

### "Hot reload issues"

- Clear Vite cache: `cd client && rm -rf node_modules/.vite`
- Restart with `npm run dev`

## Key Integration Points

### Socket.IO

Real-time messaging configured in `server/src/index.ts` with CORS for localhost:5173

### File Uploads

Cloudinary integration via `attachmentRoutes` for resumes/logos

### Social Auth

Passport.js with Google/LinkedIn/Facebook OAuth configured

## Common Gotchas

1. **Route Organization**: Application routes include auth middleware internally - don't double-apply
2. **Token Management**: Login must call `apiClient.setToken()` or subsequent API calls fail
3. **Role Validation**: Always check user role before rendering role-specific UI
4. **Error Boundaries**: Empty states should render gracefully, not throw errors
5. **Migration Safety**: Use `db:push` for development, `db:migrate` for production
6. **Component Imports**: Use barrel exports from index.ts files for cleaner imports

## Testing Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

When working on this codebase, prioritize understanding the user role context and ensure API calls include proper authentication headers.

### Socket.IO

Real-time messaging configured in `server/src/index.ts` with CORS for localhost:5173

### File Uploads

Cloudinary integration via `attachmentRoutes` for resumes/logos

### Social Auth

Passport.js with Google/LinkedIn/Facebook OAuth configured

## Common Gotchas

1. **Route Organization**: Application routes include auth middleware internally - don't double-apply
2. **Token Management**: Login must call `apiClient.setToken()` or subsequent API calls fail
3. **Role Validation**: Always check user role before rendering role-specific UI
4. **Error Boundaries**: Empty states should render gracefully, not throw errors
5. **Migration Safety**: Use `db:push` for development, `db:migrate` for production
6. **Component Imports**: Use barrel exports from index.ts files for cleaner imports

## Testing Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

When working on this codebase, prioritize understanding the user role context and ensure API calls include proper authentication headers.
