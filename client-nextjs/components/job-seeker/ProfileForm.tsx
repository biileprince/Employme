"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MdEdit,
  MdSave,
  MdCancel,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdWork,
  MdSchool,
  MdDescription,
  MdUpload,
  MdPictureAsPdf,
  MdOpenInNew,
} from "react-icons/md";
import { formatImageUrl } from "@/lib/api";
import { updateJobSeekerProfile } from "@/app/actions/profile";
import { uploadProfileImage, uploadResume } from "@/app/actions/upload";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  jobSeekerProfileSchema,
  type JobSeekerProfileInput,
} from "@/lib/validations";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface JobSeekerProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  experience: string | null;
  education: string | null;
  cvUrl: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  countryCode: string | null;
  isProfilePublic: boolean;
  resumeAttachments?: Array<{
    id: string;
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface JobSeekerProfileFormProps {
  initialProfile: JobSeekerProfile | null;
  userEmail: string;
  userImageUrl?: string;
}

const LOCATION_API_CONFIG = {
  baseUrl: "https://nominatim.openstreetmap.org/search",
  countryCodes: "gh",
  limit: 5,
};

export default function JobSeekerProfileForm({
  initialProfile,
  userEmail,
  userImageUrl,
}: JobSeekerProfileFormProps) {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Location search states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // File upload refs
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form setup with Zod validation
  const form = useForm<JobSeekerProfileInput>({
    resolver: zodResolver(jobSeekerProfileSchema),
    defaultValues: {
      firstName: initialProfile?.firstName || "",
      lastName: initialProfile?.lastName || "",
      dateOfBirth: initialProfile?.dateOfBirth
        ? new Date(initialProfile.dateOfBirth).toISOString().split("T")[0]
        : "",
      location: initialProfile?.location || "",
      bio: initialProfile?.bio || "",
      skills: initialProfile?.skills || [],
      experience: (initialProfile?.experience as any) || "",
      education: (initialProfile?.education as any) || "",
      phone: initialProfile?.phone || "",
      countryCode: initialProfile?.countryCode || "+233",
      isProfilePublic: initialProfile?.isProfilePublic ?? true,
      cvUrl: initialProfile?.cvUrl || "",
      profileImageUrl: initialProfile?.profileImageUrl || userImageUrl || "",
    },
    mode: "onChange", // Validate on change for better UX
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    control,
  } = form;

  // Watch values for dynamic updates
  const watchedFields = watch();

  // Location search functionality
  const searchLocations = async (query: string) => {
    if (!query.trim()) return;

    setIsSearchingLocation(true);
    try {
      const url = `${LOCATION_API_CONFIG.baseUrl}?format=json&q=${encodeURIComponent(query)}&countrycodes=${LOCATION_API_CONFIG.countryCodes}&limit=${LOCATION_API_CONFIG.limit}&addressdetails=1`;

      const response = await fetch(url);
      const data: LocationResult[] = await response.json();
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

  const selectLocation = (location: LocationResult) => {
    const cityName = location.display_name.split(",")[0].trim();
    setValue("location", cityName);
    setLocationSearch(cityName);
    setShowLocationDropdown(false);
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("files", files[0]);

      const result = await uploadProfileImage(uploadFormData);

      if (result.success && result.imageUrl) {
        const imageUrl = formatImageUrl(result.imageUrl);
        setValue("profileImageUrl", imageUrl);
        setProfile((prev) =>
          prev ? { ...prev, profileImageUrl: imageUrl } : prev,
        );
      } else {
        setError(result.error || "Failed to upload profile image");
      }
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      setError("Failed to upload profile image");
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("files", files[0]);

      const result = await uploadResume(uploadFormData);

      if (result.success && result.attachment) {
        setValue("cvUrl", result.attachment.url);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                cvUrl: result.attachment!.url,
                resumeAttachments: [
                  {
                    id: result.attachment!.id,
                    url: result.attachment!.url,
                    filename: result.attachment!.filename || files[0].name,
                    fileType: files[0].type || "application/pdf",
                    fileSize: files[0].size,
                  },
                ],
              }
            : prev,
        );
      } else {
        setError(result.error || "Failed to upload resume");
      }
    } catch (error) {
      console.error("Failed to upload resume:", error);
      setError("Failed to upload resume");
    }
  };

  const addSkill = () => {
    const currentSkills = watchedFields.skills || [];
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      setValue("skills", [...currentSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = watchedFields.skills || [];
    setValue("skills", currentSkills.filter((s) => s !== skill));
  };

  const onSubmit = async (data: JobSeekerProfileInput) => {
    setError("");
    setSuccess("");

    try {
      const result = await updateJobSeekerProfile(data);

      if (result.success) {
        await refreshUser();
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...data } : null);
      } else {
        if (result.fieldErrors) {
          // Set field errors in the form
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof JobSeekerProfileInput, {
              type: "server",
              message,
            });
          });
        }
        setError(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    if (profile) {
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        location: profile.location || "",
        bio: profile.bio || "",
        skills: profile.skills || [],
        experience: (profile.experience as any) || "",
        education: (profile.education as any) || "",
        phone: profile.phone || "",
        countryCode: profile.countryCode || "+233",
        isProfilePublic: profile.isProfilePublic ?? true,
        cvUrl: profile.cvUrl || "",
        profileImageUrl: profile.profileImageUrl || "",
      });
    }
    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            My Profile
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your professional information
          </p>
        </div>
        {/* Profile Image Display */}
        {(profile?.profileImageUrl || userImageUrl) && (
          <div className="shrink-0 hidden sm:block">
            <Image
              src={formatImageUrl(
                profile?.profileImageUrl || userImageUrl || "",
              )}
              alt="Profile"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border-2 border-border bg-background"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Basic Information
          </h3>

          {/* Profile Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Profile Image
            </label>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {(watchedFields.profileImageUrl ||
                    profile?.profileImageUrl ||
                    userImageUrl) && (
                    <Image
                      src={formatImageUrl(
                        watchedFields.profileImageUrl ||
                          profile?.profileImageUrl ||
                          userImageUrl ||
                          "",
                      )}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-full border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => profileImageInputRef.current?.click()}
                  className="gap-2"
                >
                  <MdUpload className="w-4 h-4" />
                  Upload Profile Image
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {profile?.profileImageUrl || userImageUrl ? (
                  <Image
                    src={formatImageUrl(
                      profile?.profileImageUrl || userImageUrl || "",
                    )}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-full border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground">No profile image</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <>
                  <input
                    {...register("firstName")}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                      errors.firstName ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">{profile?.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <>
                  <input
                    {...register("lastName")}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                      errors.lastName ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">{profile?.lastName}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                <MdEmail className="w-4 h-4" />
                Email
              </label>
              <p className="text-muted-foreground">{userEmail}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                <MdPhone className="w-4 h-4" />
                Phone Number
              </label>
              {isEditing ? (
                <Controller
                  name="phone"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <>
                      <PhoneInput
                        phoneNumber={value || ""}
                        countryCode={watchedFields.countryCode || "+233"}
                        onPhoneNumberChange={onChange}
                        onCountryCodeChange={(countryCode) =>
                          setValue("countryCode", countryCode)
                        }
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </>
                  )}
                />
              ) : (
                <p className="text-muted-foreground">
                  {profile?.countryCode} {profile?.phone || "Not provided"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Date of Birth
              </label>
              {isEditing ? (
                <>
                  <input
                    {...register("dateOfBirth")}
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                      errors.dateOfBirth ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  {profile?.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : "Not provided"}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                <MdLocationOn className="w-4 h-4" />
                Location
              </label>
              {isEditing ? (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onFocus={() => {
                        if (!locationSearch) {
                          setLocationSearch(watchedFields.location || "");
                        }
                      }}
                      placeholder="Type to search for city or location..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                        errors.location ? "border-red-500" : "border-border"
                      }`}
                    />
                    {isSearchingLocation && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>

                  {/* Location Dropdown */}
                  {showLocationDropdown && locationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationResults.map((location) => (
                        <button
                          key={location.place_id}
                          type="button"
                          onClick={() => selectLocation(location)}
                          className="w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
                        >
                          <div className="flex items-center">
                            <MdLocationOn className="w-4 h-4 text-primary mr-2 shrink-0" />
                            <span className="text-foreground text-sm truncate">
                              {location.display_name.split(",")[0].trim()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.location.message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground py-3">
                  {profile?.location || "Not provided"}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                CV/Resume
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resumeInputRef.current?.click()}
                    className="gap-2"
                  >
                    <MdUpload className="w-4 h-4" />
                    Upload CV/Resume
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Upload your CV or Resume (.pdf, .doc, .docx, max 10MB)
                  </p>
                </div>
              ) : (
                <div className="text-foreground">
                  {profile?.resumeAttachments &&
                  profile.resumeAttachments.length > 0 ? (
                    profile.resumeAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="border border-border rounded-lg p-4 bg-background hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {attachment.fileType.includes("pdf") ? (
                              <MdPictureAsPdf className="w-8 h-8 text-red-600" />
                            ) : (
                              <MdDescription className="w-8 h-8 text-blue-600" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">
                                {attachment.filename}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <a
                            href={formatImageUrl(attachment.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-primary hover:text-primary/80 font-medium"
                          >
                            <span>View</span>
                            <MdOpenInNew className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : profile?.cvUrl ? (
                    <div className="border border-border rounded-lg p-4 bg-background hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {profile.cvUrl.toLowerCase().includes(".pdf") ? (
                            <MdPictureAsPdf className="w-8 h-8 text-red-600" />
                          ) : (
                            <MdDescription className="w-8 h-8 text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-foreground">CV/Resume</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.cvUrl.toLowerCase().includes(".pdf")
                                ? "PDF Document"
                                : "Document"}
                            </p>
                          </div>
                        </div>
                        <a
                          href={formatImageUrl(profile.cvUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-primary hover:text-primary/80 font-medium"
                        >
                          <span>View</span>
                          <MdOpenInNew className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic py-3">
                      No resume uploaded
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MdWork className="w-5 h-5 text-primary" />
            Professional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Experience Level
              </label>
              {isEditing ? (
                <>
                  <select
                    {...register("experience")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                      errors.experience ? "border-red-500" : "border-border"
                    }`}
                  >
                    <option value="">Select experience level</option>
                    <option value="ENTRY_LEVEL">Entry Level (0-2 years)</option>
                    <option value="MID_LEVEL">Mid Level (2-5 years)</option>
                    <option value="SENIOR_LEVEL">Senior Level (5+ years)</option>
                    <option value="EXECUTIVE">Executive (Leadership)</option>
                  </select>
                  {errors.experience && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.experience.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-foreground py-3">
                  {profile?.experience || "Not provided"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Education
              </label>
              {isEditing ? (
                <>
                  <select
                    {...register("education")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                      errors.education ? "border-red-500" : "border-border"
                    }`}
                  >
                    <option value="">Select Education Level</option>
                    <option value="HIGH_SCHOOL">High School</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="BACHELOR">Bachelor's Degree</option>
                    <option value="MASTER">Master's Degree</option>
                    <option value="PHD">PhD/Doctorate</option>
                    <option value="PROFESSIONAL">Professional Certificate</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.education && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.education.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-foreground py-3">
                  {watchedFields.education
                    ? watchedFields.education
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    : profile?.education || "Not provided"}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                <MdDescription className="w-4 h-4" />
                Bio
              </label>
              {isEditing ? (
                <>
                  <textarea
                    {...register("bio")}
                    rows={4}
                    placeholder="Tell employers about yourself..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none ${
                      errors.bio ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.bio.message}
                    </p>
                  )}
                </>
              ) : (
                <div className="bg-muted rounded-lg p-4 min-h-[100px]">
                  <p className="text-foreground whitespace-pre-wrap">
                    {profile?.bio || "No bio provided"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Skills
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addSkill())
                      }
                      placeholder="Add a skill..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                    <Button type="button" onClick={addSkill}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(watchedFields.skills || []).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.skills && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.skills.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No skills added</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Privacy Settings
          </h3>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Public Profile
              </p>
              <p className="text-sm text-muted-foreground">
                When enabled, employers can find and view your profile through
                candidate searches. This increases your visibility and job opportunities.
              </p>
            </div>
            <div className="ml-4 shrink-0">
              {isEditing ? (
                <Controller
                  name="isProfilePublic"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={onChange}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  )}
                />
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profile?.isProfilePublic
                      ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {profile?.isProfilePublic ? "Public" : "Private"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center pt-4 pb-8"
        >
          {!isEditing ? (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className="gap-2 min-w-[160px]"
              size="lg"
            >
              <MdEdit className="w-5 h-5" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="gap-2 min-w-[120px]"
                size="lg"
              >
                <MdCancel className="w-5 h-5" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 min-w-[160px]"
                size="lg"
              >
                <MdSave className="w-5 h-5" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
}