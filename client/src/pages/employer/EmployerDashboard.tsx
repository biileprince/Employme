import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MdWork,
  MdCheckCircle,
  MdDescription,
  MdAdd,
  MdAccessTime,
  MdPeople,
  MdAssignment,
  MdSearch,
  MdBarChart,
  MdLightbulb,
} from "react-icons/md";
import { jobsAPI, userAPI, applicationsAPI } from "../../services/api";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalCandidates: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  applicationsCount: number;
  createdAt: string;
}

interface RecentApplication {
  id: string;
  applicantName: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalCandidates: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentApplications, setRecentApplications] = useState<
    RecentApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel
      const [jobsResponse, candidatesResponse] = await Promise.all([
        jobsAPI.getMyJobs(),
        userAPI.getCandidates(),
      ]);

      // Extract data from API responses
      const jobsData = jobsResponse.data as { jobs?: RecentJob[] };
      const jobs = jobsData.jobs || [];
      const candidates = candidatesResponse.data as { length: number }[];

      // Calculate stats
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter((job) => job.status === "ACTIVE").length;

      // Get recent jobs (last 5)
      const sortedJobs = jobs
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      // Calculate application stats
      let totalApplications = 0;
      let pendingApplications = 0;

      // For now, we'll use mock data for applications since we need to fetch from multiple jobs
      // In a real implementation, you'd have a dashboard API endpoint that aggregates this data
      totalApplications = jobs.reduce(
        (sum, job) => sum + (job.applicationsCount || 0),
        0
      );
      pendingApplications = Math.floor(totalApplications * 0.6); // Mock data

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        totalCandidates: candidates.length,
      });

      setRecentJobs(sortedJobs);

      // Fetch recent applications
      try {
        const applicationsResponse =
          await applicationsAPI.getEmployerApplications();
        if (applicationsResponse.success && applicationsResponse.data) {
          const data = applicationsResponse.data as {
            applications: Array<{
              id: string;
              status: string;
              appliedAt?: string;
              createdAt?: string;
              jobSeeker?: {
                firstName?: string;
                lastName?: string;
                user?: {
                  firstName?: string;
                  lastName?: string;
                  email?: string;
                };
              };
              job?: { title?: string };
            }>;
          };
          const applications = data.applications || [];
          // Get the 5 most recent applications
          const recentApps = applications.slice(0, 5).map((app) => {
            const firstName =
              app.jobSeeker?.firstName || app.jobSeeker?.user?.firstName || "";
            const lastName =
              app.jobSeeker?.lastName || app.jobSeeker?.user?.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim();

            return {
              id: app.id,
              applicantName: fullName || "Unknown Applicant",
              jobTitle: app.job?.title || "Unknown Job",
              status: app.status,
              appliedAt:
                app.appliedAt || app.createdAt || new Date().toISOString(),
            };
          });
          setRecentApplications(recentApps);
        }
      } catch (err) {
        console.error("Failed to fetch applications:", err);
        // Fallback to empty array on error
        setRecentApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-success bg-success/10 border-success/20";
      case "PAUSED":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/10 dark:border-yellow-800/20";
      case "CLOSED":
        return "text-muted-foreground bg-muted/50 border-border";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/10 dark:border-yellow-800/20";
      case "REVIEWING":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/10 dark:border-blue-800/20";
      case "ACCEPTED":
        return "text-success bg-success/10 border-success/20";
      case "REJECTED":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your hiring activity.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalJobs}
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MdWork className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Jobs
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.activeJobs}
              </p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <MdCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Applications
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalApplications}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <MdDescription className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.pendingApplications}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <MdAccessTime className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Candidates
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalCandidates}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <MdPeople className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/employer/post-job"
            className="flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors group"
          >
            <MdAdd className="w-5 h-5" />
            <span className="font-medium ml-2">Post New Job</span>
          </Link>

          <Link
            to="/employer/applications"
            className="flex items-center justify-center p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors group"
          >
            <MdAssignment className="w-5 h-5" />
            <span className="font-medium ml-2">Review Applications</span>
          </Link>

          <Link
            to="/employer/candidates"
            className="flex items-center justify-center p-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors group"
          >
            <MdSearch className="w-5 h-5" />
            <span className="font-medium ml-2">Find Candidates</span>
          </Link>

          <Link
            to="/employer/my-jobs"
            className="flex items-center justify-center p-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <MdBarChart className="w-5 h-5" />
            <span className="font-medium ml-2">Manage Jobs</span>
          </Link>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Jobs
            </h2>
            <Link
              to="/employer/my-jobs"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  No jobs posted yet
                </div>
                <Link
                  to="/employer/post-job"
                  className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block"
                >
                  Post your first job →
                </Link>
              </div>
            ) : (
              recentJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {job.applicationsCount || 0} applications
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Applications
            </h2>
            <Link
              to="/employer/applications"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {recentApplications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  No applications yet
                </div>
              </div>
            ) : (
              recentApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {application.applicantName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground text-sm">
                        {application.jobTitle}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-border rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <MdLightbulb className="w-6 h-6 text-blue-600" />
          <span className="ml-2">Hiring Tips</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">
              Optimize Your Job Posts
            </h3>
            <p className="text-sm text-muted-foreground">
              Include clear requirements, competitive salary ranges, and company
              benefits to attract quality candidates.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Quick Response Time</h3>
            <p className="text-sm text-muted-foreground">
              Respond to applications within 2-3 days to maintain candidate
              interest and improve your employer brand.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
