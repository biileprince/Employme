"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  MdPhone,
  MdEmail,
  MdFileDownload,
} from "react-icons/md";
import { adminAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import ExcelJS from "exceljs";

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
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  employer: {
    id: string;
    companyName?: string;
    countryCode?: string;
    phone?: string;
    isVerified?: boolean;
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

export default function AdminJobsPage() {
  const { user } = useRouteGuard({
    requireAuth: true,
    requireRole: "ADMIN",
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "approved" | "pending"
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

      if (approvalFilter !== "all") {
        params.append(
          "isApproved",
          approvalFilter === "approved" ? "true" : "false"
        );
      }

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const response = await adminAPI.getAllJobs(params);

      if (response.success && response.data) {
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
  }, [currentPage, searchTerm, statusFilter, approvalFilter]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, fetchJobs]);

  const handleJobAction = async (jobId: string, action: string) => {
    const actionMessages = {
      activate:
        "Are you sure you want to activate this job? It will become visible to job seekers.",
      deactivate:
        "Are you sure you want to deactivate this job? It will be hidden from job seekers.",
      approve:
        "Are you sure you want to approve this job? It will become visible to job seekers.",
      reject:
        "Are you sure you want to reject this job? The employer will be notified.",
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
        await fetchJobs();
        if (selectedJob?.id === jobId) {
          setShowJobModal(false);
          setSelectedJob(null);
        }
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
        await fetchJobs();
        if (selectedJob?.id === jobId) {
          setShowJobModal(false);
          setSelectedJob(null);
        }
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
    if (!type) return "Full Time";
    const formatted = type.replace(/_/g, " ").toLowerCase();
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
      setIsExporting(true);

      // Fetch all jobs with current filters applied
      const params = new URLSearchParams({
        page: "1",
        limit: "999999", // Get all jobs
      });

      if (searchTerm) params.append("search", searchTerm);
      if (approvalFilter !== "all") {
        params.append(
          "isApproved",
          approvalFilter === "approved" ? "true" : "false"
        );
      }
      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const response = await adminAPI.getAllJobs(params);

      if (!response.success || !response.data) {
        throw new Error("Failed to fetch jobs for export");
      }

      const jobsData = (response.data as JobsData).jobs;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Employ.me Admin";
      workbook.created = new Date();

      // Add main jobs sheet
      const worksheet = workbook.addWorksheet("Jobs", {
        properties: { tabColor: { argb: "FF1e293b" } },
      });

      // Define columns
      worksheet.columns = [
        { header: "Job ID", key: "id", width: 25 },
        { header: "Job Title", key: "title", width: 30 },
        { header: "Company", key: "company", width: 25 },
        { header: "Contact Person", key: "contactPerson", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Location", key: "location", width: 20 },
        { header: "Job Type", key: "type", width: 15 },
        { header: "Category", key: "category", width: 20 },
        { header: "Min Salary", key: "salaryMin", width: 15 },
        { header: "Max Salary", key: "salaryMax", width: 15 },
        { header: "Salary Range", key: "salaryRange", width: 25 },
        { header: "Applications", key: "applications", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Approved", key: "approved", width: 12 },
        { header: "Featured", key: "featured", width: 12 },
        { header: "Posted Date", key: "postedDate", width: 15 },
        { header: "Last Updated", key: "updatedDate", width: 15 },
        { header: "Days Active", key: "daysActive", width: 15 },
        { header: "Description", key: "description", width: 50 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1e293b" },
      };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getRow(1).height = 25;

      // Add data rows
      jobsData.forEach((job) => {
        const postedDate = new Date(job.createdAt);
        const daysActive = Math.floor(
          (new Date().getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const row = worksheet.addRow({
          id: job.id,
          title: job.title,
          company: job.employer.companyName || "Not specified",
          contactPerson: `${job.employer.user.firstName} ${job.employer.user.lastName}`,
          email: job.employer.user.email,
          phone: job.employer.phone
            ? `${job.employer.countryCode || "+233"} ${job.employer.phone}`
            : "Not provided",
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
          approved: job.isApproved ? "Yes" : "No",
          featured: job.isFeatured ? "Yes" : "No",
          postedDate: formatDate(job.createdAt),
          updatedDate: formatDate(job.updatedAt),
          daysActive: daysActive,
          description: job.description.replace(/\n/g, " ").substring(0, 500),
        });

        // Conditional formatting for status
        const statusCell = row.getCell("status");
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: job.isActive ? "FFD4EDDA" : "FFF8D7DA" },
        };
        statusCell.font = {
          color: { argb: job.isActive ? "FF155724" : "FF721C24" },
          bold: true,
        };

        // Conditional formatting for approved
        const approvedCell = row.getCell("approved");
        approvedCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: job.isApproved ? "FFCCE5FF" : "FFFEF3CD" },
        };
        approvedCell.font = {
          color: { argb: job.isApproved ? "FF004085" : "FF856404" },
          bold: true,
        };

        // Conditional formatting for featured
        const featuredCell = row.getCell("featured");
        if (job.isFeatured) {
          featuredCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF3CD" },
          };
          featuredCell.font = { color: { argb: "FFFF8800" }, bold: true };
        }
      });

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
          cell.alignment = { vertical: "middle", wrapText: true };
        });
      });

      // Add summary sheet
      const summarySheet = workbook.addWorksheet("Summary", {
        properties: { tabColor: { argb: "FFFF6B35" } },
      });

      summarySheet.mergeCells("A1:B1");
      summarySheet.getCell("A1").value = "Job Statistics Summary";
      summarySheet.getCell("A1").font = { size: 16, bold: true };
      summarySheet.getCell("A1").alignment = { horizontal: "center" };
      summarySheet.getRow(1).height = 30;

      const stats = [
        ["Total Jobs", jobsData.length],
        ["Active Jobs", jobsData.filter((j) => j.isActive).length],
        ["Inactive Jobs", jobsData.filter((j) => !j.isActive).length],
        ["Approved Jobs", jobsData.filter((j) => j.isApproved).length],
        ["Pending Jobs", jobsData.filter((j) => !j.isApproved).length],
        ["Featured Jobs", jobsData.filter((j) => j.isFeatured).length],
        ["", ""],
        [
          "Total Applications",
          jobsData.reduce((sum, j) => sum + j._count.applications, 0),
        ],
        [
          "Jobs with Applications",
          jobsData.filter((j) => j._count.applications > 0).length,
        ],
        [
          "Jobs without Applications",
          jobsData.filter((j) => j._count.applications === 0).length,
        ],
        ["", ""],
        ["Export Date", new Date().toLocaleString()],
      ];

      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 20;

      stats.forEach((stat, index) => {
        if (stat[0] === "") {
          summarySheet.addRow(stat);
          return;
        }
        const row = summarySheet.addRow(stat);
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true, color: { argb: "FF1e293b" } };
        row.getCell(2).alignment = { horizontal: "right" };

        if (index === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE5E7EB" },
            };
          });
        }
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `employme-jobs-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setIsExporting(false);
    } catch (err) {
      console.error("Failed to export jobs:", err);
      setError("Failed to export jobs to Excel");
      setIsExporting(false);
    }
  };

  if (loading && !jobs.length) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MdWork className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Job Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage all job postings across the platform
                </p>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={exportJobsToExcel}
              disabled={isExporting || jobs.length === 0}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <MdFileDownload className="w-5 h-5" />
                  <span>Export to Excel</span>
                </>
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <MdWork className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Jobs
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {totalJobs}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <MdCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Active
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {jobs.filter((job) => job.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <MdStar className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Featured
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {jobs.filter((job) => job.isFeatured).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <MdCancel className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Inactive
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {jobs.filter((job) => !job.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive"
                    )
                  }
                  className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={approvalFilter}
                  onChange={(e) =>
                    setApprovalFilter(
                      e.target.value as "all" | "approved" | "pending"
                    )
                  }
                  className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer appearance-none"
                >
                  <option value="all">All Approvals</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                </select>

                <Button
                  onClick={handleSearch}
                  variant="default"
                  className="flex items-center justify-center gap-2 h-12"
                >
                  <MdSearch className="w-4 h-4" />
                  <span>Search</span>
                </Button>

                <Button
                  onClick={fetchJobs}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12"
                >
                  <MdRefresh className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-red-700 dark:text-red-400 font-medium">
              {error}
            </p>
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

        {/* Jobs Table */}
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
                {searchTerm ||
                statusFilter !== "all" ||
                approvalFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "No jobs have been posted yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-medium text-foreground">
                        Job Details
                      </th>
                      <th className="text-left p-3 font-medium text-foreground">
                        Company
                      </th>
                      <th className="text-left p-3 font-medium text-foreground">
                        Salary
                      </th>
                      <th className="text-center p-3 font-medium text-foreground">
                        Apps
                      </th>
                      <th className="text-center p-3 font-medium text-foreground">
                        Status
                      </th>
                      <th className="text-right p-3 font-medium text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job, index) => (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <MdWork className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-foreground truncate">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <MdLocationOn className="w-4 h-4 shrink-0" />
                                <span className="truncate">{job.location}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                  {formatJobType(job.type)}
                                </span>
                                {job.isFeatured && (
                                  <MdStar className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <MdBusiness className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p
                                className="font-medium text-foreground truncate"
                                title={
                                  job.employer.companyName ||
                                  `${job.employer.user.firstName} ${job.employer.user.lastName}`
                                }
                              >
                                {job.employer.companyName ||
                                  `${job.employer.user.firstName} ${job.employer.user.lastName}`}
                              </p>
                              <div className="flex items-center gap-1 min-w-0">
                                <MdEmail className="w-3 h-3 text-blue-600 shrink-0" />
                                <a
                                  href={`mailto:${job.employer.user.email}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 underline truncate"
                                  title={job.employer.user.email}
                                >
                                  {job.employer.user.email}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MdAttachMoney className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {formatSalary(job.salaryMin, job.salaryMax)}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="text-center">
                            <span className="text-lg font-bold text-foreground">
                              {job._count.applications}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col items-center gap-1">
                            {job.isActive ? (
                              <MdCheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <MdCancel className="w-5 h-5 text-red-500" />
                            )}
                            {job.isApproved ? (
                              <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                                Approved
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button
                              onClick={() => handleViewJob(job)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading !== null}
                              title="View Details"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </Button>

                            {!job.isApproved && (
                              <>
                                <Button
                                  onClick={() =>
                                    handleJobAction(job.id, "approve")
                                  }
                                  variant="outline"
                                  size="sm"
                                  isLoading={actionLoading === job.id}
                                  disabled={actionLoading !== null}
                                  className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950 border-green-300 dark:border-green-800"
                                  title="Approve"
                                >
                                  <MdCheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleJobAction(job.id, "reject")
                                  }
                                  variant="outline"
                                  size="sm"
                                  isLoading={actionLoading === job.id}
                                  disabled={actionLoading !== null}
                                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-300 dark:border-red-800"
                                  title="Reject"
                                >
                                  <MdCancel className="w-4 h-4" />
                                </Button>
                              </>
                            )}

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
                              className="text-xs px-2 py-1"
                            >
                              {job.isActive ? "Deact" : "Act"}
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
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MdLocationOn className="w-4 h-4" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                    </div>

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
                          <span className="font-medium">Apps</span>
                        </div>
                        <p className="text-foreground font-bold">
                          {job._count.applications}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {formatJobType(job.type)}
                        </span>
                        {job.isApproved ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                            Pending
                          </span>
                        )}
                      </div>
                      <span>Posted: {formatDate(job.createdAt)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleViewJob(job)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading !== null}
                        className="flex-1 min-w-0 h-10"
                      >
                        <MdVisibility className="w-4 h-4" />
                        <span className="ml-1">View</span>
                      </Button>

                      {!job.isApproved && (
                        <>
                          <Button
                            onClick={() => handleJobAction(job.id, "approve")}
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === job.id}
                            disabled={actionLoading !== null}
                            className="flex-1 min-w-0 h-10 text-green-600 border-green-300 dark:border-green-800"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleJobAction(job.id, "reject")}
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === job.id}
                            disabled={actionLoading !== null}
                            className="flex-1 min-w-0 h-10 text-red-600 border-red-300 dark:border-red-800"
                          >
                            Reject
                          </Button>
                        </>
                      )}

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
                        className="flex-1 min-w-0 h-10"
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
                        className="min-w-11 h-10"
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
                        className="min-w-11 h-10 text-red-500"
                      >
                        <MdDelete className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing {(currentPage - 1) * 10 + 1} to{" "}
                      {Math.min(currentPage * 10, totalJobs)} of {totalJobs}{" "}
                      jobs
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="h-10 min-w-11"
                      >
                        <MdNavigateBefore className="w-5 h-5" />
                      </Button>
                      <span className="px-3 py-2 text-sm text-foreground bg-muted rounded-lg min-w-20 text-center">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="h-10 min-w-11"
                      >
                        <MdNavigateNext className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Job Details Modal */}
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
              {/* Modal Header */}
              <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
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
                  className="shrink-0 p-2"
                >
                  <MdClose className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
                {/* Job Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdLocationOn className="w-4 h-4 shrink-0" />
                        Location
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1 break-words">
                        {selectedJob.location}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdAttachMoney className="w-4 h-4 shrink-0" />
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
                        <MdAccessTime className="w-4 h-4 shrink-0" />
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
                        <MdCategory className="w-4 h-4 shrink-0" />
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
                        <MdCheckCircle className="w-4 h-4 shrink-0" />
                        Status
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        {selectedJob.isActive ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm font-semibold">
                            <MdCheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm font-semibold">
                            <MdCancel className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                        {selectedJob.isApproved ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm font-semibold">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm font-semibold">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdWork className="w-4 h-4 shrink-0" />
                        Applications
                      </label>
                      <p className="text-lg sm:text-xl lg:text-2xl text-foreground mt-1 font-bold">
                        {selectedJob._count.applications}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MdCalendarToday className="w-4 h-4 shrink-0" />
                        Posted Date
                      </label>
                      <p className="text-sm sm:text-base text-foreground mt-1">
                        {formatDate(selectedJob.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-4 sm:mb-6">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 sm:mb-3">
                    <MdDescription className="w-4 h-4 shrink-0" />
                    Job Description
                  </label>
                  <div className="bg-muted/20 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                      {selectedJob.description}
                    </p>
                  </div>
                </div>

                {/* Company Information */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <MdBusiness className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
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
                          <MdEmail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          Email
                        </label>
                        <a
                          href={`mailto:${selectedJob.employer.user.email}`}
                          className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline mt-1 break-all block"
                        >
                          {selectedJob.employer.user.email}
                        </a>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MdPhone className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          Contact Phone
                        </label>
                        {selectedJob.employer.phone ? (
                          <a
                            href={`tel:${
                              selectedJob.employer.countryCode || "+233"
                            }${selectedJob.employer.phone}`}
                            className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline mt-1 block"
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

                {/* Action Buttons */}
                <div className="border-t border-border pt-4 sm:pt-6 mt-6">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-20 order-last sm:order-first"
                    >
                      Close
                    </Button>
                    {!selectedJob.isApproved && (
                      <>
                        <Button
                          onClick={() => {
                            handleJobAction(selectedJob.id, "approve");
                          }}
                          variant="default"
                          size="sm"
                          isLoading={actionLoading === selectedJob.id}
                          disabled={actionLoading !== null}
                          className="flex-1 sm:flex-none min-w-0 sm:min-w-24 bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            handleJobAction(selectedJob.id, "reject");
                          }}
                          variant="outline"
                          size="sm"
                          isLoading={actionLoading === selectedJob.id}
                          disabled={actionLoading !== null}
                          className="flex-1 sm:flex-none min-w-0 sm:min-w-24 text-red-600 border-red-300 dark:border-red-800"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => {
                        handleJobAction(
                          selectedJob.id,
                          selectedJob.isActive ? "deactivate" : "activate"
                        );
                      }}
                      variant={selectedJob.isActive ? "outline" : "default"}
                      size="sm"
                      isLoading={actionLoading === selectedJob.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-24"
                    >
                      {selectedJob.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      onClick={() => {
                        handleJobAction(
                          selectedJob.id,
                          selectedJob.isFeatured ? "unfeature" : "feature"
                        );
                      }}
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === selectedJob.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-24"
                    >
                      {selectedJob.isFeatured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      onClick={() => {
                        handleDeleteJob(selectedJob.id);
                      }}
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === selectedJob.id}
                      disabled={actionLoading !== null}
                      className="flex-1 sm:flex-none min-w-0 sm:min-w-20 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Delete
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
