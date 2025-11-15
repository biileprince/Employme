import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MdEmail,
  MdDownload,
  MdDelete,
  MdFilterList,
  MdSearch,
  MdCheckCircle,
  MdCancel,
  MdAnalytics,
} from "react-icons/md";
import Button from "../../components/ui/Button";

interface NewsletterSubscription {
  id: string;
  email: string;
  isActive: boolean;
  source?: string;
  createdAt: string;
  unsubscribedAt?: string;
}

interface NewsletterStats {
  active: number;
  inactive: number;
  total: number;
}

interface NewsletterAnalytics {
  trends: Record<string, number>;
  sourceBreakdown: Array<{
    source: string;
    count: number;
  }>;
  recentSubscriptions: Array<{
    email: string;
    createdAt: string;
    source?: string;
    isActive: boolean;
  }>;
  totalNewSubscriptions: number;
}

const AdminNewsletterPage = () => {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>(
    []
  );
  const [stats, setStats] = useState<NewsletterStats>({
    active: 0,
    inactive: 0,
    total: 0,
  });
  const [analytics, setAnalytics] = useState<NewsletterAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/newsletter/subscriptions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setSubscriptions(result.data.subscriptions);
        setStats(result.data.stats);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        setError(result.message || "Failed to load subscriptions");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/newsletter/analytics?days=30`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      }
    } catch {
      console.error("Failed to load analytics");
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
    loadAnalytics();
  }, [loadSubscriptions, loadAnalytics]);

  const handleDelete = async (id: string) => {
    if (
      !confirm("Are you sure you want to permanently delete this subscription?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/newsletter/subscriptions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        loadSubscriptions();
      } else {
        alert(result.message || "Failed to delete subscription");
      }
    } catch {
      alert("Network error occurred");
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/newsletter/export?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Convert to CSV and download
        const csvContent = generateCSV(result.data.subscriptions);
        downloadCSV(csvContent, "newsletter-subscriptions.csv");
      } else {
        alert(result.message || "Failed to export data");
      }
    } catch {
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: NewsletterSubscription[]) => {
    const headers = [
      "Email",
      "Status",
      "Source",
      "Subscribed Date",
      "Unsubscribed Date",
    ];
    const rows = data.map((item) => [
      item.email,
      item.isActive ? "Active" : "Inactive",
      item.source || "Unknown",
      new Date(item.createdAt).toLocaleDateString(),
      item.unsubscribedAt
        ? new Date(item.unsubscribedAt).toLocaleDateString()
        : "N/A",
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Newsletter Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage newsletter subscriptions and view analytics
          </p>
        </div>
        <Button
          onClick={handleExport}
          isLoading={isExporting}
          className="flex items-center gap-2"
        >
          <MdDownload className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Active Subscriptions
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <MdCheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Inactive Subscriptions
              </p>
              <p className="text-2xl font-bold text-red-600">
                {stats.inactive}
              </p>
            </div>
            <MdCancel className="w-8 h-8 text-red-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Subscriptions
              </p>
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
            </div>
            <MdEmail className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <MdAnalytics className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Analytics (Last 30 Days)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">
                New Subscriptions: {analytics.totalNewSubscriptions}
              </h3>
              <div className="space-y-2">
                {analytics.sourceBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {item.source}:
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Recent Subscriptions</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {analytics.recentSubscriptions.slice(0, 5).map((sub, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">
                      {sub.email}
                    </span>
                    <span
                      className={`font-medium ${
                        sub.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {sub.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <MdFilterList className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-md px-3 py-1 text-sm bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <MdSearch className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-border rounded-md px-3 py-1 text-sm bg-background w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-lg overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No subscriptions found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Source</th>
                    <th className="text-left p-4 font-medium">Subscribed</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MdEmail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {subscription.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subscription.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          }`}
                        >
                          {subscription.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-muted-foreground capitalize">
                          {subscription.source || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm">
                            {formatDate(subscription.createdAt)}
                          </div>
                          {subscription.unsubscribedAt && (
                            <div className="text-xs text-red-600">
                              Unsubscribed:{" "}
                              {formatDate(subscription.unsubscribedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(subscription.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <MdDelete className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AdminNewsletterPage;
