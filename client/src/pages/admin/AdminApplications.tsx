import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";
import {
  MdAssignment,
  MdSearch,
  MdDelete,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdStar,
  MdBusiness,
  MdPerson,
  MdCalendarToday,
  MdNavigateNext,
  MdNavigateBefore,
  MdRefresh,
  MdClose,
  MdDescription,
  MdWork,
  MdEmail,
  MdTableChart,
} from "react-icons/md";
import { adminAPI } from "../../services/api";
import Button from "../../components/ui/Button";

interface Application {
  id: string;
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  coverLetter?: string;
  appliedAt: string | Date;
  updatedAt: string | Date;
  job: {
    id: string;
    title: string;
    location: string;
    type: string;
    employer: {
      id: string;
      companyName?: string;
      countryCode?: string;
      phone?: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
  jobSeeker: {
    id: string;
    skills: string[];
    experience?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface ApplicationsData {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  // Application Details Modal State
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await adminAPI.getAllApplications(params);

      if (response.success) {
        const data = response.data as ApplicationsData;
        setApplications(data.applications);
        setTotalPages(data.pagination.pages);
        setTotalApplications(data.pagination.total);
      } else {
        setError("Failed to load applications");
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load applications. Please try again.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDeleteApplication = async (applicationId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this application? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading(applicationId);
      const response = await adminAPI.deleteApplication(applicationId);

      if (response.success) {
        await fetchApplications(); // Refresh the list
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(null);
          setShowApplicationModal(false);
        }
      } else {
        setError("Failed to delete application");
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
      setError("Failed to delete application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchApplications();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) {
      return "Not available";
    }

    let date: Date;

    // Handle both string and Date object inputs
    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === "string") {
      // Remove any timezone info and parse as UTC to avoid timezone issues
      date = new Date(dateString);
    } else {
      return "Invalid format";
    }

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    try {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Format error";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <MdPending className="w-5 h-5 text-yellow-500" />;
      case "REVIEWED":
        return <MdVisibility className="w-5 h-5 text-blue-500" />;
      case "SHORTLISTED":
        return <MdStar className="w-5 h-5 text-purple-500" />;
      case "REJECTED":
        return <MdCancel className="w-5 h-5 text-red-500" />;
      case "HIRED":
        return <MdCheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <MdPending className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "REVIEWED":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "SHORTLISTED":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      case "HIRED":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleCloseModal = () => {
    setSelectedApplication(null);
    setShowApplicationModal(false);
  };

  const exportApplicationsToExcel = async () => {
    try {
      setActionLoading("export");

      // Use currently loaded applications data instead of fetching again
      let applicationsData = applications;

      // If we need more data (beyond current page), fetch all applications
      if (totalApplications > applications.length) {
        const params = new URLSearchParams({
          page: "1",
          limit: "1000", // Large limit to get all applications
        });

        // Apply current filters to export
        if (searchTerm) params.append("search", searchTerm);
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const response = await adminAPI.getAllApplications(params);

        if (response.success) {
          applicationsData = (response.data as ApplicationsData).applications;
        } else {
          setError("Failed to fetch applications for export");
          return;
        }
      }

      if (applicationsData.length === 0) {
        setError("No applications to export");
        return;
      }

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Applications Export");

      // Define columns with proper formatting
      worksheet.columns = [
        { header: "Application ID", key: "id", width: 20 },
        { header: "Job Title", key: "jobTitle", width: 30 },
        { header: "Company", key: "company", width: 25 },
        { header: "Employer Name", key: "employerName", width: 25 },
        { header: "Employer Email", key: "employerEmail", width: 30 },
        { header: "Employer Phone", key: "employerPhone", width: 18 },
        { header: "Job Seeker Name", key: "jobSeekerName", width: 25 },
        { header: "Job Seeker Email", key: "jobSeekerEmail", width: 30 },
        { header: "Job Seeker Skills", key: "skills", width: 40 },
        { header: "Experience Level", key: "experience", width: 20 },
        { header: "Job Location", key: "jobLocation", width: 20 },
        { header: "Job Type", key: "jobType", width: 15 },
        { header: "Application Status", key: "status", width: 15 },
        { header: "Applied Date", key: "appliedDate", width: 20 },
        { header: "Last Updated", key: "updatedDate", width: 20 },
        { header: "Days Since Applied", key: "daysSinceApplied", width: 20 },
        { header: "Cover Letter", key: "coverLetter", width: 50 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6F3FF" },
      };

      // Add data rows
      applicationsData.forEach((application) => {
        const appliedDate = new Date(application.appliedAt);
        const daysSinceApplied =
          appliedDate.getTime() && !isNaN(appliedDate.getTime())
            ? Math.floor(
                (new Date().getTime() - appliedDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;

        // Format employer phone number
        const formatEmployerPhone = () => {
          if (application.job.employer.phone) {
            const countryCode = application.job.employer.countryCode || "+233";
            return `${countryCode} ${application.job.employer.phone}`;
          }
          return "Not provided";
        };

        worksheet.addRow({
          id: application.id,
          jobTitle: application.job.title,
          company: application.job.employer.companyName || "Not specified",
          employerName: `${application.job.employer.user.firstName} ${application.job.employer.user.lastName}`,
          employerEmail: application.job.employer.user.email,
          employerPhone: formatEmployerPhone(),
          jobSeekerName: `${application.jobSeeker.user.firstName} ${application.jobSeeker.user.lastName}`,
          jobSeekerEmail: application.jobSeeker.user.email,
          skills: application.jobSeeker.skills.join(", ") || "Not specified",
          experience: application.jobSeeker.experience || "Not specified",
          jobLocation: application.job.location,
          jobType: application.job.type?.replace(/_/g, " ") || "Full Time",
          status: application.status,
          appliedDate: formatDate(application.appliedAt),
          updatedDate: formatDate(application.updatedAt),
          daysSinceApplied: daysSinceApplied,
          coverLetter: application.coverLetter
            ? application.coverLetter.replace(/\n/g, " ").substring(0, 500)
            : "No cover letter provided",
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        if (column.key !== "coverLetter") {
          column.width = Math.max(column.width || 10, 12);
        }
      });

      // Generate filename with filter info
      let filename = "applications_export";
      if (statusFilter !== "all") filename += `_${statusFilter.toLowerCase()}`;
      if (searchTerm) filename += "_filtered";
      filename += `_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Create and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(
        `Exported ${applicationsData.length} applications to ${filename}`
      );
    } catch (err) {
      console.error("Failed to export applications:", err);
      setError("Failed to export applications");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MdAssignment className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Applications Management
                </h1>
                <p className="text-muted-foreground">
                  Oversee all job applications across the platform
                </p>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={exportApplicationsToExcel}
              variant="primary"
              isLoading={actionLoading === "export"}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 border-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[100px] sm:min-w-[140px]"
            >
              <MdTableChart className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                {actionLoading === "export" ? "Exporting..." : "Export Excel"}
              </span>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdAssignment className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalApplications}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdPending className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {
                      applications.filter((app) => app.status === "PENDING")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdStar className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Shortlisted</p>
                  <p className="text-2xl font-bold text-foreground">
                    {
                      applications.filter((app) => app.status === "SHORTLISTED")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdCheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Hired</p>
                  <p className="text-2xl font-bold text-foreground">
                    {
                      applications.filter((app) => app.status === "HIRED")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdCancel className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-foreground">
                    {
                      applications.filter((app) => app.status === "REJECTED")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative min-w-0">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by job title, applicant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-0 sm:min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>

              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  variant="primary"
                  className="flex items-center justify-center gap-2 px-4 py-3 min-w-0 flex-1 sm:flex-none sm:min-w-[100px]"
                >
                  <MdSearch className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Search</span>
                </Button>
                <Button
                  onClick={fetchApplications}
                  variant="outline"
                  className="flex items-center justify-center p-3 min-w-[48px]"
                  title="Refresh"
                >
                  <MdRefresh className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              onClick={() => setError("")}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Dismiss
            </Button>
          </motion.div>
        )}

        {/* Applications Table - Responsive */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <MdAssignment className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Applications Found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "No applications have been submitted yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {/* Table Header */}
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
                    <div className="col-span-3">Job & Company</div>
                    <div className="col-span-3">Applicant</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Applied Date</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                {/* Desktop Table Body */}
                <div className="divide-y divide-border">
                  {applications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Job & Company */}
                        <div className="col-span-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MdWork className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-foreground truncate">
                                {application.job.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <MdBusiness className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {application.job.employer.companyName ||
                                    `${application.job.employer.user.firstName} ${application.job.employer.user.lastName}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Applicant */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            <MdPerson className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">
                                {application.jobSeeker.user.firstName}{" "}
                                {application.jobSeeker.user.lastName}
                              </p>
                              <div className="flex items-center gap-1">
                                <MdEmail className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                <a
                                  href={`mailto:${application.jobSeeker.user.email}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 underline truncate"
                                  title={`Send email to ${application.jobSeeker.user.email}`}
                                >
                                  {application.jobSeeker.user.email}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(application.status)}
                            <span
                              className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {application.status}
                            </span>
                          </div>
                        </div>

                        {/* Applied Date */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MdCalendarToday className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(application.appliedAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleViewApplication(application)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading !== null}
                            >
                              <MdVisibility className="w-4 h-4" />
                            </Button>

                            <Button
                              onClick={() =>
                                handleDeleteApplication(application.id)
                              }
                              variant="outline"
                              size="sm"
                              isLoading={actionLoading === application.id}
                              disabled={actionLoading !== null}
                            >
                              <MdDelete className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {applications.map((application, index) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Application Header - Mobile */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MdWork className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {application.job.title}
                          </h3>
                          {getStatusIcon(application.status)}
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <MdBusiness className="w-4 h-4" />
                          <span className="truncate">
                            {application.job.employer.companyName ||
                              `${application.job.employer.user.firstName} ${application.job.employer.user.lastName}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <MdPerson className="w-4 h-4" />
                          <span className="truncate">
                            {application.jobSeeker.user.firstName}{" "}
                            {application.jobSeeker.user.lastName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Application Details - Mobile */}
                    <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                      <span
                        className={`px-2 py-1 rounded-full border ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                      <span>Applied: {formatDate(application.appliedAt)}</span>
                    </div>

                    {/* Actions - Mobile */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleViewApplication(application)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading !== null}
                        className="flex-1 min-w-0 px-3 py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <MdVisibility className="w-4 h-4" />
                        <span className="truncate">View</span>
                      </Button>

                      <Button
                        onClick={() => handleDeleteApplication(application.id)}
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === application.id}
                        disabled={actionLoading !== null}
                        className="min-w-[44px] px-3 py-2 text-red-500 flex items-center justify-center"
                      >
                        <MdDelete className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * 10 + 1} to{" "}
                      {Math.min(currentPage * 10, totalApplications)} of{" "}
                      {totalApplications} applications
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <MdNavigateBefore className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-foreground px-3">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        <MdNavigateNext className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Application Details Modal */}
        {showApplicationModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border">
                <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MdAssignment className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-words">
                      Application for {selectedApplication.job.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground break-words">
                      By {selectedApplication.jobSeeker.user.firstName}{" "}
                      {selectedApplication.jobSeeker.user.lastName}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 p-2"
                >
                  <MdClose className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
                {/* Application Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdWork className="w-4 h-4 flex-shrink-0" />
                        Job Information
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1 break-words">
                        {selectedApplication.job.title}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {selectedApplication.job.location} •{" "}
                        {selectedApplication.job.type}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdBusiness className="w-4 h-4 flex-shrink-0" />
                        Company
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {selectedApplication.job.employer.companyName ||
                          `${selectedApplication.job.employer.user.firstName} ${selectedApplication.job.employer.user.lastName}`}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdCalendarToday className="w-4 h-4 flex-shrink-0" />
                        Applied Date
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {formatDate(selectedApplication.appliedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdPerson className="w-4 h-4 flex-shrink-0" />
                        Applicant
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {selectedApplication.jobSeeker.user.firstName}{" "}
                        {selectedApplication.jobSeeker.user.lastName}
                      </p>
                      <a
                        href={`mailto:${selectedApplication.jobSeeker.user.email}`}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline block"
                      >
                        {selectedApplication.jobSeeker.user.email}
                      </a>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Experience Level
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {selectedApplication.jobSeeker.experience ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Skills
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedApplication.jobSeeker.skills.length > 0 ? (
                          selectedApplication.jobSeeker.skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No skills listed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div className="mb-4 sm:mb-6">
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 sm:mb-3">
                      <MdDescription className="w-4 h-4 flex-shrink-0" />
                      Cover Letter
                    </label>
                    <div className="bg-muted/20 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Application Status */}
                <div className="mb-6">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                    <MdAssignment className="w-4 h-4 flex-shrink-0" />
                    Application Status
                  </label>
                  <div className="flex items-center gap-4">
                    {getStatusIcon(selectedApplication.status)}
                    <span
                      className={`px-3 py-1 rounded-full border ${getStatusColor(
                        selectedApplication.status
                      )}`}
                    >
                      {selectedApplication.status}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-border pt-4 sm:pt-6 mt-6">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-[80px] order-last sm:order-first"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() =>
                        handleDeleteApplication(selectedApplication.id)
                      }
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === selectedApplication.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px] text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <span className="truncate text-xs sm:text-sm">
                        Delete Application
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
