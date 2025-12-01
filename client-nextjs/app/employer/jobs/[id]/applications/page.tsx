"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  MdEdit,
  MdDelete,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { apiClient, formatImageUrl } from "@/lib/api";

interface Interview {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: string;
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  appliedAt: string;
  coverLetter?: string;
  jobSeeker: {
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
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    fileType: string;
    fileSize: number;
  }>;
  interviews?: Interview[];
}

interface Job {
  id: string;
  title: string;
  applicationsCount: number;
}

// Interview Modal Component
function InterviewScheduleModal({
  isOpen,
  onClose,
  applicationId,
  applicantName,
  jobTitle,
  onScheduled,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  onScheduled: () => void;
}) {
  const [formData, setFormData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    description: "",
    location: "",
    isVirtual: false,
    meetingLink: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await apiClient.post(
        `/applications/${applicationId}/schedule-interview`,
        formData
      );
      onScheduled();
    } catch (err) {
      console.error("Failed to schedule interview:", err);
      setError("Failed to schedule interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Schedule Interview
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {applicantName} for {jobTitle}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVirtual"
                checked={formData.isVirtual}
                onChange={(e) =>
                  setFormData({ ...formData, isVirtual: e.target.checked })
                }
                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <label
                htmlFor="isVirtual"
                className="text-sm font-medium text-foreground"
              >
                Virtual Interview
              </label>
            </div>

            {formData.isVirtual ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={formData.meetingLink}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingLink: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Office address or meeting room"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Additional information for the candidate..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Scheduling..." : "Schedule Interview"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// Edit Interview Modal Component
function EditInterviewModal({
  isOpen,
  onClose,
  interview,
  candidateName,
  jobTitle,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  candidateName: string;
  jobTitle: string;
  onSave: (data: Partial<Interview>) => void;
}) {
  const [formData, setFormData] = useState({
    scheduledDate: interview.scheduledDate.split("T")[0],
    scheduledTime: interview.scheduledTime,
    description: interview.description || "",
    location: interview.location || "",
    meetingLink: interview.meetingLink || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Edit Interview
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {candidateName} for {jobTitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {interview.isVirtual ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={formData.meetingLink}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingLink: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Office address or meeting room"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Additional information for the candidate..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function JobApplicationsPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    applicationId: string;
    newStatus: string;
    applicantName: string;
    currentStatus: string;
  } | null>(null);

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

  const formatTimeToAMPM = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const fetchApplications = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.get<{
        applications: Application[];
        job: Job;
      }>(`/applications/job/${jobId}`);

      if (response.success && response.data) {
        setApplications(response.data.applications || []);
        setJob(response.data.job || null);
      } else {
        setApplications([]);
        setJob(null);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setApplications([]);
      setJob(null);
      setError("Failed to load applications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChangeRequest = (
    applicationId: string,
    newStatus: string,
    applicantName: string,
    currentStatus: string
  ) => {
    if (newStatus === currentStatus) return;
    setPendingStatusChange({
      applicationId,
      newStatus,
      applicantName,
      currentStatus,
    });
    setShowStatusConfirm(true);
  };

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      await apiClient.patch(`/applications/${applicationId}/status`, {
        status: newStatus,
      });
      await fetchApplications();
    } catch (err) {
      console.error("Failed to update application status:", err);
      setError("Failed to update application status");
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatusChange) {
      await updateApplicationStatus(
        pendingStatusChange.applicationId,
        pendingStatusChange.newStatus
      );
    }
    setShowStatusConfirm(false);
    setPendingStatusChange(null);
  };

  const handleScheduleInterview = (application: Application) => {
    setSelectedApplication(application);
    setShowInterviewModal(true);
  };

  const handleInterviewScheduled = () => {
    fetchApplications();
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

  const handleInterviewUpdated = async (updatedData: Partial<Interview>) => {
    if (!selectedInterview) return;

    try {
      await apiClient.put(`/interviews/${selectedInterview.id}`, updatedData);
      await fetchApplications();
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
      await apiClient.delete(`/interviews/${interviewId}`);
      await fetchApplications();
    } catch (err) {
      console.error("Failed to delete interview:", err);
    }
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="w-full">
            <Link
              href="/employer/my-jobs"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium mb-3 sm:mb-4 transition-colors"
            >
              <MdArrowBack className="w-4 h-4" />
              Back to My Jobs
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Applications for {job?.title || "Job"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {applications.length} total application
              {applications.length !== 1 ? "s" : ""}
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
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-8">
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
              className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {status.replace("_", " ")}
              {status !== "ALL" && (
                <span className="bg-background/20 rounded-full px-1.5 sm:px-2 py-0.5 text-xs font-semibold">
                  {applications.filter((app) => app.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="space-y-4 sm:space-y-6">
          {filteredApplications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12 lg:py-16 px-4"
            >
              <div className="text-muted-foreground text-base sm:text-lg mb-4">
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
                className="bg-card text-card-foreground border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 sm:mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      {/* Profile Image */}
                      <div className="relative shrink-0">
                        {application.jobSeeker.user.imageUrl ? (
                          <Image
                            src={formatImageUrl(
                              application.jobSeeker.user.imageUrl
                            )}
                            alt={`${application.jobSeeker.firstName} ${application.jobSeeker.lastName} profile`}
                            width={64}
                            height={64}
                            unoptimized
                            className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-border"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              (
                                e.currentTarget
                                  .nextElementSibling as HTMLElement
                              )?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-border ${
                            application.jobSeeker.user.imageUrl ? "hidden" : ""
                          }`}
                        >
                          <MdPerson className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 truncate">
                          {application.jobSeeker.firstName}{" "}
                          {application.jobSeeker.lastName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border self-start ${getStatusColor(
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

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                      <div className="flex items-center gap-2">
                        <MdEmail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <a
                          href={`mailto:${application.jobSeeker.user.email}`}
                          className="truncate text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {application.jobSeeker.user.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdPhone className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        {application.jobSeeker.phone ? (
                          <a
                            href={`tel:${
                              application.jobSeeker.countryCode || ""
                            }${application.jobSeeker.phone}`}
                            className="truncate text-primary hover:text-primary/80 hover:underline transition-colors"
                          >
                            {application.jobSeeker.countryCode}{" "}
                            {application.jobSeeker.phone}
                          </a>
                        ) : (
                          <span className="truncate text-muted-foreground">
                            Not provided
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MdLocationOn className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">
                          {application.jobSeeker.location || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdWork className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">
                          {application.jobSeeker.experience || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:ml-6 mt-3 lg:mt-0 w-full lg:w-auto">
                    {/* Status Update */}
                    <select
                      value={application.status}
                      onChange={(e) =>
                        handleStatusChangeRequest(
                          application.id,
                          e.target.value,
                          `${application.jobSeeker.firstName} ${application.jobSeeker.lastName}`,
                          application.status
                        )
                      }
                      className="px-2 sm:px-3 py-2 border border-border rounded-lg text-xs sm:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors w-full sm:w-auto"
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
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <MdSchedule className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          {application.interviews &&
                          application.interviews.length > 0
                            ? "Schedule Another"
                            : "Schedule Interview"}
                        </span>
                        <span className="sm:hidden">Interview</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <MdAttachFile className="w-3 h-3 sm:w-4 sm:h-4" />
                    Documents & Resume
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {/* Profile CV */}
                    {application.jobSeeker.cvUrl && (
                      <a
                        href={formatImageUrl(application.jobSeeker.cvUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
                      >
                        <MdAttachFile className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            Profile Resume/CV
                          </p>
                          <p className="text-xs opacity-80">
                            From candidate&apos;s profile
                          </p>
                        </div>
                        <MdVisibility className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      </a>
                    )}

                    {/* Application Documents */}
                    {application.attachments &&
                      application.attachments.length > 0 && (
                        <>
                          {application.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={formatImageUrl(attachment.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 sm:gap-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              <MdAttachFile className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs sm:text-sm truncate">
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
                              <MdVisibility className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            </a>
                          ))}
                        </>
                      )}

                    {/* No documents message */}
                    {!application.jobSeeker.cvUrl &&
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
                {application.jobSeeker.skills.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                      <MdWork className="w-3 h-3 sm:w-4 sm:h-4" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {application.jobSeeker.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio/About */}
                {application.jobSeeker.bio && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                      <MdDescription className="w-3 h-3 sm:w-4 sm:h-4" />
                      About
                    </h4>
                    <div className="bg-muted p-3 sm:p-4 rounded-lg">
                      <p className="text-foreground text-sm leading-relaxed">
                        {application.jobSeeker.bio}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {application.coverLetter && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                      <MdDescription className="w-3 h-3 sm:w-4 sm:h-4" />
                      Cover Letter
                    </h4>
                    <div className="bg-muted p-3 sm:p-4 rounded-lg">
                      <p className="text-foreground text-sm leading-relaxed">
                        {application.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interviews Section */}
                {application.interviews &&
                  application.interviews.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h4 className="text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                        <MdEventNote className="w-3 h-3 sm:w-4 sm:h-4" />
                        Scheduled Interviews ({application.interviews.length})
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {application.interviews.map((interview) => (
                          <div
                            key={interview.id}
                            className="bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4"
                          >
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
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

                            {/* Content Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              {/* Date & Time */}
                              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
                                <MdAccessTime className="w-4 h-4 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">
                                    {new Date(
                                      interview.scheduledDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs opacity-75">
                                    at{" "}
                                    {formatTimeToAMPM(interview.scheduledTime)}
                                  </p>
                                </div>
                              </div>

                              {/* Location/Meeting Info */}
                              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
                                {interview.isVirtual ? (
                                  <>
                                    <MdVideoCall className="w-4 h-4 mt-0.5 shrink-0" />
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
                                    <MdPlace className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium">
                                        Location
                                      </p>
                                      <p className="text-xs opacity-75 wrap-break-word">
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
                                    <MdDescription className="w-4 h-4 mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                                        Notes
                                      </p>
                                      <p className="text-xs text-blue-600 dark:text-blue-400 opacity-90 leading-relaxed wrap-break-word">
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
            className="mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-border">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                {applications.length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Total
              </div>
            </div>
            <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-border">
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getStatusBadgeColor(
                  "PENDING"
                )}`}
              >
                {applications.filter((a) => a.status === "PENDING").length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Pending
              </div>
            </div>
            <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-border">
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getStatusBadgeColor(
                  "REVIEWED"
                )}`}
              >
                {applications.filter((a) => a.status === "REVIEWED").length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Reviewed
              </div>
            </div>
            <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-border">
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getStatusBadgeColor(
                  "SHORTLISTED"
                )}`}
              >
                {applications.filter((a) => a.status === "SHORTLISTED").length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Shortlisted
              </div>
            </div>
            <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-border">
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getStatusBadgeColor(
                  "HIRED"
                )}`}
              >
                {applications.filter((a) => a.status === "HIRED").length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Hired
              </div>
            </div>
            <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-border">
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getStatusBadgeColor(
                  "REJECTED"
                )}`}
              >
                {applications.filter((a) => a.status === "REJECTED").length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Rejected
              </div>
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
          applicantName={`${selectedApplication.jobSeeker.firstName} ${selectedApplication.jobSeeker.lastName}`}
          jobTitle={job?.title || "Position"}
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
          jobTitle={job?.title || "Position"}
          onSave={handleInterviewUpdated}
        />
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && pendingStatusChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Confirm Status Change
              </h3>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <MdEmail className="w-5 h-5 text-blue-500 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      📧 Email Notification
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {pendingStatusChange.applicantName} will receive an email
                      notification about this status change.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Are you sure you want to change{" "}
                <strong>{pendingStatusChange.applicantName}</strong>&apos;s
                application status from{" "}
                <strong>{pendingStatusChange.currentStatus}</strong> to{" "}
                <strong>{pendingStatusChange.newStatus}</strong>?
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusConfirm(false);
                    setPendingStatusChange(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={confirmStatusChange} className="flex-1">
                  Confirm Change
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
