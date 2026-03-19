"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiLocationMarker,
  HiClock,
  HiBriefcase,
  HiCurrencyDollar,
  HiStar,
  HiX,
  HiShare,
  HiEye,
  HiHeart,
  HiUpload,
  HiDocumentText,
  HiTrash,
  HiAcademicCap,
  HiCheckCircle,
  HiArrowLeft,
  HiOfficeBuilding,
  HiUsers,
  HiGlobeAlt,
  HiCalendar,
} from "react-icons/hi";
import { apiClient, formatImageUrl } from "@/lib/api";
import type { Job, JobResponse, Pagination } from "@/types/job";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal, JobApplicationModal } from "@/components/features";

// Type guard for database jobs
interface DatabaseJob extends Job {
  employer: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    website: string | null;
    location: string | null;
    description: string | null;
  };
}

const isDatabaseJob = (job: Job): job is DatabaseJob => {
  return job && "employer" in job && job.employer !== null;
};

// Helper functions
const getCompanyName = (job: Job) => {
  if (isDatabaseJob(job)) {
    return job.employer.companyName || "Unknown Company";
  }
  return "Unknown Company";
};

const getCompanyId = (job: Job) => {
  if (isDatabaseJob(job)) {
    return job.employer.id;
  }
  return null;
};

const getCompanyDescription = (job: Job) => {
  if (isDatabaseJob(job) && job.employer.description) {
    return job.employer.description;
  }
  return "No company description available.";
};

const getJobType = (job: Job) => {
  return job.jobType || "FULL_TIME";
};

const getSalary = (job: Job) => {
  if (!job.salaryMin && !job.salaryMax) return "Negotiable";
  if (job.salaryMin && job.salaryMax) {
    return `GH₵${job.salaryMin.toLocaleString()} - GH₵${job.salaryMax.toLocaleString()}`;
  }
  if (job.salaryMin) return `GH₵${job.salaryMin.toLocaleString()}+`;
  return `Up to GH₵${job.salaryMax?.toLocaleString()}`;
};

const getCategoryLabel = (category: string) => {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getJobImages = (job: Job) => {
  if (!job.attachments || job.attachments.length === 0) return [];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  return job.attachments.filter((att) =>
    imageExtensions.some((ext) => att.url.toLowerCase().endsWith(ext)),
  );
};

const getDocumentAttachments = (job: Job) => {
  if (!job.attachments || job.attachments.length === 0) return [];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  return job.attachments.filter(
    (att) =>
      !imageExtensions.some((ext) => att.url.toLowerCase().endsWith(ext)),
  );
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<"save" | "apply">(
    "save",
  );
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<File & { preview?: string }>
  >([]);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Fetch job details and related jobs
  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<JobResponse>(`/jobs/${jobId}`);

        if (response.success && response.data) {
          setJob(response.data.job);

          // Fetch related jobs
          if (response.data.job.category) {
            const relatedResponse = await apiClient.get<{
              jobs: Job[];
              pagination: Pagination;
            }>(`/jobs?category=${response.data.job.category}&limit=4`);

            if (relatedResponse.success && relatedResponse.data) {
              // Filter out current job
              const filtered = relatedResponse.data.jobs.filter(
                (j) => j.id !== jobId,
              );
              setRelatedJobs(filtered.slice(0, 3));
            }
          }

          // Check if job is saved (if user is logged in)
          if (isAuthenticated) {
            try {
              const savedResponse = await apiClient.get<{
                savedJobs: Array<{ job: { id: string } }>;
              }>("/saved-jobs");
              if (savedResponse.success && savedResponse.data?.savedJobs) {
                const savedJobIds = savedResponse.data.savedJobs.map(
                  (saved) => saved.job.id,
                );
                setIsSaved(savedJobIds.includes(jobId));
              }
            } catch (err) {
              console.error("Error checking saved status:", err);
            }

            // Check if already applied
            try {
              const applicationsResponse = await apiClient.get<{
                applications: Array<{ job: { id: string } }>;
              }>("/applications/my-applications");
              if (applicationsResponse.success && applicationsResponse.data) {
                const appliedJobIds =
                  applicationsResponse.data.applications.map(
                    (app) => app.job.id,
                  );
                setHasApplied(appliedJobIds.includes(jobId));
              }
            } catch (err) {
              console.error("Error checking applied status:", err);
            }
          }
        } else {
          setError(response.message || "Failed to fetch job details");
        }
      } catch (err) {
        setError("An error occurred while fetching job details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, isAuthenticated]);

  // Handle save job
  const handleSaveJob = async () => {
    if (!isAuthenticated) {
      setAuthModalAction("save");
      setShowAuthModal(true);
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        // Unsave job
        const response = await apiClient.post(`/saved-jobs/remove`, { jobId });
        if (response.success || response.data) {
          setIsSaved(false);
        }
      } else {
        // Save job
        const response = await apiClient.post(`/saved-jobs/save`, { jobId });
        if (response.success || response.data) {
          setIsSaved(true);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to save/unsave job:", error);
      // Handle duplicate save attempt
      const errorMessage = error instanceof Error ? error.message : "";
      const errorStatus = (error as any)?.response?.status;
      if (
        !isSaved &&
        (errorStatus === 400 || errorMessage.includes("already"))
      ) {
        setIsSaved(true);
      } else {
        alert("An error occurred. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle apply job
  const handleApplyJob = () => {
    if (!isAuthenticated) {
      setAuthModalAction("apply");
      setShowAuthModal(true);
      return;
    }
    setShowApplicationModal(true);
  };

  // Handle share job
  const handleShareJob = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this job: ${job?.title} at ${getCompanyName(
      job!,
    )}`;

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert(
          `${file.name} is not a valid file type. Please upload PDF, DOC, DOCX, or TXT files.`,
        );
        return false;
      }

      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }

      return true;
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle application submit
  const handleApplicationSubmit = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one document (resume required)");
      return;
    }

    setIsSubmittingApplication(true);

    try {
      // Upload files first
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("type", "APPLICATION");

      const uploadResponse = await apiClient.post<{
        attachments: Array<{ id: string }>;
      }>("/attachments/upload", formData);

      if (!uploadResponse.success || !uploadResponse.data?.attachments) {
        throw new Error("Failed to upload files");
      }

      const attachmentIds = uploadResponse.data.attachments.map(
        (att) => att.id,
      );

      // Submit application
      const applicationResponse = await apiClient.post("/applications/apply", {
        jobId,
        coverLetter: coverLetter || "",
        attachmentIds,
      });

      if (applicationResponse.success) {
        alert("Application submitted successfully!");
        setShowApplicationModal(false);
        setUploadedFiles([]);
        setCoverLetter("");
        setHasApplied(true);
      } else {
        throw new Error(
          applicationResponse.message || "Failed to submit application",
        );
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit application";
      alert(errorMessage);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-32 rounded bg-muted"></div>
              <div className="h-12 w-3/4 rounded bg-muted"></div>
              <div className="h-6 w-1/2 rounded bg-muted"></div>
              <div className="h-64 rounded bg-muted"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="rounded-xl border border-destructive bg-destructive/10 p-12 text-center">
              <h2 className="mb-4 text-2xl font-bold text-destructive">
                {error || "Job not found"}
              </h2>
              <Link href="/jobs">
                <Button variant="outline">
                  <HiArrowLeft className="mr-2 h-5 w-5" />
                  Back to Jobs
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const daysLeft = getDaysUntilDeadline(job.deadline);
  const jobImages = getJobImages(job);
  const documentAttachments = getDocumentAttachments(job);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background pb-20 lg:pb-8">
        {/* Back Button */}
        <div className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <HiArrowLeft className="h-5 w-5" />
              <span>Back to Jobs</span>
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Job Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        {job.title}
                      </h1>
                      {job.isFeatured && (
                        <Badge className="bg-yellow-500">
                          <HiStar className="mr-1 h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="mb-4 text-lg text-primary">
                      {getCompanyName(job)}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HiLocationMarker className="h-5 w-5" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HiBriefcase className="h-5 w-5" />
                        <span>{getJobType(job).replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HiCurrencyDollar className="h-5 w-5" />
                        <span>{getSalary(job)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HiClock className="h-5 w-5" />
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="hidden items-center gap-2 lg:flex">
                    <button
                      onClick={handleSaveJob}
                      disabled={isSaving}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                        isSaved
                          ? "border-primary bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30"
                          : "border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground"
                      } ${isSaving ? "cursor-not-allowed opacity-50" : ""}`}
                      title={isSaved ? "Remove from saved" : "Save for later"}
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      ) : (
                        <HiHeart
                          className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`}
                        />
                      )}
                    </button>
                    <button
                      onClick={handleShareJob}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border text-muted-foreground transition-all hover:bg-muted hover:border-muted-foreground"
                      title="Share this job"
                    >
                      <HiShare className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Desktop Apply Button */}
                <div className="hidden lg:block">
                  <Button
                    size="lg"
                    onClick={handleApplyJob}
                    disabled={hasApplied || daysLeft <= 0}
                    className="w-full"
                  >
                    {hasApplied
                      ? "Applied ✓"
                      : daysLeft <= 0
                        ? "Deadline Passed"
                        : "Apply Now"}
                  </Button>
                  {daysLeft > 0 && (
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      {daysLeft} {daysLeft === 1 ? "day" : "days"} left to apply
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Job Images */}
              {jobImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                    Job Images
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {jobImages.map((image, index) => (
                      <a
                        key={index}
                        href={formatImageUrl(image.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-video overflow-hidden rounded-lg"
                      >
                        <Image
                          src={formatImageUrl(image.url)}
                          alt={`Job image ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
                          <HiEye className="h-8 w-8 translate-y-4 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Job Description
                </h2>
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {job.description}
                  </p>
                </div>
              </motion.div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
                    <HiAcademicCap className="h-6 w-6 text-primary" />
                    Requirements
                  </h2>
                  <ul className="space-y-3">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <HiCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                    Benefits
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {job.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg bg-secondary/10 p-3"
                      >
                        <HiCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                        <span className="text-sm font-medium text-foreground">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Document Attachments */}
              {documentAttachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                    Attachments
                  </h2>
                  <div className="space-y-2">
                    {documentAttachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={formatImageUrl(attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary hover:shadow-md"
                      >
                        <HiDocumentText className="h-8 w-8 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {attachment.filename ||
                              attachment.url.split("/").pop()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click to download
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-full space-y-6 lg:w-80">
              {/* Company Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  About {getCompanyName(job)}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <HiOfficeBuilding className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-medium text-foreground">
                        {getCategoryLabel(job.category)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HiUsers className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Company Size
                      </p>
                      <p className="font-medium text-foreground">
                        50-100 employees
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HiCalendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="font-medium text-foreground">2015</p>
                    </div>
                  </div>

                  {isDatabaseJob(job) && job.employer.website && (
                    <div className="flex items-center gap-3">
                      <HiGlobeAlt className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a
                          href={
                            job.employer.website.startsWith("http")
                              ? job.employer.website
                              : `https://${job.employer.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {job.employer.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-4 text-sm text-muted-foreground">
                    {getCompanyDescription(job)}
                  </p>
                  {getCompanyId(job) ? (
                    <Link href={`/jobs/companies/${getCompanyId(job)}`}>
                      <Button variant="outline" className="w-full">
                        View Company Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Company Profile Unavailable
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Job Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Job Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      Experience Level
                    </p>
                    <p className="font-medium text-foreground">
                      {job.experience
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="mb-1 text-sm text-muted-foreground">
                      Remote Work
                    </p>
                    <p className="font-medium text-foreground">
                      {job.isRemote ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="mb-1 text-sm text-muted-foreground">
                      Posted On
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="mb-1 text-sm text-muted-foreground">
                      Application Deadline
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(job.deadline)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Similar Jobs */}
              {relatedJobs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Similar Jobs
                  </h3>

                  <div className="space-y-4">
                    {relatedJobs.map((relatedJob) => (
                      <Link
                        key={relatedJob.id}
                        href={`/jobs/${relatedJob.id}`}
                        className="block rounded-lg border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <h4 className="mb-1 line-clamp-2 font-medium text-foreground">
                          {relatedJob.title}
                        </h4>
                        <p className="mb-2 text-sm text-primary">
                          {getCompanyName(relatedJob)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{relatedJob.location}</span>
                          <span>{getSalary(relatedJob)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Link href="/jobs">
                      <Button variant="outline" className="w-full">
                        View All Jobs
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Apply Button (Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-border bg-background dark:bg-card backdrop-blur-sm shadow-lg p-3 sm:p-4 lg:hidden z-40">
          <div className="mx-auto flex max-w-screen-sm gap-2 sm:gap-3">
            <button
              onClick={handleSaveJob}
              disabled={isSaving}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all sm:h-12 sm:w-12 ${
                isSaved
                  ? "border-primary bg-primary/10 dark:bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              } ${isSaving ? "cursor-not-allowed opacity-50" : ""}`}
              title={isSaved ? "Remove from saved" : "Save for later"}
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent sm:h-5 sm:w-5"></div>
              ) : (
                <HiHeart
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    isSaved ? "fill-current" : ""
                  }`}
                />
              )}
            </button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleApplyJob}
              disabled={hasApplied || daysLeft <= 0}
            >
              {hasApplied
                ? "Applied ✓"
                : daysLeft <= 0
                  ? "Deadline Passed"
                  : "Apply Now"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authModalAction}
      />

      {/* Job Application Modal */}
      {showApplicationModal && job && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          job={{
            id: job.id,
            title: job.title,
            company: getCompanyName(job),
            location: job.location,
          }}
          onApplicationSuccess={() => {
            setShowApplicationModal(false);
            setHasApplied(true);
          }}
        />
      )}
    </div>
  );
}
