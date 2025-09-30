import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdWork,
  MdLocationOn,
  MdDateRange,
  MdVisibility,
  MdSchedule,
  MdBusiness,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdStar,
  MdAttachMoney,
} from "react-icons/md";
import { applicationsAPI } from "../../services/api";
import { InterviewCard } from "../../components/job-seeker";

interface Interview {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
}

interface Job {
  id: string;
  title: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  employer: {
    companyName: string;
    logoUrl?: string;
    user?: {
      imageUrl?: string;
    };
  };
}

interface Application {
  id: string;
  jobId: string;
  status?: "PENDING" | "REVIEWED" | "SHORTLISTED" | "HIRED" | "REJECTED";
  appliedAt: string;
  coverLetter?: string;
  job: Job;
  interviews?: Interview[];
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "REVIEWED" | "SHORTLISTED" | "HIRED" | "REJECTED"
  >("ALL");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getMyApplications();
      if (response.success && response.data) {
        // Ensure we get an array
        const applicationsData = Array.isArray(response.data)
          ? response.data
          : (response.data as { applications: Application[] })?.applications ||
            [];

        // Fetch interviews for each application
        const applicationsWithInterviews = await Promise.all(
          (applicationsData as Application[]).map(async (app) => {
            try {
              const interviewResponse = await applicationsAPI.getInterviews(
                app.id
              );
              if (interviewResponse.success && interviewResponse.data) {
                const interviews = Array.isArray(interviewResponse.data)
                  ? interviewResponse.data
                  : (interviewResponse.data as { interviews: Interview[] })
                      ?.interviews || [];
                return { ...app, interviews };
              }
              return app;
            } catch (error) {
              console.warn(
                `Failed to fetch interviews for application ${app.id}:`,
                error
              );
              return app;
            }
          })
        );

        setApplications(applicationsWithInterviews);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to fetch applications");
      setApplications([]); // Ensure applications is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "REVIEWED":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "SHORTLISTED":
        return "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "HIRED":
        return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
      case "REJECTED":
        return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "PENDING":
        return <MdPending className="w-4 h-4" />;
      case "REVIEWED":
        return <MdVisibility className="w-4 h-4" />;
      case "SHORTLISTED":
        return <MdStar className="w-4 h-4" />;
      case "HIRED":
        return <MdCheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <MdCancel className="w-4 h-4" />;
      default:
        return <MdWork className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(
    (app) => filter === "ALL" || app.status === filter
  );

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    reviewed: applications.filter((a) => a.status === "REVIEWED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    hired: applications.filter((a) => a.status === "HIRED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
    interviews: applications.reduce(
      (count, app) => count + (app.interviews?.length || 0),
      0
    ),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          My Applications
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track the status of your job applications
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Prominent Upcoming Interviews Section */}
      {(() => {
        const upcomingInterviews = applications.flatMap((app) =>
          (app.interviews || [])
            .filter((interview) => {
              const interviewDate = new Date(interview.scheduledDate);
              const now = new Date();
              return (
                interviewDate > now &&
                (interview.status === "SCHEDULED" ||
                  interview.status === "CONFIRMED")
              );
            })
            .map((interview) => ({ ...interview, job: app.job }))
        );

        if (upcomingInterviews.length === 0) return null;

        return (
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-xl p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <MdSchedule className="w-6 h-6 text-primary" />
                  Upcoming Interviews
                  <span className="bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full">
                    {upcomingInterviews.length}
                  </span>
                </h2>
                <div className="text-sm text-muted-foreground">
                  Don't miss your scheduled interviews!
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcomingInterviews.slice(0, 3).map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    jobTitle={interview.job.title}
                    companyName={interview.job.employer.companyName}
                    className="bg-card/80 backdrop-blur-sm shadow-lg border-primary/10"
                  />
                ))}
              </div>

              {upcomingInterviews.length > 3 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    + {upcomingInterviews.length - 3} more interviews scheduled
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        );
      })()}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-foreground">
            {stats.total}
          </div>
          <div className="text-muted-foreground text-sm">Total</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
          <div className="text-muted-foreground text-sm">Pending</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.reviewed}
          </div>
          <div className="text-muted-foreground text-sm">Reviewed</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.shortlisted}
          </div>
          <div className="text-muted-foreground text-sm">Shortlisted</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.hired}
          </div>
          <div className="text-muted-foreground text-sm">Hired</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.rejected}
          </div>
          <div className="text-muted-foreground text-sm">Rejected</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-primary">
            {stats.interviews}
          </div>
          <div className="text-muted-foreground text-sm">Interviews</div>
        </div>
      </div>

      {/* Enhanced Filter & Actions Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Filter Applications
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "ALL",
                "PENDING",
                "REVIEWED",
                "SHORTLISTED",
                "HIRED",
                "REJECTED",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setFilter(
                      status as
                        | "ALL"
                        | "PENDING"
                        | "REVIEWED"
                        | "SHORTLISTED"
                        | "HIRED"
                        | "REJECTED"
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    filter === status
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-background text-muted-foreground hover:bg-muted border-border hover:border-primary/20"
                  }`}
                >
                  {status === "ALL"
                    ? "All Applications"
                    : status.replace("_", " ")}
                  {status !== "ALL" && (
                    <span
                      className={`ml-2 rounded-full px-2 py-1 text-xs ${
                        filter === status
                          ? "bg-primary-foreground/20"
                          : "bg-muted"
                      }`}
                    >
                      {
                        applications.filter((app) => app.status === status)
                          .length
                      }
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => (window.location.href = "/jobs")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <MdWork className="w-4 h-4" />
              Browse Jobs
            </button>
            <button
              onClick={() => fetchApplications()}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {filteredApplications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-muted-foreground text-lg mb-4">
              {filter === "ALL"
                ? "No applications yet"
                : `No ${filter.toLowerCase()} applications`}
            </div>
            {filter === "ALL" && (
              <Link
                to="/jobs"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-block"
              >
                Browse Jobs
              </Link>
            )}
          </motion.div>
        ) : (
          filteredApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {application.job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <MdBusiness className="w-4 h-4" />
                        <span className="font-medium">
                          {application.job.employer.companyName}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {getStatusIcon(application.status)}
                      {application.status?.replace("_", " ") || "Unknown"}
                    </span>
                  </div>

                  {/* Job Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MdLocationOn className="w-4 h-4" />
                      {application.job.location || "Location not specified"}
                    </div>
                    <div className="flex items-center gap-1">
                      <MdWork className="w-4 h-4" />
                      {application.job.jobType?.replace("_", " ") ||
                        "Not specified"}
                    </div>
                    <div className="flex items-center gap-1">
                      <MdDateRange className="w-4 h-4" />
                      Applied{" "}
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </div>
                    {(application.job.salaryMin ||
                      application.job.salaryMax) && (
                      <div className="flex items-center gap-1">
                        <MdAttachMoney className="w-4 h-4" />
                        {application.job.salaryMin && application.job.salaryMax
                          ? `$${application.job.salaryMin} - $${application.job.salaryMax}`
                          : application.job.salaryMin
                          ? `$${application.job.salaryMin}+`
                          : `Up to $${application.job.salaryMax}`}
                      </div>
                    )}
                  </div>

                  {/* Interview Information - Enhanced with InterviewCard */}
                  {application.interviews &&
                    application.interviews.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <MdSchedule className="w-5 h-5 text-primary" />
                          Your Interviews ({application.interviews.length})
                        </h4>
                        <div className="space-y-4">
                          {application.interviews.map((interview) => (
                            <InterviewCard
                              key={interview.id}
                              interview={interview}
                              jobTitle={application.job.title}
                              companyName={application.job.employer.companyName}
                              className="shadow-md hover:shadow-lg transition-shadow"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Cover Letter Preview */}
                  {application.coverLetter && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Your Cover Letter:
                      </h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                          {application.coverLetter}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  <Link
                    to={`/jobs/${application.jobId}`}
                    className="flex items-center justify-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    <MdVisibility className="w-4 h-4" />
                    View Job
                  </Link>
                </div>
              </div>

              {/* Application Status Progress */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span
                    className={
                      application.status === "PENDING"
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    Applied
                  </span>
                  <span
                    className={
                      application.status === "REVIEWED"
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    Under Review
                  </span>
                  <span
                    className={
                      application.status === "SHORTLISTED"
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    Shortlisted
                  </span>
                  <span
                    className={
                      application.status &&
                      ["HIRED", "REJECTED"].includes(application.status)
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    Decision
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      application.status === "PENDING"
                        ? "w-1/4 bg-yellow-500"
                        : application.status === "REVIEWED"
                        ? "w-2/4 bg-blue-500"
                        : application.status === "SHORTLISTED"
                        ? "w-3/4 bg-purple-500"
                        : application.status === "HIRED"
                        ? "w-full bg-green-500"
                        : application.status === "REJECTED"
                        ? "w-full bg-red-500"
                        : "w-1/4 bg-muted-foreground"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Help Section */}
      {applications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Application Status Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <MdPending className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Pending:</strong> Your application has been submitted
                and is waiting to be reviewed.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MdVisibility className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Reviewed:</strong> The employer has reviewed your
                application.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MdStar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Shortlisted:</strong> You've been shortlisted for the
                next stage!
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MdCheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Hired:</strong> Congratulations! You've been selected
                for the position.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MdCancel className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Rejected:</strong> Unfortunately, you weren't selected
                for this position.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MdSchedule className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Interview:</strong> Scheduled interviews will appear
                with date, time, and meeting details.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
