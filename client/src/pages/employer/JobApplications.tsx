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
  MdAttachFile,
  MdVisibility,
  MdPhone,
  MdSchedule,
  MdVideoCall,
  MdPlace,
  MdAccessTime,
  MdEventNote,
} from "react-icons/md";
import { applicationsAPI, formatImageUrl } from "../../services/api";
import { InterviewScheduleModal } from "../../components/employer";
import Button from "../../components/ui/Button";

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  appliedAt: string;
  resumeUrl?: string;
  skills: string[];
  experience: string;
  location: string;
  jobTitle?: string; // For employer applications view
  jobLocation?: string; // For employer applications view
  jobType?: string; // For employer applications view
  interviews?: Array<{
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    description?: string;
    location?: string;
    isVirtual: boolean;
    meetingLink?: string;
    status:
      | "SCHEDULED"
      | "CONFIRMED"
      | "COMPLETED"
      | "CANCELLED"
      | "RESCHEDULED";
    createdAt: string;
    updatedAt: string;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    fileType: string;
    fileSize: number;
  }>;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
    profile?: {
      bio?: string;
      skills?: string[];
      experience?: string;
      location?: string;
      phone?: string;
      countryCode?: string;
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
    "ALL" | "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  >("ALL");
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

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
            interviews?: Array<{
              id: string;
              scheduledDate: string;
              scheduledTime: string;
              description?: string;
              location?: string;
              isVirtual: boolean;
              meetingLink?: string;
              status:
                | "SCHEDULED"
                | "CONFIRMED"
                | "COMPLETED"
                | "CANCELLED"
                | "RESCHEDULED";
              createdAt: string;
              updatedAt: string;
            }>;
            jobSeeker?: {
              id: string;
              firstName: string;
              lastName: string;
              location?: string;
              bio?: string;
              skills: string[];
              experience?: string;
              cvUrl?: string;
              phone?: string;
              countryCode?: string;
              user: {
                email: string;
                imageUrl?: string;
              };
            };
          }) => ({
            id: app.id,
            applicantName: app.jobSeeker
              ? `${app.jobSeeker.firstName || ""} ${
                  app.jobSeeker.lastName || ""
                }`.trim() || "Unknown Applicant"
              : "Unknown Applicant",
            applicantEmail: app.jobSeeker?.user?.email || "Unknown",
            coverLetter: app.coverLetter || "",
            status: app.status as
              | "PENDING"
              | "REVIEWED"
              | "SHORTLISTED"
              | "HIRED"
              | "REJECTED",
            appliedAt: app.appliedAt,
            resumeUrl: app.jobSeeker?.cvUrl,
            skills: app.jobSeeker?.skills || [],
            experience: app.jobSeeker?.experience || "",
            location: app.jobSeeker?.location || "",
            interviews: app.interviews || [],
            attachments:
              (
                app as {
                  attachments?: Array<{
                    id: string;
                    filename: string;
                    url: string;
                    fileType: string;
                    fileSize: number;
                  }>;
                }
              ).attachments || [],
            user: {
              firstName: app.jobSeeker?.firstName,
              lastName: app.jobSeeker?.lastName,
              email: app.jobSeeker?.user?.email,
              imageUrl: app.jobSeeker?.user?.imageUrl,
              profile: {
                bio: app.jobSeeker?.bio,
                skills: app.jobSeeker?.skills,
                experience: app.jobSeeker?.experience,
                location: app.jobSeeker?.location,
                phone: app.jobSeeker?.phone,
                countryCode: app.jobSeeker?.countryCode,
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
            interviews?: Array<{
              id: string;
              scheduledDate: string;
              scheduledTime: string;
              description?: string;
              location?: string;
              isVirtual: boolean;
              meetingLink?: string;
              status:
                | "SCHEDULED"
                | "CONFIRMED"
                | "COMPLETED"
                | "CANCELLED"
                | "RESCHEDULED";
              createdAt: string;
              updatedAt: string;
            }>;
            jobSeeker?: {
              id: string;
              firstName: string;
              lastName: string;
              location?: string;
              bio?: string;
              skills: string[];
              experience?: string;
              cvUrl?: string;
              phone?: string;
              countryCode?: string;
              user: {
                email: string;
                imageUrl?: string;
              };
            };
          }) => ({
            id: app.id,
            applicantName: app.jobSeeker
              ? `${app.jobSeeker.firstName || ""} ${
                  app.jobSeeker.lastName || ""
                }`.trim() || "Unknown Applicant"
              : "Unknown Applicant",
            applicantEmail: app.jobSeeker?.user?.email || "Unknown",
            coverLetter: app.coverLetter || "",
            status: app.status as
              | "PENDING"
              | "REVIEWED"
              | "SHORTLISTED"
              | "HIRED"
              | "REJECTED",
            appliedAt: app.appliedAt,
            resumeUrl: app.jobSeeker?.cvUrl,
            skills: app.jobSeeker?.skills || [],
            experience: app.jobSeeker?.experience || "",
            location: app.jobSeeker?.location || "",
            interviews: app.interviews || [],
            attachments:
              (
                app as {
                  attachments?: Array<{
                    id: string;
                    filename: string;
                    url: string;
                    fileType: string;
                    fileSize: number;
                  }>;
                }
              ).attachments || [],
            jobTitle: app.job?.title || "Unknown Position",
            jobLocation: app.job?.location || "",
            jobType: app.job?.jobType || "",
            user: {
              firstName: app.jobSeeker?.firstName,
              lastName: app.jobSeeker?.lastName,
              email: app.jobSeeker?.user?.email,
              imageUrl: app.jobSeeker?.user?.imageUrl,
              profile: {
                bio: app.jobSeeker?.bio,
                skills: app.jobSeeker?.skills,
                experience: app.jobSeeker?.experience,
                location: app.jobSeeker?.location,
                phone: app.jobSeeker?.phone,
                countryCode: app.jobSeeker?.countryCode,
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

  const handleScheduleInterview = (application: Application) => {
    setSelectedApplication(application);
    setShowInterviewModal(true);
  };

  const handleInterviewScheduled = () => {
    fetchApplications(); // Refresh to show updated status
    setSelectedApplication(null);
    setShowInterviewModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "REVIEWED":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "SHORTLISTED":
        return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "HIRED":
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
      case "REVIEWED":
        return "text-blue-600 dark:text-blue-400";
      case "SHORTLISTED":
        return "text-purple-600 dark:text-purple-400";
      case "HIRED":
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
              onClick={() => setFilter(status as typeof filter)}
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
          ))}
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
                    <div className="flex items-center gap-4 mb-4">
                      {/* Profile Image */}
                      <div className="relative">
                        {application.user?.imageUrl ? (
                          <img
                            src={formatImageUrl(application.user.imageUrl)}
                            alt={`${application.applicantName} profile`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-border ${
                            application.user?.imageUrl ? "hidden" : ""
                          }`}
                        >
                          <MdPerson className="w-8 h-8 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {application.user?.firstName &&
                          application.user?.lastName
                            ? `${application.user.firstName} ${application.user.lastName}`
                            : application.applicantName}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              application.status
                            )}`}
                          >
                            {application.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Applied {formatDate(application.appliedAt)}
                          </span>
                        </div>
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

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-muted-foreground text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <MdEmail className="w-4 h-4" />
                        <span>
                          {application.user?.email ||
                            application.applicantEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdPhone className="w-4 h-4" />
                        <span>
                          {application.user?.profile?.countryCode &&
                          application.user?.profile?.phone
                            ? `${application.user.profile.countryCode} ${application.user.profile.phone}`
                            : application.user?.profile?.phone ||
                              "Not provided"}
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
                      <option value="REVIEWED">Reviewed</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="HIRED">Hired</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Schedule Interview Button */}
                    {(application.status === "PENDING" ||
                      application.status === "REVIEWED" ||
                      application.status === "SHORTLISTED") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleInterview(application)}
                        className="flex items-center gap-2"
                      >
                        <MdSchedule className="w-4 h-4" />
                        Schedule Interview
                      </Button>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <MdAttachFile className="w-4 h-4" />
                    Documents & Resume
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Profile CV */}
                    {application.resumeUrl && (
                      <a
                        href={formatImageUrl(application.resumeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg border border-green-200 transition-colors"
                      >
                        <MdAttachFile className="w-5 h-5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            Profile Resume/CV
                          </p>
                          <p className="text-xs opacity-80">
                            From candidate's profile
                          </p>
                        </div>
                        <MdVisibility className="w-4 h-4 flex-shrink-0" />
                      </a>
                    )}

                    {/* Application Documents */}
                    {application.attachments &&
                      application.attachments.length > 0 && (
                        <>
                          {application.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={formatImageUrl(attachment.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg border border-blue-200 transition-colors"
                            >
                              <MdAttachFile className="w-5 h-5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {attachment.filename}
                                </p>
                                <p className="text-xs opacity-80">
                                  Uploaded with application •{" "}
                                  {(attachment.fileSize / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB
                                </p>
                              </div>
                              <MdVisibility className="w-4 h-4 flex-shrink-0" />
                            </a>
                          ))}
                        </>
                      )}

                    {/* No documents message */}
                    {!application.resumeUrl &&
                      (!application.attachments ||
                        application.attachments.length === 0) && (
                        <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                          <MdAttachFile className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No documents uploaded</p>
                        </div>
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
                  <div className="mb-6">
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

                {/* Interviews Section */}
                {application.interviews &&
                  application.interviews.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <MdEventNote className="w-4 h-4" />
                        Scheduled Interviews ({application.interviews.length})
                      </h4>
                      <div className="space-y-3">
                        {application.interviews.map((interview) => (
                          <div
                            key={interview.id}
                            className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4"
                          >
                            {/* Header Section - Mobile Optimized */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <MdSchedule className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm sm:text-base truncate">
                                    {interview.isVirtual
                                      ? "Virtual Interview"
                                      : "In-Person Interview"}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                      interview.status === "SCHEDULED"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : interview.status === "CONFIRMED"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        : interview.status === "COMPLETED"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                        : interview.status === "CANCELLED"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    }`}
                                  >
                                    {interview.status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Content Grid - Responsive */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              {/* Date & Time */}
                              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
                                <MdAccessTime className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">
                                    {new Date(
                                      interview.scheduledDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs opacity-75">
                                    at {interview.scheduledTime}
                                  </p>
                                </div>
                              </div>

                              {/* Location/Meeting Info */}
                              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
                                {interview.isVirtual ? (
                                  <>
                                    <MdVideoCall className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium">
                                        Virtual Meeting
                                      </p>
                                      {interview.meetingLink && (
                                        <a
                                          href={interview.meetingLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                                        >
                                          Join Meeting
                                        </a>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <MdPlace className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium">
                                        Location
                                      </p>
                                      <p className="text-xs opacity-75 break-words">
                                        {interview.location || "TBD"}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Notes Section */}
                              {interview.description && (
                                <div className="sm:col-span-2 lg:col-span-1">
                                  <div className="flex items-start gap-2">
                                    <MdDescription className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-700 dark:text-blue-300" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                                        Notes
                                      </p>
                                      <p className="text-xs text-blue-600 dark:text-blue-400 opacity-90 leading-relaxed break-words">
                                        {interview.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
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
            className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
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
                  "REVIEWED"
                )}`}
              >
                {applications.filter((a) => a.status === "REVIEWED").length}
              </div>
              <div className="text-muted-foreground text-sm">Reviewed</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div
                className={`text-3xl font-bold ${getStatusBadgeColor(
                  "SHORTLISTED"
                )}`}
              >
                {applications.filter((a) => a.status === "SHORTLISTED").length}
              </div>
              <div className="text-muted-foreground text-sm">Shortlisted</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <div
                className={`text-3xl font-bold ${getStatusBadgeColor("HIRED")}`}
              >
                {applications.filter((a) => a.status === "HIRED").length}
              </div>
              <div className="text-muted-foreground text-sm">Hired</div>
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

      {/* Interview Schedule Modal */}
      {showInterviewModal && selectedApplication && (
        <InterviewScheduleModal
          isOpen={showInterviewModal}
          onClose={() => setShowInterviewModal(false)}
          applicationId={selectedApplication.id}
          applicantName={selectedApplication.applicantName}
          jobTitle={job?.title || "Position"}
          onScheduled={handleInterviewScheduled}
        />
      )}
    </div>
  );
}
