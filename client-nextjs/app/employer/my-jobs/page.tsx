import MyJobsContent from "@/components/employer/MyJobsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Job Postings | Employ.me",
};

export default async function MyJobsPage() {
  let myJobs: any[] = [];

  try {
    const response = await serverFetch<{ jobs: any[] }>("/jobs/my-jobs", {
      next: { tags: ["my-jobs"], revalidate: 0 }, // We don't want heavily caching this until active mutations settle
    });

    if (response.success && response.data?.jobs) {
      myJobs = response.data.jobs;
    }
  } catch (error: any) {
    if (error.message?.includes("401") || error.message?.includes("403")) {
      redirect("/auth/login");
    }
    console.error("Failed to load employer jobs on server:", error);
  }

  return <MyJobsContent initialJobs={myJobs} />;
}
