import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdLocationOn,
  MdPictureAsPdf,
  MdDescription,
  MdOpenInNew,
} from "react-icons/md";
import { userAPI, attachmentAPI, formatImageUrl } from "../../services/api";
import PhoneInput from "../../components/ui/PhoneInput";
import Button from "../../components/ui/Button";
import ImageUpload from "../../components/ui/ImageUpload";
import FileUpload from "../../components/ui/FileUpload";
import AttachmentViewer from "../../components/ui/AttachmentViewer";
import { LOCATION_API_CONFIG } from "../../utils/constants";

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
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience?: string;
  education?: string;
  cvUrl?: string;
  profileImageUrl?: string;
  isProfilePublic: boolean;
  countryCode?: string;
  phone?: string;
  resumeAttachments?: Array<{
    id: string;
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
}

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  imageUrl?: string;
  profile?: JobSeekerProfile;
}

interface ApiResponse {
  success: boolean;
  data: {
    user: UserData;
  };
}

export default function JobSeekerProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    location: "",
    bio: "",
    skills: [] as string[],
    experience: "",
    education: "",
    cvUrl: "",
    profileImageUrl: "",
    isProfilePublic: true,
    countryCode: "+233",
    phone: "",
  });

  const [newSkill, setNewSkill] = useState("");

  // Location search states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = (await userAPI.me()) as ApiResponse;
      const data = response.data.user;
      setUserData(data);

      // Populate form with current data
      if (data.profile) {
        setFormData({
          firstName: data.profile.firstName || data.firstName || "",
          lastName: data.profile.lastName || data.lastName || "",
          dateOfBirth: data.profile.dateOfBirth
            ? data.profile.dateOfBirth.split("T")[0]
            : "",
          location: data.profile.location || "",
          bio: data.profile.bio || "",
          skills: data.profile.skills || [],
          experience: data.profile.experience || "",
          education: data.profile.education || "",
          cvUrl: data.profile.cvUrl || "",
          profileImageUrl: data.profile.profileImageUrl || data.imageUrl || "",
          isProfilePublic: data.profile.isProfilePublic ?? true,
          countryCode: data.profile.countryCode || "+233",
          phone: data.profile.phone || "",
        });
      } else {
        // No profile exists, prefill with user data
        setFormData((prev) => ({
          ...prev,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          profileImageUrl: data.imageUrl || "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageUpload = async (files: File[]) => {
    try {
      const response = await attachmentAPI.upload(files, "USER");
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "attachments" in response.data
      ) {
        const responseData = response.data as {
          attachments: Array<{ url: string; id: string; filename: string }>;
        };
        if (responseData.attachments.length > 0) {
          const uploadedAttachment = responseData.attachments[0];
          const imageUrl = formatImageUrl(uploadedAttachment.url);

          // Update form data
          setFormData((prev) => ({
            ...prev,
            profileImageUrl: imageUrl,
          }));

          // Update userData state so image appears immediately
          setUserData((prev) =>
            prev
              ? {
                  ...prev,
                  imageUrl: imageUrl,
                  profile: {
                    ...prev.profile!,
                    profileImageUrl: imageUrl,
                  },
                }
              : prev
          );
        }
      }
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      setError("Failed to upload profile image");
    }
  };

  const handleResumeUpload = async (files: File[]) => {
    try {
      const response = await attachmentAPI.upload(files, "USER");
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "attachments" in response.data
      ) {
        const responseData = response.data as {
          attachments: Array<{ url: string; id: string; filename: string }>;
        };
        if (responseData.attachments.length > 0) {
          const uploadedAttachment = responseData.attachments[0];
          setFormData((prev) => ({
            ...prev,
            cvUrl: uploadedAttachment.url,
          }));
          // Store the attachment in userData for display
          setUserData((prev) =>
            prev
              ? {
                  ...prev,
                  profile: {
                    ...prev.profile!,
                    resumeAttachments: [
                      {
                        id: uploadedAttachment.id,
                        url: uploadedAttachment.url,
                        filename: uploadedAttachment.filename || files[0].name,
                        fileType: files[0].type || "application/pdf",
                        fileSize: files[0].size,
                      },
                    ],
                  },
                }
              : prev
          );
        }
      }
    } catch (error) {
      console.error("Failed to upload resume:", error);
      setError("Failed to upload resume");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await userAPI.updateJobSeekerProfile(formData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      await fetchProfile(); // Refresh profile
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional information
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Profile Image Display */}
          {(userData?.profile?.profileImageUrl || userData?.imageUrl) && (
            <div className="flex-shrink-0">
              <img
                src={formatImageUrl(
                  userData.profile?.profileImageUrl || userData.imageUrl!
                )}
                alt="Profile"
                className="w-24 h-24 object-cover rounded-full border-2 border-border bg-background"
                onError={(e) => {
                  console.warn(
                    "Failed to load header profile image:",
                    userData?.profile?.profileImageUrl || userData?.imageUrl
                  );
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-secondary/10 border border-secondary/20 text-secondary px-4 py-3 rounded-md mb-6">
          {success}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border overflow-hidden"
      >
        <div className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
                Basic Information
              </h2>
            </div>

            {/* Profile Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Profile Image
              </label>
              {isEditing ? (
                <ImageUpload
                  onFilesUpload={handleProfileImageUpload}
                  accept="image/*"
                  maxFiles={1}
                  label="Upload Profile Image"
                  existingImages={
                    formData.profileImageUrl ? [formData.profileImageUrl] : []
                  }
                />
              ) : (
                <div className="flex items-center gap-4">
                  {userData?.profile?.profileImageUrl || userData?.imageUrl ? (
                    <img
                      src={formatImageUrl(
                        userData.profile?.profileImageUrl || userData.imageUrl!
                      )}
                      alt="Profile"
                      className="w-20 h-20 object-cover rounded-full border border-border"
                      onError={(e) => {
                        console.warn(
                          "Failed to load profile image:",
                          userData?.profile?.profileImageUrl ||
                            userData?.imageUrl
                        );
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
                <label className="block text-sm font-semibold text-primary mb-2">
                  First Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-lg font-medium text-foreground bg-muted/30 p-3 rounded-md">
                    {userData?.profile?.firstName ||
                      userData?.firstName ||
                      "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Last Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-lg font-medium text-foreground bg-muted/30 p-3 rounded-md">
                    {userData?.profile?.lastName ||
                      userData?.lastName ||
                      "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full px-3 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-lg font-medium text-foreground bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                    {userData?.profile?.dateOfBirth
                      ? new Date(
                          userData.profile.dateOfBirth
                        ).toLocaleDateString()
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                  Phone
                </label>
                {isEditing ? (
                  <PhoneInput
                    countryCode={formData.countryCode}
                    phoneNumber={formData.phone}
                    onCountryCodeChange={(code) =>
                      setFormData({ ...formData, countryCode: code })
                    }
                    onPhoneNumberChange={(phone) =>
                      setFormData({ ...formData, phone })
                    }
                    label=""
                  />
                ) : (
                  <div className="text-lg font-medium text-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    {userData?.profile?.phone
                      ? `${userData?.profile?.countryCode || "+233"} ${
                          userData?.profile?.phone
                        }`
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
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
                          // Allow manual clearing - don't revert if user cleared the field
                          if (!locationSearch) {
                            setFormData({ ...formData, location: "" });
                          }
                        }}
                        placeholder="Type to search for city or location..."
                        className="w-full pl-10 pr-12 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
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
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationResults.map((location) => (
                          <button
                            key={location.place_id}
                            onClick={() => selectLocation(location)}
                            className="w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
                          >
                            <div className="flex items-center">
                              <MdLocationOn className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
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
                  <div className="text-lg font-medium text-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    {userData?.profile?.location || "Not specified"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
                Professional Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-orange-600 mb-1">
                  Experience Level
                </label>
                {isEditing ? (
                  <select
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-background text-foreground"
                  >
                    <option value="">Select experience level</option>
                    <option value="ENTRY_LEVEL">Entry Level (0-2 years)</option>
                    <option value="MID_LEVEL">Mid Level (2-5 years)</option>
                    <option value="SENIOR_LEVEL">
                      Senior Level (5+ years)
                    </option>
                    <option value="EXECUTIVE">Executive (Leadership)</option>
                  </select>
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.experience || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-600 mb-2">
                  Education
                </label>
                {isEditing ? (
                  <select
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  >
                    <option value="">Select Education Level</option>
                    <option value="HIGH_SCHOOL">High School</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="BACHELOR">Bachelor's Degree</option>
                    <option value="MASTER">Master's Degree</option>
                    <option value="PHD">PhD/Doctorate</option>
                    <option value="PROFESSIONAL">
                      Professional Certificate
                    </option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <div className="text-lg font-medium text-foreground bg-muted/30 p-3 rounded-md">
                    {formData.education
                      ? formData.education
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : userData?.profile?.education || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-pink-600 mb-1">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    placeholder="Tell us about yourself, your background, and what you're looking for..."
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.bio || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-yellow-600 mb-1">
                  CV/Resume
                </label>
                {isEditing ? (
                  <FileUpload
                    onFilesUpload={handleResumeUpload}
                    maxFiles={1}
                    acceptedTypes={[
                      "application/pdf",
                      "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ]}
                    maxFileSize={10 * 1024 * 1024} // 10MB
                    label="Upload CV/Resume"
                    description="Upload your CV or Resume (.pdf, .doc, .docx)"
                  />
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.resumeAttachments &&
                    userData.profile.resumeAttachments.length > 0 ? (
                      <AttachmentViewer
                        attachments={userData.profile.resumeAttachments}
                      />
                    ) : userData?.profile?.cvUrl ? (
                      <div className="border border-border rounded-lg p-4 bg-background hover:bg-muted transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {userData.profile.cvUrl
                              .toLowerCase()
                              .includes(".pdf") ? (
                              <MdPictureAsPdf className="w-8 h-8 text-red-600" />
                            ) : (
                              <MdDescription className="w-8 h-8 text-blue-600" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">
                                {userData.profile.cvUrl
                                  .split("/")
                                  .pop()
                                  ?.split(".")[0] || "CV/Resume"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {userData.profile.cvUrl
                                  .toLowerCase()
                                  .includes(".pdf")
                                  ? "PDF Document"
                                  : "Document"}
                              </p>
                            </div>
                          </div>
                          <a
                            href={formatImageUrl(userData.profile.cvUrl)}
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
                      <p className="text-muted-foreground italic">
                        No resume uploaded
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
                Skills
              </h2>
            </div>
            {isEditing ? (
              <div>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill"
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                  <Button onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userData?.profile?.skills?.map(
                  (skill: string, index: number) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  )
                ) || (
                  <span className="text-muted-foreground">No skills added</span>
                )}
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
                Privacy Settings
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Public Profile
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Allow employers to find and view your profile
                  </p>
                </div>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={formData.isProfilePublic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isProfilePublic: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      userData?.profile?.isProfilePublic
                        ? "bg-secondary/10 text-secondary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {userData?.profile?.isProfilePublic ? "Public" : "Private"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="primary"
                size="lg"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  variant="primary"
                  size="lg"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
