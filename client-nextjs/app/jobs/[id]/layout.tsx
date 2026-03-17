import type { Metadata } from "next";
import { serverFetch } from "@/lib/server-api";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// In a real app we would fetch the specific job for its title and summary
// However, since we don't have direct DB access here and rely on the external API,
// we provide a dynamic title based on the route.
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    // Attempt to fetch job data from backend for rich SEO metadata
    const response = await serverFetch<any>(`/jobs/${id}`, {
      next: { revalidate: 60 },
    });
    
    if (response.success && response.data) {
      const job = response.data.job;
      const companyName = job.employer?.companyName || "Employ.me";
      
      return {
        title: `${job.title} at ${companyName} | Employ.me`,
        description: job.description?.substring(0, 160) || `Apply for ${job.title} at ${companyName} on Employ.me`,
        openGraph: {
          title: `${job.title} at ${companyName}`,
          description: job.description?.substring(0, 160) || `Apply for ${job.title} at ${companyName} on Employ.me`,
          type: "website",
        },
      };
    }
  } catch (error) {
    console.error("Error fetching job metadata:", error);
  }

  // Fallback metadata
  return {
    title: `Job Details | Employ.me`,
    description: "View job details and apply on Employ.me, Ghana's premier job platform.",
  };
}

export default function JobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
