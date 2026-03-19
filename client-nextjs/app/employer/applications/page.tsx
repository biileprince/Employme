import ApplicationsContent from "@/components/employer/ApplicationsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Job Applications | Employ.me",
};

export default async function EmployerApplicationsPage() {
  let applicationsWithInterviews: any[] = [];

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
    const response = await serverFetch<{ applications: any[] }>(
      "/applications/employer",
      {
        next: { tags: ["employer-applications"], revalidate: 0 },
      },
    );

    if (response.success && response.data?.applications) {
      const applicationsData = response.data.applications;

      // Fetch interviews for each application in parallel
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
