# Navigation Structure Documentation

Complete navigation implementation matching the React client routing structure.

## Overview

The Next.js application now has a complete navigation structure with:

- **3 Dashboard Layouts**: Employer, Job Seeker, and Admin
- **25+ Pages**: All routes from the React client have been created
- **Role-Based Access**: All protected routes use `ProtectedRoute` with role requirements
- **Responsive Design**: Mobile-friendly sidebars and navigation

## Route Structure

### Public Routes

All public routes use the standard Header and Footer components.

| Route           | Page                        | Description                                 |
| --------------- | --------------------------- | ------------------------------------------- |
| `/`             | `app/page.tsx`              | Homepage with hero and features             |
| `/about`        | `app/about/page.tsx`        | About page with mission, vision, and values |
| `/jobs`         | `app/jobs/page.tsx`         | Job listings                                |
| `/jobs/[id]`    | `app/jobs/[id]/page.tsx`    | Job detail page                             |
| `/company/[id]` | `app/company/[id]/page.tsx` | Company profile page                        |
| `/auth/login`   | `app/auth/login/page.tsx`   | Login page (multi-step)                     |
| `/auth/signup`  | `app/auth/signup/page.tsx`  | Signup page (role → register → verify)      |
| `/onboarding`   | `app/onboarding/page.tsx`   | Onboarding redirect page                    |

### Employer Routes

All employer routes require `EMPLOYER` role and use `EmployerDashboardLayout`.

**Layout**: `app/employer/layout.tsx` wraps all child routes with:

- `ProtectedRoute` with `requireRole="EMPLOYER"`
- `EmployerDashboardLayout` with sidebar navigation

| Route                    | Page                                 | Description                   |
| ------------------------ | ------------------------------------ | ----------------------------- |
| `/employer/dashboard`    | `app/employer/dashboard/page.tsx`    | Employer dashboard with stats |
| `/employer/post-job`     | `app/employer/post-job/page.tsx`     | Create new job posting        |
| `/employer/my-jobs`      | `app/employer/my-jobs/page.tsx`      | List of employer's jobs       |
| `/employer/applications` | `app/employer/applications/page.tsx` | All applications across jobs  |
| `/employer/candidates`   | `app/employer/candidates/page.tsx`   | Candidate search              |
| `/employer/messages`     | `app/employer/messages/page.tsx`     | Messaging interface           |
| `/employer/profile`      | `app/employer/profile/page.tsx`      | Company profile management    |

**Sidebar Navigation** (Employer):

- Dashboard
- Post Job
- My Jobs
- Applications
- Find Candidates
- Messages
- Profile
- Logout

### Job Seeker Routes

All job seeker routes require `JOB_SEEKER` role and use `JobSeekerDashboardLayout`.

**Layout**: `app/job-seeker/layout.tsx` wraps all child routes with:

- `ProtectedRoute` with `requireRole="JOB_SEEKER"`
- `JobSeekerDashboardLayout` with sidebar navigation

| Route                      | Page                                   | Description                     |
| -------------------------- | -------------------------------------- | ------------------------------- |
| `/job-seeker/dashboard`    | `app/job-seeker/dashboard/page.tsx`    | Job seeker dashboard with stats |
| `/job-seeker/applications` | `app/job-seeker/applications/page.tsx` | My applications                 |
| `/job-seeker/saved-jobs`   | `app/job-seeker/saved-jobs/page.tsx`   | Saved/bookmarked jobs           |
| `/job-seeker/messages`     | `app/job-seeker/messages/page.tsx`     | Messaging interface             |
| `/job-seeker/profile`      | `app/job-seeker/profile/page.tsx`      | Profile management              |

**Sidebar Navigation** (Job Seeker):

- Dashboard
- Browse Jobs (links to `/jobs`)
- My Applications
- Saved Jobs
- Messages
- Profile
- Logout

### Admin Routes

All admin routes require `ADMIN` role and use `AdminLayout`.

**Layout**: `app/admin/layout.tsx` wraps all child routes with:

- `ProtectedRoute` with `requireRole="ADMIN"`
- `AdminLayout` with sidebar navigation

| Route                 | Page                              | Description                         |
| --------------------- | --------------------------------- | ----------------------------------- |
| `/admin/dashboard`    | `app/admin/dashboard/page.tsx`    | Admin dashboard with platform stats |
| `/admin/users`        | `app/admin/users/page.tsx`        | User management                     |
| `/admin/employers`    | `app/admin/employers/page.tsx`    | Employer verification               |
| `/admin/jobs`         | `app/admin/jobs/page.tsx`         | Job approval and management         |
| `/admin/applications` | `app/admin/applications/page.tsx` | Application management              |
| `/admin/analytics`    | `app/admin/analytics/page.tsx`    | Analytics dashboard                 |
| `/admin/newsletter`   | `app/admin/newsletter/page.tsx`   | Newsletter management               |
| `/admin/messages`     | `app/admin/messages/page.tsx`     | Platform communications             |
| `/admin/create-admin` | `app/admin/create-admin/page.tsx` | Create new admin                    |

**Sidebar Navigation** (Admin):

- Dashboard
- Users
- Employers
- Jobs
- Applications
- Analytics
- Newsletter
- Messages
- Create Admin
- Logout

## Layout Components

### 1. EmployerDashboardLayout

**Location**: `components/layouts/EmployerDashboardLayout.tsx`

**Features**:

- Fixed sidebar (desktop) / slide-out sidebar (mobile)
- 7 navigation links
- Top bar with page title and home link
- Mobile hamburger menu
- Logout functionality
- Smooth animations with Framer Motion

**Usage**:

```tsx
import { EmployerDashboardLayout } from "@/components/layouts";

<EmployerDashboardLayout>{children}</EmployerDashboardLayout>;
```

### 2. JobSeekerDashboardLayout

**Location**: `components/layouts/JobSeekerDashboardLayout.tsx`

**Features**:

- Fixed sidebar (desktop) / slide-out sidebar (mobile)
- 6 navigation links
- Top bar with page title and home link
- Mobile hamburger menu
- Logout functionality
- Smooth animations with Framer Motion

**Usage**:

```tsx
import { JobSeekerDashboardLayout } from "@/components/layouts";

<JobSeekerDashboardLayout>{children}</JobSeekerDashboardLayout>;
```

### 3. AdminLayout

**Location**: `components/layouts/AdminLayout.tsx`

**Features**:

- Fixed sidebar with scrollable navigation
- 9 navigation links
- Fixed header with page title
- User info section at bottom of sidebar
- Mobile slide-out sidebar
- Logout functionality
- Smooth animations with Framer Motion

**Usage**:

```tsx
import { AdminLayout } from "@/components/layouts";

<AdminLayout>{children}</AdminLayout>;
```

## Protected Routes

All dashboard routes are protected using the `ProtectedRoute` component with role-based access control.

**Implementation Pattern**:

```tsx
// app/employer/layout.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmployerDashboardLayout } from "@/components/layouts/EmployerDashboardLayout";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireRole="EMPLOYER">
      <EmployerDashboardLayout>{children}</EmployerDashboardLayout>
    </ProtectedRoute>
  );
}
```

**Role Requirements**:

- Employer routes: `requireRole="EMPLOYER"`
- Job Seeker routes: `requireRole="JOB_SEEKER"`
- Admin routes: `requireRole="ADMIN"`

If user doesn't have the required role, they are redirected to `/auth/login`.

## Navigation Flow

### After Login/Registration

1. User completes authentication
2. `AuthContext` sets user data with role
3. Based on role:
   - **EMPLOYER**: Redirected to `/employer/dashboard`
   - **JOB_SEEKER**: Redirected to `/job-seeker/dashboard`
   - **ADMIN**: Redirected to `/admin/dashboard`

### Role-Based Redirects

The `ProtectedRoute` component handles automatic redirects:

```typescript
// If user is authenticated but has wrong role
if (user.role !== requireRole) {
  router.push("/auth/login"); // Redirect to login
}
```

### Onboarding Flow

The `/onboarding` page handles profile completion:

1. Checks if user is authenticated
2. If not authenticated → redirect to `/auth/login`
3. If has profile → redirect to role-specific dashboard
4. If missing profile → redirect to profile page

## Mobile Responsiveness

All dashboard layouts are fully responsive:

### Desktop (lg: 1024px+)

- Sidebar is fixed at 256px width
- Main content has left margin to accommodate sidebar
- Top bar spans remaining width

### Tablet (md: 768px - 1023px)

- Sidebar slides in from left
- Main content takes full width
- Hamburger menu in top bar

### Mobile (< 768px)

- Sidebar slides in from left
- Full-screen backdrop when sidebar is open
- Compact top bar with essential info only

## Component Exports

### Layouts

```typescript
// components/layouts/index.ts
export { EmployerDashboardLayout } from "./EmployerDashboardLayout";
export { JobSeekerDashboardLayout } from "./JobSeekerDashboardLayout";
export { AdminLayout } from "./AdminLayout";
```

### Common Components

```typescript
// components/common/index.ts
export { Header } from "./Header";
export { Footer } from "./Footer";
export { ScrollToTop } from "./ScrollToTop";
```

## Styling

All layouts use Tailwind CSS with:

- CSS custom properties for theming (defined in `app/globals.css`)
- Semantic color tokens (`bg-card`, `text-foreground`, etc.)
- Responsive utilities (`lg:ml-64`, `hidden md:block`, etc.)
- Smooth transitions and hover effects

## Framer Motion Animations

All pages and layouts use Framer Motion for:

- Page transitions: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
- Sidebar slide-in: `animate={{ x: sidebarOpen ? 0 : "-100%" }}`
- Staggered animations: `delay: index * 0.1`

## Next Steps

The navigation structure is now complete. Next implementations can focus on:

1. **Job Posting Form**: Implement full job creation in `/employer/post-job`
2. **Application Management**: Build application tracking in employer/job-seeker dashboards
3. **Profile Pages**: Create comprehensive profile forms for all roles
4. **Messaging System**: Implement real-time chat (Socket.IO integration)
5. **Admin Tools**: Build verification, approval, and management interfaces
6. **Analytics**: Add charts and metrics to dashboard pages
7. **Search & Filters**: Enhance job browsing with filters and search

## Testing Navigation

To test the navigation:

1. **Start the dev server**: `cd client-nextjs && npm run dev`
2. **Login with different roles**:
   - Job Seeker: See job seeker dashboard and navigation
   - Employer: See employer dashboard and navigation
   - Admin: See admin dashboard and navigation
3. **Test mobile responsiveness**: Resize browser to see responsive sidebars
4. **Test protected routes**: Try accessing routes without authentication
5. **Test role-based access**: Try accessing employer routes as job seeker (should redirect)

## File Structure Summary

```
client-nextjs/
├── app/
│   ├── page.tsx (/)
│   ├── about/page.tsx (/about)
│   ├── onboarding/page.tsx (/onboarding)
│   ├── jobs/
│   │   ├── page.tsx (/jobs)
│   │   └── [id]/page.tsx (/jobs/:id)
│   ├── company/
│   │   └── [id]/page.tsx (/company/:id)
│   ├── auth/
│   │   ├── login/page.tsx (/auth/login)
│   │   └── signup/page.tsx (/auth/signup)
│   ├── employer/
│   │   ├── layout.tsx (Protected: EMPLOYER)
│   │   ├── dashboard/page.tsx
│   │   ├── post-job/page.tsx
│   │   ├── my-jobs/page.tsx
│   │   ├── applications/page.tsx
│   │   ├── candidates/page.tsx
│   │   ├── messages/page.tsx
│   │   └── profile/page.tsx
│   ├── job-seeker/
│   │   ├── layout.tsx (Protected: JOB_SEEKER)
│   │   ├── dashboard/page.tsx
│   │   ├── applications/page.tsx
│   │   ├── saved-jobs/page.tsx
│   │   ├── messages/page.tsx
│   │   └── profile/page.tsx
│   └── admin/
│       ├── layout.tsx (Protected: ADMIN)
│       ├── dashboard/page.tsx
│       ├── users/page.tsx
│       ├── employers/page.tsx
│       ├── jobs/page.tsx
│       ├── applications/page.tsx
│       ├── analytics/page.tsx
│       ├── newsletter/page.tsx
│       ├── messages/page.tsx
│       └── create-admin/page.tsx
└── components/
    ├── layouts/
    │   ├── EmployerDashboardLayout.tsx
    │   ├── JobSeekerDashboardLayout.tsx
    │   ├── AdminLayout.tsx
    │   └── index.ts
    └── common/
        ├── Header.tsx
        ├── Footer.tsx
        ├── ScrollToTop.tsx
        └── index.ts
```
