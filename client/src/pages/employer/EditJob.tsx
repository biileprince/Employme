import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import {
  MdLocationOn,
  MdSearch,
  MdAdd,
  MdClose,
  MdArrowBack,
} from "react-icons/md";
import PhoneInput from "../../components/ui/PhoneInput";
import ImageUpload from "../../components/ui/ImageUpload";
import Button from "../../components/ui/Button";
import { INDUSTRIES, LOCATION_API_CONFIG } from "../../utils/constants";
import { jobsAPI, attachmentAPI, formatImageUrl } from "../../services/api";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  responsibilities?: string;
  requirements: string[] | string;
  benefits: string[];
  location: string;
  category: string;
  experienceLevel: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote: boolean;
  applicationDeadline?: string;
  contactPhone?: string;
  contactCountryCode?: string;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    fileType: string;
  }>;
}

const EditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentBenefit, setCurrentBenefit] = useState("");

  // Location search states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "", // Add responsibilities field
    benefits: [] as string[],
    location: "",
    category: "",
    experienceLevel: "ENTRY_LEVEL",
    type: "FULL_TIME",
    salaryMin: "",
    salaryMax: "",
    isRemote: false,
    applicationDeadline: "",
    contactPhone: "",
    contactCountryCode: "+233",
    jobImages: [] as string[], // Add job images field
  });

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setIsFetching(true);
        const response = await jobsAPI.getById(jobId!);
        console.log("Job response:", response); // Debug log

        // Handle the response structure - backend returns { success: true, data: { job: ... } }
        const jobData = response.data as { job: Job } | Job;
        const job = "job" in jobData ? jobData.job : jobData;

        setFormData({
          title: job.title || "",
          description: job.description || "",
          requirements: Array.isArray(job.requirements)
            ? job.requirements.join("\n")
            : job.requirements || "",
          responsibilities: job.responsibilities || "", // Load existing responsibilities
          benefits: job.benefits || [],
          location: job.location || "",
          category: job.category || "",
          experienceLevel: job.experienceLevel || "ENTRY_LEVEL",
          type: job.type || "FULL_TIME",
          salaryMin: job.salaryMin ? job.salaryMin.toString() : "",
          salaryMax: job.salaryMax ? job.salaryMax.toString() : "",
          isRemote: job.isRemote || false,
          applicationDeadline: job.applicationDeadline
            ? new Date(job.applicationDeadline).toISOString().split("T")[0]
            : "",
          contactPhone: job.contactPhone || "",
          contactCountryCode: job.contactCountryCode || "+233",
          jobImages:
            job.attachments
              ?.filter((att) => att.fileType.startsWith("image/"))
              .map((att) => formatImageUrl(att.url)) || [],
        });

        setLocationSearch(job.location || "");
      } catch (err) {
        console.error("Failed to fetch job details:", err);
        setError("Failed to load job details");
      } finally {
        setIsFetching(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationResults([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const response = await fetch(
        `${LOCATION_API_CONFIG.baseUrl}?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=${LOCATION_API_CONFIG.countryCodes}`
      );
      const data = await response.json();
      setLocationResults(data || []);
      setShowLocationDropdown(true);
    } catch (error) {
      console.error("Error searching locations:", error);
      setLocationResults([]);
    }
    setIsSearchingLocation(false);
  };

  const extractCityName = (displayName: string) => {
    const parts = displayName.split(",");
    return parts[0].trim();
  };

  const handleLocationSelect = (location: LocationResult) => {
    const cityName = extractCityName(location.display_name);
    setFormData((prev) => ({ ...prev, location: cityName }));
    setLocationSearch(cityName);
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  const handleLocationSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationSearch(value);
    setFormData((prev) => ({ ...prev, location: value }));
    searchLocation(value);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addBenefit = () => {
    if (
      currentBenefit.trim() &&
      !formData.benefits.includes(currentBenefit.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()],
      }));
      setCurrentBenefit("");
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((b) => b !== benefit),
    }));
  };

  const handleJobImageUpload = async (files: File[]) => {
    try {
      // Only allow one job image
      if (files.length > 1) {
        setError("Only one job advertisement image is allowed");
        return;
      }

      const response = await attachmentAPI.upload(files, "job", jobId!);
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "attachments" in response.data
      ) {
        const uploadedAttachments = response.data.attachments as Array<{
          id: string;
          url: string;
          filename: string;
        }>;
        setFormData((prev) => ({
          ...prev,
          // Replace existing job images with the new one (only one allowed)
          jobImages: uploadedAttachments.map((att) => formatImageUrl(att.url)),
        }));
      }
    } catch (error) {
      console.error("Failed to upload job images:", error);
      setError("Failed to upload job images");
    }
  };

  const handleRemoveJobImage = () => {
    setFormData((prev) => ({
      ...prev,
      jobImages: [], // Clear job images array
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to update a job");
      return;
    }

    if (
      !formData.title ||
      !formData.description ||
      !formData.location ||
      !formData.category
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        responsibilities: formData.responsibilities, // Add responsibilities field
        requirements: formData.requirements
          .split("\n")
          .filter((req) => req.trim()), // Convert to array
        location: formData.location,
        isRemote: formData.isRemote,
        jobType: formData.type,
        experience: formData.experienceLevel,
        salaryMin: formData.salaryMin
          ? parseInt(formData.salaryMin)
          : undefined,
        salaryMax: formData.salaryMax
          ? parseInt(formData.salaryMax)
          : undefined,
        deadline: formData.applicationDeadline || undefined,
        category: formData.category,
        benefits: formData.benefits,
        contactPhone: formData.contactPhone,
        contactCountryCode: formData.contactCountryCode,
        jobImages: formData.jobImages.map((url) => {
          // Convert absolute URLs back to relative for storage
          if (
            url.startsWith("http://localhost:5000") ||
            url.startsWith("http://localhost:5001")
          ) {
            return url.replace(/^https?:\/\/localhost:\d+/, "");
          }
          return url;
        }),
      };

      await jobsAPI.update(jobId!, jobData);
      setSuccessMessage("Job updated successfully!");

      // Navigate back to my jobs after a short delay
      setTimeout(() => {
        navigate("/employer/my-jobs");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error updating job:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update job. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/employer/my-jobs")}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Job</h1>
            <p className="text-muted-foreground">
              Update your job posting details
            </p>
          </div>
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

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6"
          >
            {successMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card text-card-foreground p-6 rounded-xl border border-border"
          >
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  required
                >
                  <option value="">Select Category</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="ENTRY_LEVEL">Entry Level</option>
                  <option value="MID_LEVEL">Mid Level</option>
                  <option value="SENIOR_LEVEL">Senior Level</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="mt-6 relative">
              <label className="block text-sm font-medium text-foreground mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MdLocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={handleLocationSearchChange}
                  placeholder="Start typing city name..."
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  required
                />
                {isSearchingLocation && (
                  <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 animate-spin" />
                )}
              </div>

              {/* Location Dropdown */}
              {showLocationDropdown && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationResults.map((location) => (
                    <button
                      key={location.place_id}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-4 py-3 text-left hover:bg-muted focus:outline-none focus:bg-muted transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MdLocationOn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">
                          {extractCityName(location.display_name)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Remote Work Option */}
            <div className="mt-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isRemote"
                  checked={formData.isRemote}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium text-foreground">
                  This is a remote position
                </span>
              </label>
            </div>
          </motion.div>

          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card text-card-foreground p-6 rounded-xl border border-border"
          >
            <h2 className="text-xl font-semibold mb-6">Job Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
                  required
                />
              </div>

              {/* Responsibilities Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Key Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="List the main responsibilities and duties for this role..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="List the required qualifications, skills, and experience..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
                />
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Benefits & Perks
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentBenefit}
                    onChange={(e) => setCurrentBenefit(e.target.value)}
                    placeholder="Add a benefit..."
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBenefit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <MdAdd className="w-5 h-5" />
                  </button>
                </div>

                {formData.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-muted text-foreground px-3 py-1 rounded-full text-sm"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(benefit)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Advertisement Image Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Advertisement Image
                  <span className="text-sm text-muted-foreground ml-2">
                    (Only one image allowed)
                  </span>
                </label>

                {/* Current Job Image Display with Remove Option */}
                {formData.jobImages.length > 0 && (
                  <div className="mb-4 p-4 border border-border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">
                        Current Image:
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveJobImage}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <MdClose className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={formatImageUrl(formData.jobImages[0])}
                        alt="Current job advertisement"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn(
                            "Failed to load job image:",
                            formData.jobImages[0]
                          );
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload New Image (only show if no current image) */}
                {formData.jobImages.length === 0 && (
                  <ImageUpload
                    onFilesUpload={handleJobImageUpload}
                    accept="image/*"
                    maxFiles={1}
                    label="Upload Job Advertisement Image"
                    existingImages={[]}
                  />
                )}

                <p className="text-sm text-muted-foreground mt-2">
                  Add an image to showcase the workplace, team, or job
                  environment. This will be displayed prominently on the job
                  details page.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Salary & Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card text-card-foreground p-6 rounded-xl border border-border"
          >
            <h2 className="text-xl font-semibold mb-6">Salary & Contact</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Salary (GHS)
                </label>
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Maximum Salary (GHS)
                </label>
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="e.g., 8000"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Contact Phone
                </label>
                <PhoneInput
                  phoneNumber={formData.contactPhone}
                  countryCode={formData.contactCountryCode}
                  onPhoneNumberChange={(phone) =>
                    setFormData((prev) => ({ ...prev, contactPhone: phone }))
                  }
                  onCountryCodeChange={(code) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactCountryCode: code,
                    }))
                  }
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <button
              type="button"
              onClick={() => navigate("/employer/my-jobs")}
              className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating Job..." : "Update Job"}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default EditJob;
