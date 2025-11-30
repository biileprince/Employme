import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts/AdminLayout";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
