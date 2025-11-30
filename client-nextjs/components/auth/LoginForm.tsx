"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SocialLogin } from "./SocialLogin";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  onSwitchToForgotPassword: () => void;
  onVerificationRequired?: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToForgotPassword,
  onVerificationRequired,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      const errorMessage = (err as Error).message || "Login failed";

      // Check if the error is about email verification
      if (
        errorMessage.toLowerCase().includes("verify") ||
        errorMessage.toLowerCase().includes("verification")
      ) {
        if (onVerificationRequired) {
          onVerificationRequired(email);
        } else {
          setError(
            "Please verify your email address before logging in. Check your inbox for the verification link."
          );
        }
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your email"
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
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-primary hover:text-primary/80"
          >
            Forgot your password?
          </button>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Social Login Options */}
      <SocialLogin text="Sign in with" />
    </div>
  );
};
