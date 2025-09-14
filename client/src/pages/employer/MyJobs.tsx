import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdLocationOn, 
  MdWork, 
  MdPeople, 
  MdCalendarToday,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdAdd,
  MdAccessTime
} from 'react-icons/md';
import { jobsAPI } from '../../services/api';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  status: 'ACTIVE' | 'CLOSED'; // Simplified to match database schema
  applicationsCount: number;
  createdAt: string;
  applicationDeadline?: string;
}

export default function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getMyJobs();
      const data = response.data as { jobs: Job[] };
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await jobsAPI.updateJobStatus(jobId, newStatus);
      await fetchJobs(); // Refresh the list
    } catch (err) {
      console.error('Failed to update job status:', err);
      setError('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await jobsAPI.deleteJob(jobId);
        await fetchJobs(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete job:', err);
        setError('Failed to delete job');
      }
    }
  };

  const filteredJobs = jobs.filter(job => filter === 'ALL' || job.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700';
      case 'CLOSED': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700';
      default: return 'bg-muted text-muted-foreground border border-border';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">My Job Postings</h1>
        <Link
          to="/employer/post-job"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <MdAdd className="w-5 h-5" />
          Post New Job
        </Link>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'ACTIVE', 'CLOSED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as 'ALL' | 'ACTIVE' | 'CLOSED')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {status}
            {status !== 'ALL' && (
              <span className="bg-background/20 rounded-full px-2 py-0.5 text-xs font-semibold">
                {jobs.filter(job => job.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-muted-foreground text-lg mb-4">
              {filter === 'ALL' ? 'No job postings yet' : `No ${filter.toLowerCase()} jobs`}
            </div>
            <Link
              to="/employer/post-job"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create your first job posting
            </Link>
          </motion.div>
        ) : (
          filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/20"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center text-muted-foreground text-sm gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <MdLocationOn className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdWork className="w-4 h-4" />
                      <span>{job.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdPeople className="w-4 h-4" />
                      <span>{job.applicationsCount} applications</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center text-muted-foreground text-sm gap-4">
                    <div className="flex items-center gap-1">
                      <MdCalendarToday className="w-4 h-4" />
                      <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    {job.applicationDeadline && (
                      <div className="flex items-center gap-1">
                        <MdAccessTime className="w-4 h-4" />
                        <span>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 ml-6">
                  {/* Status Toggle */}
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                  </select>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <MdVisibility className="w-4 h-4" />
                      View Details
                    </Link>
                    
                    <Link
                      to={`/employer/jobs/${job.id}/applications`}
                      className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <MdPeople className="w-4 h-4" />
                      Applications ({job.applicationsCount})
                    </Link>
                    
                    <Link
                      to={`/employer/jobs/${job.id}/edit`}
                      className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <MdEdit className="w-4 h-4" />
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <MdDelete className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary">{jobs.length}</div>
            <div className="text-muted-foreground text-sm font-medium mt-1">Total Jobs</div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {jobs.filter(j => j.status === 'ACTIVE').length}
            </div>
            <div className="text-muted-foreground text-sm font-medium mt-1">Active Jobs</div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {jobs.reduce((sum, job) => sum + job.applicationsCount, 0)}
            </div>
            <div className="text-muted-foreground text-sm font-medium mt-1">Total Applications</div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {(jobs.reduce((sum, job) => sum + job.applicationsCount, 0) / Math.max(jobs.filter(j => j.status === 'ACTIVE').length, 1)).toFixed(1)}
            </div>
            <div className="text-muted-foreground text-sm font-medium mt-1">Avg Applications/Job</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
