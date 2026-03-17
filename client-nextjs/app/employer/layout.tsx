import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmployerDashboardLayout } from "@/components/layouts/EmployerDashboardLayout";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="EMPLOYER">
      <EmployerDashboardLayout>{children}</EmployerDashboardLayout>
    </ProtectedRoute>
  );
}
