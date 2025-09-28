import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUpload, FiCamera } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI, attachmentAPI } from "../../services/api";
import PhoneInput from "../../components/ui/PhoneInput";
import { INDUSTRIES } from "../../utils/constants";
import imagegreet from "../../assets/images/imagegreet.jpg";
import ladyWithLaptop from "../../assets/images/Ladywithlaptop.jpg";

// Role-based form interfaces
interface JobSeekerProfile {
  fullName: string;
  phone: string;
  countryCode: string;
  location: string;
  bio: string;
  experience: string;
  skills: string[];
  education: string;
  cvUrl?: string;
}

interface EmployerProfile {
  companyName: string;
  title: string;
  companySize: string;
  industry: string;
  website: string;
  phone: string;
  countryCode: string;
  location: string;
  description: string;
  founded: number;
}

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Role-based form data
  const [jobSeekerData, setJobSeekerData] = useState<JobSeekerProfile>({
    fullName: "",
    phone: "",
    countryCode: "+233",
    location: "",
    bio: "",
    experience: "",
    skills: [],
    education: "",
    cvUrl: "",
  });

  const [employerData, setEmployerData] = useState<EmployerProfile>({
    companyName: "",
    title: "",
    companySize: "",
    industry: "",
    website: "",
    phone: "",
    countryCode: "+233",
    location: "",
    description: "",
    founded: 0,
  });

  // Current skill input
  const [currentSkill, setCurrentSkill] = useState("");

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // CV upload states
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string>("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.hasProfile) {
      // Redirect based on role if profile already exists
      if (user.role === "EMPLOYER") {
        navigate("/employer/dashboard");
      } else {
        navigate("/job-seeker/dashboard");
      }
      return;
    }

    // Pre-fill name if available
    if (user.role === "JOB_SEEKER") {
      setJobSeekerData((prev) => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
      }));
    } else if (user.role === "EMPLOYER") {
      // No need to pre-fill any employer fields since title and founded are user-specific
    }
  }, [user, navigate]);

  const handleJobSeekerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setJobSeekerData({
      ...jobSeekerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmployerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEmployerData({
      ...employerData,
      [name]: name === "founded" ? parseInt(value) || 0 : value,
    });
  };

  const addSkill = () => {
    if (
      currentSkill.trim() &&
      !jobSeekerData.skills.includes(currentSkill.trim())
    ) {
      setJobSeekerData({
        ...jobSeekerData,
        skills: [...jobSeekerData.skills, currentSkill.trim()],
      });
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setJobSeekerData({
      ...jobSeekerData,
      skills: jobSeekerData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const response = await attachmentAPI.upload([file], "USER");
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "attachments" in response.data
      ) {
        const responseData = response.data as {
          attachments: Array<{ url: string }>;
        };
        if (responseData.attachments.length > 0) {
          return responseData.attachments[0].url;
        }
      }
      throw new Error("Failed to upload image");
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const isValidFile =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isValidFile) {
        alert("Please upload PDF, DOC, or DOCX files only.");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        return;
      }

      setCvFile(file);
      setCvFileName(file.name);
    }
  };

  const uploadCvToCloudinary = async (file: File): Promise<string> => {
    try {
      const response = await attachmentAPI.upload([file], "CV");
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "attachments" in response.data
      ) {
        const responseData = response.data as {
          attachments: Array<{ url: string }>;
        };
        if (responseData.attachments.length > 0) {
          return responseData.attachments[0].url;
        }
      }
      throw new Error("Failed to upload CV");
    } catch (error) {
      console.error("Error uploading CV:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Upload image first if provided
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      // Upload CV for job seekers if provided
      let cvUrl = "";
      if (user?.role === "JOB_SEEKER" && cvFile) {
        cvUrl = await uploadCvToCloudinary(cvFile);
      }

      const profileData =
        user?.role === "JOB_SEEKER" ? jobSeekerData : employerData;

      // Add the role and appropriate file URLs to the profile data
      const profileDataWithRole = {
        ...profileData,
        role: user?.role,
        // For job seekers: save as imageUrl (profile picture)
        // For employers: save as logoUrl (company logo)
        ...(imageUrl && user?.role === "JOB_SEEKER" && { imageUrl }),
        ...(imageUrl && user?.role === "EMPLOYER" && { logoUrl: imageUrl }),
        ...(cvUrl && { cvUrl }),
      };

      await userAPI.createProfile(
        profileDataWithRole as Record<string, unknown>
      );

      // Refresh user data to update hasProfile flag
      await refreshUser();

      // Show success message
      const roleText = user?.role === "EMPLOYER" ? "Employer" : "Job Seeker";
      setSuccess(
        `🎉 ${roleText} profile created successfully! Redirecting to your dashboard...`
      );

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        if (user?.role === "EMPLOYER") {
          navigate("/employer/dashboard");
        } else {
          navigate("/job-seeker/dashboard");
        }
      }, 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const isJobSeeker = user.role === "JOB_SEEKER";
  const isEmployer = user.role === "EMPLOYER";

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${
            isEmployer
              ? "bg-gradient-to-br from-secondary-600/90 to-secondary-800/90"
              : "bg-gradient-to-br from-primary-600/90 to-primary-800/90"
          } z-10`}
        />
        <img
          src={isEmployer ? imagegreet : ladyWithLaptop}
          alt={
            isEmployer
              ? "Professional greeting"
              : "Professional woman with laptop"
          }
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold mb-6">
              {isEmployer
                ? "Complete Your Company Profile"
                : "Complete Your Profile"}
            </h1>
            <p
              className={`text-xl mb-8 ${
                isEmployer ? "text-secondary-100" : "text-primary-100"
              }`}
            >
              {isEmployer
                ? "Set up your company profile to start posting jobs and finding the best talent."
                : "Complete your profile to get personalized job recommendations and stand out to employers."}
            </p>
            <div
              className={`space-y-4 ${
                isEmployer ? "text-secondary-100" : "text-primary-100"
              }`}
            >
              {isEmployer ? (
                <>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                    <span>Add company information</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                    <span>Post unlimited jobs</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                    <span>Find qualified candidates</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                    <span>Showcase your skills and experience</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                    <span>Get matched with relevant jobs</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                    <span>Track your applications</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isEmployer ? "Company Profile" : "Your Profile"}
            </h2>
            <p className="text-muted-foreground">
              {isEmployer
                ? "Tell us about your company"
                : "Tell us about yourself"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card rounded-2xl shadow-xl border border-border p-8 max-h-[70vh] overflow-y-auto"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                      <FiCamera className="text-2xl text-muted-foreground" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <FiUpload className="text-sm" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {isEmployer
                    ? "Upload company logo (optional)"
                    : "Upload profile picture (optional)"}
                </p>
              </div>

              {isJobSeeker ? (
                // Job Seeker Form
                <>
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={jobSeekerData.fullName}
                      onChange={handleJobSeekerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <PhoneInput
                    countryCode={jobSeekerData.countryCode}
                    phoneNumber={jobSeekerData.phone}
                    onCountryCodeChange={(code) =>
                      setJobSeekerData((prev) => ({
                        ...prev,
                        countryCode: code,
                      }))
                    }
                    onPhoneNumberChange={(phone) =>
                      setJobSeekerData((prev) => ({ ...prev, phone }))
                    }
                    label="Phone Number"
                    required
                  />

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={jobSeekerData.location}
                      onChange={handleJobSeekerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder="e.g., Accra, Ghana"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="experience"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Experience Level
                    </label>
                    <select
                      id="experience"
                      name="experience"
                      value={jobSeekerData.experience}
                      onChange={handleJobSeekerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="">Select experience level</option>
                      <option value="ENTRY_LEVEL">
                        Entry Level (0-2 years)
                      </option>
                      <option value="MID_LEVEL">Mid Level (3-5 years)</option>
                      <option value="SENIOR_LEVEL">
                        Senior Level (6+ years)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="education"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Education Level
                    </label>
                    <select
                      id="education"
                      name="education"
                      value={jobSeekerData.education}
                      onChange={handleJobSeekerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="">Select education level</option>
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="DIPLOMA">Diploma</option>
                      <option value="BACHELORS">Bachelor's Degree</option>
                      <option value="MASTERS">Master's Degree</option>
                      <option value="PHD">PhD</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="skills"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Skills
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSkill())
                        }
                        className="flex-1 px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        placeholder="Add a skill"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {jobSeekerData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-secondary-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Professional Summary
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={jobSeekerData.bio}
                      onChange={handleJobSeekerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder="Describe your professional background and career goals..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Upload CV/Resume (Optional)
                    </label>
                    <div className="border-2 border-dashed border-input rounded-lg p-4 text-center">
                      {cvFileName ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm text-foreground">
                            📄 {cvFileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCvFile(null);
                              setCvFileName("");
                            }}
                            className="text-destructive hover:text-destructive/80 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              📄
                            </div>
                            <div>
                              <span className="text-sm font-medium text-primary">
                                Choose file
                              </span>
                              <p className="text-xs text-muted-foreground">
                                PDF, DOC, DOCX (Max 5MB)
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleCvUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // Employer Form
                <>
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Your Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={employerData.title}
                      onChange={handleEmployerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder="e.g., HR Manager, CEO, Recruiter"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="founded"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Company Founded Year
                    </label>
                    <input
                      id="founded"
                      name="founded"
                      type="number"
                      value={employerData.founded || ""}
                      onChange={handleEmployerChange}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder={`e.g., ${new Date().getFullYear() - 10}`}
                    />
                  </div>

                  <PhoneInput
                    countryCode={employerData.countryCode}
                    phoneNumber={employerData.phone}
                    onCountryCodeChange={(code) =>
                      setEmployerData((prev) => ({
                        ...prev,
                        countryCode: code,
                      }))
                    }
                    onPhoneNumberChange={(phone) =>
                      setEmployerData((prev) => ({ ...prev, phone }))
                    }
                    label="Phone Number"
                    required
                  />

                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={employerData.companyName}
                      onChange={handleEmployerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="industry"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Industry
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      value={employerData.industry}
                      onChange={handleEmployerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry.value} value={industry.value}>
                          {industry.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="companySize"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Company Size
                    </label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={employerData.companySize}
                      onChange={handleEmployerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Company Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={employerData.location}
                      onChange={handleEmployerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder="e.g., Accra, Ghana"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Company Website (Optional)
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={employerData.website}
                      onChange={handleEmployerChange}
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder="https://www.company.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Company Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={employerData.description}
                      onChange={handleEmployerChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      placeholder="Describe your company, mission, and what makes it a great place to work..."
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  isEmployer
                    ? "bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50"
                    : "bg-primary hover:bg-primary/90 disabled:bg-primary/50"
                }`}
              >
                {isLoading ? "Creating Profile..." : "Complete Profile"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
