"use client";

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
  MdRefresh,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { adminAPI } from "@/lib/api";
import { useRouteGuard } from "@/hooks/useRouteGuard";

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

export default function AdminNewsletterPage() {
  useRouteGuard();

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
      setError("");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await adminAPI.getNewsletterSubscriptions(params);

      if (response.success && response.data) {
        const data = response.data as {
          subscriptions: NewsletterSubscription[];
          stats: NewsletterStats;
          pagination: {
            totalPages: number;
          };
        };
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(response.message || "Failed to load subscriptions");
      }
    } catch (err) {
      console.error("Newsletter subscriptions error:", err);
      setError("Failed to load subscriptions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await adminAPI.getNewsletterAnalytics(30);

      if (response.success && response.data) {
        setAnalytics(response.data as NewsletterAnalytics);
      }
    } catch (err) {
      console.error("Newsletter analytics error:", err);
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
      const response = await adminAPI.deleteNewsletterSubscription(id);

      if (response.success) {
        loadSubscriptions();
      } else {
        alert(response.message || "Failed to delete subscription");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete subscription");
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await adminAPI.exportNewsletterEmails(statusFilter);

      if (response.success && response.data) {
        const data = response.data as {
          subscriptions: NewsletterSubscription[];
        };
        // Convert to CSV and download
        const csvContent = generateCSV(data.subscriptions);
        downloadCSV(csvContent, "newsletter-subscriptions.csv");
      } else {
        alert(response.message || "Failed to export data");
      }
    } catch (err) {
      console.error("Export error:", err);
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

  if (error && !subscriptions.length) {
    return (
      <div className="px-4 sm:px-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg text-center">
          <p className="text-red-600 dark:text-red-200 mb-4">{error}</p>
          <Button onClick={loadSubscriptions} variant="outline">
            <MdRefresh className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Newsletter Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage newsletter subscriptions and view analytics
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <MdDownload className="w-4 h-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Active Subscriptions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.active}
              </p>
            </div>
            <MdCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Inactive Subscriptions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.inactive}
              </p>
            </div>
            <MdCancel className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Subscriptions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {stats.total}
              </p>
            </div>
            <MdEmail className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <MdAnalytics className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Analytics (Last 30 Days)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm sm:text-base font-medium mb-3 text-foreground">
                New Subscriptions: {analytics.totalNewSubscriptions}
              </h3>
              <div className="space-y-2">
                {analytics.sourceBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-xs sm:text-sm"
                  >
                    <span className="text-muted-foreground capitalize">
                      {item.source}:
                    </span>
                    <span className="font-medium text-foreground">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-medium mb-3 text-foreground">
                Recent Subscriptions
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {analytics.recentSubscriptions.slice(0, 5).map((sub, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-xs sm:text-sm gap-2"
                  >
                    <span className="text-muted-foreground truncate">
                      {sub.email}
                    </span>
                    <span
                      className={`font-medium shrink-0 ${
                        sub.isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-card border border-border rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <MdFilterList className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <MdSearch className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground w-full sm:w-64"
            />
          </div>
        </div>
      </motion.div>

      {/* Subscriptions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading subscriptions...
              </p>
            </div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MdEmail className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No subscriptions found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Source
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Subscribed
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription, index) => (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MdEmail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {subscription.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            subscription.isActive
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
                          }`}
                        >
                          {subscription.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-muted-foreground capitalize text-sm">
                          {subscription.source || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm text-foreground">
                            {formatDate(subscription.createdAt)}
                          </div>
                          {subscription.unsubscribedAt && (
                            <div className="text-xs text-red-600 dark:text-red-400">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <MdDelete className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {subscriptions.map((subscription, index) => (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MdEmail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground text-sm break-all">
                          {subscription.email}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${
                          subscription.isActive
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
                        }`}
                      >
                        {subscription.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">
                        Source: {subscription.source || "Unknown"}
                      </span>
                      <span>{formatDate(subscription.createdAt)}</span>
                    </div>

                    {subscription.unsubscribedAt && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Unsubscribed: {formatDate(subscription.unsubscribedAt)}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(subscription.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <MdDelete className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
}
