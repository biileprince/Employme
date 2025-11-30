"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";
import { SocialLogin } from "./SocialLogin";
import { Button } from "@/components/ui/button";

interface RegisterFormProps {
  role: UserRole;
  onSwitchToLogin: () => void;
  onRegistrationSuccess: (email: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  role,
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: role,
  });
  const [error, setError] = useState("");
  const { register, isLoading } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.role
      );
      onRegistrationSuccess(formData.email);
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            minLength={6}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            minLength={6}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {/* Social Login Options */}
      <SocialLogin text="Sign up with" selectedRole={role} />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
