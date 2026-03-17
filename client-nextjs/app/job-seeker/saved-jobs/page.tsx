import SavedJobsContent from "@/components/job-seeker/SavedJobsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Saved Jobs | Employ.me",
};

export default async function SavedJobsPage() {
  let savedJobs: any[] = [];

  try {
    const response = await serverFetch<{ savedJobs: any[] }>("/saved-jobs", {
      next: { tags: ["saved-jobs"], revalidate: 0 },
    });

    if (response.success && response.data) {
      savedJobs = Array.isArray(response.data) ? response.data : response.data.savedJobs || [];
    }
  } catch (error: any) {
    if (error.message?.includes("401") || error.message?.includes("403")) {
      redirect("/auth/login");
    }
    console.error("Failed to load saved jobs on server:", error);
  }

  return <SavedJobsContent initialJobs={savedJobs} />;
}
