"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requireProfile?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireProfile = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while loading auth state
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!user) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (user.role === "EMPLOYER") {
        router.push("/employer/dashboard");
      } else if (user.role === "JOB_SEEKER") {
        router.push("/job-seeker/dashboard");
      } else if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
      return;
    }

    // Check profile requirement
    if (requireProfile && !user.hasProfile) {
      // Redirect to profile setup based on role
      if (user.role === "EMPLOYER") {
        router.push("/employer/profile");
      } else if (user.role === "JOB_SEEKER") {
        router.push("/job-seeker/profile");
      }
      return;
    }
  }, [user, isLoading, requiredRole, requireProfile, router, pathname]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or wrong role
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  // Don't render if profile required but not completed
  if (requireProfile && !user.hasProfile) {
    return null;
  }

  return <>{children}</>;
}
