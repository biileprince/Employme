import { useState, useEffect } from "react";
import { useLoaderData, Link } from "react-router-dom";
import {
  HiLocationMarker,
  HiClock,
  HiBriefcase,
  HiCurrencyDollar,
  HiStar,
  HiHeart,
  HiShare,
  HiOfficeBuilding,
  HiUsers,
  HiGlobeAlt,
  HiCalendar,
  HiAcademicCap,
  HiCheckCircle,
  HiArrowLeft,
  HiEye,
} from "react-icons/hi";
import Button from "../../components/ui/Button";
import { AttachmentViewer } from "../../components/ui";
import { AuthModal } from "../../components/auth";
import JobApplicationModal from "../../components/features/JobApplicationModal";
import {
  applicationsAPI,
  savedJobsAPI,
  formatImageUrl,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getCategoryLabel } from "../../utils/constants";

// Database job structure from API
interface DatabaseJob {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  isRemote: boolean;
  jobType: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: Date;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  requirements: string[];
  responsibilities?: string;
  benefits: string[];
  contactPhone?: string;
  contactCountryCode?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    fileType: string;
    fileSize: number;
  }>;
  employer: {
    companyName: string;
    logoUrl?: string;
    location?: string;
    website?: string;
    description?: string;
  };
}

// Legacy job structure for mock data
interface LegacyJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements?: string[];
  postedDate?: string;
  deadline?: string;
}

type Job = DatabaseJob | LegacyJob;

const JobDetail = () => {
  const { job, relatedJobs } = useLoaderData() as {
    job: Job;
    relatedJobs: Job[];
  };
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showJobApplicationModal, setShowJobApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Type guard to check if job is from database
  const isDatabaseJob = (job: Job): job is DatabaseJob => {
    return "employer" in job && typeof job.employer === "object";
  };

  // Helper functions to extract data from either job type
  const getCompanyName = (job: Job) => {
    return isDatabaseJob(job) ? job.employer.companyName : job.company;
  };

  const getCompanyId = (job: Job) => {
    return isDatabaseJob(job) ? job.employer.id : null;
  };

  const getJobType = (job: Job) => {
    return isDatabaseJob(job) ? job.jobType : job.type;
  };

  const getSalary = (job: Job) => {
    if (isDatabaseJob(job)) {
      if (job.salaryMin && job.salaryMax) {
        return `GHS ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} monthly`;
      } else if (job.salaryMin) {
        return `From GHS ${job.salaryMin.toLocaleString()} monthly`;
      }
      return "Salary negotiable";
    }
    return job.salary || "Salary negotiable";
  };

  // Check if job is saved and handle save/unsave
  useEffect(() => {
    const checkJobStatus = async () => {
      if (!user) return;

      try {
        // Only check saved jobs for job seekers
        if (user.role === "JOB_SEEKER") {
          // Check if job is saved
          const savedResponse = await savedJobsAPI.getSavedJobs();
          const savedJobs =
            (
              savedResponse as {
                data: { savedJobs: { jobId: string; id: string }[] };
              }
            ).data.savedJobs || [];
          const isJobSaved = savedJobs.some(
            (savedJob) => (savedJob.jobId || savedJob.id) === job.id
          );
          setIsSaved(isJobSaved);

          // Check if user has already applied
          const applicationsResponse =
            await applicationsAPI.getMyApplications();
          const applications =
            (
              applicationsResponse as {
                data: { applications: { jobId: string }[] };
              }
            ).data.applications || [];
          const hasUserApplied = applications.some(
            (app) => app.jobId === job.id
          );
          setHasApplied(hasUserApplied);
        } else {
          // For employers, don't check saved jobs but they can still see the job
          setIsSaved(false);
          setHasApplied(false);
        }
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    };

    checkJobStatus();
  }, [user, job.id]);

  const handleSaveJob = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Only allow job seekers to save jobs
    if (user.role !== "JOB_SEEKER") {
      alert("Only job seekers can save jobs.");
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await savedJobsAPI.unsaveJob(job.id);
        setIsSaved(false);
      } else {
        await savedJobsAPI.saveJob(job.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      alert("Failed to save job. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyJob = async () => {
    if (!user) {
      setShowApplyModal(true);
      return;
    }

    if (hasApplied) {
      alert("You have already applied for this job.");
      return;
    }

    // Open the job application modal
    setShowJobApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
  };

  const getRequirements = (job: Job) => {
    if (isDatabaseJob(job)) {
      return job.requirements || [];
    }
    return job.requirements || [];
  };

  const getBenefits = (job: Job) => {
    if (isDatabaseJob(job)) {
      return job.benefits || [];
    }
    return [
      "Health Insurance",
      "Professional Development",
      "Flexible Working Hours",
      "Performance Bonuses",
    ];
  };

  const getCompanyLogo = (job: Job) => {
    // Only get the actual company logo
    if (isDatabaseJob(job) && job.employer.logoUrl) {
      return formatImageUrl(job.employer.logoUrl);
    }

    // Fallback to mock logos based on company name
    const companyName = getCompanyName(job);
    const logos: Record<string, string> = {
      "TechCorp Ghana":
        "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&crop=center",
      DigitalWave:
        "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&h=120&fit=crop&crop=center",
      GhanaFintech:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop&crop=center",
      "BuildTech Solutions":
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&h=120&fit=crop&crop=center",
      "DataInsight Ghana":
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=120&h=120&fit=crop&crop=center",
    };
    return (
      logos[companyName] ||
      "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&crop=center"
    );
  };

  const getJobImages = (job: Job) => {
    // Get job advertisement images from attachments (fileType: "IMAGE")
    if (isDatabaseJob(job) && job.attachments && job.attachments.length > 0) {
      return job.attachments.filter((att) => att.fileType === "IMAGE");
    }
    return [];
  };

  const getCompanyDescription = (job: Job) => {
    if (isDatabaseJob(job) && job.employer.description) {
      return job.employer.description;
    }
    return `${getCompanyName(
      job
    )} is a leading company committed to innovation and excellence. We provide a dynamic work environment where employees can grow and contribute to meaningful projects.`;
  };

  const getDeadline = (job: Job) => {
    if (isDatabaseJob(job) && job.deadline) {
      return new Date(job.deadline).toLocaleDateString();
    }
    return null;
  };

  const deadline = getDeadline(job);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/jobs"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Jobs</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Company Logo Only */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center">
                <img
                  src={getCompanyLogo(job)}
                  alt={`${getCompanyName(job)} logo`}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-border dark:border-gray-700 shadow-lg"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Company Logo
                </p>
              </div>
            </div>

            {/* Job Header Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                <div className="flex-1 md:max-w-2xl">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {job.title}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    {getCompanyId(job) ? (
                      <Link
                        to={`/company/${getCompanyId(job)}`}
                        className="text-lg md:text-xl font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        {getCompanyName(job)}
                      </Link>
                    ) : (
                      <h2 className="text-lg md:text-xl font-semibold text-primary">
                        {getCompanyName(job)}
                      </h2>
                    )}
                    <div className="flex items-center gap-1">
                      <HiStar className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                      <span className="text-xs md:text-sm text-muted-foreground">
                        4.5 (127 reviews)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                    <div className="flex items-center text-sm md:text-base text-muted-foreground">
                      <HiLocationMarker className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary flex-shrink-0" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center text-sm md:text-base text-muted-foreground">
                      <HiBriefcase className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary flex-shrink-0" />
                      <span>{getJobType(job)}</span>
                    </div>
                    <div className="flex items-center text-sm md:text-base text-muted-foreground">
                      <HiCurrencyDollar className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary flex-shrink-0" />
                      <span>{getSalary(job)}</span>
                    </div>
                    <div className="flex items-center text-sm md:text-base text-muted-foreground">
                      <HiClock className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary flex-shrink-0" />
                      <span>
                        {deadline
                          ? `Deadline: ${deadline}`
                          : "Posted 2 days ago"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-primary/10 text-primary">
                      Full-time
                    </span>
                    <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-secondary/10 text-secondary">
                      Remote
                    </span>
                    <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-yellow-500/10 text-yellow-700">
                      Urgent Hiring
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col lg:flex-row   gap-2 md:gap-3 md:flex-shrink-0">
                  {(!user || user?.role !== "EMPLOYER") && (
                    <button
                      onClick={handleSaveJob}
                      disabled={isSaving}
                      className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border transition-colors text-sm font-medium whitespace-nowrap ${
                        isSaved
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                          : "bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
                      } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <HiHeart
                          className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
                        />
                      )}
                      <span className="hidden sm:inline">
                        {isSaving
                          ? "Saving..."
                          : isSaved
                          ? "Saved"
                          : "Save Job"}
                      </span>
                    </button>
                  )}

                  <button className="flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border border-border dark:border-gray-700 bg-background dark:bg-gray-800 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap">
                    <HiShare className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  {(!user || user?.role !== "EMPLOYER") && (
                    <Button
                      size="md"
                      onClick={handleApplyJob}
                      disabled={hasApplied}
                      className={`px-4 md:px-6 text-sm font-medium whitespace-nowrap ${
                        hasApplied
                          ? "bg-secondary/20 text-secondary cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {hasApplied ? "Applied ✓" : "Apply Now"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Job Advertisement Image - Prominent Display */}
            {getJobImages(job).length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Job Advertisement
                </h3>
                <div
                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={() =>
                    window.open(
                      formatImageUrl(getJobImages(job)[0].url),
                      "_blank"
                    )
                  }
                >
                  <img
                    src={formatImageUrl(getJobImages(job)[0].url)}
                    alt="Job advertisement"
                    className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-white text-center">
                      <HiEye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">View Full Size</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Job Description
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {job.description}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We are looking for a talented React Developer to join our
                  dynamic team. You will be responsible for developing and
                  implementing user interface components using React.js concepts
                  and workflows such as Redux, Flux, and Webpack. You will also
                  be responsible for profiling and improving front-end
                  performance and documenting our front-end codebase.
                </p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Requirements
              </h3>
              <ul className="space-y-3">
                {getRequirements(job).map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <HiAcademicCap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Responsibilities */}
            {isDatabaseJob(job) && job.responsibilities && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Key Responsibilities
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{job.responsibilities}</p>
                </div>
              </div>
            )}

            {/* Benefits - Only show if there are benefits */}
            {getBenefits(job).length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Benefits & Perks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getBenefits(job).map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg"
                    >
                      <HiCheckCircle className="w-5 h-5 text-secondary" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Attachments (Documents & Files) - Exclude Job Images */}
            {isDatabaseJob(job) &&
              job.attachments &&
              job.attachments.filter((att) => att.fileType !== "IMAGE").length >
                0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    All Documents & Files
                  </h3>
                  <AttachmentViewer
                    attachments={job.attachments.filter(
                      (att) => att.fileType !== "IMAGE"
                    )}
                    maxPreviewImages={6}
                    showDownloadButton={true}
                    showFullscreenButton={true}
                  />
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Company Info */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                About {getCompanyName(job)}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <HiOfficeBuilding className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Industry
                    </p>
                    <p className="font-medium text-foreground dark:text-white">
                      {isDatabaseJob(job)
                        ? getCategoryLabel(job.category)
                        : "Technology"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HiUsers className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Company Size
                    </p>
                    <p className="font-medium text-foreground dark:text-white">
                      50-100 employees
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HiCalendar className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Founded
                    </p>
                    <p className="font-medium text-foreground dark:text-white">
                      2015
                    </p>
                  </div>
                </div>

                {isDatabaseJob(job) && job.employer.website && (
                  <div className="flex items-center gap-3">
                    <HiGlobeAlt className="w-5 h-5 text-primary dark:text-blue-400" />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Website
                      </p>
                      <a
                        href={
                          job.employer.website.startsWith("http")
                            ? job.employer.website
                            : `https://${job.employer.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary dark:text-blue-400 hover:underline"
                      >
                        {job.employer.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border dark:border-gray-700">
                <p className="text-sm text-muted-foreground dark:text-gray-300 mb-4">
                  {getCompanyDescription(job)}
                </p>
                <Button variant="outline" fullWidth>
                  View Company Profile
                </Button>
              </div>
            </div>

            {/* Similar Jobs */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                Similar Jobs
              </h3>

              <div className="space-y-4">
                {relatedJobs?.slice(0, 3).map((relatedJob) => (
                  <Link
                    key={relatedJob.id}
                    to={`/jobs/${relatedJob.id}`}
                    className="block p-4 bg-background dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <h4 className="font-medium text-foreground dark:text-white mb-1 line-clamp-2">
                      {relatedJob.title}
                    </h4>
                    <p className="text-sm text-primary dark:text-blue-400 mb-2">
                      {getCompanyName(relatedJob)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-400">
                      <span>{relatedJob.location}</span>
                      <span>{getSalary(relatedJob)}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4">
                <Link to="/jobs">
                  <Button variant="outline" fullWidth>
                    View All Jobs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Apply Button (Mobile) - Show for all users except employers */}
      {(!user || user?.role !== "EMPLOYER") && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border dark:border-gray-800 p-3 sm:p-4 lg:hidden">
          <div className="flex gap-2 sm:gap-3 max-w-screen-sm mx-auto">
            <button
              onClick={handleSaveJob}
              disabled={isSaving}
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg border transition-colors ${
                isSaved
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                  : "border-border dark:border-gray-700 text-muted-foreground dark:text-gray-400"
              } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-current"></div>
              ) : (
                <HiHeart
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isSaved ? "fill-current" : ""
                  }`}
                />
              )}
            </button>
            <Button
              size="lg"
              fullWidth
              className="flex-1"
              onClick={handleApplyJob}
              disabled={hasApplied}
            >
              {hasApplied ? "Applied ✓" : "Apply Now"}
            </Button>
          </div>
        </div>
      )}

      {/* Auth Modal for Saving */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Login to Save Jobs"
        actionType="save"
      />

      {/* Auth Modal for Applying */}
      <AuthModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Login to Apply"
        actionType="apply"
      />

      {/* Job Application Modal */}
      <JobApplicationModal
        isOpen={showJobApplicationModal}
        onClose={() => setShowJobApplicationModal(false)}
        job={{
          id: job.id,
          title: job.title,
          company: getCompanyName(job),
          location: job.location,
        }}
        onApplicationSuccess={handleApplicationSuccess}
      />
    </div>
  );
};

export default JobDetail;
