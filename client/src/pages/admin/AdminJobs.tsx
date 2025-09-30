import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";
import {
  MdWork,
  MdSearch,
  MdDelete,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdStar,
  MdStarBorder,
  MdBusiness,
  MdLocationOn,
  MdAttachMoney,
  MdCalendarToday,
  MdNavigateNext,
  MdNavigateBefore,
  MdRefresh,
  MdClose,
  MdDescription,
  MdCategory,
  MdAccessTime,
  MdTableChart,
  MdPhone,
  MdEmail,
} from "react-icons/md";
import { adminAPI } from "../../services/api";
import Button from "../../components/ui/Button";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  type?: string;
  category?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
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
  _count: {
    applications: number;
  };
}

interface JobsData {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Job Details Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const fetchJobs = useCallback(async () => {
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
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const response = await adminAPI.getAllJobs(params);

      if (response.success) {
        const data = response.data as JobsData;
        setJobs(data.jobs);
        setTotalPages(data.pagination.pages);
        setTotalJobs(data.pagination.total);
      } else {
        setError("Failed to load jobs");
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load jobs. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobAction = async (jobId: string, action: string) => {
    // Confirmation prompts for job actions
    const actionMessages = {
      activate:
        "Are you sure you want to activate this job? It will become visible to job seekers.",
      deactivate:
        "Are you sure you want to deactivate this job? It will be hidden from job seekers.",
      feature:
        "Are you sure you want to feature this job? It will be highlighted on the platform.",
      unfeature:
        "Are you sure you want to unfeature this job? It will no longer be highlighted.",
    };

    const confirmMessage =
      actionMessages[action as keyof typeof actionMessages];
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(jobId);
      const response = await adminAPI.manageJob(jobId, action);

      if (response.success) {
        await fetchJobs(); // Refresh the list
      } else {
        setError(`Failed to ${action} job`);
      }
    } catch (err) {
      console.error(`Failed to ${action} job:`, err);
      setError(`Failed to ${action} job`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading(jobId);
      const response = await adminAPI.deleteJob(jobId);

      if (response.success) {
        await fetchJobs(); // Refresh the list
      } else {
        setError("Failed to delete job");
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
      setError("Failed to delete job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && max)
      return `GH₵${min.toLocaleString()} - GH₵${max.toLocaleString()}`;
    if (min) return `GH₵${min.toLocaleString()}+`;
    return `Up to GH₵${max?.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatJobType = (type?: string) => {
    if (!type) return "Full Time"; // Default to Full Time instead of "Not specified"

    // Handle common job type formats
    const formatted = type.replace(/_/g, " ").toLowerCase();

    // Capitalize each word
    return formatted
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setShowJobModal(false);
  };

  const exportJobsToExcel = async () => {
    try {
      setActionLoading("export");

      // Fetch all jobs for export with current filters applied
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Large limit to get all jobs
      });

      // Apply current filters to export
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const response = await adminAPI.getAllJobs(params);

      if (response.success) {
        const jobsData = (response.data as JobsData).jobs;

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Jobs Export");

        // Define columns with proper formatting
        worksheet.columns = [
          { header: "Job ID", key: "id", width: 20 },
          { header: "Job Title", key: "title", width: 30 },
          { header: "Company", key: "company", width: 25 },
          { header: "Contact Person", key: "contactPerson", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Contact Phone", key: "contactPhone", width: 18 },
          { header: "Location", key: "location", width: 20 },
          { header: "Job Type", key: "type", width: 15 },
          { header: "Category", key: "category", width: 20 },
          { header: "Min Salary", key: "salaryMin", width: 15 },
          { header: "Max Salary", key: "salaryMax", width: 15 },
          { header: "Salary Range", key: "salaryRange", width: 25 },
          { header: "Applications", key: "applications", width: 15 },
          { header: "Status", key: "status", width: 12 },
          { header: "Featured", key: "featured", width: 12 },
          { header: "Posted Date", key: "postedDate", width: 15 },
          { header: "Last Updated", key: "updatedDate", width: 15 },
          { header: "Days Active", key: "daysActive", width: 15 },
          { header: "Description", key: "description", width: 50 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6F3FF" },
        };

        // Add data rows
        jobsData.forEach((job) => {
          const postedDate = new Date(job.createdAt);
          const daysActive = Math.floor(
            (new Date().getTime() - postedDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Format contact phone number
          const formatContactPhone = () => {
            if (job.employer.phone) {
              const countryCode = job.employer.countryCode || "+233";
              return `${countryCode} ${job.employer.phone}`;
            }
            return "Not provided";
          };

          worksheet.addRow({
            id: job.id,
            title: job.title,
            company: job.employer.companyName || "Not specified",
            contactPerson: `${job.employer.user.firstName} ${job.employer.user.lastName}`,
            email: job.employer.user.email,
            contactPhone: formatContactPhone(),
            location: job.location,
            type: formatJobType(job.type),
            category: job.category
              ? job.category.replace("_", " ")
              : "Uncategorized",
            salaryMin: job.salaryMin || "",
            salaryMax: job.salaryMax || "",
            salaryRange: formatSalary(job.salaryMin, job.salaryMax),
            applications: job._count.applications,
            status: job.isActive ? "Active" : "Inactive",
            featured: job.isFeatured ? "Yes" : "No",
            postedDate: formatDate(job.createdAt),
            updatedDate: formatDate(job.updatedAt),
            daysActive: daysActive,
            description: job.description.replace(/\n/g, " ").substring(0, 500),
          });
        });

        // Auto-fit columns
        worksheet.columns.forEach((column) => {
          if (column.key !== "description") {
            column.width = Math.max(column.width || 10, 12);
          }
        });

        // Generate filename with filter info
        let filename = "jobs_export";
        if (statusFilter !== "all") filename += `_${statusFilter}`;
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

        console.log(`Exported ${jobsData.length} jobs to ${filename}`);
      } else {
        setError("Failed to fetch jobs for export");
      }
    } catch (err) {
      console.error("Failed to export jobs:", err);
      setError("Failed to export jobs");
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
                <MdWork className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Job Management
                </h1>
                <p className="text-muted-foreground">
                  Manage all job postings across the platform
                </p>
              </div>
            </div>

            {/* Export Button - Enhanced Responsive Design */}
            <Button
              onClick={exportJobsToExcel}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdWork className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalJobs}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdCheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {jobs.filter((job) => job.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdStar className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Featured Jobs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {jobs.filter((job) => job.isFeatured).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MdCancel className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Inactive Jobs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {jobs.filter((job) => !job.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters - Enhanced Responsive Design */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative min-w-0">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title, description, or location..."
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
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-0 sm:min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                  onClick={fetchJobs}
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

        {/* Jobs Table - Responsive */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <MdWork className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Jobs Found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "No jobs have been posted yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {/* Table Header */}
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
                    <div className="col-span-3">Job Details</div>
                    <div className="col-span-2">Company</div>
                    <div className="col-span-2">Salary</div>
                    <div className="col-span-1">Applications</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                </div>

                {/* Desktop Table Body */}
                <div className="divide-y divide-border">
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Job Details */}
                        <div className="col-span-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MdWork className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-foreground truncate">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <MdLocationOn className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{job.location}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                  {formatJobType(job.type)}
                                </span>
                                {job.isFeatured && (
                                  <MdStar className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Company */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <MdBusiness className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">
                                {job.employer.companyName ||
                                  `${job.employer.user.firstName} ${job.employer.user.lastName}`}
                              </p>
                              <div className="flex items-center gap-1">
                                <MdEmail className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                <a
                                  href={`mailto:${job.employer.user.email}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 underline truncate"
                                  title={`Send email to ${job.employer.user.email}`}
                                >
                                  {job.employer.user.email}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Salary */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <MdAttachMoney className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {formatSalary(job.salaryMin, job.salaryMax)}
                            </span>
                          </div>
                        </div>

                        {/* Applications */}
                        <div className="col-span-1">
                          <div className="text-center">
                            <span className="text-lg font-bold text-foreground">
                              {job._count.applications}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              applications
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <div className="flex flex-col items-center gap-1">
                            {job.isActive ? (
                              <MdCheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <MdCancel className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {job.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleViewJob(job)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading !== null}
                            >
                              <MdVisibility className="w-4 h-4" />
                            </Button>

                            <Button
                              onClick={() =>
                                handleJobAction(
                                  job.id,
                                  job.isActive ? "deactivate" : "activate"
                                )
                              }
                              variant="outline"
                              size="sm"
                              isLoading={actionLoading === job.id}
                              disabled={actionLoading !== null}
                            >
                              {job.isActive ? "Deactivate" : "Activate"}
                            </Button>

                            <Button
                              onClick={() =>
                                handleJobAction(
                                  job.id,
                                  job.isFeatured ? "unfeature" : "feature"
                                )
                              }
                              variant="outline"
                              size="sm"
                              isLoading={actionLoading === job.id}
                              disabled={actionLoading !== null}
                            >
                              {job.isFeatured ? (
                                <MdStar className="w-4 h-4" />
                              ) : (
                                <MdStarBorder className="w-4 h-4" />
                              )}
                            </Button>

                            <Button
                              onClick={() => handleDeleteJob(job.id)}
                              variant="outline"
                              size="sm"
                              isLoading={actionLoading === job.id}
                              disabled={actionLoading !== null}
                            >
                              <MdDelete className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Job Meta Info */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <MdCalendarToday className="w-3 h-3" />
                              <span>Posted: {formatDate(job.createdAt)}</span>
                            </div>
                            {job.updatedAt !== job.createdAt && (
                              <div className="flex items-center gap-1">
                                <span>
                                  Updated: {formatDate(job.updatedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-full bg-muted/50">
                              {job.category
                                ? job.category.replace("_", " ")
                                : "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Job Header - Mobile */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MdWork className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            {job.isActive ? (
                              <MdCheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <MdCancel className="w-4 h-4 text-red-500" />
                            )}
                            {job.isFeatured && (
                              <MdStar className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <MdBusiness className="w-4 h-4" />
                          <span className="truncate">
                            {job.employer.companyName ||
                              `${job.employer.user.firstName} ${job.employer.user.lastName}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <MdLocationOn className="w-4 h-4" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Job Details - Mobile */}
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MdAttachMoney className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Salary</span>
                        </div>
                        <p className="text-foreground">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MdWork className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Applications</span>
                        </div>
                        <p className="text-foreground font-bold">
                          {job._count.applications}
                        </p>
                      </div>
                    </div>

                    {/* Job Meta - Mobile */}
                    <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {formatJobType(job.type)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-muted/50">
                          {job.category
                            ? job.category.replace("_", " ")
                            : "Uncategorized"}
                        </span>
                      </div>
                      <span>Posted: {formatDate(job.createdAt)}</span>
                    </div>

                    {/* Actions - Mobile - Improved */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleViewJob(job)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading !== null}
                        className="flex-1 min-w-0 px-3 py-2 text-xs flex items-center justify-center gap-1"
                      >
                        <MdVisibility className="w-4 h-4" />
                        <span className="truncate">View</span>
                      </Button>

                      <Button
                        onClick={() =>
                          handleJobAction(
                            job.id,
                            job.isActive ? "deactivate" : "activate"
                          )
                        }
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === job.id}
                        disabled={actionLoading !== null}
                        className="flex-1 min-w-0 px-3 py-2 text-xs"
                      >
                        {job.isActive ? "Deactivate" : "Activate"}
                      </Button>

                      <Button
                        onClick={() =>
                          handleJobAction(
                            job.id,
                            job.isFeatured ? "unfeature" : "feature"
                          )
                        }
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === job.id}
                        disabled={actionLoading !== null}
                        className="min-w-[44px] px-3 py-2 flex items-center justify-center"
                      >
                        {job.isFeatured ? (
                          <MdStar className="w-4 h-4" />
                        ) : (
                          <MdStarBorder className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        onClick={() => handleDeleteJob(job.id)}
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === job.id}
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
                      {Math.min(currentPage * 10, totalJobs)} of {totalJobs}{" "}
                      jobs
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

        {/* Job Details Modal - Enhanced Responsive */}
        {showJobModal && selectedJob && (
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
              className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Enhanced Responsive */}
              <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border">
                <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MdWork className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-words">
                      {selectedJob.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground break-words">
                      {selectedJob.employer.companyName ||
                        `${selectedJob.employer.user.firstName} ${selectedJob.employer.user.lastName}`}
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

              {/* Modal Content - Enhanced Responsive */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
                {/* Job Overview - Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdLocationOn className="w-4 h-4 flex-shrink-0" />
                        Location
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1 break-words">
                        {selectedJob.location}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdAttachMoney className="w-4 h-4 flex-shrink-0" />
                        Salary Range
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {formatSalary(
                          selectedJob.salaryMin,
                          selectedJob.salaryMax
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdAccessTime className="w-4 h-4 flex-shrink-0" />
                        Job Type
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {formatJobType(selectedJob.type)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdCategory className="w-4 h-4 flex-shrink-0" />
                        Category
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {selectedJob.category
                          ? selectedJob.category.replace("_", " ")
                          : "Uncategorized"}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdWork className="w-4 h-4 flex-shrink-0" />
                        Applications
                      </label>
                      <p className="text-lg sm:text-xl lg:text-2xl text-foreground mt-1 font-bold">
                        {selectedJob._count.applications}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdCalendarToday className="w-4 h-4 flex-shrink-0" />
                        Posted Date
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {formatDate(selectedJob.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Description - Responsive */}
                <div className="mb-4 sm:mb-6">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 sm:mb-3">
                    <MdDescription className="w-4 h-4 flex-shrink-0" />
                    Job Description
                  </label>
                  <div className="bg-muted/20 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                      {selectedJob.description}
                    </p>
                  </div>
                </div>

                {/* Company Information - Enhanced with Phone */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <MdBusiness className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    Company Information
                  </h3>
                  <div className="bg-muted/20 rounded-lg p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Company Name
                        </label>
                        <p className="text-sm sm:text-base text-foreground mt-1 break-words">
                          {selectedJob.employer.companyName || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Contact Person
                        </label>
                        <p className="text-sm sm:text-base text-foreground mt-1">
                          {selectedJob.employer.user.firstName}{" "}
                          {selectedJob.employer.user.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MdEmail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          Email
                        </label>
                        <a
                          href={`mailto:${selectedJob.employer.user.email}`}
                          className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline mt-1 break-all block"
                          title={`Send email to ${selectedJob.employer.user.email}`}
                        >
                          {selectedJob.employer.user.email}
                        </a>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MdPhone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          Contact Phone
                        </label>
                        {selectedJob.employer.phone ? (
                          <a
                            href={`tel:${
                              selectedJob.employer.countryCode || "+233"
                            }${selectedJob.employer.phone}`}
                            className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline mt-1 block"
                            title={`Call ${
                              selectedJob.employer.countryCode || "+233"
                            } ${selectedJob.employer.phone}`}
                          >
                            {selectedJob.employer.countryCode || "+233"}{" "}
                            {selectedJob.employer.phone}
                          </a>
                        ) : (
                          <p className="text-sm sm:text-base text-muted-foreground mt-1">
                            Not provided
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Status */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    {selectedJob.isActive ? (
                      <MdCheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <MdCancel className="w-5 h-5 text-red-500" />
                    )}
                    <span
                      className={`font-medium ${
                        selectedJob.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {selectedJob.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {selectedJob.isFeatured && (
                    <div className="flex items-center gap-2">
                      <MdStar className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium text-yellow-600">
                        Featured Job
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Part of Scrollable Content */}
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
                        handleJobAction(
                          selectedJob.id,
                          selectedJob.isActive ? "deactivate" : "activate"
                        )
                      }
                      variant={selectedJob.isActive ? "outline" : "primary"}
                      size="sm"
                      isLoading={actionLoading === selectedJob.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-[100px]"
                    >
                      <span className="truncate text-xs sm:text-sm">
                        {selectedJob.isActive ? "Deactivate" : "Activate"}
                      </span>
                    </Button>
                    <Button
                      onClick={() =>
                        handleJobAction(
                          selectedJob.id,
                          selectedJob.isFeatured ? "unfeature" : "feature"
                        )
                      }
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === selectedJob.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-[90px]"
                    >
                      <span className="truncate text-xs sm:text-sm">
                        {selectedJob.isFeatured ? "Unfeature" : "Feature"}
                      </span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteJob(selectedJob.id)}
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === selectedJob.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-[80px] text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <span className="truncate text-xs sm:text-sm">
                        Delete
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
