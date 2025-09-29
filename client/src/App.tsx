import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import "./App.css";

// Import layouts
import RootLayout from "./layouts/RootLayout";
import EmployerDashboardLayout from "./layouts/EmployerDashboardLayout";
import JobSeekerDashboardLayout from "./layouts/JobSeekerDashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Import pages using the new organized structure
import {
  HomePage,
  ErrorPage,
  LoginPage,
  SignupPage,
  Onboarding,
  Dashboard,
  JobSeekerProfile,
  MyApplications,
  SavedJobs,
  JobListings,
  JobDetail,
  CompanyProfile,
  EmployerDashboard,
  EmployerProfile,
  PostJob,
  EditJob,
  MyJobs,
  JobApplications,
  AllApplications,
  CandidateSearch,
} from "./pages";

// Import admin pages
import {
  AdminDashboard,
  AdminUsers,
  AdminJobs,
  AdminApplications,
  AdminAnalytics,
  AdminSettings,
  CreateAdmin,
} from "./pages/admin";

// Import loaders
import { jobDetailLoader } from "./loaders/jobsLoaders";

// Import providers
import { ProtectedRoute } from "./components/common/ProtectedRoute";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "/jobs",
          element: <JobListings />,
        },
        {
          path: "/jobs/:id",
          element: <JobDetail />,
          loader: jobDetailLoader,
        },
        {
          path: "/company/:id",
          element: <CompanyProfile />,
        },
        {
          path: "/login",
          element: <LoginPage />,
        },
        {
          path: "/signup",
          element: <SignupPage />,
        },

        {
          path: "/onboarding",
          element: (
            <ProtectedRoute requireOnboarding={true}>
              <Onboarding />
            </ProtectedRoute>
          ),
        },
        {
          path: "/dashboard",
          element: (
            <ProtectedRoute requireRole="JOB_SEEKER">
              <Navigate to="/job-seeker/dashboard" replace />
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Employer Dashboard Routes (separate layout)
    {
      path: "/employer",
      element: <EmployerDashboardLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <EmployerDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "post-job",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <PostJob />
            </ProtectedRoute>
          ),
        },
        {
          path: "my-jobs",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <MyJobs />
            </ProtectedRoute>
          ),
        },
        {
          path: "jobs/:jobId/edit",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <EditJob />
            </ProtectedRoute>
          ),
        },
        {
          path: "jobs/:jobId/applications",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <JobApplications />
            </ProtectedRoute>
          ),
        },
        {
          path: "applications",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <AllApplications />
            </ProtectedRoute>
          ),
        },
        {
          path: "candidates",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <CandidateSearch />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute requireRole="EMPLOYER">
              <EmployerProfile />
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Job Seeker Dashboard Routes (separate layout)
    {
      path: "/job-seeker",
      element: <JobSeekerDashboardLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute requireRole="JOB_SEEKER">
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "applications",
          element: (
            <ProtectedRoute requireRole="JOB_SEEKER">
              <MyApplications />
            </ProtectedRoute>
          ),
        },
        {
          path: "saved-jobs",
          element: (
            <ProtectedRoute requireRole="JOB_SEEKER">
              <SavedJobs />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute requireRole="JOB_SEEKER">
              <JobSeekerProfile />
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Admin Dashboard Routes (separate layout)
    {
      path: "/admin",
      element: <AdminLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "dashboard",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "users",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <AdminUsers />
            </ProtectedRoute>
          ),
        },
        {
          path: "jobs",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <AdminJobs />
            </ProtectedRoute>
          ),
        },
        {
          path: "applications",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <AdminApplications />
            </ProtectedRoute>
          ),
        },
        {
          path: "analytics",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <AdminAnalytics />
            </ProtectedRoute>
          ),
        },
        {
          path: "settings",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <AdminSettings />
            </ProtectedRoute>
          ),
        },
        {
          path: "create-admin",
          element: (
            <ProtectedRoute requireRole="ADMIN">
              <CreateAdmin />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

function App() {
  useEffect(() => {
    // Apply the theme on initial load
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
