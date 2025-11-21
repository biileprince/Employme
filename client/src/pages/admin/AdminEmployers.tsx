import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { motion } from "framer-motion";
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
} from "react-icons/md";

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

export default function AdminEmployers() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [pendingEmployers, setPendingEmployers] = useState<Employer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">(
    "pending"
  );
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(
    null
  );
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationAction, setVerificationAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmployers();
  }, [filter]);

  const loadEmployers = async () => {
    setIsLoading(true);
    setError("");
    try {
      if (filter === "pending") {
        const response = await adminAPI.getPendingEmployers();
        if (response.success) {
          setPendingEmployers(response.data.employers || []);
          setEmployers(response.data.employers || []);
        }
      } else {
        const params = new URLSearchParams();
        params.append("verificationStatus", filter);
        const response = await adminAPI.getAllEmployers(params);
        if (response.success) {
          setEmployers(response.data.employers || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load employers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationClick = (
    employer: Employer,
    action: "approve" | "reject"
  ) => {
    setSelectedEmployer(employer);
    setVerificationAction(action);
    setShowVerificationModal(true);
    setRejectionReason("");
  };

  const handleVerificationSubmit = async () => {
    if (!selectedEmployer || !verificationAction) return;

    if (verificationAction === "reject" && !rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
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
        loadEmployers(); // Reload the list
      }
    } catch (err: any) {
      setError(err.message || "Failed to update verification status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="wave-loader">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MdBusiness className="w-8 h-8 text-primary" />
            Employer Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Verify and manage employer accounts
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter("pending")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            filter === "pending"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          <div className="flex items-center gap-2">
            <MdPending className="w-5 h-5" />
            Pending ({pendingEmployers.length})
          </div>
        </button>
        <button
          onClick={() => setFilter("verified")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            filter === "verified"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          <div className="flex items-center gap-2">
            <MdVerified className="w-5 h-5" />
            Verified
          </div>
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          All Employers
        </button>
      </div>

      {error && (
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
              : `No ${filter} employers at the moment`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {employers.map((employer, index) => (
            <motion.div
              key={employer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Logo */}
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {employer.logoUrl ? (
                      <img
                        src={employer.logoUrl}
                        alt={employer.companyName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <MdBusiness className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {employer.companyName}
                      </h3>
                      {employer.isVerified && (
                        <MdVerified className="w-6 h-6 text-success" />
                      )}
                      {!employer.isVerified && (
                        <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-semibold px-2 py-1 rounded">
                          Pending Verification
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MdEmail className="w-4 h-4" />
                        {employer.user.email}
                      </div>
                      {employer.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MdLocationOn className="w-4 h-4" />
                          {employer.location}
                        </div>
                      )}
                      {employer.industry && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MdWork className="w-4 h-4" />
                          {employer.industry}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MdCalendarToday className="w-4 h-4" />
                        Joined {formatDate(employer.createdAt)}
                      </div>
                    </div>

                    {employer.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {employer.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {employer._count.jobs} job
                        {employer._count.jobs !== 1 ? "s" : ""} posted
                      </span>
                      {employer.website && (
                        <a
                          href={employer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {!employer.isVerified ? (
                    <>
                      <button
                        onClick={() =>
                          handleVerificationClick(employer, "approve")
                        }
                        className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground px-4 py-2 rounded-lg transition-colors"
                      >
                        <MdCheck className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleVerificationClick(employer, "reject")
                        }
                        className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg transition-colors"
                      >
                        <MdClose className="w-5 h-5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        handleVerificationClick(employer, "reject")
                      }
                      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <MdClose className="w-5 h-5" />
                      Unverify
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedEmployer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {verificationAction === "approve"
                ? "Approve Employer"
                : selectedEmployer.isVerified
                ? "Unverify Employer"
                : "Reject Employer"}
            </h2>

            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                Company: <strong>{selectedEmployer.companyName}</strong>
              </p>
              <p className="text-muted-foreground">
                Email: <strong>{selectedEmployer.user.email}</strong>
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
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder={
                    selectedEmployer.isVerified
                      ? "Explain why this employer's verification is being revoked..."
                      : "Explain why this employer cannot be verified..."
                  }
                  required
                />
              </div>
            )}

            {verificationAction === "approve" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200">
                  This employer will be verified and their jobs can be approved.
                  They will receive an email notification.
                </p>
              </div>
            )}

            {verificationAction === "reject" && selectedEmployer.isVerified && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This will remove verification status. The employer's active
                  jobs may be hidden from public view. They will receive an
                  email notification.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedEmployer(null);
                  setVerificationAction(null);
                  setRejectionReason("");
                  setError("");
                }}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleVerificationSubmit}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  verificationAction === "approve"
                    ? "bg-success hover:bg-success/90 text-success-foreground"
                    : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="wave-loader">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                ) : verificationAction === "approve" ? (
                  "Approve Employer"
                ) : selectedEmployer.isVerified ? (
                  "Unverify Employer"
                ) : (
                  "Reject Employer"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
