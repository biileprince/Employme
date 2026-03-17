"use client";

import { motion } from "framer-motion";
import { HiBriefcase, HiUserGroup, HiArrowRight } from "react-icons/hi";
import type { UserRole } from "@/types/auth";

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({
  onRoleSelect,
  selectedRole,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Join Employ.me
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose how you want to get started
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Job Seeker Card */}
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRoleSelect("JOB_SEEKER")}
            className={`group relative overflow-hidden rounded-2xl border-2 bg-card p-8 text-left transition-all duration-300 ${
              selectedRole === "JOB_SEEKER"
                ? "border-primary shadow-xl shadow-primary/20"
                : "border-border hover:border-primary/50 hover:shadow-lg"
            }`}
          >
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl transition-opacity group-hover:opacity-100" />

            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HiUserGroup className="h-8 w-8" />
              </div>

              <h3 className="mb-3 text-2xl font-bold text-foreground">
                I&apos;m looking for a job
              </h3>

              <p className="mb-6 text-muted-foreground">
                Find your dream job from thousands of opportunities across Ghana
              </p>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Browse job listings
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Apply to multiple jobs
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Track your applications
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Build your profile
                </li>
              </ul>

              {/* Action Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-8"
              >
                <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl group">
                  I&apos;m looking for a job
                  <HiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>

              {selectedRole === "JOB_SEEKER" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-lg bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary"
                >
                  Selected ✓
                </motion.div>
              )}
            </div>
          </motion.button>

          {/* Employer Card */}
          <motion.button
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRoleSelect("EMPLOYER")}
            className={`group relative overflow-hidden rounded-2xl border-2 bg-card p-8 text-left transition-all duration-300 ${
              selectedRole === "EMPLOYER"
                ? "border-primary shadow-xl shadow-primary/20"
                : "border-border hover:border-primary/50 hover:shadow-lg"
            }`}
          >
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl transition-opacity group-hover:opacity-100" />

            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <HiBriefcase className="h-8 w-8" />
              </div>

              <h3 className="mb-3 text-2xl font-bold text-foreground">
                I&apos;m hiring talent
              </h3>

              <p className="mb-6 text-muted-foreground">
                Post jobs and find the perfect candidates for your company
              </p>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Post unlimited jobs
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Review applications
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Manage candidates
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Build company profile
                </li>
              </ul>

              {/* Action Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-8"
              >
                <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-secondary-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl group">
                  I&apos;m hiring talent
                  <HiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>

              {selectedRole === "EMPLOYER" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-lg bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary"
                >
                  Selected ✓
                </motion.div>
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
