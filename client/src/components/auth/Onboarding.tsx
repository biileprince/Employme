import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiUpload, FiUser, FiBriefcase, FiCamera } from "react-icons/fi";
import { userAPI, attachmentAPI } from "../../services/api";

interface OnboardingProps {
  onComplete: () => void;
}

type UserRole = "JOB_SEEKER" | "EMPLOYER";

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Job Seeker fields
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [education] = useState("");

  // Employer fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companySize] = useState("");

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

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsArray = e.target.value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    setSkills(skillsArray);
  };

  const handleSubmit = async () => {
    if (!role || !firstName || !lastName) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const profileData: Record<string, unknown> = {
        role,
        firstName,
        lastName,
        imageUrl,
      };

      if (role === "JOB_SEEKER") {
        profileData.location = location;
        profileData.bio = bio;
        profileData.skills = skills;
        profileData.experience = experience;
        profileData.education = education;
      } else {
        profileData.companyName = companyName;
        profileData.industry = industry;
        profileData.website = website;
        profileData.companyDescription = companyDescription;
        profileData.companySize = companySize;
      }

      const response = await userAPI.completeOnboarding(profileData);

      if (response.success) {
        onComplete();
      } else {
        setError("Onboarding failed. Please try again.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "An error occurred during onboarding"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Choose Your Role
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
            Select how you'll be using our platform
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole("JOB_SEEKER")}
              className={`p-8 rounded-xl border-2 transition-all ${
                role === "JOB_SEEKER"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
              }`}
            >
              <FiUser className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Job Seeker
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Looking for your next career opportunity
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole("EMPLOYER")}
              className={`p-8 rounded-xl border-2 transition-all ${
                role === "EMPLOYER"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
              }`}
            >
              <FiBriefcase className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Employer
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Hiring talented professionals for your company
              </p>
            </motion.button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setStep(2)}
              disabled={!role}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Complete Your Profile
        </h2>

        <div className="space-y-6">
          {/* Image Upload */}
          <div className="text-center">
            <div className="relative inline-block">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-300 dark:border-gray-600">
                  <FiCamera className="text-2xl text-gray-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <FiUpload className="text-sm" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Upload profile picture (optional)
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Role-specific fields */}
          {role === "JOB_SEEKER" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <input
                  type="text"
                  onChange={handleSkillsChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="JavaScript, React, Node.js (comma separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select experience level</option>
                  <option value="ENTRY_LEVEL">Entry Level</option>
                  <option value="MID_LEVEL">Mid Level</option>
                  <option value="SENIOR_LEVEL">Senior Level</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>
            </>
          )}

          {role === "EMPLOYER" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Technology, Healthcare, Finance..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://www.company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Description
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="What does your company do?"
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Setting up..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
