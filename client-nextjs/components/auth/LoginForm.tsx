"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { SocialLogin } from "./SocialLogin";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/lib/validations";

interface LoginFormProps {
  onSwitchToForgotPassword: () => void;
  onVerificationRequired?: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToForgotPassword,
  onVerificationRequired,
}) => {
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  // React Hook Form setup with Zod validation
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Validate on change for better UX
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = form;

  const onSubmit = async (data: LoginInput) => {
    setError("");

    try {
      await login(data.email, data.password);
    } catch (err) {
      const errorMessage = (err as Error).message || "Login failed";

      // Check if the error is about email verification
      if (
        errorMessage.toLowerCase().includes("verify") ||
        errorMessage.toLowerCase().includes("verification")
      ) {
        if (onVerificationRequired) {
          onVerificationRequired(data.email);
        } else {
          setError(
            "Please verify your email address before logging in. Check your inbox for the verification link.",
          );
        }
      } else {
        setError(errorMessage);
      }
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* General Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={`w-full rounded-md border bg-background px-3 py-2 text-foreground placeholder-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.email
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-primary"
            }`}
            placeholder="Enter your email"
            disabled={isFormLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`w-full rounded-md border bg-background px-3 py-2 text-foreground placeholder-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.password
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-primary"
            }`}
            placeholder="Enter your password"
            disabled={isFormLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
            disabled={isFormLoading}
          >
            Forgot your password?
          </button>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isFormLoading} className="w-full">
          {isFormLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <SocialLogin disabled={isFormLoading} />
    </div>
  );
};
