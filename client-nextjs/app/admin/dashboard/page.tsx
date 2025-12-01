"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MdDashboard,
  MdPeople,
  MdWork,
  MdAssignment,
  MdTrendingUp,
  MdPersonAdd,
  MdBusiness,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouteGuard } from "@/hooks/useRouteGuard";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeEmployers: number;
  activeJobSeekers: number;
  pendingApplications: number;
  pendingEmployerVerifications: number;
  pendingJobApprovals: number;
}

interface RecentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface RecentJob {
  id: string;
  title: string;
  location: string;
  employer: {
    user: {
      firstName?: string;
      lastName?: string;
    };
    companyName?: string;
  };
  _count: {
    applications: number;
  };
  createdAt: string;
  isActive: boolean;
}

interface DashboardData {
  stats: AdminStats;
  recentUsers: RecentUser[];
  recentJobs: RecentJob[];
}

export default function AdminDashboardPage() {
  const { user } = useRouteGuard({
    requireAuth: true,
    requireRole: "ADMIN",
  });

  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<DashboardData>("/admin/stats");

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-6 rounded-lg">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Users",
      value: data.stats?.totalUsers || 0,
      icon: MdPeople,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Total Jobs",
      value: data.stats?.totalJobs || 0,
      icon: MdWork,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Applications",
      value: data.stats?.totalApplications || 0,
      icon: MdAssignment,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Active Employers",
      value: data.stats?.activeEmployers || 0,
      icon: MdBusiness,
      color: "bg-orange-500",
      textColor: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Job Seekers",
      value: data.stats?.activeJobSeekers || 0,
      icon: MdPersonAdd,
      color: "bg-teal-500",
      textColor: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
    },
    {
      title: "Pending Apps",
      value: data.stats?.pendingApplications || 0,
      icon: MdTrendingUp,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      title: "Pending Verifications",
      value: data.stats?.pendingEmployerVerifications || 0,
      icon: MdCheckCircle,
      color: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
  ];

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MdDashboard className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage users, jobs, and monitor platform activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`}
                />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {stat.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              Recent Users
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/users")}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {data.recentUsers && data.recentUsers.length > 0 ? (
              data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <MdPeople className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "EMPLOYER"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                              : user.role === "JOB_SEEKER"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                          }`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                        {user.isActive ? (
                          <MdCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                        ) : (
                          <MdCancel className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MdPeople className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  No recent users
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              Recent Jobs
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/jobs")}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {data.recentJobs && data.recentJobs.length > 0 ? (
              data.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <MdWork className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {job.location}
                        </p>
                        <span className="text-muted-foreground hidden sm:inline">
                          •
                        </span>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {job.employer.companyName ||
                            `${job.employer.user.firstName} ${job.employer.user.lastName}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {job._count.applications} applications
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </p>
                      {job.isActive ? (
                        <MdCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      ) : (
                        <MdCancel className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MdWork className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  No recent jobs
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pending Employer Verifications Alert */}
      {data.stats && data.stats.pendingEmployerVerifications > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 sm:mt-8 bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-full flex items-center justify-center shrink-0">
                <MdBusiness className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Pending Employer Verifications
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {data.stats.pendingEmployerVerifications} employer
                  {data.stats.pendingEmployerVerifications !== 1
                    ? "s"
                    : ""}{" "}
                  waiting for verification
                </p>
              </div>
            </div>
            <Button onClick={() => router.push("/admin/employers")}>
              Review Employers
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
