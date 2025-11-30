import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { JobSeekerDashboardLayout } from "@/components/layouts/JobSeekerDashboardLayout";

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireRole="JOB_SEEKER">
      <JobSeekerDashboardLayout>{children}</JobSeekerDashboardLayout>
    </ProtectedRoute>
  );
}
