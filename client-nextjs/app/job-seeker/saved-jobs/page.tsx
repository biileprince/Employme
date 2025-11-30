"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdBookmark,
  MdLocationOn,
  MdAttachMoney,
  MdBusinessCenter,
  MdWork,
} from "react-icons/md";
import { apiClient } from "@/lib/api";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import JobApplicationModal from "@/components/features/JobApplicationModal";
import AuthModal from "@/components/features/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

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

export default function SavedJobsPage() {
  const { user } = useRouteGuard({
    requireAuth: true,
    requireOnboarding: false,
    requireRole: "JOB_SEEKER",
  });

  const { isAuthenticated } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{
    id: string;
    title: string;
    company: string;
    location: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  const loadSavedJobs = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get<{
        savedJobs?: SavedJob[];
      }>("/saved-jobs");

      if (response.data) {
        const jobsData = Array.isArray(response.data)
          ? response.data
          : response.data?.savedJobs || [];
        setSavedJobs(jobsData as SavedJob[]);
      } else {
        setSavedJobs([]);
      }
    } catch (err) {
      console.error("Failed to load saved jobs:", err);
      setError("Failed to load saved jobs. Please try again.");
      setSavedJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      await apiClient.post(`/saved-jobs/remove`, { jobId });
      setSavedJobs((prev) =>
        prev.filter((savedJob) => savedJob.job.id !== jobId)
      );
    } catch (err) {
      console.error("Failed to unsave job:", err);
      alert("Failed to remove job from saved jobs. Please try again.");
    }
  };

  const handleApply = (job: SavedJob["job"]) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSelectedJob({
      id: job.id,
      title: job.title,
      company: job.employer.companyName,
      location: job.location,
    });
    setShowApplicationModal(true);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified";
    if (min && max)
      return `GHS ${min.toLocaleString()} - GHS ${max.toLocaleString()}`;
    if (min) return `From GHS ${min.toLocaleString()}`;
    if (max) return `Up to GHS ${max.toLocaleString()}`;
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
              className="bg-card rounded-lg border-2 border-border p-6 animate-pulse"
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

        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6">
          <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            Try Again
          </button>
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
            Start browsing jobs and save the ones you&apos;re interested in.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <MdWork className="w-5 h-5" />
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
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
              className="bg-card rounded-lg border-2 border-border p-4 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                    <Link
                      href={`/jobs/${savedJob.job.id}`}
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
                      <MdLocationOn className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">{savedJob.job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdBusinessCenter className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">{savedJob.job.jobType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdAttachMoney className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
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

                <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => handleUnsave(savedJob.job.id)}
                    className="text-primary hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 border border-border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove from saved jobs"
                  >
                    <MdBookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleApply(savedJob.job)}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium"
                  >
                    Apply Now
                  </button>
                  <Link
                    href={`/jobs/${savedJob.job.id}`}
                    className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-xs sm:text-sm font-medium text-foreground"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onApplicationSuccess={() => {
            loadSavedJobs();
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="apply"
      />
    </>
  );
}
