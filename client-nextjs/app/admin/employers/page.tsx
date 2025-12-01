"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MdBusiness,
  MdVerified,
  MdPending,
  MdCheck,
  MdClose,
  MdEmail,
  MdLocationOn,
  MdWork,
  MdCalendarToday,
  MdLanguage,
  MdRefresh,
} from "react-icons/md";
import { adminAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouteGuard } from "@/hooks/useRouteGuard";

interface Employer {
  id: string;
  companyName: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
  };
  _count: {
    jobs: number;
  };
}

interface EmployersData {
  employers: Employer[];
  total: number;
}

export default function AdminEmployersPage() {
  useRouteGuard();

  const [employers, setEmployers] = useState<Employer[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">(
    "pending"
  );

  // Modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(
    null
  );
  const [verificationAction, setVerificationAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (filter === "pending") {
        const response = await adminAPI.getPendingEmployers();
        if (response.success && response.data) {
          const data = response.data as EmployersData;
          setEmployers(data.employers || []);
          setPendingCount(data.employers?.length || 0);
        }
      } else {
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.append("verificationStatus", filter);
        }
        const response = await adminAPI.getAllEmployers(params);
        if (response.success && response.data) {
          const data = response.data as EmployersData;
          setEmployers(data.employers || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employers");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const handleVerificationClick = (
    employer: Employer,
    action: "approve" | "reject"
  ) => {
    setSelectedEmployer(employer);
    setVerificationAction(action);
    setShowVerificationModal(true);
    setRejectionReason("");
    setError("");
  };

  const handleVerificationSubmit = async () => {
    if (!selectedEmployer || !verificationAction) return;

    if (verificationAction === "reject" && !rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setActionLoading(selectedEmployer.id);
    setError("");

    try {
      const isVerified = verificationAction === "approve";
      const response = await adminAPI.verifyEmployer(
        selectedEmployer.id,
        isVerified,
        verificationAction === "reject" ? rejectionReason : undefined
      );

      if (response.success) {
        setShowVerificationModal(false);
        setSelectedEmployer(null);
        setVerificationAction(null);
        setRejectionReason("");
        fetchEmployers(); // Reload the list
      } else {
        setError(response.message || "Failed to update verification status");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update verification status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setSelectedEmployer(null);
    setVerificationAction(null);
    setRejectionReason("");
    setError("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employers...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MdBusiness className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Employer Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Verify and manage employer accounts
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={fetchEmployers}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <MdRefresh
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${
                filter === "pending"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MdPending className="w-5 h-5" />
                <span className="text-sm sm:text-base">
                  Pending {pendingCount > 0 && `(${pendingCount})`}
                </span>
              </div>
            </button>
            <button
              onClick={() => setFilter("verified")}
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${
                filter === "verified"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MdVerified className="w-5 h-5" />
                <span className="text-sm sm:text-base">Verified</span>
              </div>
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${
                filter === "all"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MdBusiness className="w-5 h-5" />
                <span className="text-sm sm:text-base">All Employers</span>
              </div>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && !showVerificationModal && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Employers List */}
        {employers.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <MdBusiness className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No employers found
            </h3>
            <p className="text-muted-foreground">
              {filter === "pending"
                ? "No pending verification requests"
                : filter === "verified"
                ? "No verified employers at the moment"
                : "No employers at the moment"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {employers.map((employer, index) => (
              <motion.div
                key={employer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    {/* Logo */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {employer.logoUrl ? (
                        <Image
                          src={employer.logoUrl}
                          alt={employer.companyName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <MdBusiness className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground">
                          {employer.companyName}
                        </h3>
                        {employer.isVerified ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <MdVerified className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-xs sm:text-sm font-semibold">
                              Verified
                            </span>
                          </div>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-semibold px-2 py-1 rounded w-fit">
                            Pending Verification
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <MdEmail className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {employer.user.email}
                          </span>
                        </div>
                        {employer.location && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MdLocationOn className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {employer.location}
                            </span>
                          </div>
                        )}
                        {employer.industry && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MdWork className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {employer.industry}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <MdCalendarToday className="w-4 h-4 shrink-0" />
                          Joined {formatDate(employer.createdAt)}
                        </div>
                      </div>

                      {employer.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                          {employer.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground font-medium">
                          {employer._count.jobs} job
                          {employer._count.jobs !== 1 ? "s" : ""} posted
                        </span>
                        {employer.website && (
                          <a
                            href={employer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <MdLanguage className="w-4 h-4" />
                            View Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-2 w-full lg:w-auto">
                    {!employer.isVerified ? (
                      <>
                        <Button
                          onClick={() =>
                            handleVerificationClick(employer, "approve")
                          }
                          disabled={actionLoading !== null}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <MdCheck className="w-5 h-5" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          onClick={() =>
                            handleVerificationClick(employer, "reject")
                          }
                          disabled={actionLoading !== null}
                          variant="destructive"
                          className="flex items-center justify-center gap-2"
                        >
                          <MdClose className="w-5 h-5" />
                          <span>Reject</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleVerificationClick(employer, "reject")
                        }
                        disabled={actionLoading !== null}
                        className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white"
                      >
                        <MdClose className="w-5 h-5" />
                        <span>Unverify</span>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Verification Modal */}
      {showVerificationModal && selectedEmployer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
              {verificationAction === "approve"
                ? "Approve Employer"
                : selectedEmployer.isVerified
                ? "Unverify Employer"
                : "Reject Employer"}
            </h2>

            <div className="mb-6 space-y-2">
              <p className="text-sm sm:text-base text-muted-foreground">
                Company:{" "}
                <strong className="text-foreground">
                  {selectedEmployer.companyName}
                </strong>
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Email:{" "}
                <strong className="text-foreground">
                  {selectedEmployer.user.email}
                </strong>
              </p>
            </div>

            {verificationAction === "reject" && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Reason for{" "}
                  {selectedEmployer.isVerified ? "Unverifying" : "Rejection"} *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  rows={4}
                  placeholder={
                    selectedEmployer.isVerified
                      ? "Explain why this employer&apos;s verification is being revoked..."
                      : "Explain why this employer cannot be verified..."
                  }
                  required
                />
              </div>
            )}

            {verificationAction === "approve" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 mb-6">
                <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                  This employer will be verified and their jobs can be approved.
                  They will receive an email notification.
                </p>
              </div>
            )}

            {verificationAction === "reject" && selectedEmployer.isVerified && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4 mb-6">
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                  This will remove verification status. The employer&apos;s
                  active jobs may be hidden from public view. They will receive
                  an email notification.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 p-3 rounded-lg mb-4 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCloseModal}
                variant="outline"
                disabled={actionLoading !== null}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerificationSubmit}
                disabled={actionLoading !== null}
                className={`flex-1 ${
                  verificationAction === "approve"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {actionLoading === selectedEmployer.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : verificationAction === "approve" ? (
                  "Approve Employer"
                ) : selectedEmployer.isVerified ? (
                  "Unverify Employer"
                ) : (
                  "Reject Employer"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
