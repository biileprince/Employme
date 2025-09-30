import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBriefcase,
  FiBookmark,
  FiTrendingUp,
  FiEye,
  FiMapPin,
} from "react-icons/fi";
import {
  userAPI,
  jobsAPI,
  applicationsAPI,
  savedJobsAPI,
} from "../../services/api";

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

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  role: string;
  profile?: Record<string, unknown>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface JobsApiResponse {
  jobs: RecentJob[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

interface ApplicationsApiResponse {
  applications: unknown[];
}

interface SavedJobsApiResponse {
  savedJobs: unknown[];
}

interface UserApiResponse {
  user: UserProfile;
}

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    savedJobs: 0,
    applications: 0,
    profileViews: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          profileResponse,
          jobsResponse,
          applicationsResponse,
          savedJobsResponse,
        ] = await Promise.all([
          userAPI.me().catch((err) => {
            console.warn("Failed to fetch user profile:", err);
            return null;
          }),
          jobsAPI.getAll({ limit: 5 }).catch((err) => {
            console.warn("Failed to fetch recent jobs:", err);
            return { data: { jobs: [], pagination: { total: 0 } } };
          }),
          applicationsAPI.getMyApplications().catch((err) => {
            console.warn("Failed to fetch applications:", err);
            return { data: { applications: [] } };
          }),
          savedJobsAPI.getSavedJobs().catch((err) => {
            console.warn("Failed to fetch saved jobs:", err);
            return { data: { savedJobs: [] } };
          }),
        ]);

        // Update user profile
        if (profileResponse) {
          setUserProfile(
            (profileResponse as ApiResponse<UserApiResponse>).data.user
          );
        } else {
          // Use auth user data as fallback
          setUserProfile({
            id: user.id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: "JOB_SEEKER",
          });
        }

        // Update recent jobs
        setRecentJobs(
          (jobsResponse as ApiResponse<JobsApiResponse>).data.jobs || []
        );

        // Update stats with real data
        setStats({
          totalJobs:
            (jobsResponse as ApiResponse<JobsApiResponse>).data.pagination
              ?.total || 0,
          savedJobs:
            (savedJobsResponse as ApiResponse<SavedJobsApiResponse>).data
              .savedJobs?.length || 0,
          applications:
            (applicationsResponse as ApiResponse<ApplicationsApiResponse>).data
              .applications?.length || 0,
          profileViews: 0, // This would need a dedicated API endpoint
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && user) {
      fetchDashboardData();
    }
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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
            Welcome back, {userProfile?.firstName || user?.firstName || "User"}!
          </motion.h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Here's what's happening with your job search today.
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiBriefcase className="h-6 w-6 text-secondary" />
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiBookmark className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-accent/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <FiEye className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
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
                  to="/jobs"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View all jobs →
                </Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-2">
                      <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer text-sm sm:text-base line-clamp-1">
                        {job.title}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(job.createdAt)}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs sm:text-sm mb-2 line-clamp-1">
                      {job.employer.companyName}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FiMapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiBriefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.jobType}</span>
                      </div>
                      {job.salaryMin && job.salaryMax && (
                        <div>
                          {formatCurrency(job.salaryMin)} -{" "}
                          {formatCurrency(job.salaryMax)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                  to="/jobs"
                  className="w-full border border-border hover:bg-muted/50 py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  Browse Jobs
                </Link>

                <Link
                  to="/job-seeker/saved-jobs"
                  className="w-full border border-border hover:bg-muted/50 py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  Saved Jobs
                </Link>

                <Link
                  to="/job-seeker/applications"
                  className="w-full border border-border hover:bg-muted/50 py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  My Applications
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
