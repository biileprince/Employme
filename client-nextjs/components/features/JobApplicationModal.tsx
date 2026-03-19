"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Upload, FileText, Trash2, AlertCircle } from "lucide-react";
import { submitApplication } from "@/app/actions/application-submit";
import { Button } from "@/components/ui/button";

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
  onApplicationSuccess: () => void;
}

interface FileUpload {
  file: File;
  preview: string;
}

export default function JobApplicationModal({
  isOpen,
  onClose,
  job,
  onApplicationSuccess,
}: JobApplicationModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      const isValidFile =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "text/plain";

      if (!isValidFile) {
        alert("Please upload PDF, DOC, DOCX, or TXT files only.");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        return;
      }

      const fileUpload: FileUpload = {
        file,
        preview: URL.createObjectURL(file),
      };

      setUploadedFiles((prev) => [...prev, fileUpload]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    // Validate that at least one file is uploaded (resume required)
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one document before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData with job ID and files
      const formData = new FormData();
      formData.append("jobId", job.id);
      uploadedFiles.forEach((upload) => {
        formData.append("files", upload.file);
      });

      // Submit via server action (handles upload + application in one call)
      const result = await submitApplication(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to submit application");
      }

      alert("Application submitted successfully!");
      onApplicationSuccess();
      onClose();

      // Clean up
      setUploadedFiles([]);
    } catch (error) {
      console.error("Error submitting application:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit application. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card rounded-2xl border-2 border-border shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-border bg-muted/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-foreground truncate">
              Apply for Job
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 sm:p-6 overflow-y-auto bg-background"
          style={{ maxHeight: "calc(95vh - 200px)" }}
        >
          {/* Profile Completion Notice */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Profile Information Notice
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  When you apply for this job, the employer will be able to see
                  your complete profile information. Please ensure your profile
                  details are complete and up-to-date.
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Documents <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your resume, cover letter, portfolio, or other supporting
                documents (Max 5MB each)
              </p>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors bg-muted/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Click to upload or drag and drop
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 5MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">
                  Uploaded Files ({uploadedFiles.length}):
                </h4>
                {uploadedFiles.map((fileUpload, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border-2 border-border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {fileUpload.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500 dark:text-red-400 transition-colors shrink-0"
                      aria-label="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Job Summary */}
            <div className="bg-muted/30 border-2 border-border rounded-xl p-4">
              <h4 className="font-semibold text-foreground mb-3">
                Job Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium text-foreground">
                    {job.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium text-foreground">
                    {job.company}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-foreground">
                    {job.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-border bg-muted/20 p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || uploadedFiles.length === 0}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
