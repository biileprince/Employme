import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { jobsAPI, userAPI } from '../../services/api';

// Icon components (using simple SVG icons for consistency)
const BriefcaseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25A8.966 8.966 0 0118 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LightBulbIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

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
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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
      const activeJobs = jobs.filter(job => job.status === 'ACTIVE').length;
      
      // Get recent jobs (last 5)
      const sortedJobs = jobs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Calculate application stats
      let totalApplications = 0;
      let pendingApplications = 0;

      // For now, we'll use mock data for applications since we need to fetch from multiple jobs
      // In a real implementation, you'd have a dashboard API endpoint that aggregates this data
      totalApplications = jobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
      pendingApplications = Math.floor(totalApplications * 0.6); // Mock data

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        totalCandidates: candidates.length,
      });

      setRecentJobs(sortedJobs);
      // For demo, create some mock recent applications
      setRecentApplications([
        {
          id: '1',
          applicantName: 'John Doe',
          jobTitle: 'Software Engineer',
          status: 'PENDING',
          appliedAt: new Date().toISOString(),
        },
        {
          id: '2',
          applicantName: 'Jane Smith',
          jobTitle: 'Product Manager',
          status: 'REVIEWING',
          appliedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          applicantName: 'Mike Johnson',
          jobTitle: 'UX Designer',
          status: 'ACCEPTED',
          appliedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-success bg-success/10 border-success/20';
      case 'PAUSED': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/10 dark:border-yellow-800/20';
      case 'CLOSED': return 'text-muted-foreground bg-muted/50 border-border';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/10 dark:border-yellow-800/20';
      case 'REVIEWING': return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/10 dark:border-blue-800/20';
      case 'ACCEPTED': return 'text-success bg-success/10 border-success/20';
      case 'REJECTED': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted/50 border-border';
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
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard
        </h1>
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
              <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalJobs}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BriefcaseIcon />
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
              <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircleIcon />
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
              <p className="text-sm font-medium text-muted-foreground">Applications</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <DocumentIcon />
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
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{stats.pendingApplications}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <ClockIcon />
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
              <p className="text-sm font-medium text-muted-foreground">Candidates</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCandidates}</p>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <UsersIcon />
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
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/employer/post-job"
            className="flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors group"
          >
            <PlusIcon />
            <span className="font-medium ml-2">Post New Job</span>
          </Link>

          <Link
            to="/employer/applications"
            className="flex items-center justify-center p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors group"
          >
            <ClipboardIcon />
            <span className="font-medium ml-2">Review Applications</span>
          </Link>

          <Link
            to="/employer/candidates"
            className="flex items-center justify-center p-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors group"
          >
            <SearchIcon />
            <span className="font-medium ml-2">Find Candidates</span>
          </Link>

          <Link
            to="/employer/my-jobs"
            className="flex items-center justify-center p-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <ChartIcon />
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
            <h2 className="text-xl font-semibold text-foreground">Recent Jobs</h2>
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
                <div className="text-muted-foreground text-sm">No jobs posted yet</div>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
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
            <h2 className="text-xl font-semibold text-foreground">Recent Applications</h2>
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
                <div className="text-muted-foreground text-sm">No applications yet</div>
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
                    <h3 className="font-medium text-foreground">{application.applicantName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground text-sm">{application.jobTitle}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
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
          <LightBulbIcon />
          <span className="ml-2">Hiring Tips</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Optimize Your Job Posts</h3>
            <p className="text-sm text-muted-foreground">
              Include clear requirements, competitive salary ranges, and company benefits to attract quality candidates.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Quick Response Time</h3>
            <p className="text-sm text-muted-foreground">
              Respond to applications within 2-3 days to maintain candidate interest and improve your employer brand.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
