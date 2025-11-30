"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface RouteGuardOptions {
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  requireRole?: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
  requireVerification?: boolean;
  redirectTo?: string;
}

export function useRouteGuard(options: RouteGuardOptions = {}) {
  const {
    requireAuth = true,
    requireOnboarding = false,
    requireRole,
    requireVerification = true,
    redirectTo,
  } = options;

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !user) {
      router.push(redirectTo || "/auth/login");
      return;
    }

    if (!user) return;

    // Check email verification requirement (skip for auth pages)
    const isAuthPage = pathname?.startsWith("/auth");
    if (requireVerification && !user.isVerified && !isAuthPage) {
      router.push("/auth/verify-email?email=" + encodeURIComponent(user.email));
      return;
    }

    // Check if user needs onboarding (doesn't have profile) - do this BEFORE role checks
    // Skip this check only if we're on the onboarding page itself
    const isOnboardingPage = pathname === "/onboarding";
    if (!user.hasProfile && !isOnboardingPage) {
      router.push("/onboarding");
      return;
    }

    // If user has completed onboarding but is trying to access onboarding page
    if (user.hasProfile && requireOnboarding) {
      if (user.role === "EMPLOYER") {
        router.push("/employer/dashboard");
      } else if (user.role === "JOB_SEEKER") {
        router.push("/job-seeker/dashboard");
      } else if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      }
      return;
    }

    // Check role requirement
    if (requireRole && user.role !== requireRole) {
      // Redirect to appropriate dashboard based on their actual role
      if (user.role === "EMPLOYER") {
        router.push("/employer/dashboard");
      } else if (user.role === "JOB_SEEKER") {
        router.push("/job-seeker/dashboard");
      } else if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      }
      return;
    }
  }, [
    user,
    isLoading,
    requireAuth,
    requireOnboarding,
    requireRole,
    requireVerification,
    redirectTo,
    router,
    pathname,
  ]);

  return { user, isLoading };
}
