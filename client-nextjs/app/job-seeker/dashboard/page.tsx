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

  try {
    // We can get the user's name from another endpoint or from a token, but for now we'll fetch /auth/me if necessary
    // We'll run the fetches in parallel. The backend expects authorization cookie.
    const [jobsResponse, applicationsResponse, savedJobsResponse, authResponse] = await Promise.all([
      serverFetch<{ jobs: RecentJob[]; pagination: { total: number } }>("/jobs?limit=5", {
        next: { tags: ["jobs"], revalidate: 60 }
      }).catch(() => null),
      serverFetch<{ applications: any[] }>("/applications/my-applications", {
        next: { tags: ["my-applications"], revalidate: 0 }
      }).catch(() => null),
      serverFetch<{ savedJobs: any[] }>("/jobs/saved", {
        next: { tags: ["saved-jobs"], revalidate: 0 }
      }).catch(() => null),
      serverFetch<{ user: { firstName: string, role: string } }>("/auth/me", {
        next: { revalidate: 0 }
      }).catch((e: any) => {
        if (e.message?.includes("401") || e.message?.includes("403")) {
          redirect("/auth/login");
        }
        return null;
      }),
    ]);
    
    // Check role strictly on the server
    if (authResponse?.data?.user) {
      if (authResponse.data.user.role !== "JOB_SEEKER") {
        redirect("/auth/login");
      }
      firstName = authResponse.data.user.firstName;
    } else if (!authResponse) {
      // If we failed to get user details without getting redirected, we should still require auth
      redirect("/auth/login");
    }

    if (jobsResponse?.success && jobsResponse.data) {
      recentJobs = jobsResponse.data.jobs || [];
      stats.totalJobs = jobsResponse.data.pagination?.total || 0;
    }

    if (savedJobsResponse?.success && savedJobsResponse.data?.savedJobs) {
      stats.savedJobs = savedJobsResponse.data.savedJobs.length;
    }

    if (applicationsResponse?.success && applicationsResponse.data?.applications) {
      stats.applications = applicationsResponse.data.applications.length;
    }

  } catch (error: any) {
    if (error.message?.includes("401") || error.message?.includes("403") || error.message?.includes("NEXT_REDIRECT")) {
      throw error; // Let next/navigation handle redirects
    }
    console.error("Failed to fetch job seeker dashboard data:", error);
  }

  return (
    <DashboardContent 
      stats={stats} 
      recentJobs={recentJobs} 
      firstName={firstName} 
    />
  );
}
