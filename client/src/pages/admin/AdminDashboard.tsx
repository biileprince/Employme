import { useState, useEffect } from "react";
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
import { adminAPI } from "../../services/api";
import Button from "../../components/ui/Button";

interface AdminStats {
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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getStats();

      if (response.success) {
        setData(response.data as DashboardData);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      textColor: "text-blue-600",
    },
    {
      title: "Total Jobs",
      value: data.stats?.totalJobs || 0,
      icon: MdWork,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Applications",
      value: data.stats?.totalApplications || 0,
      icon: MdAssignment,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      title: "Active Employers",
      value: data.stats?.activeEmployers || 0,
      icon: MdBusiness,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
    {
      title: "Job Seekers",
      value: data.stats?.activeJobSeekers || 0,
      icon: MdPersonAdd,
      color: "bg-teal-500",
      textColor: "text-teal-600",
    },
    {
      title: "Pending Apps",
      value: data.stats?.pendingApplications || 0,
      icon: MdTrendingUp,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MdDashboard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage users, jobs, and monitor platform activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${stat.color.replace(
                    "500",
                    "100"
                  )}`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Recent Users
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {data.recentUsers && data.recentUsers.length > 0 ? (
                data.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MdPeople className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.role === "EMPLOYER"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : user.role === "JOB_SEEKER"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            }`}
                          >
                            {user.role.replace("_", " ")}
                          </span>
                          {user.isActive ? (
                            <MdCheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <MdCancel className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MdPeople className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent users</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Recent Jobs
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {data.recentJobs && data.recentJobs.length > 0 ? (
                data.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MdWork className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {job.location}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm text-muted-foreground">
                            {job.employer.companyName ||
                              `${job.employer.user.firstName} ${job.employer.user.lastName}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {job._count.applications} applications
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(job.createdAt)}
                        </p>
                        {job.isActive ? (
                          <MdCheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <MdCancel className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MdWork className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent jobs</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
