import { useState } from "react";
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
} from "react-icons/hi";
import Button from "../../components/ui/Button";

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
  benefits: string[];
  contactPhone?: string;
  contactCountryCode?: string;
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
  const [isSaved, setIsSaved] = useState(false);

  // Type guard to check if job is from database
  const isDatabaseJob = (job: Job): job is DatabaseJob => {
    return "employer" in job && typeof job.employer === "object";
  };

  // Helper functions to extract data from either job type
  const getCompanyName = (job: Job) => {
    return isDatabaseJob(job) ? job.employer.companyName : job.company;
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
    if (isDatabaseJob(job) && job.employer.logoUrl) {
      return job.employer.logoUrl;
    }

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
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <img
                src={getCompanyLogo(job)}
                alt={`${getCompanyName(job)} logo`}
                className="w-24 h-24 rounded-xl object-cover border-2 border-border dark:border-gray-700 shadow-lg"
              />
            </div>

            {/* Job Header Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                <div className="flex-1 md:max-w-2xl">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {job.title}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <h2 className="text-lg md:text-xl font-semibold text-primary">
                      {getCompanyName(job)}
                    </h2>
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
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border transition-colors text-sm font-medium whitespace-nowrap ${
                      isSaved
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                        : "bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    <HiHeart
                      className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
                    />
                    <span className="hidden sm:inline">
                      {isSaved ? "Saved" : "Save Job"}
                    </span>
                  </button>

                  <button className="flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border border-border dark:border-gray-700 bg-background dark:bg-gray-800 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap">
                    <HiShare className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  <Button
                    size="md"
                    className="px-4 md:px-6 text-sm font-medium whitespace-nowrap"
                  >
                    Apply Now
                  </Button>
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

            {/* Benefits */}
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
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Company Info */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6 sticky top-4">
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
                      {isDatabaseJob(job) ? job.category : "Technology"}
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

      {/* Sticky Apply Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border dark:border-gray-800 p-3 sm:p-4 lg:hidden">
        <div className="flex gap-2 sm:gap-3 max-w-screen-sm mx-auto">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg border transition-colors ${
              isSaved
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "border-border dark:border-gray-700 text-muted-foreground dark:text-gray-400"
            }`}
          >
            <HiHeart
              className={`w-5 h-5 sm:w-6 sm:h-6 ${
                isSaved ? "fill-current" : ""
              }`}
            />
          </button>
          <Button size="lg" fullWidth className="flex-1">
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
