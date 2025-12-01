"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MdSearch,
  MdLocationOn,
  MdWork,
  MdEmail,
  MdPhone,
  MdPerson,
  MdDescription,
  MdAttachMoney,
  MdCheckCircle,
  MdFilterList,
  MdAttachFile,
} from "react-icons/md";
import { apiClient, formatImageUrl } from "@/lib/api";
import { INDUSTRIES } from "@/lib/constants";
import { useRouteGuard } from "@/hooks/useRouteGuard";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string;
  profile?: {
    phone?: string;
    location?: string;
    experience?: string;
    skills?: string[];
    bio?: string;
    resumeUrl?: string;
    isAvailable?: boolean;
    preferredSalary?: string;
    industry?: string;
    phoneCountryCode?: string;
    applications?: Array<{
      id: string;
      status: string;
      createdAt: string;
      job: {
        title: string;
      };
      attachments?: Array<{
        id: string;
        filename: string;
        url: string;
      }>;
    }>;
    cvs?: Array<{
      id: string;
      filename: string;
      url: string;
    }>;
  };
}

export default function CandidatesPage() {
  const { user } = useRouteGuard({
    requireAuth: true,
    requireRole: "EMPLOYER",
  });

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: "",
    experience: "",
    skills: "",
    industry: "",
    availabilityOnly: false,
  });

  useEffect(() => {
    if (user) {
      fetchCandidates();
    }
  }, [user]);

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<Candidate[]>("/users/my-candidates");

      if (response.success && response.data) {
        setCandidates(Array.isArray(response.data) ? response.data : []);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Failed to fetch candidates who applied to your jobs");
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      location: "",
      experience: "",
      skills: "",
      industry: "",
      availabilityOnly: false,
    });
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      searchTerm === "" ||
      candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.profile?.skills || []).some((skill: string) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesLocation =
      filters.location === "" ||
      (candidate.profile?.location || "")
        .toLowerCase()
        .includes(filters.location.toLowerCase());

    const matchesExperience =
      filters.experience === "" ||
      (candidate.profile?.experience || "")
        .toLowerCase()
        .includes(filters.experience.toLowerCase());

    const matchesSkills =
      filters.skills === "" ||
      (candidate.profile?.skills || []).some((skill: string) =>
        skill.toLowerCase().includes(filters.skills.toLowerCase())
      );

    const matchesIndustry =
      filters.industry === "" ||
      (candidate.profile?.industry || "")
        .toLowerCase()
        .includes(filters.industry.toLowerCase());

    const matchesAvailability =
      !filters.availabilityOnly || candidate.profile?.isAvailable;

    return (
      matchesSearch &&
      matchesLocation &&
      matchesExperience &&
      matchesSkills &&
      matchesIndustry &&
      matchesAvailability
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          My Candidates
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and connect with candidates who have applied to your job postings
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or skills..."
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <MdFilterList className="w-4 h-4" />
            Filters
            {Object.values(filters).some((v) => v !== "" && v !== false) && (
              <span className="bg-background/20 rounded-full w-2 h-2"></span>
            )}
          </button>
          {(searchTerm ||
            Object.values(filters).some((v) => v !== "" && v !== false)) && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <div className="relative">
                  <MdLocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                    placeholder="e.g., Accra, Remote..."
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Experience Level
                </label>
                <select
                  value={filters.experience}
                  onChange={(e) =>
                    setFilters({ ...filters, experience: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Skills
                </label>
                <input
                  type="text"
                  value={filters.skills}
                  onChange={(e) =>
                    setFilters({ ...filters, skills: e.target.value })
                  }
                  placeholder="e.g., JavaScript, Design..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Industry
                </label>
                <select
                  value={filters.industry}
                  onChange={(e) =>
                    setFilters({ ...filters, industry: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="">All Industries</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Filter */}
              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  id="availabilityOnly"
                  checked={filters.availabilityOnly}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      availabilityOnly: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <label
                  htmlFor="availabilityOnly"
                  className="ml-2 text-sm font-medium text-foreground"
                >
                  Available candidates only
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredCandidates.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {candidates.length}
              </span>{" "}
              candidates
            </span>
            {filteredCandidates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>
                  {candidates.filter((c) => c.profile?.isAvailable).length}{" "}
                  available
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {filteredCandidates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="text-muted-foreground text-base sm:text-lg mb-4">
              {candidates.length === 0
                ? "No candidates found"
                : "No candidates match your search criteria"}
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              {candidates.length === 0
                ? "There are no candidates who have applied to your jobs yet."
                : "Try adjusting your search terms or filters to find more candidates."}
            </p>
            {(searchTerm ||
              Object.values(filters).some((v) => v !== "" && v !== false)) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <MdSearch className="w-4 h-4" />
                Clear Search & Filters
              </button>
            )}
          </motion.div>
        ) : (
          filteredCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                      {candidate.imageUrl ? (
                        <Image
                          src={formatImageUrl(candidate.imageUrl)}
                          alt={`${candidate.firstName} ${candidate.lastName}`}
                          width={64}
                          height={64}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <MdPerson className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {candidate.profile?.isAvailable && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <MdCheckCircle className="w-3 h-3" />
                            Available
                          </span>
                        )}
                        {candidate.profile?.industry && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {candidate.profile.industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-muted-foreground text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <MdEmail className="w-4 h-4 shrink-0" />
                      <a
                        href={`mailto:${candidate.email}`}
                        className="truncate text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        {candidate.email}
                      </a>
                    </div>
                    {candidate.profile?.phone && (
                      <div className="flex items-center gap-2">
                        <MdPhone className="w-4 h-4 shrink-0" />
                        <a
                          href={`tel:${
                            candidate.profile.phoneCountryCode || ""
                          }${candidate.profile.phone}`}
                          className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {candidate.profile.phoneCountryCode || ""}{" "}
                          {candidate.profile.phone}
                        </a>
                      </div>
                    )}
                    {candidate.profile?.location && (
                      <div className="flex items-center gap-2">
                        <MdLocationOn className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {candidate.profile.location}
                        </span>
                      </div>
                    )}
                    {candidate.profile?.experience && (
                      <div className="flex items-center gap-2">
                        <MdWork className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {candidate.profile.experience}
                        </span>
                      </div>
                    )}
                  </div>

                  {candidate.profile?.preferredSalary && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <MdAttachMoney className="w-4 h-4 shrink-0" />
                      <span>
                        Preferred Salary: {candidate.profile.preferredSalary}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-stretch gap-2 sm:gap-3 lg:ml-6">
                  {candidate.profile?.resumeUrl && (
                    <a
                      href={formatImageUrl(candidate.profile.resumeUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <MdAttachFile className="w-4 h-4" />
                      View Resume
                    </a>
                  )}

                  <a
                    href={`mailto:${candidate.email}`}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <MdEmail className="w-4 h-4" />
                    Contact
                  </a>
                </div>
              </div>

              {/* Skills */}
              {candidate.profile?.skills &&
                candidate.profile.skills.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MdWork className="w-4 h-4" />
                      Skills & Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.profile.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* CV Files */}
              {candidate.profile?.cvs && candidate.profile.cvs.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <MdAttachFile className="w-4 h-4" />
                    CV Documents
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.profile.cvs.map((cv, cvIndex) => (
                      <a
                        key={cvIndex}
                        href={formatImageUrl(cv.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                      >
                        <MdAttachFile className="w-4 h-4" />
                        {cv.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Application History */}
              {candidate.profile?.applications &&
                candidate.profile.applications.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MdWork className="w-4 h-4" />
                      Application History (
                      {candidate.profile.applications.length} applications)
                    </h4>
                    <div className="space-y-2">
                      {candidate.profile.applications
                        .slice(0, 3)
                        .map((application, appIndex) => (
                          <div
                            key={appIndex}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 border border-border rounded-lg text-sm"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {application.job.title}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Applied:{" "}
                                {application.createdAt
                                  ? new Date(
                                      application.createdAt
                                    ).toLocaleDateString()
                                  : "Date unavailable"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  application.status === "HIRED"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : application.status === "SHORTLISTED"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                    : application.status === "REVIEWED"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : application.status === "REJECTED"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                                }`}
                              >
                                {application.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      {candidate.profile.applications.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{candidate.profile.applications.length - 3} more
                          applications
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* Bio */}
              {candidate.profile?.bio && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <MdDescription className="w-4 h-4" />
                    About
                  </h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-foreground text-sm leading-relaxed">
                      {candidate.profile.bio}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredCandidates.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Showing all {filteredCandidates.length} candidates
          </p>
        </div>
      )}
    </div>
  );
}
