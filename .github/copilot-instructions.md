# Employ.me Copilot Instructions

This is a full-stack job platform with React/TypeScript frontend and Express/Prisma backend.

## Architecture Overview

**Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4.1 + Framer Motion+ react icons.
Use react icons instead of emojis

**Backend**: Express + TypeScript + Prisma + PostgreSQL + Socket.io
**Authentication**: JWT tokens with role-based access (JOB_SEEKER, EMPLOYER, ADMIN)

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

### Icon Integration Pattern

```typescript
// React Icons with consistent sizing
import { MdPhone, MdEmail, MdWork } from "react-icons/md";

// Standard icon usage in components
<MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />;
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
// Centralized HTTP client with automatic token management
class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  private async request<T>(
    endpoint: string,
    method: HttpMethod = "GET",
    data?: RequestData
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include", // Include cookies
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
};

export const jobsAPI = {
  getAll: (params?: URLSearchParams) =>
    apiClient.get(`/jobs${params ? `?${params}` : ""}`),
  getById: (id: string) => apiClient.get(`/jobs/${id}`),
  create: (jobData: CreateJobData) => apiClient.post("/jobs", jobData),
  update: (id: string, jobData: Partial<CreateJobData>) =>
    apiClient.put(`/jobs/${id}`, jobData),
  delete: (id: string) => apiClient.delete(`/jobs/${id}`),
};

export const applicationsAPI = {
  getByJobSeeker: () => apiClient.get("/applications/job-seeker"),
  getByEmployer: () => apiClient.get("/applications/employer"),
  create: (applicationData: { jobId: string; coverLetter?: string }) =>
    apiClient.post("/applications", applicationData),
  updateStatus: (id: string, status: string) =>
    apiClient.put(`/applications/${id}/status`, { status }),
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
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}

// Frontend package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
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
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
# Prisma Studio: http://localhost:5555 (npm run db:studio)
```

## Critical Development Patterns

### Authentication Flow

- JWT tokens stored in localStorage via `apiClient.setToken()`
- `AuthContext` manages user state and provides login/logout
- Backend uses `authMiddleware` for protected routes
- Role-based middleware: `employerOnly`, `jobSeekerOnly`, `adminOnly`

### API Client Pattern

```typescript
// Use the centralized API client in services/api.ts
import { authAPI, jobsAPI, applicationsAPI, userAPI } from "../services/api";

// All API methods return ApiResponse<T> with success/data structure
const response = await jobsAPI.getAll();
if (response.success) {
  setJobs(response.data.jobs);
}
```

## Development Commands

### Backend (server/)

```bash
npm run dev          # Start with tsx watch
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Apply database migrations
npm run db:seed      # Seed database with sample data
```

### Frontend (client/)

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
```

### Full Stack

- Backend runs on `localhost:5000`
- Frontend dev server on `localhost:5173`
- Health check: `GET /health`

## Role-Based Features

### Job Seekers

- View jobs (`/jobs`), apply to jobs, manage applications
- Profile creation via onboarding flow
- Saved jobs functionality

### Employers

- Post/edit jobs, view applications, manage candidates
- Company profile with verification status
- Dashboard with job metrics

### Admins

- System statistics, user management
- Access via `/api/admin` routes

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
