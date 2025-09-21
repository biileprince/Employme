import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { userAPI, attachmentAPI, formatImageUrl } from "../../services/api";
import PhoneInput from "../../components/ui/PhoneInput";
import Button from "../../components/ui/Button";
import ImageUpload from "../../components/ui/ImageUpload";
import FileUpload from "../../components/ui/FileUpload";
import AttachmentViewer from "../../components/ui/AttachmentViewer";

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
                className="w-16 h-16 object-cover rounded-full border-2 border-border bg-background"
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

          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="primary">
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                variant="primary"
              >
                Save Changes
              </Button>
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
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Basic Information
            </h2>

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
                      className="w-16 h-16 object-cover rounded-full border border-border"
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
                <label className="block text-sm font-medium text-foreground mb-1">
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
                  <div className="text-foreground">
                    {userData?.profile?.firstName ||
                      userData?.firstName ||
                      "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                  <div className="text-foreground">
                    {userData?.profile?.lastName ||
                      userData?.lastName ||
                      "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.dateOfBirth
                      ? new Date(
                          userData.profile.dateOfBirth
                        ).toLocaleDateString()
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                  <div className="text-foreground">
                    {userData?.profile?.phone
                      ? `${userData?.profile?.countryCode || "+233"} ${
                          userData?.profile?.phone
                        }`
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Accra, Ghana"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.location || "Not specified"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Professional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Experience Level
                </label>
                {isEditing ? (
                  <select
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  Education
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    rows={3}
                    placeholder="Your educational background..."
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.education || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground">
                    {userData?.profile?.bio || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                      <a
                        href={formatImageUrl(userData.profile.cvUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View CV/Resume
                      </a>
                    ) : (
                      "No resume uploaded"
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Skills
            </h2>
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
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Privacy Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">
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
        </div>
      </motion.div>
    </div>
  );
}
