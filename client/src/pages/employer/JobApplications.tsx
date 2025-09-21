import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdArrowBack,
  MdEmail,
  MdLocationOn,
  MdWork,
  MdDescription,
  MdPerson,
} from "react-icons/md";
import { applicationsAPI, formatImageUrl } from "../../services/api";

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  resumeUrl?: string;
  skills: string[];
  experience: string;
  location: string;
  jobTitle?: string; // For employer applications view
  jobLocation?: string; // For employer applications view
  jobType?: string; // For employer applications view
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profile?: {
      bio?: string;
      skills?: string[];
      experience?: string;
      location?: string;
    };
  };
}

interface Job {
  id: string;
  title: string;
  applicationsCount: number;
}

export default function JobApplications() {
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED"
  >("ALL");

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      let response;
      if (jobId) {
        // Fetch applications for a specific job
        response = await applicationsAPI.getJobApplications(jobId);
        console.log("Job Applications API response:", response); // Debug log

        // Ensure we have a valid response structure
        if (!response || !response.data) {
          throw new Error("Invalid response structure");
        }

        const data = response.data as { applications: Application[]; job: Job };

        // Transform the data to match our interface
        const transformedApplications = (data.applications || []).map(
          (app: {
            id: string;
            coverLetter?: string;
            status: string;
            appliedAt: string;
            jobSeeker?: {
              id: string;
              firstName: string;
              lastName: string;
              location?: string;
              bio?: string;
              skills: string[];
              experience?: string;
              cvUrl?: string;
              user: {
                email: string;
              };
            };
          }) => ({
            id: app.id,
            applicantName: app.jobSeeker
              ? `${app.jobSeeker.firstName} ${app.jobSeeker.lastName}`
              : "Unknown",
            applicantEmail: app.jobSeeker?.user?.email || "Unknown",
            coverLetter: app.coverLetter || "",
            status: app.status as
              | "PENDING"
              | "REVIEWING"
              | "ACCEPTED"
              | "REJECTED",
            appliedAt: app.appliedAt,
            resumeUrl: app.jobSeeker?.cvUrl,
            skills: app.jobSeeker?.skills || [],
            experience: app.jobSeeker?.experience || "",
            location: app.jobSeeker?.location || "",
            user: {
              firstName: app.jobSeeker?.firstName,
              lastName: app.jobSeeker?.lastName,
              email: app.jobSeeker?.user?.email,
              profile: {
                bio: app.jobSeeker?.bio,
                skills: app.jobSeeker?.skills,
                experience: app.jobSeeker?.experience,
                location: app.jobSeeker?.location,
              },
            },
          })
        );

        setApplications(transformedApplications);
        setJob(data.job || null);
      } else {
        // Fetch all applications for the employer
        response = await applicationsAPI.getEmployerApplications();
        console.log("Employer Applications API response:", response); // Debug log

        // Ensure we have a valid response structure
        if (!response || !response.data) {
          throw new Error("Invalid response structure");
        }

        const data = response.data as {
          applications: Application[];
          pagination?: {
            current: number;
            total: number;
            totalItems: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
        };

        // Transform the data to match our interface for employer applications
        const transformedApplications = (data.applications || []).map(
          (app: {
            id: string;
            coverLetter?: string;
            status: string;
            appliedAt: string;
            job?: {
              id: string;
              title: string;
              location?: string;
              jobType?: string;
            };
            jobSeeker?: {
              id: string;
              firstName: string;
              lastName: string;
              location?: string;
              bio?: string;
              skills: string[];
              experience?: string;
              cvUrl?: string;
              user: {
                email: string;
              };
            };
          }) => ({
            id: app.id,
            applicantName: app.jobSeeker
              ? `${app.jobSeeker.firstName} ${app.jobSeeker.lastName}`
              : "Unknown",
            applicantEmail: app.jobSeeker?.user?.email || "Unknown",
            coverLetter: app.coverLetter || "",
            status: app.status as
              | "PENDING"
              | "REVIEWING"
              | "ACCEPTED"
              | "REJECTED",
            appliedAt: app.appliedAt,
            resumeUrl: app.jobSeeker?.cvUrl,
            skills: app.jobSeeker?.skills || [],
            experience: app.jobSeeker?.experience || "",
            location: app.jobSeeker?.location || "",
            jobTitle: app.job?.title || "Unknown Position",
            jobLocation: app.job?.location || "",
            jobType: app.job?.jobType || "",
            user: {
              firstName: app.jobSeeker?.firstName,
              lastName: app.jobSeeker?.lastName,
              email: app.jobSeeker?.user?.email,
              profile: {
                bio: app.jobSeeker?.bio,
                skills: app.jobSeeker?.skills,
                experience: app.jobSeeker?.experience,
                location: app.jobSeeker?.location,
              },
            },
          })
        );

        setApplications(transformedApplications);
        setJob(null); // No specific job when viewing all applications
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);

      // Set empty state instead of showing error for empty results
      setApplications([]);
      setJob(
        jobId ? { id: jobId, title: "Unknown Job", applicationsCount: 0 } : null
      );

      // Only show error message for actual API failures, not empty results
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch applications";
      if (
        !errorMessage.includes("not found") &&
        !errorMessage.includes("empty")
      ) {
        setError("Failed to load applications. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      await applicationsAPI.updateStatus(applicationId, newStatus);
      await fetchApplications(); // Refresh the list
    } catch (err) {
      console.error("Failed to update application status:", err);
      setError("Failed to update application status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "REVIEWING":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "ACCEPTED":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 dark:text-yellow-400";
      case "REVIEWING":
        return "text-blue-600 dark:text-blue-400";
      case "ACCEPTED":
        return "text-green-600 dark:text-green-400";
      case "REJECTED":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredApplications = applications.filter(
    (app) => filter === "ALL" || app.status === filter
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {jobId && (
              <Link
                to="/employer/my-jobs"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium mb-4 transition-colors"
              >
                <MdArrowBack className="w-4 h-4" />
                Back to My Jobs
              </Link>
            )}
            <h1 className="text-3xl font-bold text-foreground">
              {jobId ? `Applications for ${job?.title}` : "All Applications"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {applications.length} total applications
              {!jobId && " across all job postings"}
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["ALL", "PENDING", "REVIEWING", "ACCEPTED", "REJECTED"].map(
            (status) => (
              <button
                key={status}
                onClick={() =>
                  setFilter(
                    status as
                      | "ALL"
                      | "PENDING"
                      | "REVIEWING"
                      | "ACCEPTED"
                      | "REJECTED"
                  )
                }
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {status.replace("_", " ")}
                {status !== "ALL" && (
                  <span className="bg-background/20 rounded-full px-2 py-0.5 text-xs font-semibold">
                    {applications.filter((app) => app.status === status).length}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-muted-foreground text-lg mb-4">
                {filter === "ALL"
                  ? "No applications yet"
                  : `No ${filter.toLowerCase()} applications`}
              </div>
              <p className="text-muted-foreground text-sm">
                Applications will appear here once candidates apply to this job.
              </p>
            </motion.div>
          ) : (
            filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card text-card-foreground border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <MdPerson className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {application.user?.firstName &&
                          application.user?.lastName
                            ? `${application.user.firstName} ${application.user.lastName}`
                            : application.applicantName}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {!jobId && application.jobTitle && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <h4 className="font-medium text-foreground mb-1">
                          Applied for:
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium">
                            {application.jobTitle}
                          </div>
                          {application.jobLocation && (
                            <div className="flex items-center gap-1 mt-1">
                              <MdLocationOn className="w-3 h-3" />
                              {application.jobLocation}
                            </div>
                          )}
                          {application.jobType && (
                            <div className="flex items-center gap-1 mt-1">
                              <MdWork className="w-3 h-3" />
                              {application.jobType}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <MdEmail className="w-4 h-4" />
                        <span>
                          {application.user?.email ||
                            application.applicantEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdLocationOn className="w-4 h-4" />
                        <span>
                          {application.user?.profile?.location ||
                            application.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdWork className="w-4 h-4" />
                        <span>
                          {application.user?.profile?.experience ||
                            application.experience}
                        </span>
                      </div>
                    </div>

                    <div className="text-muted-foreground text-sm">
                      Applied:{" "}
                      {new Date(application.appliedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-6">
                    {/* Status Update */}
                    <select
                      value={application.status}
                      onChange={(e) =>
                        updateApplicationStatus(application.id, e.target.value)
                      }
                      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* View Resume */}
                    {application.resumeUrl && (
                      <a
                        href={formatImageUrl(application.resumeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        View Resume
                      </a>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {(application.user?.profile?.skills || application.skills)
                  ?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MdWork className="w-4 h-4" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(
                        application.user?.profile?.skills || application.skills
                      ).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio/About */}
                {application.user?.profile?.bio && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MdDescription className="w-4 h-4" />
                      About
                    </h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-foreground text-sm leading-relaxed">
                        {application.user.profile.bio}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {application.coverLetter && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MdDescription className="w-4 h-4" />
                      Cover Letter
                    </h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-foreground text-sm leading-relaxed">
                        {application.coverLetter}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="text-3xl font-bold text-foreground">
                {applications.length}
              </div>
              <div className="text-muted-foreground text-sm">Total</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div
                className={`text-3xl font-bold ${getStatusBadgeColor(
                  "PENDING"
                )}`}
              >
                {applications.filter((a) => a.status === "PENDING").length}
              </div>
              <div className="text-muted-foreground text-sm">Pending</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div
                className={`text-3xl font-bold ${getStatusBadgeColor(
                  "REVIEWING"
                )}`}
              >
                {applications.filter((a) => a.status === "REVIEWING").length}
              </div>
              <div className="text-muted-foreground text-sm">Reviewing</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div
                className={`text-3xl font-bold ${getStatusBadgeColor(
                  "ACCEPTED"
                )}`}
              >
                {applications.filter((a) => a.status === "ACCEPTED").length}
              </div>
              <div className="text-muted-foreground text-sm">Accepted</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div
                className={`text-3xl font-bold ${getStatusBadgeColor(
                  "REJECTED"
                )}`}
              >
                {applications.filter((a) => a.status === "REJECTED").length}
              </div>
              <div className="text-muted-foreground text-sm">Rejected</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
