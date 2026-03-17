import { Suspense } from "react";
import JobsPageContent from "@/components/jobs/JobsPageContent";
import { serverFetch } from "@/lib/server-api";
import type { JobsResponse } from "@/types/job";

export const metadata = {
  title: "Browse Jobs | Employ.me",
  description: "Find your dream job among our thousands of active listings.",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Format searchParams to pass to the backend
  const queryParams = new URLSearchParams();
  queryParams.append("limit", "15");
  queryParams.append("page", "1");
  
  if (params.search) queryParams.append("search", params.search as string);
  if (params.category) queryParams.append("category", params.category as string);
  if (params.location) queryParams.append("location", params.location as string);
  
  if (params.jobType && typeof params.jobType === "string") {
    queryParams.append("jobType", params.jobType.toUpperCase().replace("-", "_"));
  }

  // Use next-level cache tags or revalidate timings
  let initialJobsResponse: JobsResponse | null = null;
  try {
    const response = await serverFetch<JobsResponse>(
      `/jobs?${queryParams.toString()}`,
      {
        next: { tags: ["jobs"], revalidate: 60 },
      }
    );
    if (response.success && response.data) {
      initialJobsResponse = response.data;
    }
  } catch (error) {
    console.error("Failed to fetch jobs on server:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      }
    >
      <JobsPageContent 
        initialJobs={initialJobsResponse?.jobs || []} 
        initialTotalPages={initialJobsResponse?.pagination.totalPages || 1}
        initialTotalJobs={initialJobsResponse?.pagination.total || 0}
      />
    </Suspense>
  );
}
