"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { EmailVerification } from "@/components/auth/EmailVerification";
import { ForgotPassword } from "@/components/auth/ForgotPassword";
import { ResetPassword } from "@/components/auth/ResetPassword";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import Link from "next/link";
import Image from "next/image";

type LoginStep =
  | "login"
  | "verify-email"
  | "forgot-password"
  | "reset-password";

function LoginContent() {
  const [currentStep, setCurrentStep] = useState<LoginStep>("login");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [resetEmail, setResetEmail] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error) {
      console.error("OAuth error:", error, message);

      let errorMessage = "Authentication failed. Please try again.";

      if (error === "oauth_error" || error === "oauth_failed") {
        if (message) {
          errorMessage = decodeURIComponent(message);
        }
      }

      alert(`Social login failed: ${errorMessage}`);

      // Clean up URL
      router.replace("/auth/login");
    }
  }, [searchParams, router]);

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

  const handleVerificationRequired = (email: string) => {
    setPendingEmail(email);
    setCurrentStep("verify-email");
  };

  const renderStep = () => {
    switch (currentStep) {
      case "login":
        return (
          <div className="flex min-h-screen">
            {/* Left side - Image */}
            <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
              <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary-600/90 via-primary-700/90 to-primary-800/90" />
              <Image
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000"
                alt="Professional woman with laptop"
                fill
                className="object-cover"
              />
              <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="mb-6 text-4xl font-bold">
                    Welcome back to Employ.me
                  </h1>
                  <p className="mb-8 text-xl text-primary-100">
                    Continue your journey to find the perfect job or hire the
                    best talent in Ghana.
                  </p>
                  <div className="space-y-4 text-primary-100">
                    <div className="flex items-center">
                      <div className="mr-3 h-2 w-2 rounded-full bg-secondary-400" />
                      <span>Access thousands of job opportunities</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-3 h-2 w-2 rounded-full bg-secondary-400" />
                      <span>Connect with top employers</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-3 h-2 w-2 rounded-full bg-secondary-400" />
                      <span>Manage your applications</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex flex-1 items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
              <div className="w-full max-w-md space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <h2 className="mb-2 text-3xl font-bold text-foreground">
                    Welcome back
                  </h2>
                  <p className="text-muted-foreground">
                    Sign in to your account to continue
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="rounded-2xl border border-border bg-card p-8 shadow-xl"
                  style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                >
                  <LoginForm
                    onSwitchToForgotPassword={() =>
                      setCurrentStep("forgot-password")
                    }
                    onVerificationRequired={handleVerificationRequired}
                  />

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/auth/signup"
                        className="font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        Create account
                      </Link>
                    </p>
                  </div>
                </motion.div>
              </div>
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
                  onVerificationSuccess={() => setCurrentStep("login")}
                  onSwitchToLogin={() => setCurrentStep("login")}
                />
              </motion.div>
            </div>
          </div>
        );

      case "forgot-password":
        return (
          <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl border border-border bg-card p-8 shadow-xl"
              >
                <ForgotPassword
                  onBackToLogin={() => setCurrentStep("login")}
                  onSwitchToReset={(email) => {
                    setResetEmail(email);
                    setCurrentStep("reset-password");
                  }}
                />
              </motion.div>
            </div>
          </div>
        );

      case "reset-password":
        return (
          <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl border border-border bg-card p-8 shadow-xl"
              >
                <ResetPassword
                  email={resetEmail}
                  onBackToLogin={() => setCurrentStep("login")}
                  onResetSuccess={() => setCurrentStep("login")}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

