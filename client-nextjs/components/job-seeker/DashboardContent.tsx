"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  MdWork,
  MdBookmark,
  MdTrendingUp,
  MdVisibility,
  MdLocationOn,
} from "react-icons/md";

interface DashboardStats {
  totalJobs: number;
  savedJobs: number;
  applications: number;
  profileViews: number;
}

interface RecentJob {
  id: string;
  title: string;
  employer: {
    companyName: string;
    location?: string;
  };
  location: string;
  createdAt: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
}

export interface DashboardProps {
  stats: DashboardStats;
  recentJobs: RecentJob[];
  firstName: string;
}

export default function DashboardContent({ stats, recentJobs, firstName }: DashboardProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GH", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2"
          >
            Welcome back, {firstName || "User"}!
          </motion.h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Here&apos;s what&apos;s happening with your job search today.
          </p>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Available Jobs
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.totalJobs}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-secondary/20 rounded-lg flex items-center justify-center shrink-0">
                <MdWork className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Saved Jobs
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.savedJobs}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-secondary/20 rounded-lg flex items-center justify-center shrink-0">
                <MdBookmark className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Applications
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.applications}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-accent/50 rounded-lg flex items-center justify-center shrink-0">
                <MdTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Profile Views
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.profileViews}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <MdVisibility className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  Recent Job Postings
                </h2>
                <Link
                  href="/jobs"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View all jobs →
                </Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-2">
                        <h3 className="font-semibold text-foreground hover:text-primary text-sm sm:text-base line-clamp-1">
                          {job.title}
                        </h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(job.createdAt)}
                        </span>
                      </div>

                      <p className="text-muted-foreground text-xs sm:text-sm mb-2 line-clamp-1">
                        {job.employer.companyName}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MdLocationOn className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MdWork className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.jobType}</span>
                        </div>
                        {job.salaryMin && job.salaryMax && (
                          <div>
                            {formatCurrency(job.salaryMin)} -{" "}
                            {formatCurrency(job.salaryMax)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MdWork className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent jobs available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <Link
                  href="/jobs"
                  className="w-full border border-border hover:bg-muted/50 py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  Browse Jobs
                </Link>

                <Link
                  href="/job-seeker/saved-jobs"
                  className="w-full border border-border hover:bg-muted/50 py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  Saved Jobs
                </Link>

                <Link
                  href="/job-seeker/applications"
                  className="w-full border border-border hover:bg-muted/50 py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  My Applications
                </Link>

                <Link
                  href="/job-seeker/profile"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  Update Profile
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
