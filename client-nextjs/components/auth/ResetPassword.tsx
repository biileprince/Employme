"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiLockClosed, HiEye, HiEyeOff, HiArrowLeft } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface ResetPasswordProps {
  email: string;
  onBackToLogin: () => void;
  onResetSuccess: () => void;
}

export function ResetPassword({
  email,
  onBackToLogin,
  onResetSuccess,
}: ResetPasswordProps) {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword(code, newPassword);
      setError("");
      setIsSuccess(true);
      // Redirect to login after showing success message
      setTimeout(() => {
        onResetSuccess();
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCodeInput = (value: string) => {
    // Remove all non-numeric characters and limit to 6 digits
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    return cleaned;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-foreground">
          Reset Password
        </h2>
        <p className="text-muted-foreground">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium">{email}</span> and your new password.
        </p>
      </div>

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiLockClosed className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Password reset successfully! Redirecting to login...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="code"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Reset Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(formatCodeInput(e.target.value))}
            className="block w-full rounded-lg border border-border bg-background px-3 py-3 text-center text-2xl font-mono tracking-widest text-foreground placeholder-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="000000"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the 6-digit code from your email
          </p>
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <HiLockClosed className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-foreground placeholder-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter new password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <HiEyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              ) : (
                <HiEye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <HiLockClosed className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-foreground placeholder-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm new password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <HiEyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              ) : (
                <HiEye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={
            !code || !newPassword || !confirmPassword || isLoading || isSuccess
          }
        >
          {isSuccess
            ? "Password Reset Successfully!"
            : isLoading
            ? "Resetting Password..."
            : "Reset Password"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <HiArrowLeft className="mr-1 h-4 w-4" />
            Back to Sign In
          </button>
        </div>
      </form>
    </motion.div>
  );
}
