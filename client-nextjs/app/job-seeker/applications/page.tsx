import ApplicationsContent from "@/components/job-seeker/ApplicationsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Applications | Employ.me",
};

interface Application {
  id: string;
  jobId: string;
  status?: "PENDING" | "REVIEWED" | "SHORTLISTED" | "HIRED" | "REJECTED";
  appliedAt: string;
  coverLetter?: string;
  job: any; // Use proper Job type
  interviews?: any[];
}

export default async function MyApplicationsPage() {
  let applicationsWithInterviews: Application[] = [];

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
    const response = await serverFetch<{ applications: Application[] }>(
      "/applications/my-applications",
      {
        next: { tags: ["my-applications"], revalidate: 0 },
      },
    );

    if (response.success && response.data?.applications) {
      const applicationsData = response.data.applications;

      // We need to fetch interviews for each application.
      // This could optionally be merged into a single API on backend,
      // but for now we follow the existing pattern in parallel.
      applicationsWithInterviews = await Promise.all(
        applicationsData.map(async (app) => {
          try {
            const interviewResponse = await serverFetch<{ interviews?: any[] }>(
              `/applications/${app.id}/interviews`,
              {
                next: {
                  tags: [`application-${app.id}-interviews`],
                  revalidate: 0,
                },
              },
            );

            if (interviewResponse.success && interviewResponse.data) {
              const interviews = Array.isArray(interviewResponse.data)
                ? interviewResponse.data
                : interviewResponse.data.interviews || [];
              return { ...app, interviews };
            }
            return app;
          } catch (e) {
            console.warn(
              `Failed to fetch interviews for application ${app.id}:`,
              e,
            );
            return app;
          }
        }),
      );
    }
  } catch (error: any) {
    console.error("Failed to fetch applications on server:", error);
    // Don't throw, just log - the page will render with empty applications
  }

  return (
    <ApplicationsContent initialApplications={applicationsWithInterviews} />
  );
}

export const dynamic = "force-dynamic";
