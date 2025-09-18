import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdEdit,
  MdSave,
  MdCancel,
  MdBusiness,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdLanguage,
  MdPerson,
  MdDescription,
  MdWork,
} from "react-icons/md";
import { userAPI } from "../../services/api";
import PhoneInput from "../../components/ui/PhoneInput";
import { INDUSTRIES } from "../../utils/constants";
interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  founded?: number;
  companySize?: string;
  isVerified: boolean;
  phone?: string;
  countryCode?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
  };
}

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
];

export default function EmployerProfile() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    location: "",
    website: "",
    description: "",
    logoUrl: "",
    founded: "",
    companySize: "",
    phone: "",
    countryCode: "+233",
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getProfile();
      console.log("Profile response:", response); // Debug log

      // Handle the backend response structure
      const userData = response.data.user;
      const employerProfile = userData.profile;

      if (employerProfile && userData.role === "EMPLOYER") {
        // Combine user data with employer profile data
        const fullProfile: EmployerProfile = {
          ...employerProfile,
          user: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            imageUrl: userData.imageUrl,
          },
        };

        setProfile(fullProfile);
        setFormData({
          companyName: employerProfile.companyName || "",
          industry: employerProfile.industry || "",
          location: employerProfile.location || "",
          website: employerProfile.website || "",
          description: employerProfile.description || "",
          logoUrl: employerProfile.logoUrl || "",
          founded: employerProfile.founded
            ? employerProfile.founded.toString()
            : "",
          companySize: employerProfile.companySize || "",
          phone: employerProfile.phone || "",
          countryCode: employerProfile.countryCode || "+233",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
        });
      } else {
        // No employer profile exists yet, show empty form
        setProfile(null);
        setFormData({
          companyName: "",
          industry: "",
          location: "",
          website: "",
          description: "",
          logoUrl: "",
          founded: "",
          companySize: "",
          phone: "",
          countryCode: "+233",
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          email: userData?.email || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (phone: string, countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      phone,
      countryCode,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const updateData = {
        companyName: formData.companyName,
        industry: formData.industry,
        location: formData.location,
        website: formData.website,
        description: formData.description,
        logoUrl: formData.logoUrl,
        founded: formData.founded ? parseInt(formData.founded) : undefined,
        companySize: formData.companySize,
        phone: formData.phone,
        countryCode: formData.countryCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      if (profile) {
        // Update existing profile
        await userAPI.updateEmployerProfile(updateData);
      } else {
        // Create new profile
        await userAPI.createEmployerProfile(updateData);
      }

      await fetchProfile(); // Refresh the profile
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        industry: profile.industry || "",
        location: profile.location || "",
        website: profile.website || "",
        description: profile.description || "",
        logoUrl: profile.logoUrl || "",
        founded: profile.founded ? profile.founded.toString() : "",
        companySize: profile.companySize || "",
        phone: profile.phone || "",
        countryCode: profile.countryCode || "+233",
        firstName: profile.user?.firstName || "",
        lastName: profile.user?.lastName || "",
        email: profile.user?.email || "",
      });
    }
    setIsEditing(false);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Company Profile
            </h1>
            <p className="text-muted-foreground">
              {profile
                ? "Manage your company information and profile"
                : "Create your company profile to get started"}
            </p>
          </div>

          {!isEditing && (
            <div className="mt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <MdEdit className="w-4 h-4" />
                {profile ? "Edit Profile" : "Create Profile"}
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6"
          >
            {success}
          </motion.div>
        )}

        <div className="space-y-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card text-card-foreground p-6 rounded-xl border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MdPerson className="w-5 h-5" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.user?.firstName || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.user?.lastName || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MdEmail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-muted-foreground py-3">
                  {profile?.user?.email || "Not provided"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MdPhone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <PhoneInput
                    phoneNumber={formData.phone}
                    countryCode={formData.countryCode}
                    onPhoneNumberChange={handlePhoneChange}
                    onCountryCodeChange={(code) =>
                      handlePhoneChange(formData.phone, code)
                    }
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.phone
                      ? `${profile.countryCode || ""} ${profile.phone}`
                      : "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Company Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card text-card-foreground p-6 rounded-xl border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MdBusiness className="w-5 h-5" />
              Company Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    required
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.companyName || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Industry
                </label>
                {isEditing ? (
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  >
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.industry || "Not specified"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MdLocationOn className="w-4 h-4" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Accra, Ghana"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.location || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MdLanguage className="w-4 h-4" />
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.company.com"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Founded Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="founded"
                    value={formData.founded}
                    onChange={handleInputChange}
                    placeholder="e.g., 2020"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.founded || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MdWork className="w-4 h-4" />
                  Company Size
                </label>
                {isEditing ? (
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  >
                    <option value="">Select Company Size</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-foreground py-3">
                    {profile?.companySize || "Not specified"}
                  </p>
                )}
              </div>
            </div>

            {/* Company Description */}
            <div className="mt-6">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <MdDescription className="w-4 h-4" />
                Company Description
              </label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Tell potential candidates about your company, culture, and mission..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
                />
              ) : (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed">
                    {profile?.description || "No company description provided."}
                  </p>
                </div>
              )}
            </div>

            {/* Company Logo URL */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Logo URL
              </label>
              {isEditing ? (
                <input
                  type="url"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              ) : (
                <div className="flex items-center gap-4">
                  {profile?.logoUrl && (
                    <img
                      src={profile.logoUrl}
                      alt="Company Logo"
                      className="w-16 h-16 object-contain rounded-lg border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <p className="text-foreground">
                    {profile?.logoUrl || "No logo provided"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Verification Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card text-card-foreground p-6 rounded-xl border border-border"
          >
            <h2 className="text-xl font-semibold mb-4">Verification Status</h2>
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  profile?.isVerified ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              <span className="text-foreground">
                {profile?.isVerified
                  ? "Verified Company"
                  : "Pending Verification"}
              </span>
            </div>
            {!profile?.isVerified && (
              <p className="text-muted-foreground text-sm mt-2">
                Complete your profile information to get verified and build
                trust with candidates.
              </p>
            )}
          </motion.div>
        </div>

        {/* Action Buttons - Bottom of Page */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex justify-end gap-4 sticky bottom-4 bg-background/90 backdrop-blur-sm p-4 rounded-lg border border-border"
          >
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-6 py-3 rounded-lg hover:bg-muted/80 transition-colors"
            >
              <MdCancel className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <MdSave className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
