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
} from "react-icons/md";
import Button from "../../components/ui/Button";
import { applicationsAPI } from "../../services/api";

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
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    skills: string[];
    experience?: string;
    phone?: string;
    countryCode?: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    fileType: string;
  }>;
}

export default function EmployerApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  >("ALL");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationsAPI.getEmployerApplications();

        if (response.success && (response.data as any)?.applications) {
          setApplications((response.data as any).applications);
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
                          {application.jobSeeker.user.firstName}{" "}
                          {application.jobSeeker.user.lastName}
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
                    <Link
                      to={`/employer/jobs/${application.job.id}/applications`}
                      className="flex-1 lg:flex-none"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <MdVisibility className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
