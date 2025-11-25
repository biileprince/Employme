# Employ.me Copilot Instructions

Full-stack job platform for Ghana's market. React 19 + TypeScript + Vite frontend, Express + Prisma + PostgreSQL backend with 3-tier role system (JOB_SEEKER, EMPLOYER, ADMIN).

## Quick Start Commands

```bash
# Backend (Terminal 1) - Port 5001
cd server && npm run dev          # tsx watch with hot reload (Express + Socket.IO)
npm run db:studio                 # Prisma Studio on :5555

# Frontend (Terminal 2) - Port 5173
cd client && npm run dev          # Vite with HMR (React + Socket.IO client)

# Database operations (from server/)
npm run db:generate               # Regenerate Prisma client after schema changes
npm run db:push                   # Push schema changes (dev only, no migrations)
npm run db:migrate                # Create migration (required for prod)
npm run db:seed                   # Seed with test data (preserves admin)
```

## Architecture Overview

**Tech Stack**: React 19.1 + TypeScript 5.8 + Vite 7.1 + Tailwind CSS 4.1 + Framer Motion 12.23 | Express 4.18 + Prisma 5.22 + PostgreSQL + Socket.io 4.x + Cloudinary + Nodemailer

**Critical Design Decisions**:

- **Role-based profiles**: User model has `role` field, one-to-one relations create JobSeeker/Employer/Admin profiles
- **Two-tier moderation**: Employers need `isVerified=true` (admin manual approval), Jobs need `isApproved=true` (separate admin approval)
- **Request deduplication**: ApiClient caches pending requests by `${method}:${endpoint}:${data}` to prevent duplicate API calls
- **JWT + localStorage**: `apiClient.setToken()` stores token, auto-included in all requests via Authorization header
- **Graceful empty states**: Backend returns `success: true, data: []` even for empty results; frontend always initializes state as `[]`

**Project Structure**:

```
client/src/
├── pages/          # Feature-organized: auth/, employer/, job-seeker/, jobs/, admin/
│   ├── Messages.tsx  # Real-time chat UI with Socket.IO
├── components/
│   ├── ui/         # Reusable: Button, PhoneInput (with variant/size props)
│   ├── common/     # Header, Footer, ScrollToTop
│   ├── auth/       # LoginForm, RegisterForm, SocialLogin, EmailVerification
│   └── features/   # Newsletter, JobApplicationModal
├── contexts/       # AuthContext (useAuth hook for user state), ChatContext (Socket.IO + messaging)
├── services/       # api.ts (centralized ApiClient with token management)
└── layouts/        # Role-specific: JobSeekerDashboardLayout, EmployerDashboardLayout, AdminLayout

server/src/
├── controllers/    # Business logic: authController, jobController, adminController, newsletterController, interviewController, chatController
├── routes/         # Express routes with middleware applied
├── middleware/     # auth.ts (authMiddleware populates req.user), errorHandler.ts (catchAsync wrapper)
├── services/       # emailService.ts (Nodemailer for verification/notifications)
├── index.ts        # Express + Socket.IO setup with JWT authentication
└── prisma/         # schema.prisma (includes Conversation + Message models), migrations/, seed.ts
```

## Database Schema (Prisma) - Critical Patterns

**Core Relationships**:

```typescript
User (role: JOB_SEEKER|EMPLOYER|ADMIN) →1:1→ JobSeeker|Employer|Admin
Employer →1:many→ Job (employer posts jobs)
Job →many:many→ JobSeeker via Application (unique constraint: [jobId, jobSeekerId])
Job →many:many→ JobSeeker via SavedJob (bookmarks)
User/Job/Application →1:many→ Attachment (file uploads)
```

**Key Fields** (from schema.prisma):

- `User.isVerified`: Email verification (boolean)
- `Employer.isVerified`: Admin approval for employer (boolean) - **required to post jobs that can be approved**
- `Job.isApproved`: Admin approval for individual job (boolean) - **required for public visibility**
- `Job.isActive`: Employer control (boolean) - deactivate without deleting
- `Job.isFeatured`: Premium placement (boolean)
- `Application.status`: PENDING|REVIEWED|SHORTLISTED|REJECTED|HIRED
- `JobSeeker.skills`: String[] - array of skill strings
- `Job.requirements`: String[] - array of requirements
- `Job.benefits`: String[] - array of benefits

**CRITICAL Query Pattern** - Always include role profiles:

```typescript
const user = await prisma.user.findUnique({
  where: { id },
  include: { jobSeeker: true, employer: true, admin: true }, // Include ALL role profiles
});
```

**Duplicate Prevention**:

```typescript
// Application model has @@unique([jobId, jobSeekerId])
try {
  await prisma.application.create({
    data: { jobId, jobSeekerId, coverLetter },
  });
} catch (error) {
  if (error.code === "P2002") {
    // Prisma unique constraint violation
    throw new AppError("You have already applied to this job", 400);
  }
}
```

**Cascade Deletes**:

- User deletion → cascades to JobSeeker/Employer/Admin, SocialAccount, Attachment
- Job deletion → cascades to Application, SavedJob, Attachment
- Application deletion → cascades to Attachment

## Frontend Component Patterns

**Icon Integration (CRITICAL)**: ALWAYS use React Icons (react-icons/md, react-icons/hi), NEVER SVG or emojis:

```typescript
import { MdPhone, MdEmail, MdWork } from "react-icons/md";
<MdPhone className="w-5 h-5 text-muted-foreground" />;
```

**UI Component Props** (Button, PhoneInput follow this pattern):

```typescript
interface ComponentProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}
```

**File Upload Pattern** (ALWAYS reset input after processing):

```typescript
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  // Validate: PDF, DOC, DOCX, TXT only, 5MB max
  // Create preview with URL.createObjectURL()

  if (fileInputRef.current) {
    fileInputRef.current.value = ""; // CRITICAL: Prevent file persistence
  }
};

// Cleanup on removal
const removeFile = (index: number) => {
  URL.revokeObjectURL(files[index].preview); // Prevent memory leaks
};
```

**Animation Pattern** (Framer Motion):

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }} // Stagger list items
>
```

**Tailwind Theme** (use CSS variables, NOT hardcoded colors):

```css
/* client/src/index.css defines tokens */
--color-primary-800: #1e293b; /* Use: bg-primary, text-primary */
--color-secondary-500: #22c55e; /* Use: bg-secondary */
/* NEVER: bg-[#1e293b], use semantic tokens */
```

## API & Backend Patterns

**API Response Structure** (ALL endpoints follow this):

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Frontend pattern - ALWAYS check success first
const response = await jobsAPI.getAll();
if (response.success) {
  setJobs(response.data.jobs || []); // Default to [] for safety
}
```

**Error Handling**:

```typescript
// Backend: Custom error class
throw new AppError("Job not found", 404);
throw new AppError("You have already applied to this job", 400);

// Controller wrapper (ALWAYS use catchAsync)
export const getJobs = catchAsync(async (req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: { isActive: true, isApproved: true },
  });
  res.status(200).json({ success: true, data: { jobs, count: jobs.length } });
});

// Prisma errors: error.code === "P2002" = unique constraint violation
```

**Authentication Middleware** (populates `req.user`):

```typescript
// Backend sets req.user from JWT token
req.user = {
  id: string;
  email: string;
  role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
  profile: JobSeeker | Employer | Admin | null;
};

// Frontend: apiClient.setToken() called in AuthContext login
// Token auto-included in all requests via Authorization header
```

**Request Deduplication** (ApiClient pattern):

```typescript
// Prevents duplicate API calls with same parameters
const requestKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
if (pendingRequests.has(requestKey)) {
  return pendingRequests.get(requestKey); // Return existing promise
}
```

**Email Service** (Nodemailer + Mailtrap):

```typescript
// server/src/services/emailService.ts handles all notifications
await sendEmployerVerificationNotification(
  employer,
  isApproved,
  rejectionReason
);
await sendJobDeactivationNotification(job, employer);
// HTML templates with green (approval) / red (rejection) themes
```

## Two-Tier Moderation System (CRITICAL Business Logic)

**Employer Verification** (`Employer.isVerified`):

- Admin manually verifies employers at `/admin/employers`
- Unverified employers CAN post jobs, but jobs won't be approved
- Admin can "Unverify" verified employers (removes verification status)
- Email notifications sent on approval/rejection

**Job Approval** (`Job.isApproved`):

- Admin approves individual jobs at `/admin/jobs`
- Jobs only appear publicly if `isApproved=true AND isActive=true`
- Employers can post without verification, but jobs need both employer verification AND job approval for public visibility
- Filter: "Pending Approval" shows unapproved jobs

**Admin Actions** (adminController.ts):

```typescript
// Toggle employer verification
PATCH /api/admin/employers/:id/verification { isVerified, rejectionReason? }

// Manage job (actions: approve, reject, activate, deactivate, feature, unfeature)
PATCH /api/admin/jobs/:id { action: "approve" | "reject" }

// Get pending items
GET /api/admin/employers/pending  // isVerified=false
GET /api/admin/jobs/pending       // isApproved=false, isActive=true
```

**Frontend Implementation**:

- `AdminEmployers.tsx`: Verification modal with approve/reject/unverify buttons
- `AdminJobs.tsx`: Approval filter dropdown + approve/reject buttons for pending jobs
- Both show badges: green "Approved/Verified" | yellow "Pending"

## Environment Setup

**Backend** (server/.env):

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/employme"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5001
CORS_ORIGIN="http://localhost:5173"
CLIENT_URL="http://localhost:5173"  # For Socket.IO CORS

# Email (Mailtrap for dev)
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="your-user"
EMAIL_PASS="your-pass"

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
```

**Frontend** (client/.env):

```bash
VITE_API_URL=http://localhost:5001/api
# Socket.IO connects to http://localhost:5001 (derived from VITE_API_URL)
```

## Common Workflows

**Database Changes**:

```bash
# 1. Edit server/prisma/schema.prisma
# 2. Generate Prisma client
cd server && npm run db:generate
# 3. Development: Push changes
npm run db:push
# 4. Production: Create migration
npm run db:migrate -- --name descriptive_name
```

**Seeding Test Data**:

```bash
cd server && npm run db:seed
# Creates: 1 admin, 3 employers (2 verified), 3 job seekers, 5 jobs (3 approved), 4 applications
# Admin: admin@employme.com / AdminPassword123!
# Employers: tech@company.com, hr@financecorp.com, info@healthplus.com (all Password123!)
```

**Adding New Feature**:

1. Backend: Add controller → route → apply middleware
2. Frontend: Add API endpoint in `services/api.ts`
3. Create component using existing UI patterns (Button, animations, icons)
4. Test with Postman → Integrate with AuthContext if needed

## Real-Time Chat System (Socket.IO)

**Critical Architecture**: Socket.IO server runs alongside Express on port 5001, frontend connects from port 5173.

**Socket.IO Setup** (server/src/index.ts):

```typescript
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ["http://localhost:5173"], methods: ["GET", "POST"] },
});

// CRITICAL: Authentication uses userId in JWT payload
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
  };
  socket.data.userId = decoded.userId; // NOT decoded.id
  next();
});
```

**Database Models** (Prisma schema):

```typescript
model Conversation {
  id              String   @id @default(cuid())
  participant1Id  String
  participant2Id  String
  lastMessageAt   DateTime @default(now())
  participant1    User     @relation("ConversationsAsParticipant1", fields: [participant1Id], references: [id], onDelete: Cascade)
  participant2    User     @relation("ConversationsAsParticipant2", fields: [participant2Id], references: [id], onDelete: Cascade)
  messages        Message[]
  @@unique([participant1Id, participant2Id]) // Prevent duplicate conversations
}

model Message {
  id             String  @id @default(cuid())
  conversationId String
  senderId       String
  content        String  @db.Text
  isRead         Boolean @default(false)
  isEdited       Boolean @default(false)
  isDeleted      Boolean @default(false)
  attachmentUrl  String?
  attachmentType String?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User    @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
}
```

**Socket.IO Events Pattern**:

```typescript
// Backend: Broadcast to receiver only (NOT back to sender)
socket.on("message_sent", (data: { conversationId; message; receiverId }) => {
  io.to(`user_${data.receiverId}`).emit("new_message", {
    conversationId: data.conversationId,
    message: data.message,
  });
  // DON'T emit to conversation room - causes duplicates
});

// Frontend: Skip own messages to prevent duplicates
newSocket.on("new_message", (data) => {
  if (data.message.senderId === currentUserId) return; // CRITICAL

  setMessages((prev) => {
    // Check if message already exists
    if (prev.some((msg) => msg.id === data.message.id)) return prev;
    return [...prev, data.message];
  });
});
```

**CRITICAL: Preventing Stale Closures** (ChatContext pattern):

```typescript
// Use useRef to track current user ID - prevents stale closures in socket listeners
const userIdRef = useRef<string | null>(null);

useEffect(() => {
  if (user?.id) {
    userIdRef.current = user.id;
  }
}, [user?.id]);

// Socket listener uses ref, not state
newSocket.on("new_message", (data) => {
  const currentUserId = userIdRef.current; // Always current value
  if (data.message.senderId === currentUserId) return;
});
```

**Typing Indicators** (without activeConversation dependency):

```typescript
// Frontend: Start typing
const startTyping = () => {
  if (!socket || !activeConversation) return;
  const receiverId = getOtherParticipantId(activeConversation);
  socket.emit("typing_start", {
    conversationId: activeConversation.id,
    receiverId,
  });
};

// Backend: Broadcast to receiver
socket.on("typing_start", (data: { conversationId; receiverId }) => {
  io.to(`user_${data.receiverId}`).emit("user_typing", {
    conversationId: data.conversationId,
    userId: socket.data.userId,
  });
});
```

**Role-Based Messaging Rules**:

- **Admin**: Can message ANY user (job seekers, employers)
- **Job Seeker**: Can message employers who posted jobs they applied to
- **Employer**: Can message job seekers who applied to their jobs
- Backend: `getEligibleContacts` filters based on role + applications

**Responsive Chat UI Patterns**:

```typescript
// Mobile: Conditional sidebar/chat visibility
const [showMobileChat, setShowMobileChat] = useState(false);

// Sidebar: Hidden on mobile when chat open
<div className={`${showMobileChat ? "hidden md:flex" : "flex"} md:w-80 lg:w-72`}>

// Chat: Hidden on mobile until conversation selected
<div className={`${showMobileChat ? "flex" : "hidden md:flex"} flex-1`}>
  {/* Back button for mobile */}
  <button onClick={() => setShowMobileChat(false)}>Back</button>

  {/* Message bubbles: Responsive max-widths */}
  <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]">
    {/* Text wrapping: CRITICAL to prevent horizontal scroll */}
    <p className="break-words whitespace-pre-wrap overflow-wrap-anywhere hyphens-auto">
      {message.content}
    </p>
  </div>
</div>
```

**Auto-Resizing Textarea** (for message editing):

```typescript
const editTextareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  const textarea = editTextareaRef.current;
  if (textarea && editingMessageId) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}, [editContent, editingMessageId]);
```

**Common Chat Issues**:

| Issue                         | Root Cause                                            | Solution                                                             |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Messages appear 2-3 times     | Broadcasting to sender + receiver + conversation room | Only emit to `user_${receiverId}`, skip own messages in listener     |
| "User ID: undefined"          | JWT payload uses `id` instead of `userId`             | Change to `decoded.userId` in Socket.IO auth                         |
| Typing indicators not working | Stale `activeConversation` in closure                 | Use `useRef` for current user ID, don't depend on activeConversation |
| Horizontal scroll in chat     | Text overflow + wide sidebar                          | Use `break-words whitespace-pre-wrap`, reduce sidebar to `md:w-80`   |
| Socket disconnects on auth    | Token not passed in handshake                         | Use `auth: { token }` in io() constructor                            |

## Troubleshooting

| Issue                      | Solution                                                         |
| -------------------------- | ---------------------------------------------------------------- |
| API calls fail after login | Check `apiClient.setToken()` called in AuthContext               |
| Database connection error  | Verify `DATABASE_URL` in server/.env matches PostgreSQL          |
| File upload not working    | Ensure server/uploads/ exists; check Cloudinary env vars         |
| Hot reload issues          | Clear Vite cache: `cd client && rm -rf node_modules/.vite`       |
| Migration errors           | Run `npm run db:generate` then `npm run db:push`                 |
| Duplicate applications     | Unique constraint `@@unique([jobId, jobSeekerId])` prevents this |
| Icons not showing          | Use React Icons (react-icons/md or /hi), never SVG               |
| Empty state errors         | Always initialize state as `[]`, check `response.success` first  |
