import SavedJobsContent from "@/components/job-seeker/SavedJobsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Saved Jobs | Employ.me",
};

export default async function SavedJobsPage() {
  let savedJobs: any[] = [];

  // Check authentication first
  const authResponse = await serverFetch<{
    user: { firstName: string; role: string };
  }>("/auth/me", {
    next: { revalidate: 0 },
  });

  // Redirect on auth failure or wrong role
  if (!authResponse.success || authResponse.data?.user?.role !== "JOB_SEEKER") {
    redirect("/auth/login");
  }

  try {
    const response = await serverFetch<{ savedJobs: any[] }>("/saved-jobs", {
      next: { tags: ["saved-jobs"], revalidate: 0 },
    });

    if (response.success && response.data) {
      savedJobs = Array.isArray(response.data)
        ? response.data
        : response.data.savedJobs || [];
    }
  } catch (error: any) {
    console.error("Failed to load saved jobs on server:", error);
    // Don't throw, just log - the page will render with empty saved jobs
  }

  return <SavedJobsContent initialJobs={savedJobs} />;
}

export const dynamic = "force-dynamic";
