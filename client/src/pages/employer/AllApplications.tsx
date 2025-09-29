import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdWork,
  MdEmail,
  MdLocationOn,
  MdDateRange,
  MdVisibility,
  MdDescription,
  MdEdit,
  MdDelete,
} from "react-icons/md";
import Button from "../../components/ui/Button";
import { applicationsAPI } from "../../services/api";
import {
  InterviewScheduleModal,
  EditInterviewModal,
} from "../../components/employer";

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

interface Application {
  id: string;
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  appliedAt: string;
  createdAt?: string;
  coverLetter?: string;
  job: {
    id: string;
    title: string;
    location: string;
    jobType: string;
  };
  jobSeeker: {
    id: string;
    firstName: string;
    lastName: string;
    location?: string;
    bio?: string;
    skills: string[];
    experience?: string;
    education?: string;
    cvUrl?: string;
    profileImageUrl?: string;
    phone?: string;
    countryCode?: string;
    user: {
      email: string;
      imageUrl?: string;
    };
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    fileType: string;
  }>;
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
  }>;
}

export default function EmployerApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  >("ALL");
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showEditInterviewModal, setShowEditInterviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationsAPI.getEmployerApplications();

        if (response.success && response.data) {
          const data = response.data as { applications?: Application[] };
          setApplications(data.applications || []);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
        setError("Failed to load applications");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHORTLISTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIRED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredApplications = applications.filter(
    (app) => filter === "ALL" || app.status === filter
  );

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      await applicationsAPI.updateStatus(applicationId, newStatus);
      // Reload applications
      window.location.reload();
    } catch (err) {
      console.error("Failed to update application status:", err);
      setError("Failed to update application status");
    }
  };

  const handleScheduleInterview = (application: Application) => {
    setSelectedApplication(application);
    setShowInterviewModal(true);
  };

  const handleInterviewScheduled = async () => {
    // Reload applications to show updated status
    try {
      const response = await applicationsAPI.getEmployerApplications();
      if (response.success && response.data) {
        const data = response.data as { applications?: Application[] };
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to reload applications:", err);
    }
    setSelectedApplication(null);
    setShowInterviewModal(false);
  };

  const handleEditInterview = (
    application: Application,
    interview: Interview
  ) => {
    setSelectedApplication(application);
    setSelectedInterview(interview);
    setShowEditInterviewModal(true);
  };

  const handleInterviewUpdated = async (
    updatedInterview: Partial<Interview>
  ) => {
    try {
      // Call the interview update API
      if (selectedInterview) {
        await applicationsAPI.updateInterview(selectedInterview.id, {
          scheduledDate: updatedInterview.scheduledDate,
          scheduledTime: updatedInterview.scheduledTime,
          description: updatedInterview.description,
          location: updatedInterview.location,
          meetingLink: updatedInterview.meetingLink,
        });
      }
      // Reload applications to show updated interview
      const response = await applicationsAPI.getEmployerApplications();
      if (response.success && response.data) {
        const data = response.data as { applications?: Application[] };
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to update interview:", err);
    } finally {
      setShowEditInterviewModal(false);
      setSelectedInterview(null);
      setSelectedApplication(null);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to delete this interview?")) {
      return;
    }

    try {
      await applicationsAPI.deleteInterview(interviewId);
      // Reload applications to show updated list
      const response = await applicationsAPI.getEmployerApplications();
      if (response.success && response.data) {
        const data = response.data as { applications?: Application[] };
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to delete interview:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">
                Loading applications...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Job Applications
          </h1>
          <p className="text-muted-foreground">
            Manage applications received for your job postings
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
            <p className="text-2xl font-bold text-foreground">
              {applications.length}
            </p>
          </motion.div>

          {(
            ["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"] as const
          ).map((status, index) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <h3 className="text-sm font-medium text-muted-foreground capitalize">
                {status.toLowerCase()}
              </h3>
              <p className="text-2xl font-bold text-foreground">
                {statusCounts[status] || 0}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              "ALL",
              "PENDING",
              "REVIEWED",
              "SHORTLISTED",
              "REJECTED",
              "HIRED",
            ] as const
          ).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted border border-border"
              }`}
            >
              {status === "ALL"
                ? "All Applications"
                : status.charAt(0) + status.slice(1).toLowerCase()}
              {statusCounts[status] &&
                status !== "ALL" &&
                ` (${statusCounts[status]})`}
              {status === "ALL" && ` (${applications.length})`}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <MdWork className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === "ALL"
                ? "No applications yet"
                : `No ${filter.toLowerCase()} applications`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === "ALL"
                ? "Applications will appear here when candidates apply to your jobs."
                : `No applications with ${filter.toLowerCase()} status found.`}
            </p>
            {filter === "ALL" && (
              <Link to="/employer/jobs">
                <Button>View My Jobs</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Applicant Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {application.jobSeeker.firstName}{" "}
                          {application.jobSeeker.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <MdEmail className="w-4 h-4" />
                            {application.jobSeeker.user.email}
                          </div>
                          {application.jobSeeker.phone && (
                            <div className="flex items-center gap-1">
                              <MdLocationOn className="w-4 h-4" />
                              {application.jobSeeker.countryCode}{" "}
                              {application.jobSeeker.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="mb-3">
                      <p className="font-medium text-foreground">
                        Applied for: {application.job.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MdLocationOn className="w-4 h-4" />
                          {application.job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <MdWork className="w-4 h-4" />
                          {application.job.jobType.replace("_", " ")}
                        </div>
                        <div className="flex items-center gap-1">
                          <MdDateRange className="w-4 h-4" />
                          Applied {formatDate(application.appliedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {application.jobSeeker.skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Skills:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {application.jobSeeker.skills
                            .slice(0, 5)
                            .map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-muted text-foreground text-xs rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          {application.jobSeeker.skills.length > 5 && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                              +{application.jobSeeker.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {application.jobSeeker.experience && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Experience:</span>{" "}
                          {application.jobSeeker.experience}
                        </p>
                      </div>
                    )}

                    {/* Cover Letter Preview */}
                    {application.coverLetter && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Cover Letter:
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {application.coverLetter}
                        </p>
                      </div>
                    )}

                    {/* Attachments */}
                    {application.attachments &&
                      application.attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-foreground mb-2">
                            Documents:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {application.attachments.map(
                              (attachment, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                                >
                                  <MdDescription className="w-3 h-3" />
                                  {attachment.filename}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {/* Status Update */}
                    <select
                      value={application.status}
                      onChange={(e) =>
                        updateApplicationStatus(application.id, e.target.value)
                      }
                      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-background dark:text-foreground dark:border-border"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="HIRED">Hired</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Interview Information */}
                    {application.interviews &&
                      application.interviews.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Scheduled Interviews
                          </h4>
                          {application.interviews.map((interview) => (
                            <div
                              key={interview.id}
                              className="flex items-center justify-between text-sm mb-2 last:mb-0"
                            >
                              <div className="text-blue-700 dark:text-blue-300 flex-1">
                                <div>
                                  {new Date(
                                    interview.scheduledDate
                                  ).toLocaleDateString()}{" "}
                                  at {interview.scheduledTime}
                                </div>
                                <div className="text-xs opacity-75">
                                  {interview.isVirtual
                                    ? "Virtual Interview"
                                    : interview.location}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleEditInterview(application, interview)
                                  }
                                  className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors flex items-center gap-1"
                                >
                                  <MdEdit className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteInterview(interview.id)
                                  }
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors flex items-center gap-1"
                                >
                                  <MdDelete className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Schedule Interview Button */}
                    {(application.status === "PENDING" ||
                      application.status === "REVIEWED" ||
                      application.status === "SHORTLISTED") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleInterview(application)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <MdDateRange className="w-4 h-4" />
                        <span>
                          {application.interviews &&
                          application.interviews.length > 0
                            ? "Schedule Another Interview"
                            : "Schedule Interview"}
                        </span>
                      </Button>
                    )}

                    <Link
                      to={`/employer/jobs/${application.job.id}/applications`}
                      className="flex-1 lg:flex-none"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <MdVisibility className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Schedule Modal */}
      {showInterviewModal && selectedApplication && (
        <InterviewScheduleModal
          isOpen={showInterviewModal}
          onClose={() => setShowInterviewModal(false)}
          applicationId={selectedApplication.id}
          applicantName={`${selectedApplication.jobSeeker.firstName} ${selectedApplication.jobSeeker.lastName}`}
          jobTitle={selectedApplication.job.title}
          onScheduled={handleInterviewScheduled}
        />
      )}

      {/* Edit Interview Modal */}
      {showEditInterviewModal && selectedApplication && selectedInterview && (
        <EditInterviewModal
          isOpen={showEditInterviewModal}
          onClose={() => setShowEditInterviewModal(false)}
          interview={selectedInterview}
          candidateName={`${selectedApplication.jobSeeker.firstName} ${selectedApplication.jobSeeker.lastName}`}
          jobTitle={selectedApplication.job.title}
          onSave={handleInterviewUpdated}
        />
      )}
    </div>
  );
}
