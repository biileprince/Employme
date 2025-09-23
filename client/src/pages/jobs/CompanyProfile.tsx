import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiLocationMarker,
  HiGlobeAlt,
  HiUsers,
  HiCalendar,
  HiOfficeBuilding,
  HiBriefcase,
  HiArrowLeft,
} from "react-icons/hi";
import { MdWork, MdLocationOn, MdVerified } from "react-icons/md";
import Button from "../../components/ui/Button";
import { jobsAPI, formatImageUrl } from "../../services/api";

interface CompanyProfile {
  id: string;
  companyName: string;
  companyDescription?: string;
  website?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  founded?: number;
  logoUrl?: string;
  isVerified: boolean;
  totalJobs: number;
  activeJobs: number;
}

interface Job {
  id: string;
  title: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
  isActive: boolean;
}

const CompanyProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch company profile and jobs
        const [profileResponse, jobsResponse] = await Promise.all([
          fetch(`http://localhost:5001/api/users/employer/${id}`),
          jobsAPI.getAll(new URLSearchParams({ employerId: id, limit: "20" })),
        ]);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setCompany(profileData.data.employer);
        }

        if (jobsResponse.success && jobsResponse.data) {
          const jobsData = jobsResponse.data as { jobs: Job[] };
          setJobs(jobsData.jobs || []);
        }
      } catch (err) {
        console.error("Error fetching company data:", err);
        setError("Failed to load company profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompanyData();
    }
  }, [id]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified";
    if (min && max)
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return "Competitive salary";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">
                Loading company profile...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Company Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              {error || "The company profile you're looking for doesn't exist."}
            </p>
            <Link to="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              Back to Jobs
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-card rounded-2xl border border-border flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img
                    src={formatImageUrl(company.logoUrl)}
                    alt={`${company.companyName} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HiOfficeBuilding className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {company.companyName}
                </h1>
                {company.isVerified && (
                  <div className="flex items-center gap-1 bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                    <MdVerified className="w-4 h-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                {company.location && (
                  <div className="flex items-center gap-1">
                    <HiLocationMarker className="w-4 h-4" />
                    <span>{company.location}</span>
                  </div>
                )}
                {company.industry && (
                  <div className="flex items-center gap-1">
                    <HiBriefcase className="w-4 h-4" />
                    <span>{company.industry}</span>
                  </div>
                )}
                {company.companySize && (
                  <div className="flex items-center gap-1">
                    <HiUsers className="w-4 h-4" />
                    <span>{company.companySize}</span>
                  </div>
                )}
                {company.founded && (
                  <div className="flex items-center gap-1">
                    <HiCalendar className="w-4 h-4" />
                    <span>Founded {company.founded}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                  >
                    <HiGlobeAlt className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
                <div className="text-sm text-muted-foreground">
                  {company.activeJobs} active job
                  {company.activeJobs !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex border-b border-border mb-8">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "about"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "jobs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Jobs ({jobs.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "about" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Company Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                About {company.companyName}
              </h2>
              {company.companyDescription ? (
                <div className="prose prose-gray max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {company.companyDescription}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No company description available.
                </p>
              )}
            </div>

            {/* Company Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <HiBriefcase className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {company.totalJobs}
                </h3>
                <p className="text-muted-foreground">Total Jobs Posted</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <HiUsers className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {company.activeJobs}
                </h3>
                <p className="text-muted-foreground">Active Openings</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <HiCalendar className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {company.founded
                    ? new Date().getFullYear() - company.founded
                    : "N/A"}
                </h3>
                <p className="text-muted-foreground">Years in Business</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "jobs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <HiBriefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Jobs Available
                </h3>
                <p className="text-muted-foreground">
                  This company doesn't have any active job postings at the
                  moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {job.title}
                          </Link>
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <MdLocationOn className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MdWork className="w-4 h-4" />
                            <span>{job.jobType.replace("_", " ")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HiCalendar className="w-4 h-4" />
                            <span>
                              Posted{" "}
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.isActive
                              ? "bg-secondary/20 text-secondary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {job.isActive ? "Active" : "Closed"}
                        </div>
                        <Link to={`/jobs/${job.id}`}>
                          <Button size="sm">View Job</Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
