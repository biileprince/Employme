import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HiFilter,
  HiLocationMarker,
  HiClock,
  HiBriefcase,
  HiCurrencyDollar,
  HiStar,
  HiX,
  HiUpload,
  HiDocumentText,
  HiTrash,
} from "react-icons/hi";
import Button from "../../components/ui/Button";
import { AuthModal } from "../../components/auth";
import {
  jobsAPI,
  applicationsAPI,
  attachmentAPI,
  formatImageUrl,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  INDUSTRIES,
  LOCATION_API_CONFIG,
  getCategoryLabel,
} from "../../utils/constants";

// Interface for backend job data
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  jobType: string;
  experienceLevel: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    fileType: string;
    fileSize: number;
  }>;
  employer: {
    id: string;
    companyName: string;
    companyDescription?: string;
    website?: string;
    location?: string;
    logoUrl?: string;
  };
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const JobListings = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<"save" | "apply">("save");
  const [searchTerm, setSearchTerm] = useState("");

  // Job Application Modal State
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({
    jobType: "",
    location: "",
    salaryRange: "",
    experience: "",
    categories: [] as string[],
  });

  // Ref to track previous API params to prevent duplicate requests
  const prevParamsRef = useRef<string>("");

  // Component mounted effect for debugging
  useEffect(() => {
    console.log("🚀 JobListings component mounted");
  }, []);

  // Load user's applications when user changes
  useEffect(() => {
    const loadUserApplications = async () => {
      if (!user || user.role !== "JOB_SEEKER") return;

      try {
        const response = await applicationsAPI.getMyApplications();
        if (response.success && response.data) {
          const data = response.data as { applications?: { jobId: string }[] };
          const applications = data.applications || [];
          const jobIds = applications.map((app) => app.jobId);
          setAppliedJobs(new Set(jobIds));
        }
      } catch (error) {
        console.error("Failed to load user applications:", error);
      }
    };

    loadUserApplications();
  }, [user]);

  // Location search states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<
    { place_id: number; display_name: string }[]
  >([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Location search functionality
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const response = await fetch(
        `${LOCATION_API_CONFIG.baseUrl}?format=json&q=${encodeURIComponent(
          query
        )}&limit=${LOCATION_API_CONFIG.limit}&countrycodes=${
          LOCATION_API_CONFIG.countryCodes
        }`
      );
      const data = await response.json();
      setLocationResults(data);
      setShowLocationDropdown(true);
    } catch (error) {
      console.error("Error searching locations:", error);
      setLocationResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Debounced location search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationSearch) {
        searchLocations(locationSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearch]);

  const selectLocation = (location: {
    place_id: number;
    display_name: string;
  }) => {
    // Extract only the city/town name (first part before comma)
    const cityName = location.display_name.split(",")[0].trim();

    setFilter((prev) => ({ ...prev, location: cityName }));
    setLocationSearch(cityName);
    setShowLocationDropdown(false);
    setLocationResults([]);
  };
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setFilter((prev) => ({ ...prev, categories: [categoryParam] }));
    }
  }, [searchParams]);

  // Memoize API parameters to prevent unnecessary recreations
  const apiParams = useMemo(() => {
    const params: Record<string, string | number> = {
      limit: 50, // Get more jobs to show
    };

    // Add search and filter parameters only if they have meaningful values
    if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
    if (filter.categories && filter.categories.length > 0)
      params.category = filter.categories[0];
    if (filter.location && filter.location.trim())
      params.location = filter.location.trim();
    if (filter.jobType && filter.jobType.trim()) {
      params.jobType = filter.jobType.toUpperCase().replace("-", "_");
    }
    if (filter.experience && filter.experience.trim()) {
      const expMap: Record<string, string> = {
        "Entry Level": "ENTRY_LEVEL",
        "Mid Level": "MID_LEVEL",
        "Senior Level": "SENIOR_LEVEL",
        Executive: "EXECUTIVE",
      };
      const mappedExp = expMap[filter.experience];
      if (mappedExp) {
        params.experience = mappedExp;
      }
    }

    return params;
  }, [
    searchTerm,
    filter.categories,
    filter.location,
    filter.jobType,
    filter.experience,
  ]);

  // Handle apply to job
  const handleApplyJob = (job: Job) => {
    if (!user) {
      setAuthModalType("apply");
      setShowAuthModal(true);
      return;
    }

    // Only allow job seekers to apply
    if (user.role !== "JOB_SEEKER") {
      alert("Only job seekers can apply for jobs.");
      return;
    }

    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(
          `Invalid file type for ${file.name}. Please upload PDF, DOC, DOCX, or TXT files only.`
        );
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      validFiles.push(file);
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);

    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle application submission
  const handleApplicationSubmit = async () => {
    if (!selectedJob || !user) return;

    // Validate that at least one file is uploaded (resume required)
    if (uploadedFiles.length === 0) {
      alert("Please upload your resume before submitting the application.");
      return;
    }

    setIsSubmittingApplication(true);
    try {
      let attachmentIds: string[] = [];

      // Upload files (required)
      if (uploadedFiles.length > 0) {
        const uploadResponse = await attachmentAPI.upload(
          uploadedFiles,
          "APPLICATION",
          undefined
        );

        if (!uploadResponse.success) {
          throw new Error("Failed to upload files");
        }

        // Extract attachment IDs from response
        if (
          uploadResponse.data &&
          typeof uploadResponse.data === "object" &&
          "attachments" in uploadResponse.data
        ) {
          const attachmentsData = uploadResponse.data as {
            attachments: Array<{ id: string }>;
          };
          attachmentIds = attachmentsData.attachments.map((att) => att.id);
        }
      }

      // Submit application with attachment IDs
      const applicationResponse = await applicationsAPI.apply(
        selectedJob.id,
        undefined, // No cover letter text, only file uploads
        attachmentIds
      );

      if (applicationResponse.success) {
        alert("Application submitted successfully!");
        setAppliedJobs((prev) => new Set([...prev, selectedJob.id]));
        setShowApplicationModal(false);
        setSelectedJob(null);
        setUploadedFiles([]);
      } else {
        throw new Error(
          applicationResponse.message || "Failed to submit application"
        );
      }
    } catch (error) {
      console.error("Application submission error:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // Fetch jobs function without useCallback to avoid circular dependencies
  const fetchJobsInternal = async (params: Record<string, string | number>) => {
    try {
      setLoading(true);
      console.log("🔍 Fetching jobs with params:", params);
      const response = await jobsAPI.getAll(params);
      console.log("📡 API response:", response);

      if (response.success && response.data) {
        const data = response.data as JobsResponse;
        console.log("✅ Jobs data received:", data.jobs?.length, "jobs");
        console.log(
          "📝 Setting jobs state with",
          data.jobs?.length || 0,
          "jobs"
        );
        setJobs(data.jobs || []);
      } else {
        console.log("❌ API response not successful:", response);
        setJobs([]);
      }
    } catch (error) {
      console.error("💥 Error fetching jobs:", error);
      setJobs([]);
    } finally {
      console.log("✅ Setting loading to false");
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    console.log("⚡ Initial fetch useEffect triggered");
    fetchJobsInternal({ limit: 50 });
  }, []); // Only run once on mount

  // Debounced fetch when filters change
  useEffect(() => {
    const paramsString = JSON.stringify(apiParams);
    console.log("🎛️ Debounced fetch effect - apiParams:", apiParams);
    console.log("📊 apiParams keys length:", Object.keys(apiParams).length);
    console.log("🔄 Previous params:", prevParamsRef.current);
    console.log("📝 Current params string:", paramsString);

    // Skip if this is just the default params (no filters applied) or if params haven't changed
    if (
      (Object.keys(apiParams).length === 1 && apiParams.limit === 50) ||
      paramsString === prevParamsRef.current
    ) {
      console.log("⏭️ Skipping debounced fetch (default params or no change)");
      return;
    }

    console.log("🔄 Params changed, scheduling debounced fetch");
    // Update previous params
    prevParamsRef.current = paramsString;

    // Use debouncing for filter changes
    const timeoutId = setTimeout(() => {
      console.log("⏰ Debounced fetch executing");
      fetchJobsInternal(apiParams);
    }, 500);

    return () => {
      console.log("🚫 Clearing debounced fetch timeout");
      clearTimeout(timeoutId);
    };
  }, [apiParams]);

  // Enhanced company logo function that prioritizes actual employer logos
  const getCompanyLogo = (job: Job) => {
    // First, try to use the actual employer logo from the database
    if (job.employer.logoUrl) {
      return formatImageUrl(job.employer.logoUrl);
    }

    // Fallback logos for demonstration - in production, this would fetch from employer profiles
    const logos: Record<string, string> = {
      "TechCorp Ghana":
        "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=64&h=64&fit=crop&crop=center",
      DigitalWave:
        "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=64&h=64&fit=crop&crop=center",
      GhanaFintech:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=center",
      "BuildTech Solutions":
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=64&h=64&fit=crop&crop=center",
      "DataInsight Ghana":
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=64&h=64&fit=crop&crop=center",
    };
    return (
      logos[job.employer.companyName] ||
      "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=64&h=64&fit=crop&crop=center"
    );
  };

  // Calculate job counts by category
  const getJobCounts = () => {
    const counts: Record<string, number> = {};
    jobs.forEach((job) => {
      const category = job.category || "TECHNOLOGY";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  };

  const jobCounts = getJobCounts();
  const jobCategories = INDUSTRIES;

  // Filter jobs based on search term and filters (client-side for additional filtering)
  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        !searchTerm ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer.companyName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesJobType =
        !filter.jobType ||
        (job.jobType &&
          job.jobType.toLowerCase().replace("_", "-") ===
            filter.jobType.toLowerCase());
      const matchesLocation =
        !filter.location ||
        job.location.toLowerCase().includes(filter.location.toLowerCase());

      const matchesCategories =
        filter.categories.length === 0 ||
        filter.categories.some(
          (category) => job.category.toLowerCase() === category.toLowerCase()
        );

      // Handle salary range filtering
      let matchesSalary = true;
      if (filter.salaryRange && job.salaryMin && job.salaryMax) {
        const avgSalary = (job.salaryMin + job.salaryMax) / 2;
        switch (filter.salaryRange) {
          case "Under GHS 2,000":
            matchesSalary = avgSalary < 2000;
            break;
          case "GHS 2,000 - 5,000":
            matchesSalary = avgSalary >= 2000 && avgSalary <= 5000;
            break;
          case "GHS 5,000 - 10,000":
            matchesSalary = avgSalary >= 5000 && avgSalary <= 10000;
            break;
          case "Above GHS 10,000":
            matchesSalary = avgSalary > 10000;
            break;
        }
      }

      return (
        matchesSearch &&
        matchesJobType &&
        matchesLocation &&
        matchesCategories &&
        matchesSalary
      );
    });

    return filtered;
  }, [jobs, searchTerm, filter]);

  // Handle category toggle
  const toggleCategory = (category: string) => {
    setFilter((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  // Format salary for display
  const formatSalary = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `GHS ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    }
    return "Salary not specified";
  };

  // Format job type for display
  const formatJobType = (jobType: string | undefined) => {
    if (!jobType) return "Not specified";
    return jobType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section with skypattern background */}
      <div
        className="bg-gradient-to-br from-primary via-primary to-primary-600 text-white py-16 relative overflow-hidden"
        style={{
          backgroundImage: `url('/src/assets/images/skypattern.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Multiple overlay layers for better readability */}
        <div className="absolute inset-0 bg-primary/80 dark:bg-primary/85"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
              Find Your Dream Job
            </h1>
            <p className="text-xl text-white/95 max-w-2xl mx-auto drop-shadow-md">
              {loading
                ? `Loading jobs... (${jobs.length} found)`
                : `${filteredJobs.length} jobs available across Ghana`}
            </p>
          </div>

          {/* Main Search Bar with improved contrast */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Job title, keywords, or company"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search location..."
                    className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {showLocationDropdown && locationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationResults.map((location) => (
                        <button
                          key={location.place_id}
                          type="button"
                          onClick={() => selectLocation(location)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none text-gray-900 dark:text-white"
                        >
                          <div className="flex items-center">
                            <HiLocationMarker className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="truncate">
                              {location.display_name.split(",")[0].trim()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {filter.location && (
                    <button
                      onClick={() => {
                        setFilter({ ...filter, location: "" });
                        setLocationSearch("");
                      }}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium dark:text-primary-400"
                >
                  <HiFilter className="w-5 h-5" />
                  {showFilters ? "Hide Filters" : "More Filters"}
                </button>
                <Button
                  size="lg"
                  className="px-8"
                  onClick={() => fetchJobsInternal(apiParams)}
                >
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4"
            >
              <HiFilter className="w-5 h-5 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Sidebar Filters */}
          <div
            className={`lg:w-80 space-y-6 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  Filter Jobs
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Categories Display */}
              {filter.categories.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-foreground dark:text-white">
                    Selected Categories:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filter.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400"
                      >
                        {category}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="ml-2 p-0.5 hover:bg-primary/20 rounded-full"
                        >
                          <HiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Categories with counts and multiple selection */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-foreground dark:text-white">
                  Categories
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobCategories.map((category) => (
                    <label
                      key={category.value}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filter.categories.includes(category.value)}
                          onChange={() => toggleCategory(category.value)}
                          className="mr-3 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white">
                          {category.label}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {jobCounts[category.value] || 0}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-foreground dark:text-white">
                  Job Type
                </h4>
                <div className="space-y-2">
                  {["full-time", "part-time", "contract", "internship"].map(
                    (type) => (
                      <label
                        key={type}
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
                      >
                        <input
                          type="radio"
                          name="jobType"
                          value={type}
                          checked={filter.jobType === type}
                          onChange={(e) =>
                            setFilter({ ...filter, jobType: e.target.value })
                          }
                          className="mr-3 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white">
                          {formatJobType(type)}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-foreground dark:text-white">
                  Experience Level
                </h4>
                <div className="space-y-2">
                  {[
                    "Entry Level",
                    "Mid Level",
                    "Senior Level",
                    "Executive",
                  ].map((level) => {
                    const isSelected = filter.experience === level;
                    return (
                      <label
                        key={level}
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
                      >
                        <input
                          type="radio"
                          name="experience"
                          value={level}
                          checked={isSelected}
                          onChange={(e) =>
                            setFilter({ ...filter, experience: e.target.value })
                          }
                          className="mr-3 text-primary focus:ring-primary"
                        />
                        <span
                          className={`text-sm transition-colors ${
                            isSelected
                              ? "text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          } dark:text-gray-300 dark:hover:text-white`}
                        >
                          {level}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <h4 className="font-medium mb-3 text-foreground dark:text-white">
                  Salary Range
                </h4>
                <div className="space-y-2">
                  {[
                    "Under GHS 2,000",
                    "GHS 2,000 - 5,000",
                    "GHS 5,000 - 10,000",
                    "Above GHS 10,000",
                  ].map((range) => (
                    <label
                      key={range}
                      className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
                    >
                      <input
                        type="radio"
                        name="salaryRange"
                        value={range}
                        checked={filter.salaryRange === range}
                        onChange={(e) =>
                          setFilter({ ...filter, salaryRange: e.target.value })
                        }
                        className="mr-3 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white">
                        {range}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border dark:border-gray-600">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() =>
                    setFilter({
                      jobType: "",
                      location: "",
                      salaryRange: "",
                      experience: "",
                      categories: [],
                    })
                  }
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground dark:text-white">
                  {loading
                    ? `Loading jobs... (${jobs.length} loaded so far)`
                    : `${filteredJobs.length} Jobs Found (${jobs.length} total loaded)`}
                </h2>
                <p className="text-muted-foreground dark:text-gray-400">
                  Best jobs matching your criteria
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  Sort by:
                </span>
                <select className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-foreground dark:text-white">
                  <option>Most Recent</option>
                  <option>Salary (High to Low)</option>
                  <option>Salary (Low to High)</option>
                  <option>Relevance</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-6 animate-pulse"
                  >
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Job Cards Grid */}
            {(() => {
              console.log("🎯 Render state:", {
                loading,
                jobsLength: jobs.length,
                filteredJobsLength: filteredJobs.length,
              });
              return null;
            })()}
            {!loading && (
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No jobs found matching your criteria.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={async () => {
                        setSearchTerm("");
                        setFilter({
                          jobType: "",
                          location: "",
                          salaryRange: "",
                          experience: "",
                          categories: [],
                        });
                        // Force refresh by fetching all jobs
                        await fetchJobsInternal({ limit: 50 });
                      }}
                    >
                      Clear filters and try again
                    </Button>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Job Image/Company Logo */}
                        <div className="flex-shrink-0 relative">
                          {/* Main job image or fallback to company logo */}
                          <div className="relative">
                            <img
                              src={
                                job.attachments && job.attachments.length > 0
                                  ? formatImageUrl(
                                      job.attachments.find(
                                        (att) => att.fileType === "IMAGE"
                                      )?.url || ""
                                    )
                                  : getCompanyLogo(job)
                              }
                              alt={
                                job.attachments && job.attachments.length > 0
                                  ? `${job.title} advertisement`
                                  : `${job.employer.companyName} logo`
                              }
                              className={`rounded-xl object-cover border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg ${
                                job.attachments && job.attachments.length > 0
                                  ? "w-20 h-20 sm:w-24 sm:h-24" // Bigger for job ads
                                  : "w-16 h-16 sm:w-20 sm:h-20" // Smaller for company logos
                              }`}
                              onError={(e) => {
                                // Fallback to company logo if job image fails
                                (e.target as HTMLImageElement).src =
                                  getCompanyLogo(job);
                              }}
                            />

                            {/* Company logo badge when job image exists */}
                            {job.attachments &&
                              job.attachments.length > 0 &&
                              job.employer.logoUrl && (
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-background bg-background shadow-lg overflow-hidden">
                                  <img
                                    src={formatImageUrl(job.employer.logoUrl)}
                                    alt={`${job.employer.companyName} logo`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                          </div>

                          {/* Enhanced decorative background elements */}
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary-500/20 rounded-full z-0"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-primary-500/15 rotate-45 z-0"></div>

                          {/* Enhanced pattern overlay */}
                          <div className="absolute inset-1 rounded-lg overflow-hidden z-0">
                            <div className="absolute top-1 right-1 w-2 h-2 border border-secondary-400/40 rounded-full bg-white/10"></div>
                            <div className="absolute bottom-1 left-1 w-3 h-3 bg-primary-400/30 rotate-45 rounded-sm"></div>
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/jobs/${job.id}`}
                                className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors mb-1 line-clamp-2"
                              >
                                {job.title}
                              </Link>
                              <p className="text-lg text-foreground font-medium">
                                {job.employer.companyName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                              <HiStar className="w-5 h-5 text-yellow-500" />
                              <span className="text-sm text-muted-foreground">
                                4.5
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="flex items-center text-muted-foreground">
                              <HiLocationMarker className="w-4 h-4 mr-2 text-primary" />
                              <span className="text-sm">{job.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <HiBriefcase className="w-4 h-4 mr-2 text-primary" />
                              <span className="text-sm">
                                {formatJobType(job.jobType)}
                              </span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <HiCurrencyDollar className="w-4 h-4 mr-2 text-primary" />
                              <span className="text-sm">
                                {formatSalary(job)}
                              </span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <HiClock className="w-4 h-4 mr-2 text-primary" />
                              <span className="text-sm">
                                {formatDate(job.createdAt)}
                              </span>
                            </div>
                          </div>

                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {formatJobType(job.jobType)}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                                {job.experienceLevel}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700">
                                {getCategoryLabel(job.category)}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {(!user || user?.role !== "EMPLOYER") && (
                                <Button
                                  size="sm"
                                  className="font-medium"
                                  onClick={() => handleApplyJob(job)}
                                  disabled={appliedJobs.has(job.id)}
                                  variant={
                                    appliedJobs.has(job.id)
                                      ? "outline"
                                      : "primary"
                                  }
                                >
                                  {appliedJobs.has(job.id)
                                    ? "Applied"
                                    : "Apply Now"}
                                </Button>
                              )}
                              <Link to={`/jobs/${job.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="font-medium"
                                >
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Responsive Pagination */}
            {!loading && filteredJobs.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>

                {/* Page Numbers - Hide some on mobile */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {/* Mobile: Show fewer pages */}
                  <div className="flex gap-1 sm:hidden">
                    {[1, 2, 3].map((page) => (
                      <Button
                        key={page}
                        variant={page === 1 ? "primary" : "outline"}
                        size="sm"
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    ))}
                    <span className="flex items-center px-2 text-muted-foreground">
                      ...
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[40px]"
                    >
                      10
                    </Button>
                  </div>

                  {/* Desktop: Show all pages */}
                  <div className="hidden sm:flex gap-1">
                    {[1, 2, 3, 4, 5].map((page) => (
                      <Button
                        key={page}
                        variant={page === 1 ? "primary" : "outline"}
                        size="sm"
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={
          authModalType === "save" ? "Login to Save Jobs" : "Login to Apply"
        }
        actionType={authModalType}
      />

      {/* Job Application Modal */}
      {showApplicationModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Apply for {selectedJob.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  at {selectedJob.employer.companyName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setSelectedJob(null);
                  setUploadedFiles([]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <HiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Profile Completion Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-blue-800">
                      Profile Information Notice
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      When you apply for this job, the employer will be able to
                      see your complete profile information. Please ensure your
                      profile details are complete and up-to-date for the best
                      impression.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Documents <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Resume is required. You can also upload additional documents
                  such as cover letter, portfolio, or certificates.
                </p>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <HiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Supported formats: PDF, DOC, DOCX, TXT (Max 5MB each)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    Select Files
                  </Button>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Uploaded Files:
                    </p>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <HiDocumentText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <HiTrash className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Job Summary
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Location:</strong>{" "}
                    {selectedJob.location || "Not specified"}
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    {selectedJob.jobType?.replace("_", " ") || "Not specified"}
                  </p>
                  <p>
                    <strong>Experience:</strong>{" "}
                    {selectedJob.experienceLevel
                      ? selectedJob.experienceLevel
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())
                      : "Not specified"}
                  </p>
                  {selectedJob.salaryMin && selectedJob.salaryMax && (
                    <p>
                      <strong>Salary:</strong> GHS{" "}
                      {selectedJob.salaryMin.toLocaleString()} - GHS{" "}
                      {selectedJob.salaryMax.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApplicationModal(false);
                  setSelectedJob(null);
                  setUploadedFiles([]);
                }}
                disabled={isSubmittingApplication}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApplicationSubmit}
                disabled={isSubmittingApplication || uploadedFiles.length === 0}
                className="min-w-[120px]"
              >
                {isSubmittingApplication ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobListings;
