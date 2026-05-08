"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { SocialLogin } from "./SocialLogin";
import { Button } from "@/components/ui/button";
import { signupSchema, type SignupInput } from "@/lib/validations";

type SignupRole = SignupInput["role"];

interface RegisterFormProps {
  role: SignupRole;
  onSwitchToLogin: () => void;
  onRegistrationSuccess: (email: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  role,
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const [error, setError] = useState("");
  const { register: authRegister, isLoading } = useAuth();

  // React Hook Form setup with Zod validation
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: role,
    },
    mode: "onChange", // Validate on change for better UX
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: SignupInput) => {
    setError("");

    try {
      await authRegister(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role,
      );
      onRegistrationSuccess(data.email);
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Create Your Account
        </h2>
        <p className="text-sm text-muted-foreground">
          {role === "EMPLOYER" ? "Join as an Employer" : "Join as a Job Seeker"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* General Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              {...register("firstName")}
              className={`w-full rounded-md border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.firstName
                  ? "border-red-500 focus:border-red-500"
                  : "border-border focus:border-primary"
              }`}
              disabled={isFormLoading}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              {...register("lastName")}
              className={`w-full rounded-md border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.lastName
                  ? "border-red-500 focus:border-red-500"
                  : "border-border focus:border-primary"
              }`}
              disabled={isFormLoading}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className={`w-full rounded-md border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
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
            type="password"
            id="password"
            {...register("password")}
            className={`w-full rounded-md border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.password
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-primary"
            }`}
            placeholder="Create a strong password"
            disabled={isFormLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            {...register("confirmPassword")}
            className={`w-full rounded-md border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.confirmPassword
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-primary"
            }`}
            placeholder="Confirm your password"
            disabled={isFormLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Hidden Role Field */}
        <input type="hidden" {...register("role")} value={role} />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isFormLoading}
          className="w-full"
          size="lg"
        >
          {isFormLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
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

      {/* Social Login Options */}
      <SocialLogin
        text="Sign up with"
        selectedRole={role}
        disabled={isFormLoading}
      />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:text-primary/80 disabled:opacity-50"
            disabled={isFormLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
