"use client";

import { motion } from "framer-motion";
import {
  X,
  Bookmark,
  FileText,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "save" | "apply";
}

export default function AuthModal({ isOpen, onClose, action }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card rounded-2xl border-2 border-border shadow-2xl w-full max-w-md my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-border bg-muted/30">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Authentication Required
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Icon and Message */}
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              {action === "save" ? (
                <Bookmark className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              ) : (
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {action === "save" ? "Save Jobs for Later" : "Apply for This Job"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {action === "save"
                ? "Sign in to save jobs and access them anytime from your dashboard."
                : "Sign in to apply for this job and track your application status."}
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-muted/30 dark:bg-muted/20 border-2 border-border rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">
              Why create an account?
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>Save jobs and access them from any device</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>Track application status and interview schedules</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>Get personalized job recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>One-click apply with your saved profile</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm sm:text-base"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Link>
          </div>

          {/* Close Option */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Continue browsing jobs
          </button>
        </div>
      </motion.div>
    </div>
  );
}
