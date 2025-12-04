"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdAnalytics,
  MdPeople,
  MdWork,
  MdAssignment,
  MdBusiness,
  MdPerson,
  MdPending,
  MdCheckCircle,
  MdCancel,
  MdStar,
  MdRefresh,
  MdInsights,
  MdBarChart,
  MdCalendarToday,
} from "react-icons/md";
import { adminAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouteGuard } from "@/hooks/useRouteGuard";

interface SystemStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeEmployers: number;
  activeJobSeekers: number;
  pendingApplications: number;
}

interface RecentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface RecentJob {
  id: string;
  title: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  employer: {
    companyName: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  _count: {
    applications: number;
  };
}

interface AnalyticsData {
  stats: SystemStats;
  recentUsers: RecentUser[];
  recentJobs: RecentJob[];
  applicationsByStatus: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  useRouteGuard();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getStats();

      if (response.success && response.data) {
        setData(response.data as AnalyticsData);
      } else {
        throw new Error("Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200";
      case "reviewed":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200";
      case "shortlisted":
        return "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200";
      case "hired":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <MdPending className="w-4 h-4" />;
      case "reviewed":
        return <MdInsights className="w-4 h-4" />;
      case "shortlisted":
        return <MdStar className="w-4 h-4" />;
      case "hired":
        return <MdCheckCircle className="w-4 h-4" />;
      case "rejected":
        return <MdCancel className="w-4 h-4" />;
      default:
        return <MdAssignment className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg text-center">
          <p className="text-red-600 dark:text-red-200 mb-4">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            <MdRefresh className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MdAnalytics className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Analytics & Reports
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Detailed insights and analytics for the platform
              </p>
            </div>
          </div>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <MdRefresh
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Total Users
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {data.stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <MdPeople className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <MdBusiness className="w-4 h-4 text-blue-500" />
                <span className="text-muted-foreground">
                  {data.stats.activeEmployers} Employers
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MdPerson className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">
                  {data.stats.activeJobSeekers} Job Seekers
                </span>
              </div>
            </div>
          </motion.div>

          {/* Total Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Total Jobs
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {data.stats.totalJobs.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <MdWork className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  Active job postings
                </span>
              </div>
            </div>
          </motion.div>

          {/* Total Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Total Applications
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {data.stats.totalApplications.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <MdAssignment className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <MdPending className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {data.stats.pendingApplications} Pending
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Application Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <MdBarChart className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Application Status Breakdown
              </h3>
            </div>
            <div className="space-y-3">
              {Object.entries(data.applicationsByStatus).map(
                ([status, count]) => {
                  const percentage =
                    data.stats.totalApplications > 0
                      ? ((count / data.stats.totalApplications) * 100).toFixed(
                          1
                        )
                      : "0";

                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm sm:text-base font-medium capitalize">
                          {status.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {percentage}%
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${getApplicationStatusColor(
                            status
                          )}`}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <MdPeople className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Recent Users
              </h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {user.role === "EMPLOYER" ? (
                        <MdBusiness className="w-4 h-4 text-primary" />
                      ) : (
                        <MdPerson className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${
                        user.role === "EMPLOYER"
                          ? "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200"
                          : "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-200"
                      }`}
                    >
                      {user.role === "EMPLOYER" ? "Employer" : "Job Seeker"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <MdWork className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Recent Job Postings
              </h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {data.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <MdWork className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-medium text-foreground mb-1 truncate">
                        {job.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">
                        {job.employer.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <MdAssignment className="w-4 h-4 text-blue-500" />
                      <span className="text-muted-foreground">
                        {job._count.applications} applications
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MdCalendarToday className="w-3 h-3" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs border ${
                        job.isActive
                          ? "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-200"
                          : "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200"
                      }`}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
