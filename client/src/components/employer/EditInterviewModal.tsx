import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdClose,
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdVideoCall,
  MdDescription,
  MdSave,
} from "react-icons/md";
import Button from "../ui/Button";

interface Interview {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
}

interface EditInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  onSave: (updatedInterview: Partial<Interview>) => Promise<void>;
  candidateName: string;
  jobTitle: string;
}

export default function EditInterviewModal({
  isOpen,
  onClose,
  interview,
  onSave,
  candidateName,
  jobTitle,
}: EditInterviewModalProps) {
  const [formData, setFormData] = useState({
    scheduledDate: interview.scheduledDate,
    scheduledTime: interview.scheduledTime,
    description: interview.description || "",
    location: interview.location || "",
    isVirtual: interview.isVirtual,
    meetingLink: interview.meetingLink || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.scheduledDate || !formData.scheduledTime) {
        throw new Error("Date and time are required");
      }

      if (formData.isVirtual && !formData.meetingLink) {
        throw new Error("Meeting link is required for virtual interviews");
      }

      if (!formData.isVirtual && !formData.location) {
        throw new Error("Location is required for in-person interviews");
      }

      // Format data properly before sending
      const updateData = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        location: formData.isVirtual ? undefined : formData.location,
        meetingLink:
          formData.isVirtual && formData.meetingLink.trim()
            ? formData.meetingLink.trim()
            : undefined,
      };

      await onSave(updateData);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update interview"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Edit Interview
            </h2>
            <p className="text-sm text-muted-foreground">
              {candidateName} • {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MdCalendarToday className="w-4 h-4 inline mr-1" />
                Interview Date
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MdAccessTime className="w-4 h-4 inline mr-1" />
                Interview Time
              </label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Interview Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isVirtual"
                  value="true"
                  checked={formData.isVirtual}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isVirtual: true }))
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
                  value="false"
                  checked={!formData.isVirtual}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isVirtual: false }))
                  }
                  className="mr-2"
                />
                <MdLocationOn className="w-4 h-4 mr-1" />
                In-person
              </label>
            </div>
          </div>

          {/* Location/Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
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
                onChange={handleChange}
                placeholder="https://zoom.us/j/123456789"
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Office address or meeting room"
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <MdDescription className="w-4 h-4 inline mr-1" />
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Interview details, what to prepare, etc."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                <>
                  <MdSave className="w-4 h-4" />
                  Update Interview
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
