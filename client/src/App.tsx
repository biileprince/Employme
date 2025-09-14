import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';

// Import layouts
import RootLayout from './layouts/RootLayout';
import EmployerDashboardLayout from './layouts/EmployerDashboardLayout';

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
  JobListings,
  JobDetail,
  EmployerDashboard,
  EmployerProfile,
  PostJob,
  EditJob,
  MyJobs,
  JobApplications,
  CandidateSearch
} from './pages';

// Import loaders
import { jobsLoader, jobDetailLoader } from './loaders/jobsLoaders';

// Import providers
import { ProtectedRoute } from './components/common/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/jobs',
        element: <JobListings />,
        loader: jobsLoader,
      },
      {
        path: '/jobs/:id',
        element: <JobDetail />,
        loader: jobDetailLoader,
      },
    
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
     
      {
        path: '/onboarding',
        element: (
          <ProtectedRoute requireOnboarding={true}>
            <Onboarding />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Employer Dashboard Routes (separate layout)
  {
    path: '/employer',
    element: <EmployerDashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <EmployerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'post-job',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <PostJob />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-jobs',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <MyJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: 'jobs/:jobId/edit',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <EditJob />
          </ProtectedRoute>
        ),
      },
      {
        path: 'jobs/:jobId/applications',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <JobApplications />
          </ProtectedRoute>
        ),
      },
      {
        path: 'applications',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <JobApplications />
          </ProtectedRoute>
        ),
      },
      {
        path: 'candidates',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <CandidateSearch />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute requireRole="EMPLOYER">
            <EmployerProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Job Seeker Routes
  {
    path: '/job-seeker',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'profile',
        element: (
          <ProtectedRoute requireRole="JOB_SEEKER">
            <JobSeekerProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'applications',
        element: (
          <ProtectedRoute requireRole="JOB_SEEKER">
            <MyApplications />
          </ProtectedRoute>
        ),
      },
    ],
  },
], {
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

function App() {
  useEffect(() => {
    // Apply the theme on initial load
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return (
    <RouterProvider router={router} />
  );
}

export default App
