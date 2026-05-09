import MyJobsContent from "@/components/employer/MyJobsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Job Postings | Employ.me",
};

export default async function MyJobsPage() {
  let myJobs: any[] = [];

  // Check authentication first
  const authResponse = await serverFetch<{
    user: { firstName: string; role: string };
  }>("/auth/me", {
    next: { revalidate: 0 },
  });

  // Redirect on auth failure or wrong role
  if (!authResponse.success || authResponse.data?.user?.role !== "EMPLOYER") {
    redirect("/auth/login");
  }

  try {
    const response = await serverFetch<{ jobs: any[] }>("/jobs/my-jobs", {
      next: { tags: ["my-jobs"], revalidate: 0 }, // We don't want heavily caching this until active mutations settle
    });

    if (response.success && response.data?.jobs) {
      myJobs = response.data.jobs;
    }
  } catch (error: any) {
    console.error("Failed to load employer jobs on server:", error);
    // Don't throw, just log - the page will render with empty jobs
  }

  return <MyJobsContent initialJobs={myJobs} />;
}

export const dynamic = "force-dynamic";
