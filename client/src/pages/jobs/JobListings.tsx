import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HiFilter,
  HiLocationMarker,
  HiClock,
  HiBriefcase,
  HiCurrencyDollar,
  HiStar,
  HiX,
  HiHeart,
  HiOutlineHeart,
} from "react-icons/hi";
import Button from "../../components/ui/Button";
import { AuthModal } from "../../components/auth";
import { jobsAPI, savedJobsAPI, formatImageUrl } from "../../services/api";
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
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<"save" | "apply">("save");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    jobType: "",
    location: "",
    salaryRange: "",
    experience: "",
    categories: [] as string[],
  });

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

  // Fetch jobs from backend
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, string | number> = {
        limit: 50, // Get more jobs to show
      };

      // Add search and filter parameters
      if (searchTerm) params.search = searchTerm;
      if (filter.categories.length > 0) params.category = filter.categories[0]; // Use first category for now
      if (filter.location) params.location = filter.location;
      if (filter.jobType)
        params.jobType = filter.jobType.toUpperCase().replace("-", "_");
      if (filter.experience) {
        const expMap: Record<string, string> = {
          "Entry Level": "ENTRY",
          "Mid Level": "MID",
          "Senior Level": "SENIOR",
          Executive: "EXECUTIVE",
        };
        params.experienceLevel = expMap[filter.experience];
      }

      const response = await jobsAPI.getAll(params);
      const data = response.data as JobsResponse;

      setJobs(data.jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filter]);

  // Fetch saved jobs
  const fetchSavedJobs = useCallback(async () => {
    if (!user) {
      setSavedJobs(new Set());
      return;
    }

    try {
      const response = await savedJobsAPI.getSavedJobs();
      const savedJobsData =
        (
          response as {
            data: { savedJobs: { jobId: string; job: { id: string } }[] };
          }
        ).data.savedJobs || [];
      const savedJobIds = new Set(
        savedJobsData.map((savedJob) => savedJob.jobId || savedJob.job.id)
      );
      setSavedJobs(savedJobIds);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      setSavedJobs(new Set());
    }
  }, [user]);

  // Handle save/unsave job
  const handleSaveJob = async (jobId: string, isSaved: boolean) => {
    if (!user) {
      setAuthModalType("save");
      setShowAuthModal(true);
      return;
    }

    setSavingJobId(jobId);
    try {
      if (isSaved) {
        await savedJobsAPI.unsaveJob(jobId);
        setSavedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await savedJobsAPI.saveJob(jobId);
        setSavedJobs((prev) => new Set(prev).add(jobId));
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      alert("Failed to save job. Please try again.");
    } finally {
      setSavingJobId(null);
    }
  };

  // Handle apply to job
  const handleApplyJob = (jobId: string) => {
    if (!user) {
      setAuthModalType("apply");
      setShowAuthModal(true);
      return;
    }
    // Redirect to job details page for full application
    window.location.href = `/jobs/${jobId}`;
  };

  // Fetch jobs when component mounts or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 800); // Increased debounce to reduce API calls

    return () => clearTimeout(timeoutId);
  }, [fetchJobs]);

  // Fetch saved jobs when authentication state changes
  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

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
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer.companyName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJobType =
      !filter.jobType ||
      job.jobType.toLowerCase().replace("_", "-") ===
        filter.jobType.toLowerCase();
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
  const formatJobType = (jobType: string) => {
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
                ? "Loading jobs..."
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
                <Button size="lg" className="px-8" onClick={fetchJobs}>
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
                  {loading ? "Loading..." : `${filteredJobs.length} Jobs Found`}
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
                              {user?.role === "JOB_SEEKER" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleSaveJob(
                                        job.id,
                                        savedJobs.has(job.id)
                                      )
                                    }
                                    disabled={savingJobId === job.id}
                                    className={`${
                                      savedJobs.has(job.id)
                                        ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                        : ""
                                    }`}
                                  >
                                    {savingJobId === job.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    ) : savedJobs.has(job.id) ? (
                                      <>
                                        <HiHeart className="w-4 h-4 mr-1" />
                                        Saved
                                      </>
                                    ) : (
                                      <>
                                        <HiOutlineHeart className="w-4 h-4 mr-1" />
                                        Save
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="font-medium"
                                    onClick={() => handleApplyJob(job.id)}
                                  >
                                    Apply Now
                                  </Button>
                                </>
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
    </div>
  );
};

export default JobListings;
