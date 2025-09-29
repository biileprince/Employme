import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdClose,
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdVideoCall,
  MdDescription,
} from "react-icons/md";
import Button from "../ui/Button";
import { applicationsAPI } from "../../services/api";

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  onScheduled: () => void;
}

export default function InterviewScheduleModal({
  isOpen,
  onClose,
  applicationId,
  applicantName,
  jobTitle,
  onScheduled,
}: InterviewScheduleModalProps) {
  const [formData, setFormData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    description: "",
    location: "",
    isVirtual: true,
    meetingLink: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Helper function to validate meeting URLs
  const isValidMeetingUrl = (url: string) => {
    const meetingDomains = [
      "meet.google.com",
      "zoom.us",
      "teams.microsoft.com",
      "webex.com",
      "gotomeeting.com",
    ];
    try {
      const urlObj = new URL(url);
      return meetingDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Client-side validation
    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError("Date and time are required");
      setIsSubmitting(false);
      return;
    }

    if (formData.isVirtual && !formData.meetingLink) {
      setError("Meeting link is required for virtual interviews");
      setIsSubmitting(false);
      return;
    }

    if (!formData.isVirtual && !formData.location) {
      setError("Location is required for in-person interviews");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare data with proper formatting
      const interviewData = {
        scheduledDate: new Date(formData.scheduledDate).toISOString(), // Convert to ISO8601 format
        scheduledTime: formData.scheduledTime, // Already in HH:MM format from time input
        description: formData.description.trim() || undefined,
        location: formData.isVirtual ? undefined : formData.location.trim(),
        isVirtual: formData.isVirtual,
        meetingLink:
          formData.isVirtual && formData.meetingLink.trim()
            ? formData.meetingLink.trim()
            : undefined,
      };

      console.log("Sending interview data:", interviewData);
      await applicationsAPI.scheduleInterview(applicationId, interviewData);
      onScheduled();
      onClose();
      // Reset form
      setFormData({
        scheduledDate: "",
        scheduledTime: "",
        description: "",
        location: "",
        isVirtual: true,
        meetingLink: "",
      });
    } catch (err) {
      console.error("Interview scheduling error:", err);

      // Try to extract specific validation errors
      if (err instanceof Error) {
        console.log("Full error object:", err);

        // Handle specific validation error messages
        if (err.message === "Validation errors") {
          // Check if it's a meeting link validation error
          if (
            formData.isVirtual &&
            formData.meetingLink &&
            !isValidMeetingUrl(formData.meetingLink)
          ) {
            setError(
              "Please enter a valid meeting link (e.g., https://meet.google.com/xyz or https://zoom.us/j/123456789)"
            );
          } else {
            setError("Please check all required fields are filled correctly");
          }
        } else {
          setError(
            err.message || "Failed to schedule interview. Please try again."
          );
        }
      } else {
        setError("Failed to schedule interview. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-x-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md min-w-[320px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Schedule Interview
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-x-auto">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Candidate:</span> {applicantName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Position:</span> {jobTitle}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MdCalendarToday className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MdAccessTime className="w-4 h-4 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interview Type
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isVirtual"
                  checked={formData.isVirtual}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isVirtual: true,
                      location: "", // Clear location when switching to virtual
                    }))
                  }
                  className="mr-2"
                />
                <MdVideoCall className="w-4 h-4 mr-1" />
                Virtual
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isVirtual"
                  checked={!formData.isVirtual}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isVirtual: false,
                      meetingLink: "", // Clear meeting link when switching to in-person
                    }))
                  }
                  className="mr-2"
                />
                <MdLocationOn className="w-4 h-4 mr-1" />
                In-Person
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.isVirtual ? (
                <>
                  <MdVideoCall className="w-4 h-4 inline mr-1" />
                  Meeting Link
                </>
              ) : (
                <>
                  <MdLocationOn className="w-4 h-4 inline mr-1" />
                  Location
                </>
              )}
            </label>
            {formData.isVirtual ? (
              <input
                type="url"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleInputChange}
                placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456789"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Office address or meeting room"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MdDescription className="w-4 h-4 inline mr-1" />
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional details about the interview..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Schedule Interview
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
