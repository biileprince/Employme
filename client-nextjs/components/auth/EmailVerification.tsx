"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationSuccess,
  onSwitchToLogin,
}) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);
  const { verifyEmail, resendVerificationCode, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      await verifyEmail(code);
      setSuccess(
        "Email verified successfully! Redirecting to your dashboard...",
      );
      setTimeout(() => {
        onVerificationSuccess();
      }, 2000);
    } catch (err) {
      setError((err as Error).message || "Verification failed");
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      await resendVerificationCode(email);
      setSuccess("Verification code sent! Please check your email.");
    } catch (err) {
      setError((err as Error).message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent a 6-digit verification code to:
        </p>
        <p className="font-medium text-primary">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <div>
          <label
            htmlFor="code"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => {
              // Only allow numbers and limit to 6 digits
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
            }}
            maxLength={6}
            placeholder="000000"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-2xl font-mono tracking-widest text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full"
          size="lg"
        >
          {isLoading && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          )}
          {isLoading ? "Verifying..." : "Verify Email"}
        </Button>
      </form>

      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?
        </p>
        <button
          onClick={handleResendCode}
          disabled={isResending}
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-primary/50"
        >
          {isResending && (
            <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent"></div>
          )}
          {isResending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};
