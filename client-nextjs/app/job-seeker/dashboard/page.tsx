import DashboardContent from "@/components/job-seeker/DashboardContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const metadata = {
  title: "Job Seeker Dashboard | Employ.me",
};

interface RecentJob {
  id: string;
  title: string;
  employer: {
    companyName: string;
    location?: string;
  };
  location: string;
  createdAt: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
}

export default async function JobSeekerDashboardPage() {
  let stats = {
    totalJobs: 0,
    savedJobs: 0,
    applications: 0,
    profileViews: 0,
  };
  let recentJobs: RecentJob[] = [];
  let firstName = "User";

  // Check authentication first
  const authResponse = await serverFetch<{
    user: { firstName: string; role: string };
  }>("/auth/me", {
    next: { revalidate: 0 },
  });

  // Redirect on auth failure
  if (!authResponse.success) {
    redirect("/auth/login");
  }

  // Check role strictly on the server
  if (authResponse.data?.user?.role !== "JOB_SEEKER") {
    redirect("/auth/login");
  }

  firstName = authResponse.data.user.firstName || "User";

  try {
    // Run data fetches in parallel after confirming authentication
    const [jobsResponse, applicationsResponse, savedJobsResponse] =
      await Promise.all([
        serverFetch<{ jobs: RecentJob[]; pagination: { total: number } }>(
          "/jobs?limit=5",
          {
            next: { tags: ["jobs"], revalidate: 60 },
          },
        ),
        serverFetch<{ applications: any[] }>("/applications/my-applications", {
          next: { tags: ["my-applications"], revalidate: 0 },
        }),
        serverFetch<{ savedJobs: any[] }>("/jobs/saved", {
          next: { tags: ["saved-jobs"], revalidate: 0 },
        }),
      ]);

    // Process successful responses
    if (jobsResponse.success && jobsResponse.data) {
      recentJobs = jobsResponse.data.jobs || [];
      stats.totalJobs = jobsResponse.data.pagination?.total || 0;
    }

    if (savedJobsResponse.success && savedJobsResponse.data?.savedJobs) {
      stats.savedJobs = savedJobsResponse.data.savedJobs.length;
    }

    if (
      applicationsResponse.success &&
      applicationsResponse.data?.applications
    ) {
      stats.applications = applicationsResponse.data.applications.length;
    }
  } catch (error: any) {
    console.error("Failed to fetch job seeker dashboard data:", error);
    // Don't throw, just log - the dashboard will render with default values
  }

  return (
    <DashboardContent
      stats={stats}
      recentJobs={recentJobs}
      firstName={firstName}
    />
  );
}
