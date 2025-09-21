import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdLocationOn, MdSearch, MdAdd, MdClose } from "react-icons/md";
import PhoneInput from "../../components/ui/PhoneInput";
import { ImageUpload } from "../../components/ui";
import { attachmentAPI } from "../../services/api";
import { INDUSTRIES, LOCATION_API_CONFIG } from "../../utils/constants";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const PostJob = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentBenefit, setCurrentBenefit] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Location search states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
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
  });

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
      if (locationSearch && !formData.isRemote) {
        searchLocations(locationSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearch, formData.isRemote]);

  const handleLocationSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocationSearch(e.target.value);
  };

  const selectLocation = (location: LocationResult) => {
    // Extract only the city/town name (first part before comma)
    const cityName = location.display_name.split(",")[0].trim();

    setFormData((prev) => ({ ...prev, location: cityName }));
    setLocationSearch(cityName);
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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

  const removeBenefit = (benefitToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((benefit) => benefit !== benefitToRemove),
    }));
  };

  const handleImageUpload = async (files: File[]) => {
    try {
      const response = await attachmentAPI.upload(files, "JOB");
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "attachments" in response.data
      ) {
        const responseData = response.data as {
          attachments: Array<{ url: string }>;
        };
        const newImageUrls = responseData.attachments.map((att) => att.url);
        setUploadedImages((prev) => [...prev, ...newImageUrls]);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Failed to upload images. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validation
      if (!formData.isRemote && !formData.location) {
        throw new Error("Location is required for non-remote jobs");
      }

      if (formData.salaryMin && formData.salaryMax) {
        const minSalary = Number(formData.salaryMin);
        const maxSalary = Number(formData.salaryMax);
        if (minSalary > maxSalary) {
          throw new Error(
            "Minimum salary cannot be greater than maximum salary"
          );
        }
      }

      // Prepare data for API
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        benefits: formData.benefits,
        location: formData.isRemote ? "Remote" : formData.location,
        category: formData.category.toUpperCase(),
        experienceLevel: formData.experienceLevel,
        type: formData.type,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
        isRemote: formData.isRemote,
        applicationDeadline: formData.applicationDeadline || null,
        contactPhone: formData.contactPhone || null,
        contactCountryCode: formData.contactCountryCode,
        images: uploadedImages,
      };

      console.log("Submitting job data:", jobData);

      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        credentials: "include", // Include cookies for JWT
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create job";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text or generic message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        // If response is successful but no JSON body, create a default result
        result = { message: "Job created successfully" };
      }

      console.log("Job created successfully:", result);

      // Show success message
      setError(""); // Clear any previous errors
      setSuccessMessage("Job posted successfully! Redirecting...");

      // Wait a moment to show the success message before navigating
      setTimeout(() => {
        navigate("/employer/dashboard", {
          state: { message: "Job posted successfully!" },
        });
      }, 1500);
    } catch (err) {
      console.error("Error creating job:", err);
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-lg border border-border p-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Post a New Job
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Job Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="e.g., Senior Software Developer"
            />
          </div>

          {/* Industry and Job Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Industry *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="">Select Industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Job Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
          </div>

          {/* Remote Work Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isRemote"
              name="isRemote"
              checked={formData.isRemote}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label
              htmlFor="isRemote"
              className="text-sm font-medium text-foreground"
            >
              This is a remote position
            </label>
          </div>

          {/* Location Search */}
          {!formData.isRemote && (
            <div className="relative">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Location *
              </label>
              <div className="relative">
                <MdLocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  id="location"
                  value={locationSearch}
                  onChange={handleLocationSearchChange}
                  required={!formData.isRemote}
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="Search for a location..."
                />
                {isSearchingLocation && (
                  <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 animate-spin" />
                )}
              </div>

              {showLocationDropdown && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationResults.map((location) => (
                    <button
                      key={location.place_id}
                      type="button"
                      onClick={() => selectLocation(location)}
                      className="w-full px-4 py-3 text-left hover:bg-muted focus:bg-muted focus:outline-none text-foreground"
                    >
                      <div className="flex items-center">
                        <MdLocationOn className="w-4 h-4 text-muted-foreground mr-2" />
                        <span className="truncate">
                          {location.display_name.split(",")[0].trim()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience Level */}
          <div>
            <label
              htmlFor="experienceLevel"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Experience Level *
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            >
              <option value="ENTRY_LEVEL">Entry Level (0-2 years)</option>
              <option value="MID_LEVEL">Mid Level (2-5 years)</option>
              <option value="SENIOR_LEVEL">Senior Level (5-10 years)</option>
              <option value="EXECUTIVE">Executive (10+ years)</option>
            </select>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Salary Range (GHS) - Optional
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                placeholder="Minimum salary"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              />
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                placeholder="Maximum salary"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <PhoneInput
            countryCode={formData.contactCountryCode}
            phoneNumber={formData.contactPhone}
            onCountryCodeChange={(code) =>
              setFormData((prev) => ({ ...prev, contactCountryCode: code }))
            }
            onPhoneNumberChange={(phone) =>
              setFormData((prev) => ({ ...prev, contactPhone: phone }))
            }
            label="Contact Phone - Optional"
            placeholder="Phone number"
          />

          {/* Job Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-vertical"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
            />
          </div>

          {/* Requirements */}
          <div>
            <label
              htmlFor="requirements"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Requirements *
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-vertical"
              placeholder="List the required skills, qualifications, and experience..."
            />
          </div>

          {/* Responsibilities */}
          <div>
            <label
              htmlFor="responsibilities"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Responsibilities *
            </label>
            <textarea
              id="responsibilities"
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-vertical"
              placeholder="List the key responsibilities and duties for this role..."
            />
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Benefits - Optional
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                placeholder="Add a benefit..."
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addBenefit())
                }
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <MdAdd className="w-5 h-5" />
              </button>
            </div>

            {formData.benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit)}
                      className="ml-2 hover:text-red-500"
                    >
                      <MdClose className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Job Images */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Job Images (Optional)
            </label>
            <p className="text-sm text-muted-foreground mb-4">
              Add images to showcase your workplace, team, or job environment.
              This helps attract more candidates.
            </p>
            <ImageUpload
              onFilesUpload={handleImageUpload}
              maxFiles={5}
              maxFileSize={5 * 1024 * 1024} // 5MB
              acceptedTypes={[
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
              ]}
            />
          </div>

          {/* Application Deadline */}
          <div>
            <label
              htmlFor="applicationDeadline"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Application Deadline *
            </label>
            <input
              type="date"
              id="applicationDeadline"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/employer/dashboard")}
              className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Posting Job..." : "Post Job"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostJob;
