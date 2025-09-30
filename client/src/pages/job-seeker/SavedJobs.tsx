import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdBookmark,
  MdLocationOn,
  MdAttachMoney,
  MdBusinessCenter,
} from "react-icons/md";
import { Button } from "../../components/ui";
import { savedJobsAPI } from "../../services/api";

interface SavedJob {
  id: string;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    jobType: string;
    createdAt: string;
    employer: {
      companyName: string;
    };
  };
}

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        setIsLoading(true);
        const response = await savedJobsAPI.getSavedJobs();
        if (response.success) {
          setSavedJobs(
            (response.data as { savedJobs: SavedJob[] }).savedJobs || []
          );
        } else {
          setError(response.message || "Failed to load saved jobs");
        }
      } catch (err) {
        console.error("Failed to load saved jobs:", err);
        setError("Failed to load saved jobs. Please try again.");
        setSavedJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedJobs();
  }, []);

  const handleUnsave = async (jobId: string) => {
    try {
      const response = await savedJobsAPI.unsaveJob(jobId);
      if (response.success) {
        setSavedJobs((prev) =>
          prev.filter((savedJob) => savedJob.job.id !== jobId)
        );
      }
    } catch (err) {
      console.error("Failed to unsave job:", err);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified";
    if (min && max)
      return `GH₵${min.toLocaleString()} - GH₵${max.toLocaleString()}`;
    if (min) return `From GH₵${min.toLocaleString()}`;
    if (max) return `Up to GH₵${max.toLocaleString()}`;
    return "Salary not specified";
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-0 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Saved Jobs
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your bookmarked job opportunities
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-lg border border-border p-6 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-0 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Saved Jobs
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your bookmarked job opportunities
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 dark:bg-red-950 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
            {error}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <div className="px-4 sm:px-0 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Saved Jobs
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your bookmarked job opportunities
            </p>
          </div>
        </div>

        <div className="text-center py-8 sm:py-12">
          <MdBookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No saved jobs yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start browsing jobs and save the ones you're interested in.
          </p>
          <Link to="/jobs">
            <Button variant="primary">Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Saved Jobs
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {savedJobs.length} job{savedJobs.length === 1 ? "" : "s"} saved
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {savedJobs.map((savedJob, index) => (
          <motion.div
            key={savedJob.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-lg border border-border p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                  <Link
                    to={`/jobs/${savedJob.job.id}`}
                    className="hover:text-primary transition-colors line-clamp-2"
                  >
                    {savedJob.job.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                  {savedJob.job.employer.companyName}
                </p>

                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  <div className="flex items-center gap-1">
                    <MdLocationOn className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{savedJob.job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdBusinessCenter className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{savedJob.job.jobType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdAttachMoney className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">
                      {formatSalary(
                        savedJob.job.salaryMin,
                        savedJob.job.salaryMax
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">
                  {savedJob.job.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => handleUnsave(savedJob.job.id)}
                  className="text-muted-foreground hover:text-red-600 transition-colors p-2"
                  title="Remove from saved jobs"
                >
                  <MdBookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <Link to={`/jobs/${savedJob.job.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    View Job
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
