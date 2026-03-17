import { Suspense } from "react";
import JobDetailsContent from "@/components/jobs/JobDetailsContent";
import { serverFetch } from "@/lib/server-api";
import type { Job, JobResponse } from "@/types/job";
import { notFound } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;
  
  if (!jobId) {
    notFound();
  }

  let job: Job | null = null;
  let relatedJobs: Job[] = [];

  try {
    // Fetch job details
    const response = await serverFetch<JobResponse>(`/jobs/${jobId}`, {
      next: { tags: [`job-${jobId}`], revalidate: 60 }
    });

    if (response.success && response.data) {
      job = response.data.job;

      // Fetch related jobs based on category
      if (job.category) {
        const relatedResponse = await serverFetch<{ jobs: Job[] }>(
          `/jobs?category=${job.category}&limit=4`,
          { next: { tags: ["jobs"], revalidate: 60 } }
        );

        if (relatedResponse.success && relatedResponse.data) {
          // Filter out current job and limit to 3
          const filtered = relatedResponse.data.jobs.filter((j) => j.id !== jobId);
          relatedJobs = filtered.slice(0, 3);
        }
      }
    } else {
      notFound();
    }
  } catch (error) {
    console.error("Failed to fetch job details on server:", error);
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 py-12 flex items-center justify-center">
            <div className="animate-pulse space-y-6 container mx-auto px-4 max-w-4xl">
              <div className="h-8 w-32 rounded bg-muted"></div>
              <div className="h-12 w-3/4 rounded bg-muted"></div>
              <div className="h-64 rounded bg-muted"></div>
            </div>
          </main>
        </div>
      }
    >
      <JobDetailsContent 
        initialJob={job as Job} 
        initialRelatedJobs={relatedJobs} 
      />
    </Suspense>
  );
}
