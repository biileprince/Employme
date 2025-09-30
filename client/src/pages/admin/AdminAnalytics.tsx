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
import { adminAPI } from "../../services/api";
import Button from "../../components/ui/Button";

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

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getStats();

      if (response.success) {
        setData(response.data as AnalyticsData);
      } else {
        throw new Error(response.message || "Failed to fetch analytics");
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
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "reviewed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "shortlisted":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "hired":
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
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
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-muted-foreground">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <p className="text-red-600 mb-4">{error}</p>
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
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MdAnalytics className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground">
                Detailed insights and analytics for the platform
              </p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} variant="outline">
            <MdRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {data.stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdPeople className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
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
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Jobs</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.stats.totalJobs.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MdWork className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1 text-sm">
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
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Applications
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {data.stats.totalApplications.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MdAssignment className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1 text-sm">
                <MdPending className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {data.stats.pendingApplications} Pending
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <MdBarChart className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
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
                        <span className="font-medium capitalize">
                          {status.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
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
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <MdPeople className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Recent Users
              </h3>
            </div>
            <div className="space-y-4">
              {data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {user.role === "EMPLOYER" ? (
                        <MdBusiness className="w-4 h-4 text-primary" />
                      ) : (
                        <MdPerson className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs px-2 py-1 rounded-full border ${
                        user.role === "EMPLOYER"
                          ? "text-blue-600 bg-blue-50 border-blue-200"
                          : "text-green-600 bg-green-50 border-green-200"
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
            className="bg-card border border-border rounded-xl p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-6">
              <MdWork className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Recent Job Postings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <div className="space-y-4">
                {data.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MdWork className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1 truncate">
                          {job.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          {job.employer.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <MdAssignment className="w-4 h-4 text-blue-500" />
                        <span className="text-muted-foreground">
                          {job._count.applications} applications
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MdCalendarToday className="w-3 h-3" />
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs border ${
                          job.isActive
                            ? "text-green-600 bg-green-50 border-green-200"
                            : "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
