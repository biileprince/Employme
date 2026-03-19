"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdWork,
  MdEmail,
  MdLocationOn,
  MdDateRange,
  MdVisibility,
  MdDescription,
  MdSchedule,
  MdVideoCall,
  MdPlace,
  MdAccessTime,
  MdEdit,
  MdDelete,
  MdClose,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { formatImageUrl } from "@/lib/api";
import { 
  updateApplicationStatus, 
  scheduleInterview, 
  updateInterview, 
  deleteInterview 
} from "@/app/actions/application";

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
  interviews?: Interview[];
}

export interface ApplicationsContentProps {
  initialApplications: Application[];
}

export default function ApplicationsContent({ initialApplications }: ApplicationsContentProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  >("ALL");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    applicationId: string;
    newStatus: string;
    applicantName: string;
    currentStatus: string;
  } | null>(null);

  // Interview modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    description: "",
    location: "",
    isVirtual: false,
    meetingLink: "",
  });
  const [editFormData, setEditFormData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    description: "",
    location: "",
    meetingLink: "",
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");



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
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "SHORTLISTED":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "HIRED":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const filteredApplications = applications.filter(
    (app) => filter === "ALL" || app.status === filter
  );

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    // Optimistic Update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus as any } : app
      )
    );

    const result = await updateApplicationStatus(applicationId, newStatus);
    if (!result.success) {
      setError(result.error || "Failed to update application status");
      // Could revert the optimistic update here if we stored the previous state
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatusChange) {
      await handleUpdateApplicationStatus(
        pendingStatusChange.applicationId,
        pendingStatusChange.newStatus
      );
    }
    setShowStatusConfirm(false);
    setPendingStatusChange(null);
  };

  // Interview handlers
  const handleScheduleInterview = (application: Application) => {
    setSelectedApplication(application);
    setScheduleFormData({
      scheduledDate: "",
      scheduledTime: "",
      description: "",
      location: "",
      isVirtual: false,
      meetingLink: "",
    });
    setShowScheduleModal(true);
  };

  const handleSubmitInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    setIsScheduling(true);
    setScheduleError("");

    const result = await scheduleInterview(selectedApplication.id, scheduleFormData);
    if (result.success) {
      setShowScheduleModal(false);
      // Data automatically revalidated on server, but we need router.refresh() or initial data update to see changes immediately.
      // Easiest is to let Server Action revalidation handle next fetch and visually rely on page refresh. 
      // Actually, since this is a Client Component with duplicated state `applications`, we should update local state manually or let next router handle it.
      // Assuming parent server-component will push new `initialApplications`.
      window.location.reload(); 
    } else {
      setScheduleError(result.error || "Failed to schedule interview. Please try again.");
    }
    
    setIsScheduling(false);
  };

  const handleEditInterview = (
    application: Application,
    interview: Interview
  ) => {
    setSelectedApplication(application);
    setSelectedInterview(interview);
    setEditFormData({
      scheduledDate: interview.scheduledDate.split("T")[0],
      scheduledTime: interview.scheduledTime,
      description: interview.description || "",
      location: interview.location || "",
      meetingLink: interview.meetingLink || "",
    });
    setShowEditModal(true);
  };

  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    setIsScheduling(true);
    setScheduleError("");

    const result = await updateInterview(selectedInterview.id, editFormData);
    if (result.success) {
      setShowEditModal(false);
      window.location.reload();
    } else {
      setScheduleError(result.error || "Failed to update interview. Please try again.");
    }
    
    setIsScheduling(false);
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to delete this interview?")) return;

    const result = await deleteInterview(interviewId);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || "Failed to delete interview");
    }
  };

  const formatTimeToAMPM = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };



  if (error && applications.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Job Applications
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage applications received for your job postings
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-3 sm:p-4"
          >
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total
            </h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
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
              className="bg-card border border-border rounded-lg p-3 sm:p-4"
            >
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground capitalize">
                {status.toLowerCase()}
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {statusCounts[status] || 0}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
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
              className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
          <div className="text-center py-8 sm:py-12">
            <MdWork className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              {filter === "ALL"
                ? "No applications yet"
                : `No ${filter.toLowerCase()} applications`}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
              {filter === "ALL"
                ? "Applications will appear here when candidates apply to your jobs."
                : `No applications with ${filter.toLowerCase()} status found.`}
            </p>
            {filter === "ALL" && (
              <Link href="/employer/my-jobs">
                <Button size="sm">View My Jobs</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  {/* Applicant Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                          {application.jobSeeker.firstName}{" "}
                          {application.jobSeeker.lastName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <MdEmail className="w-4 h-4" />
                            <a
                              href={`mailto:${application.jobSeeker.user.email}`}
                              className="text-primary hover:text-primary/80 hover:underline transition-colors"
                            >
                              {application.jobSeeker.user.email}
                            </a>
                          </div>
                          {application.jobSeeker.phone && (
                            <div className="flex items-center gap-1">
                              <MdLocationOn className="w-4 h-4" />
                              <a
                                href={`tel:${
                                  application.jobSeeker.countryCode || ""
                                }${application.jobSeeker.phone}`}
                                className="text-primary hover:text-primary/80 hover:underline transition-colors"
                              >
                                {application.jobSeeker.countryCode}{" "}
                                {application.jobSeeker.phone}
                              </a>
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
                      <p className="font-medium text-sm sm:text-base text-foreground">
                        Applied for: {application.job.title}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
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
                                <a
                                  key={index}
                                  href={formatImageUrl(attachment.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <MdDescription className="w-3 h-3" />
                                  {attachment.filename}
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Interviews */}
                    {application.interviews &&
                      application.interviews.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <MdSchedule className="w-4 h-4" />
                            Scheduled Interviews (
                            {application.interviews.length})
                          </p>
                          <div className="space-y-3">
                            {application.interviews.map((interview) => (
                              <div
                                key={interview.id}
                                className="relative bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                      {interview.status}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleEditInterview(
                                          application,
                                          interview
                                        )
                                      }
                                      className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-md transition-colors"
                                      title="Edit Interview"
                                    >
                                      <MdEdit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteInterview(interview.id)
                                      }
                                      className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-md transition-colors"
                                      title="Delete Interview"
                                    >
                                      <MdDelete className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <MdDateRange className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium">
                                      {new Date(
                                        interview.scheduledDate
                                      ).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <MdAccessTime className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium">
                                      {formatTimeToAMPM(
                                        interview.scheduledTime
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 sm:col-span-2">
                                    {interview.isVirtual ? (
                                      <MdVideoCall className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <MdPlace className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    )}
                                    <span className="truncate">
                                      {interview.location}
                                    </span>
                                  </div>

                                  {interview.meetingLink && (
                                    <div className="sm:col-span-2">
                                      <a
                                        href={interview.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        <MdVideoCall className="w-4 h-4" />
                                        Join Meeting
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {interview.description && (
                                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {interview.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-1 lg:gap-2 w-full lg:w-auto">
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
                      className="w-full lg:w-auto px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent dark:bg-background dark:text-foreground dark:border-border h-10"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="HIRED">Hired</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScheduleInterview(application)}
                      className="w-full lg:w-auto h-10 flex items-center justify-center gap-2 px-3 py-2 text-sm"
                    >
                      <MdSchedule className="w-4 h-4" />
                      <span>Schedule Interview</span>
                    </Button>

                    <Link
                      href={`/employer/jobs/${application.job.id}/applications`}
                      className="flex-1 lg:flex-none"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full lg:w-auto h-10 flex items-center justify-center gap-2 px-3 py-2 text-sm"
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

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Schedule Interview
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedApplication.jobSeeker.firstName}{" "}
                    {selectedApplication.jobSeeker.lastName} for{" "}
                    {selectedApplication.job.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {scheduleError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  {scheduleError}
                </div>
              )}

              <form onSubmit={handleSubmitInterview} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduleFormData.scheduledDate}
                      onChange={(e) =>
                        setScheduleFormData({
                          ...scheduleFormData,
                          scheduledDate: e.target.value,
                        })
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
                      value={scheduleFormData.scheduledTime}
                      onChange={(e) =>
                        setScheduleFormData({
                          ...scheduleFormData,
                          scheduledTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={scheduleFormData.isVirtual}
                    onChange={(e) =>
                      setScheduleFormData({
                        ...scheduleFormData,
                        isVirtual: e.target.checked,
                      })
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

                {scheduleFormData.isVirtual ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={scheduleFormData.meetingLink}
                      onChange={(e) =>
                        setScheduleFormData({
                          ...scheduleFormData,
                          meetingLink: e.target.value,
                          location: e.target.value,
                        })
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
                      value={scheduleFormData.location}
                      onChange={(e) =>
                        setScheduleFormData({
                          ...scheduleFormData,
                          location: e.target.value,
                        })
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
                    value={scheduleFormData.description}
                    onChange={(e) =>
                      setScheduleFormData({
                        ...scheduleFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScheduleModal(false)}
                    disabled={isScheduling}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isScheduling}
                    className="flex-1"
                  >
                    {isScheduling ? "Scheduling..." : "Schedule Interview"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Interview Modal */}
      {showEditModal && selectedInterview && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Edit Interview
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedApplication.jobSeeker.firstName}{" "}
                    {selectedApplication.jobSeeker.lastName} for{" "}
                    {selectedApplication.job.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {scheduleError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  {scheduleError}
                </div>
              )}

              <form onSubmit={handleSaveInterview} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={editFormData.scheduledDate}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          scheduledDate: e.target.value,
                        })
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
                      value={editFormData.scheduledTime}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          scheduledTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {selectedInterview.isVirtual ? "Meeting Link" : "Location"}
                  </label>
                  {selectedInterview.isVirtual ? (
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={editFormData.meetingLink}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          meetingLink: e.target.value,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Office address or meeting room"
                      value={editFormData.location}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Additional information..."
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    disabled={isScheduling}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isScheduling}
                    className="flex-1"
                  >
                    {isScheduling ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
