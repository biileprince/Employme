import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "react-icons/md";
import { userAPI, formatImageUrl } from "../../services/api";
import { INDUSTRIES } from "../../utils/constants";

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
  };
}

export default function CandidateSearch() {
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
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await userAPI.getCandidates();
      setCandidates(response.data as Candidate[]);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Failed to fetch candidates");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Find Candidates
          </h1>
          <p className="text-muted-foreground">
            Discover and connect with talented job seekers who match your
            requirements
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
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 mb-6">
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              className="text-center py-16"
            >
              <div className="text-muted-foreground text-lg mb-4">
                {candidates.length === 0
                  ? "No candidates found"
                  : "No candidates match your search criteria"}
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                {candidates.length === 0
                  ? "There are no registered job seekers yet."
                  : "Try adjusting your search terms or filters to find more candidates."}
              </p>
              {(searchTerm ||
                Object.values(filters).some(
                  (v) => v !== "" && v !== false
                )) && (
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
                className="bg-card text-card-foreground border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        {candidate.imageUrl ? (
                          <img
                            src={candidate.imageUrl}
                            alt={`${candidate.firstName} ${candidate.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <MdPerson className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-muted-foreground text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <MdEmail className="w-4 h-4" />
                        <span className="truncate">{candidate.email}</span>
                      </div>
                      {candidate.profile?.phone && (
                        <div className="flex items-center gap-2">
                          <MdPhone className="w-4 h-4" />
                          <span>
                            {candidate.profile.phoneCountryCode || ""}{" "}
                            {candidate.profile.phone}
                          </span>
                        </div>
                      )}
                      {candidate.profile?.location && (
                        <div className="flex items-center gap-2">
                          <MdLocationOn className="w-4 h-4" />
                          <span>{candidate.profile.location}</span>
                        </div>
                      )}
                      {candidate.profile?.experience && (
                        <div className="flex items-center gap-2">
                          <MdWork className="w-4 h-4" />
                          <span>{candidate.profile.experience}</span>
                        </div>
                      )}
                    </div>

                    {candidate.profile?.preferredSalary && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                        <MdAttachMoney className="w-4 h-4" />
                        <span>
                          Preferred Salary: {candidate.profile.preferredSalary}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 ml-6">
                    {candidate.profile?.resumeUrl && (
                      <a
                        href={formatImageUrl(candidate.profile.resumeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        View Resume
                      </a>
                    )}

                    <a
                      href={`mailto:${candidate.email}`}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
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

        {/* Load More / Pagination could be added here if needed */}
        {filteredCandidates.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Showing all {filteredCandidates.length} candidates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
