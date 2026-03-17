import DashboardContent, { DashboardProps } from "@/components/employer/DashboardContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Employer Dashboard | Employ.me",
};

interface RecentJob {
  id: string;
  title: string;
  isActive: boolean;
  applicationsCount?: number;
  createdAt: string;
  _count?: {
    applications: number;
  };
}

export default async function EmployerDashboardPage() {
  let stats = {
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalCandidates: 0,
  };
  let recentJobs: RecentJob[] = [];
  let recentApplications: DashboardProps["recentApplications"] = [];

  try {
    // Both fetches can run concurrently
    const [jobsResponse, applicationsResponse] = await Promise.all([
      serverFetch<{ jobs: RecentJob[] }>("/jobs/my-jobs", {
        next: { tags: ["employer-jobs"], revalidate: 0 }, // no cache or short cache for dashboard
      }),
      serverFetch<{ applications: any[] }>("/applications/employer", {
        next: { tags: ["employer-applications"], revalidate: 0 },
      }),
    ]);

    // Handle Jobs
    if (jobsResponse.success && jobsResponse.data?.jobs) {
      const jobs = jobsResponse.data.jobs;
      
      stats.totalJobs = jobs.length;
      stats.activeJobs = jobs.filter((job) => job.isActive).length;
      
      recentJobs = [...jobs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
        
      stats.totalApplications = jobs.reduce(
        (sum, job) => sum + (job._count?.applications || job.applicationsCount || 0),
        0
      );
    }

    // Handle Applications
    if (applicationsResponse.success && applicationsResponse.data?.applications) {
      const applications = applicationsResponse.data.applications;
      
      stats.pendingApplications = applications.filter((app) => app.status === "PENDING").length;
      
      recentApplications = applications.slice(0, 5).map((app) => {
        const firstName = app.jobSeeker?.firstName || app.jobSeeker?.user?.firstName || "";
        const lastName = app.jobSeeker?.lastName || app.jobSeeker?.user?.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();

        return {
          id: app.id,
          applicantName: fullName || "Unknown Applicant",
          jobTitle: app.job?.title || "Unknown Job",
          status: app.status,
          appliedAt: app.appliedAt || app.createdAt || new Date().toISOString(),
        };
      });
    }

  } catch (error: any) {
    if (error.message?.includes("401") || error.message?.includes("403")) {
      redirect("/auth/login");
    }
    console.error("Failed to fetch dashboard data:", error);
  }

  return (
    <DashboardContent 
      stats={stats} 
      recentJobs={recentJobs} 
      recentApplications={recentApplications} 
    />
  );
}
