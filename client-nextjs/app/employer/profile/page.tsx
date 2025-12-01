"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
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
import { apiClient, formatImageUrl, attachmentAPI } from "@/lib/api";
import PhoneInput from "@/components/ui/PhoneInput";
import ImageUpload from "@/components/ui/ImageUpload";
import { INDUSTRIES } from "@/lib/constants";
import { useRouteGuard } from "@/hooks/useRouteGuard";

interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  title?: string;
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

export default function EmployerProfilePage() {
  const { user } = useRouteGuard({
    requireAuth: true,
    requireRole: "EMPLOYER",
  });

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    title: "",
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
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        user: {
          firstName: string;
          lastName: string;
          email: string;
          imageUrl?: string;
          role: string;
          profile?: EmployerProfile;
        };
      }>("/users/me");

      const userData = response.data?.user;
      const employerProfile = userData?.profile;

      if (employerProfile && userData?.role === "EMPLOYER") {
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
          title: employerProfile.title || "",
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
        setProfile(null);
        setFormData({
          companyName: "",
          title: "",
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

  const handleLogoUpload = async (files: File[]) => {
    try {
      const response = await attachmentAPI.upload(files, "USER");
      if (response.success && response.data) {
        const data = response.data as unknown as {
          attachments: Array<{ url: string }>;
        };
        if (data.attachments && data.attachments.length > 0) {
          const uploadedAttachment = data.attachments[0];
          setFormData((prev) => ({
            ...prev,
            logoUrl: uploadedAttachment.url,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
      setError("Failed to upload logo");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const updateData = {
        companyName: formData.companyName,
        title: formData.title,
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

      await apiClient.put("/users/profile/employer", updateData);

      await fetchProfile();
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

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
        title: profile.title || "",
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
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Company Profile
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {profile
                ? "Manage your company information and profile"
                : "Create your company profile to get started"}
            </p>
          </div>

          {/* Company Logo Display */}
          {profile?.logoUrl && !isEditing && (
            <div className="shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 relative rounded-lg border border-border bg-background overflow-hidden">
                <Image
                  src={formatImageUrl(profile.logoUrl)}
                  alt="Company Logo"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
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

      <div className="space-y-6 sm:space-y-8">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl border border-border"
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <MdPerson className="w-5 h-5" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                  onPhoneNumberChange={(phone) =>
                    handlePhoneChange(phone, formData.countryCode)
                  }
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
          className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl border border-border"
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <MdBusiness className="w-5 h-5" />
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                Your Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="CEO, Founder, HR Manager..."
                />
              ) : (
                <p className="text-foreground py-3">
                  {profile?.title || "Not provided"}
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
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
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
                      className="text-primary hover:text-primary/80 transition-colors hover:underline"
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
                <p className="text-foreground leading-relaxed text-sm">
                  {profile?.description || "No company description provided."}
                </p>
              </div>
            )}
          </div>

          {/* Company Logo Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Company Logo
            </label>
            {isEditing ? (
              <ImageUpload
                onFilesUpload={handleLogoUpload}
                accept="image/*"
                maxFiles={1}
                label="Upload Company Logo"
                existingImages={
                  formData.logoUrl ? [formatImageUrl(formData.logoUrl)] : []
                }
              />
            ) : (
              <div className="flex items-center gap-4">
                {profile?.logoUrl ? (
                  <div className="w-24 h-24 relative rounded-lg border border-border bg-background overflow-hidden">
                    <Image
                      src={formatImageUrl(profile.logoUrl)}
                      alt="Company Logo"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No logo uploaded</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl border border-border"
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Verification Status
          </h2>
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
              Complete your profile information to get verified and build trust
              with candidates.
            </p>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
      >
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <MdEdit className="w-4 h-4" />
            {profile ? "Edit Profile" : "Create Profile"}
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-muted text-muted-foreground px-6 py-3 rounded-lg hover:bg-muted/80 transition-colors"
            >
              <MdCancel className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <MdSave className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
