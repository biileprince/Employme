import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { applicationsAPI } from "../../services/api";

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  coverLetter?: string;
  location: string;
  jobType: string;
  salary?: string;
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED"
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
        setApplications(applicationsData as Application[]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-700";
      case "REVIEWING":
        return "bg-primary/10 text-primary";
      case "ACCEPTED":
        return "bg-secondary/10 text-secondary";
      case "REJECTED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "REVIEWING":
        return "👀";
      case "ACCEPTED":
        return "✅";
      case "REJECTED":
        return "❌";
      default:
        return "📄";
    }
  };

  const filteredApplications = applications.filter(
    (app) => filter === "ALL" || app.status === filter
  );

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    reviewing: applications.filter((a) => a.status === "REVIEWING").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          My Applications
        </h1>
        <p className="text-muted-foreground">
          Track the status of your job applications
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-foreground">
            {stats.total}
          </div>
          <div className="text-muted-foreground text-sm">
            Total Applications
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="text-muted-foreground text-sm">Pending</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-primary">
            {stats.reviewing}
          </div>
          <div className="text-muted-foreground text-sm">Under Review</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-secondary">
            {stats.accepted}
          </div>
          <div className="text-muted-foreground text-sm">Accepted</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-destructive">
            {stats.rejected}
          </div>
          <div className="text-muted-foreground text-sm">Rejected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6">
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status.replace("_", " ")}
              {status !== "ALL" && (
                <span className="ml-2 bg-background/20 rounded-full px-2 py-1 text-xs">
                  {applications.filter((app) => app.status === status).length}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
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
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors inline-block"
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
              className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {application.jobTitle}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {getStatusIcon(application.status)}{" "}
                      {application.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-muted-foreground text-lg font-medium mb-2">
                    {application.companyName}
                  </div>

                  <div className="flex items-center text-muted-foreground text-sm space-x-4 mb-3">
                    <span>📍 {application.location}</span>
                    <span>💼 {application.jobType}</span>
                    {application.salary && <span>💰 {application.salary}</span>}
                  </div>

                  <div className="text-muted-foreground text-sm">
                    Applied:{" "}
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    to={`/jobs/${application.jobId}`}
                    className="bg-muted text-muted-foreground px-3 py-1 rounded-md text-sm hover:bg-muted/80 transition-colors"
                  >
                    View Job
                  </Link>
                </div>
              </div>

              {/* Cover Letter Preview */}
              {application.coverLetter && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Your Cover Letter:
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              {/* Application Status Progress */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
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
                      application.status === "REVIEWING"
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    Under Review
                  </span>
                  <span
                    className={
                      ["ACCEPTED", "REJECTED"].includes(application.status)
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    Decision
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      application.status === "PENDING"
                        ? "w-1/3 bg-yellow-500"
                        : application.status === "REVIEWING"
                        ? "w-2/3 bg-blue-500"
                        : application.status === "ACCEPTED"
                        ? "w-full bg-green-500"
                        : application.status === "REJECTED"
                        ? "w-full bg-red-500"
                        : "w-1/3 bg-gray-400"
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
          className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Application Status Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>⏳ Pending:</strong> Your application has been submitted
              and is waiting to be reviewed.
            </div>
            <div>
              <strong>👀 Under Review:</strong> The employer is currently
              reviewing your application.
            </div>
            <div>
              <strong>✅ Accepted:</strong> Congratulations! The employer is
              interested in moving forward.
            </div>
            <div>
              <strong>❌ Rejected:</strong> Unfortunately, you weren't selected
              for this position.
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
