import ApplicationsContent from "@/components/employer/ApplicationsContent";
import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Job Applications | Employ.me",
};

export default async function EmployerApplicationsPage() {
  let applicationsWithInterviews: any[] = [];

  try {
    const response = await serverFetch<{ applications: any[] }>("/applications/employer", {
      next: { tags: ["employer-applications"], revalidate: 0 },
    });

    if (response.success && response.data?.applications) {
      const applicationsData = response.data.applications;

      // Fetch interviews for each application in parallel
      applicationsWithInterviews = await Promise.all(
        applicationsData.map(async (app) => {
          try {
            const interviewResponse = await serverFetch<{ interviews?: any[] }>(`/applications/${app.id}/interviews`, {
              next: { tags: [`application-${app.id}-interviews`], revalidate: 0 },
            });

            if (interviewResponse.success && interviewResponse.data) {
              const interviews = Array.isArray(interviewResponse.data)
                ? interviewResponse.data
                : interviewResponse.data.interviews || [];
              return { ...app, interviews };
            }
            return app;
          } catch (e) {
            console.warn(`Failed to fetch interviews for application ${app.id}:`, e);
            return app;
          }
        })
      );
    }
  } catch (error: any) {
    if (error.message?.includes("401") || error.message?.includes("403")) {
      redirect("/auth/login");
    }
    console.error("Failed to fetch applications on server:", error);
  }

  return <ApplicationsContent initialApplications={applicationsWithInterviews} />;
}
