"use client";

import { useState, useEffect, useRef } from "react";
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
import { apiClient, formatImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";

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

const isJobSeekerProfile = (value: unknown): value is JobSeekerProfile => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.firstName === "string" &&
    typeof v.lastName === "string" &&
    Array.isArray(v.skills)
  );
};

const LOCATION_API_CONFIG = {
  baseUrl: "https://nominatim.openstreetmap.org/search",
  countryCodes: "gh",
  limit: 5,
};

export default function JobSeekerProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    location: "",
    bio: "",
    skills: [] as string[],
    experience: "",
    education: "",
    phone: "",
    countryCode: "+233",
    isProfilePublic: true,
    cvUrl: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    if (user?.profile && isJobSeekerProfile(user.profile)) {
      const profileData = user.profile;
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        dateOfBirth: profileData.dateOfBirth
          ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
          : "",
        location: profileData.location || "",
        bio: profileData.bio || "",
        skills: profileData.skills || [],
        experience: profileData.experience || "",
        education: profileData.education || "",
        phone: profileData.phone || "",
        countryCode: profileData.countryCode || "+233",
        isProfilePublic: profileData.isProfilePublic ?? true,
        cvUrl: profileData.cvUrl || "",
        profileImageUrl:
          profileData.profileImageUrl || (user?.imageUrl as string) || "",
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [user]);

  // Location search functionality
  const searchLocations = async (query: string) => {
    if (!query.trim()) return;

    setIsSearchingLocation(true);
    try {
      const url = `${
        LOCATION_API_CONFIG.baseUrl
      }?format=json&q=${encodeURIComponent(query)}&countrycodes=${
        LOCATION_API_CONFIG.countryCodes
      }&limit=${LOCATION_API_CONFIG.limit}&addressdetails=1`;

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

  const handleLocationSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLocationSearch(e.target.value);
  };

  const selectLocation = (location: LocationResult) => {
    const cityName = location.display_name.split(",")[0].trim();
    setFormData((prev) => ({ ...prev, location: cityName }));
    setLocationSearch(cityName);
    setShowLocationDropdown(false);
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      formData.append("files", files[0]);
      formData.append("type", "USER");

      const response = await apiClient.post<{
        attachments: Array<{ url: string; id: string; filename: string }>;
      }>("/attachments/upload", formData);

      if (
        response.success &&
        response.data &&
        (response.data.attachments?.length ?? 0) > 0
      ) {
        const imageUrl = formatImageUrl(response.data.attachments[0].url);
        setFormData((prev) => ({ ...prev, profileImageUrl: imageUrl }));
        setProfile((prev) =>
          prev ? { ...prev, profileImageUrl: imageUrl } : prev,
        );
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
      const formData = new FormData();
      formData.append("files", files[0]);
      formData.append("type", "USER");

      const response = await apiClient.post<{
        attachments: Array<{ url: string; id: string; filename: string }>;
      }>("/attachments/upload", formData);

      if (
        response.success &&
        response.data &&
        (response.data.attachments?.length ?? 0) > 0
      ) {
        const uploadedAttachment = response.data.attachments[0];
        setFormData((prev) => ({ ...prev, cvUrl: uploadedAttachment.url }));
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                cvUrl: uploadedAttachment.url,
                resumeAttachments: [
                  {
                    id: uploadedAttachment.id,
                    url: uploadedAttachment.url,
                    filename: uploadedAttachment.filename || files[0].name,
                    fileType: files[0].type || "application/pdf",
                    fileSize: files[0].size,
                  },
                ],
              }
            : prev,
        );
      }
    } catch (error) {
      console.error("Failed to upload resume:", error);
      setError("Failed to upload resume");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePhoneChange = (phone: string, countryCode: string) => {
    setFormData((prev) => ({ ...prev, phone, countryCode }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiClient.put("/users/profile/job-seeker", {
        ...formData,
        dateOfBirth: formData.dateOfBirth || null,
      });

      if (response.success) {
        await refreshUser();
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        location: profile.location || "",
        bio: profile.bio || "",
        skills: profile.skills || [],
        experience: profile.experience || "",
        education: profile.education || "",
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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

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
        {(profile?.profileImageUrl || user?.imageUrl) && (
          <div className="shrink-0 hidden sm:block">
            <Image
              src={formatImageUrl(
                profile?.profileImageUrl || (user?.imageUrl as string),
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
                {(formData.profileImageUrl ||
                  profile?.profileImageUrl ||
                  user?.imageUrl) && (
                  <Image
                    src={formatImageUrl(
                      formData.profileImageUrl ||
                        profile?.profileImageUrl ||
                        (user?.imageUrl as string),
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
              {profile?.profileImageUrl || user?.imageUrl ? (
                <Image
                  src={formatImageUrl(
                    profile?.profileImageUrl || (user?.imageUrl as string),
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
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                required
              />
            ) : (
              <p className="text-muted-foreground">{profile?.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                required
              />
            ) : (
              <p className="text-muted-foreground">{profile?.lastName}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <MdEmail className="w-4 h-4" />
              Email
            </label>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <MdPhone className="w-4 h-4" />
              Phone Number
            </label>
            {isEditing ? (
              <PhoneInput
                phoneNumber={formData.phone}
                countryCode={formData.countryCode}
                onPhoneNumberChange={(phone) =>
                  setFormData((prev) => ({ ...prev, phone }))
                }
                onCountryCodeChange={(countryCode) =>
                  setFormData((prev) => ({ ...prev, countryCode }))
                }
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
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
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
                  <MdLocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={handleLocationSearchChange}
                    onFocus={() => {
                      if (!locationSearch) {
                        setLocationSearch(formData.location);
                      }
                    }}
                    onBlur={() => {
                      if (!locationSearch) {
                        setFormData({ ...formData, location: "" });
                      }
                    }}
                    placeholder="Type to search for city or location..."
                    className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                  {locationSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationSearch("");
                        setFormData({ ...formData, location: "" });
                        setShowLocationDropdown(false);
                      }}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
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
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)}{" "}
                              MB
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
                          <p className="font-medium text-foreground">
                            CV/Resume
                          </p>
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
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="">Select experience level</option>
                <option value="ENTRY_LEVEL">Entry Level (0-2 years)</option>
                <option value="MID_LEVEL">Mid Level (2-5 years)</option>
                <option value="SENIOR_LEVEL">Senior Level (5+ years)</option>
                <option value="EXECUTIVE">Executive (Leadership)</option>
              </select>
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
              <select
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="">Select Education Level</option>
                <option value="HIGH_SCHOOL">High School</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="BACHELOR">Bachelor&apos;s Degree</option>
                <option value="MASTER">Master&apos;s Degree</option>
                <option value="PHD">PhD/Doctorate</option>
                <option value="PROFESSIONAL">Professional Certificate</option>
                <option value="OTHER">Other</option>
              </select>
            ) : (
              <p className="text-foreground py-3">
                {formData.education
                  ? formData.education
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
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell employers about yourself..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
              />
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
                  {formData.skills.map((skill, index) => (
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

      {/* Education */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MdSchool className="w-5 h-5 text-primary" />
          Education
        </h3>
        {isEditing ? (
          <textarea
            name="education"
            value={formData.education}
            onChange={handleInputChange}
            rows={3}
            placeholder="e.g., BSc Computer Science - University of Ghana"
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
          />
        ) : (
          <p className="text-muted-foreground whitespace-pre-wrap">
            {profile?.education || "Not provided"}
          </p>
        )}
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
              candidate searches. This increases your visibility and job
              opportunities.
            </p>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                <span>Visible information: Name, skills, experience, bio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                <span>
                  Contact details are only shared after you apply to jobs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                <span>You can change this setting anytime</span>
              </div>
            </div>
          </div>
          <div className="ml-4 shrink-0">
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isProfilePublic"
                  checked={formData.isProfilePublic}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            ) : (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.isProfilePublic
                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {profile?.isProfilePublic ? "✓ Public" : "🔒 Private"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons - At the bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center pt-4 pb-8"
      >
        {!isEditing ? (
          <Button
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
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="gap-2 min-w-[120px]"
              size="lg"
            >
              <MdCancel className="w-5 h-5" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 min-w-[160px]"
              size="lg"
            >
              <MdSave className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
