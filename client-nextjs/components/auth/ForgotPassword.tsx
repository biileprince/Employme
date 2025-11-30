"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiMail, HiArrowLeft } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onSwitchToReset: (email: string) => void;
}

export function ForgotPassword({
  onBackToLogin,
  onSwitchToReset,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      await forgotPassword(email);
      setMessage(
        "If an account with that email exists, we have sent a password reset code to your email."
      );

      // Wait a moment to let user read the message, then switch to reset form
      setTimeout(() => {
        onSwitchToReset(email);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
          Forgot Password?
        </h2>
        <p className="text-muted-foreground">
          No worries! Enter your email and we'll send you a reset code.
        </p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiMail className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{message}</p>
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
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <HiMail className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-foreground placeholder-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email address"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!email || isLoading}
        >
          {isLoading ? "Sending Reset Code..." : "Send Reset Code"}
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
