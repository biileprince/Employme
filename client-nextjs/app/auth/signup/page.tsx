"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { RoleSelection } from "@/components/auth/RoleSelection";
import { EmailVerification } from "@/components/auth/EmailVerification";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { apiClient } from "@/lib/api";
import type { UserRole, User } from "@/types/auth";
import Image from "next/image";

type SignupStep = "role-selection" | "register" | "verify-email";

function SignupContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<SignupStep>("role-selection");
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [isSocialAuth, setIsSocialAuth] = useState(false);
  const [socialEmail, setSocialEmail] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();

  const completeSocialRegistration = useCallback(
    async (role: UserRole, email: string) => {
      try {
        const response = await apiClient.post<{ user: User }>(
          "/auth/complete-social-auth",
          {
            role,
            email,
          }
        );

        if (response.success && response.data) {
          localStorage.removeItem("pending_social_auth_role");
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Social auth completion error:", error);
        localStorage.removeItem("pending_social_auth_role");
        setIsSocialAuth(true);
        setSocialEmail(email);
        setCurrentStep("role-selection");
      }
    },
    [router]
  );

  // Check for social auth parameters
  useEffect(() => {
    const step = searchParams.get("step");
    const social = searchParams.get("social");
    const email = searchParams.get("email");

    if (step === "role-selection" && social === "true" && email) {
      const storedRole = localStorage.getItem(
        "pending_social_auth_role"
      ) as UserRole;

      if (storedRole) {
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          completeSocialRegistration(storedRole, email);
        }, 0);
      } else {
        setTimeout(() => {
          setIsSocialAuth(true);
          setSocialEmail(email);
          setCurrentStep("role-selection");
        }, 0);
      }
    }
  }, [searchParams, completeSocialRegistration]);

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      // Check if user needs to verify email
      if (!user.isVerified) {
        router.push(
          "/auth/verify-email?email=" + encodeURIComponent(user.email)
        );
        return;
      }

      // Check if user needs onboarding
      if (!user.hasProfile) {
        router.push("/onboarding");
        return;
      }

      // Redirect to dashboard based on role
      if (user.role === "EMPLOYER") {
        router.push("/employer/dashboard");
      } else if (user.role === "JOB_SEEKER") {
        router.push("/job-seeker/dashboard");
      } else if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      }
    }
  }, [user, router]);

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);

    if (isSocialAuth && socialEmail) {
      try {
        const response = await apiClient.post<{ user: User }>(
          "/auth/complete-social-auth",
          {
            role,
            email: socialEmail,
          }
        );

        if (response.success && response.data) {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Social auth completion error:", error);
        alert("Failed to complete registration. Please try again.");
      }
    } else {
      setCurrentStep("register");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "role-selection":
        return (
          <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-blue-900/10 to-purple-900/10 dark:from-blue-900/20 dark:to-purple-900/20"></div>
              <Image
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000"
                alt="Professional background"
                fill
                className="object-cover opacity-5 dark:opacity-10"
              />
            </div>

            {/* Content */}
            <div className="relative z-20 w-full">
              <RoleSelection
                onRoleSelect={handleRoleSelect}
                selectedRole={selectedRole}
              />
            </div>

            {/* Decorative elements */}
            <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-400/20 dark:to-purple-400/20 blur-xl"></div>
            <div className="absolute bottom-20 left-10 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-purple-400/20 dark:to-pink-400/20 blur-xl"></div>
          </div>
        );

      case "register":
        return (
          <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Left side - Image */}
            <div className="relative hidden lg:flex lg:w-1/2">
              <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary-800/40 to-primary-900/60 dark:from-primary-900/70 dark:to-background/80"></div>
              <Image
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1000"
                alt="Professional background"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
                <div className="text-center text-white">
                  <h2 className="mb-4 text-4xl font-bold">
                    {selectedRole === "EMPLOYER"
                      ? "Build Your Dream Team"
                      : "Start Your Career Journey"}
                  </h2>
                  <p className="mb-8 text-xl opacity-90">
                    {selectedRole === "EMPLOYER"
                      ? "Connect with talented professionals and grow your business"
                      : "Discover opportunities that match your skills and aspirations"}
                  </p>
                  <div className="mx-auto h-1 w-24 rounded-full bg-white/60"></div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="flex w-full items-center justify-center p-4 lg:w-1/2 lg:p-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md rounded-2xl bg-card border border-border p-8 shadow-2xl backdrop-blur-sm"
              >
                <RegisterForm
                  role={selectedRole!}
                  onRegistrationSuccess={(email) => {
                    setPendingEmail(email);
                    setCurrentStep("verify-email");
                  }}
                  onSwitchToLogin={() => router.push("/auth/login")}
                />

                <div className="mt-6 border-t border-border pt-4">
                  <button
                    onClick={() => setCurrentStep("role-selection")}
                    className="flex w-full items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to role selection
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case "verify-email":
        return (
          <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl border border-border bg-card p-8 shadow-xl"
              >
                <EmailVerification
                  email={pendingEmail}
                  onVerificationSuccess={() => router.push("/auth/login")}
                  onSwitchToLogin={() => router.push("/auth/login")}
                />
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Header />
      {renderStep()}
      <Footer />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
