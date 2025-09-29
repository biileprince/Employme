import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MdWork,
  MdSearch,
  MdFilterList,
  MdDelete,
  MdEdit,
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

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
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

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button onClick={handleSearch} variant="primary">
                <MdSearch className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button onClick={fetchJobs} variant="outline">
                <MdRefresh className="w-4 h-4" />
              </Button>
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
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "No jobs have been posted yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-muted/30 px-6 py-4 border-b border-border">
                <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
                  <div className="col-span-4">Job Details</div>
                  <div className="col-span-2">Company</div>
                  <div className="col-span-2">Salary</div>
                  <div className="col-span-1">Applications</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
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
                      <div className="col-span-4">
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
                                {job.type
                                  ? job.type.replace("_", " ")
                                  : "Not specified"}
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
                            <p className="text-sm text-muted-foreground truncate">
                              {job.employer.user.email}
                            </p>
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
                      <div className="col-span-2">
                        <div className="flex items-center justify-end gap-1">
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
                              <span>Updated: {formatDate(job.updatedAt)}</span>
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
      </motion.div>
    </div>
  );
}
