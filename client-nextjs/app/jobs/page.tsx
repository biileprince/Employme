"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  HiFilter,
  HiLocationMarker,
  HiClock,
  HiBriefcase,
  HiCurrencyDollar,
  HiStar,
  HiX,
  HiShare,
  HiBookmark,
} from "react-icons/hi";
import { apiClient, formatImageUrl } from "@/lib/api";
import type { Job, JobsResponse } from "@/types/job";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal, JobApplicationModal } from "@/components/features";

const INDUSTRIES = [
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "FINANCE", label: "Finance" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "EDUCATION", label: "Education" },
  { value: "MARKETING", label: "Marketing" },
  { value: "SALES", label: "Sales" },
  { value: "DESIGN", label: "Design" },
  { value: "ENGINEERING", label: "Engineering" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "HUMAN_RESOURCES", label: "Human Resources" },
  { value: "LEGAL", label: "Legal" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "MEDIA", label: "Media" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "NON_PROFIT", label: "Non Profit" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "RETAIL", label: "Retail" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "TELECOMMUNICATIONS", label: "Telecommunications" },
  { value: "OTHER", label: "Other" },
];

const JobListings = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Auth and action modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<"save" | "apply">(
    "save"
  );
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] =
    useState<Job | null>(null);

  // Saved jobs state
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Applied jobs state
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const [filter, setFilter] = useState({
    jobType: "",
    location: "",
    experience: "",
    salaryRange: "",
    categories: [] as string[],
  });

  // Sort functionality state
  const [sortBy, setSortBy] = useState("Most Recent");

  // Location search states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<
    { place_id: number; display_name: string }[]
  >([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const jobsPerPage = 15;

  // Ref to prevent duplicate API calls
  const prevParamsRef = useRef<string>("");

  // Initialize filters from URL params
  useEffect(() => {
    const categoryParam = searchParams?.get("category");
    if (categoryParam) {
      setFilter((prev) => ({ ...prev, categories: [categoryParam] }));
    }
  }, [searchParams]);

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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=gh`
      );
      const data = await response.json();
      setLocationResults(data);
      setShowLocationDropdown(true);
    } catch (error) {
      console.error("Location search error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle location search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationSearch) {
        searchLocations(locationSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearch]);

  // Fetch jobs from backend
  const selectLocation = (location: {
    place_id: number;
    display_name: string;
  }) => {
    const locationName = location.display_name.split(",")[0].trim();
    setFilter({ ...filter, location: locationName });
    setLocationSearch(locationName);
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  // Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      const params: Record<string, string | number> = {
        limit: jobsPerPage,
        page: currentPage,
      };

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

      // Prevent duplicate requests
      const paramsString = JSON.stringify(params);
      if (paramsString === prevParamsRef.current && !loading) return;
      prevParamsRef.current = paramsString;

      setLoading(true);

      try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, value.toString());
        });

        const response = await apiClient.get<JobsResponse>(
          `/jobs?${queryParams.toString()}`
        );

        if (response.success && response.data) {
          setJobs(response.data.jobs);
          setTotalPages(response.data.pagination.totalPages);
          setTotalJobs(response.data.pagination.total);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filter, currentPage]);

  // Load saved jobs and applied jobs for authenticated users
  useEffect(() => {
    const loadUserJobData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Load saved jobs
        const savedResponse = await apiClient.get<{
          savedJobs: Array<{ job: { id: string } }>;
        }>("/saved-jobs");
        if (savedResponse.success && savedResponse.data?.savedJobs) {
          const savedIds = new Set(
            savedResponse.data.savedJobs.map((saved) => saved.job.id)
          );
          setSavedJobIds(savedIds);
        }

        // Load applications to track which jobs user has applied to
        const applicationsResponse = await apiClient.get<{
          applications: Array<{ job: { id: string } }>;
        }>("/applications/my-applications");
        if (applicationsResponse.success && applicationsResponse.data) {
          const appliedIds = new Set(
            applicationsResponse.data.applications.map((app) => app.job.id)
          );
          setAppliedJobIds(appliedIds);
        }
      } catch (error) {
        console.error("Failed to load user job data:", error);
      }
    };

    loadUserJobData();
  }, [isAuthenticated, user]);

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

  // Client-side sorting of jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case "Most Recent":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      case "Salary (High to Low)": {
        const avgSalaryA =
          a.salaryMin && a.salaryMax ? (a.salaryMin + a.salaryMax) / 2 : 0;
        const avgSalaryB =
          b.salaryMin && b.salaryMax ? (b.salaryMin + b.salaryMax) / 2 : 0;
        return avgSalaryB - avgSalaryA;
      }

      case "Salary (Low to High)": {
        const avgSalaryA =
          a.salaryMin && a.salaryMax ? (a.salaryMin + a.salaryMax) / 2 : 0;
        const avgSalaryB =
          b.salaryMin && b.salaryMax ? (b.salaryMin + b.salaryMax) / 2 : 0;
        return avgSalaryA - avgSalaryB;
      }

      case "Relevance": {
        // Sort by how well the job matches the search term
        if (!searchTerm) return 0;
        const searchLower = searchTerm.toLowerCase();
        const aTitle = a.title.toLowerCase().includes(searchLower) ? 2 : 0;
        const bTitle = b.title.toLowerCase().includes(searchLower) ? 2 : 0;
        const aCompany = a.employer.companyName
          .toLowerCase()
          .includes(searchLower)
          ? 1
          : 0;
        const bCompany = b.employer.companyName
          .toLowerCase()
          .includes(searchLower)
          ? 1
          : 0;
        return bTitle + bCompany - (aTitle + aCompany);
      }

      default:
        return 0;
    }
  });

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setFilter((prev) => {
      const isSelected = prev.categories.includes(category);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
    setCurrentPage(1);
  };

  // Remove category filter
  const removeCategory = (category: string) => {
    setFilter((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilter({
      jobType: "",
      location: "",
      experience: "",
      salaryRange: "",
      categories: [],
    });
    setLocationSearch("");
    setCurrentPage(1);
  };

  // Format salary
  const formatSalary = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `GH₵${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      return `From GH₵${job.salaryMin.toLocaleString()}`;
    }
    return "Salary negotiable";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Get company logo
  const getCompanyLogo = (job: Job) => {
    if (job.employer.logoUrl) {
      return formatImageUrl(job.employer.logoUrl);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      job.employer.companyName
    )}&background=random&size=80`;
  };

  // Format job type
  const formatJobType = (jobType: string) => {
    return jobType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const found = INDUSTRIES.find((ind) => ind.value === category);
    return found ? found.label : category;
  };

  // Handle share job
  const handleShareJob = async (job: Job) => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    const shareText = `Check out this job opportunity: ${job.title} at ${job.employer.companyName}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} - ${job.employer.companyName}`,
          text: shareText,
          url: jobUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${jobUrl}`);
        alert("Job link copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  // Handle save job
  const handleSaveJob = async (jobId: string) => {
    if (!isAuthenticated) {
      setAuthModalAction("save");
      setShowAuthModal(true);
      return;
    }

    setSavingJobId(jobId);
    try {
      const response = await apiClient.post(`/saved-jobs/save`, { jobId });
      if (response.success || response.data) {
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(jobId);
          return newSet;
        });
      }
    } catch (error: unknown) {
      console.error("Failed to save job:", error);
      // Even if API returns error, check if it's a duplicate (already saved)
      const errorMessage = error instanceof Error ? error.message : "";
      const errorStatus = (error as any)?.response?.status;
      if (errorStatus === 400 || errorMessage.includes("already")) {
        // Job is already saved, update state
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(jobId);
          return newSet;
        });
      } else {
        alert("Failed to save job. Please try again.");
      }
    } finally {
      setSavingJobId(null);
    }
  };

  // Handle unsave job
  const handleUnsaveJob = async (jobId: string) => {
    setSavingJobId(jobId);
    try {
      const response = await apiClient.post(`/saved-jobs/remove`, { jobId });
      if (response.success || response.data) {
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Failed to unsave job:", error);
      alert("Failed to unsave job. Please try again.");
    } finally {
      setSavingJobId(null);
    }
  };

  // Handle apply to job
  const handleApplyToJob = (job: Job) => {
    if (!isAuthenticated) {
      setAuthModalAction("apply");
      setShowAuthModal(true);
      return;
    }

    setSelectedJobForApplication(job);
    setShowApplicationModal(true);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with background image */}
      <div
        className="bg-gradient-to-br from-primary via-primary to-primary-600 text-white py-16 relative overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=600&fit=crop')`,
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
                : `${totalJobs} jobs available`}
            </p>
          </div>

          {/* Search Bar */}
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
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
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
                  className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium dark:text-primary-400 transition-colors"
                >
                  <HiFilter className="w-5 h-5 flex-shrink-0" />
                  <span>{showFilters ? "Hide Filters" : "More Filters"}</span>
                </button>
                <Button size="lg" className="px-8">
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4 flex items-center justify-center gap-2"
            >
              <HiFilter className="w-5 h-5 flex-shrink-0" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div
            className={`lg:w-80 space-y-6 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Categories */}
              {filter.categories.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-foreground dark:text-white">
                    Selected Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filter.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400"
                      >
                        {category}
                        <button
                          onClick={() => removeCategory(category)}
                          className="ml-2 p-0.5 hover:bg-primary/20 rounded-full"
                        >
                          <HiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-foreground dark:text-white">
                  Categories
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {INDUSTRIES.map((industry) => (
                    <label
                      key={industry.value}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filter.categories.includes(industry.value)}
                          onChange={() => toggleCategory(industry.value)}
                          className="mr-3 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white">
                          {industry.label}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {jobCounts[industry.value] || 0}
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
                  {[
                    { value: "", label: "All Types" },
                    { value: "FULL_TIME", label: "Full Time" },
                    { value: "PART_TIME", label: "Part Time" },
                    { value: "CONTRACT", label: "Contract" },
                    { value: "INTERNSHIP", label: "Internship" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
                    >
                      <input
                        type="radio"
                        name="jobType"
                        value={type.value}
                        checked={filter.jobType === type.value}
                        onChange={(e) =>
                          setFilter({ ...filter, jobType: e.target.value })
                        }
                        className="mr-3 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white">
                        {type.label}
                      </span>
                    </label>
                  ))}
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

              {/* Clear Filters Button */}
              <div className="mt-6 pt-4 border-t border-border dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground dark:text-white">
                  {loading ? "Loading..." : `${totalJobs} Jobs Found`}
                </h2>
                {!loading && totalJobs > 0 && (
                  <p className="text-muted-foreground dark:text-gray-400">
                    Best jobs matching your criteria
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Most Recent">Most Recent</option>
                  <option value="Salary (High to Low)">
                    Salary (High to Low)
                  </option>
                  <option value="Salary (Low to High)">
                    Salary (Low to High)
                  </option>
                  <option value="Relevance">Relevance</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
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

            {/* Job Cards */}
            {!loading && (
              <div className="space-y-4">
                {sortedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No jobs found matching your criteria.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear filters and try again
                    </Button>
                  </div>
                ) : (
                  sortedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Job Image/Company Logo */}
                        <div className="flex-shrink-0 relative">
                          {/* Main job image or fallback to company logo */}
                          <div className="relative">
                            <Image
                              src={
                                job.attachments && job.attachments.length > 0
                                  ? formatImageUrl(
                                      job.attachments.find(
                                        (att) => att.fileType === "IMAGE"
                                      )?.url || ""
                                    ) || getCompanyLogo(job)
                                  : getCompanyLogo(job)
                              }
                              alt={
                                job.attachments && job.attachments.length > 0
                                  ? `${job.title} advertisement`
                                  : `${job.employer.companyName} logo`
                              }
                              width={96}
                              height={96}
                              className={`rounded-xl object-cover border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg ${
                                job.attachments && job.attachments.length > 0
                                  ? "w-20 h-20 sm:w-24 sm:h-24" // Bigger for job ads
                                  : "w-16 h-16 sm:w-20 sm:h-20" // Smaller for company logos
                              }`}
                              unoptimized
                            />

                            {/* Company logo badge when job image exists */}
                            {job.attachments &&
                              job.attachments.length > 0 &&
                              job.employer.logoUrl && (
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-background bg-background shadow-lg overflow-hidden">
                                  <Image
                                    src={formatImageUrl(job.employer.logoUrl)}
                                    alt={`${job.employer.companyName} logo`}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                    unoptimized
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
                                href={`/jobs/${job.id}`}
                                className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors mb-1 line-clamp-2 block"
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
                                {job.experience}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700">
                                {getCategoryLabel(job.category)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApplyToJob(job)}
                                disabled={appliedJobIds.has(job.id)}
                                className="font-medium flex-1 sm:flex-initial min-w-[100px]"
                              >
                                {appliedJobIds.has(job.id)
                                  ? "Applied ✓"
                                  : "Apply Now"}
                              </Button>
                              <Link
                                href={`/jobs/${job.id}`}
                                className="flex-1 sm:flex-initial"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="font-medium w-full"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  savedJobIds.has(job.id)
                                    ? handleUnsaveJob(job.id)
                                    : handleSaveJob(job.id)
                                }
                                disabled={savingJobId === job.id}
                                className={`font-medium flex items-center gap-1 transition-all ${
                                  savedJobIds.has(job.id)
                                    ? "text-primary hover:text-primary/80"
                                    : ""
                                }`}
                                title={
                                  savedJobIds.has(job.id)
                                    ? "Remove from saved"
                                    : "Save for later"
                                }
                              >
                                <HiBookmark
                                  className={`w-4 h-4 ${
                                    savedJobIds.has(job.id)
                                      ? "fill-current"
                                      : ""
                                  }`}
                                />
                                <span className="hidden sm:inline">
                                  {savingJobId === job.id
                                    ? "..."
                                    : savedJobIds.has(job.id)
                                    ? "Saved"
                                    : "Save"}
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShareJob(job)}
                                className="font-medium items-center gap-1 hidden sm:flex"
                                title="Share this job"
                              >
                                <HiShare className="w-4 h-4" />
                                <span className="hidden md:inline">Share</span>
                              </Button>
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
            {!loading && sortedJobs.length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className="min-w-[40px]"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Pagination Info */}
            {!loading && totalJobs > 0 && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                Showing{" "}
                {Math.min((currentPage - 1) * jobsPerPage + 1, totalJobs)} to{" "}
                {Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs}{" "}
                jobs
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authModalAction}
      />

      {/* Job Application Modal */}
      {selectedJobForApplication && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJobForApplication(null);
          }}
          job={{
            id: selectedJobForApplication.id,
            title: selectedJobForApplication.title,
            company: selectedJobForApplication.employer.companyName,
            location: selectedJobForApplication.location,
          }}
          onApplicationSuccess={() => {
            setShowApplicationModal(false);
            setSelectedJobForApplication(null);
            // Add to applied jobs
            if (selectedJobForApplication) {
              setAppliedJobIds((prev) => {
                const newSet = new Set(prev);
                newSet.add(selectedJobForApplication.id);
                return newSet;
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default JobListings;
