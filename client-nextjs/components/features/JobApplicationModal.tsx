"use client";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { X, Upload, FileText, Trash2, AlertCircle } from "lucide-react";
import { submitApplication } from "@/app/actions/application-submit";
import { Button } from "@/components/ui/button";
import { z } from "zod";

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

// File validation schema
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const fileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  type: z.string().refine((type) => ALLOWED_FILE_TYPES.includes(type), {
    message: "Only PDF, DOC, DOCX, and TXT files are allowed",
  }),
});

// Application form schema
const applicationFormSchema = z.object({
  coverLetter: z
    .string()
    .max(5000, "Cover letter must be less than 5000 characters")
    .optional(),
  files: z
    .array(
      z.instanceof(File).refine((file) => fileSchema.safeParse(file).success, {
        message: "Invalid file",
      })
    )
    .min(1, "Please upload at least one document (resume required)")
    .max(10, "Maximum 10 files allowed"),
});

type ApplicationFormInput = z.infer<typeof applicationFormSchema>;

export default function JobApplicationModal({
  isOpen,
  onClose,
  job,
  onApplicationSuccess,
}: JobApplicationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form setup
  const form = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      coverLetter: "",
      files: [],
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = form;

  const watchedFiles = watch("files") || [];

  const validateAndAddFiles = (fileList: FileList) => {
    const currentFiles = watchedFiles;
    const newFiles: File[] = [];

    Array.from(fileList).forEach((file) => {
      // Check if file already exists
      if (currentFiles.some((f) => f.name === file.name && f.size === file.size)) {
        setError(`File "${file.name}" is already added`);
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setError(
          `File "${file.name}" has invalid type. Only PDF, DOC, DOCX, and TXT files are allowed`
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB`);
        return;
      }

      // Validate filename for security
      const filename = file.name.toLowerCase();
      if (
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\") ||
        filename.includes("\0") ||
        filename.length > 255
      ) {
        setError(`File "${file.name}" has invalid filename`);
        return;
      }

      newFiles.push(file);
    });

    if (newFiles.length > 0) {
      const allFiles = [...currentFiles, ...newFiles];
      if (allFiles.length > 10) {
        setError("Maximum 10 files allowed");
        return;
      }
      setValue("files", allFiles, { shouldValidate: true });
      setError(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    validateAndAddFiles(files);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const currentFiles = watchedFiles;
    const newFiles = currentFiles.filter((_, i) => i !== index);
    setValue("files", newFiles, { shouldValidate: true });
  };

  const onSubmit = async (data: ApplicationFormInput) => {
    setError(null);

    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("jobId", job.id);
      formData.append("coverLetter", data.coverLetter || "");

      // Add files
      data.files.forEach((file) => {
        formData.append("files", file);
      });

      const result = await submitApplication(formData);

      if (result.success) {
        onApplicationSuccess();
        onClose();
        reset();
      } else {
        if (result.fieldErrors) {
          // Set field-specific errors
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            if (field === "files") {
              setError(message);
            } else {
              form.setError(field as keyof ApplicationFormInput, {
                type: "server",
                message,
              });
            }
          });
        } else {
          setError(result.error || "Failed to submit application");
        }
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Failed to submit application. Please try again.");
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
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
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
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

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Application Error
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cover Letter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Cover Letter <span className="text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              {...register("coverLetter")}
              rows={4}
              placeholder="Tell the employer why you're interested in this position..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none ${
                errors.coverLetter ? "border-red-500" : "border-border"
              }`}
            />
            {errors.coverLetter && (
              <p className="text-red-500 text-sm mt-1">
                {errors.coverLetter.message}
              </p>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Documents <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your resume, cover letter, portfolio, or other supporting
                documents (Max 10MB each)
              </p>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors bg-muted/20 ${
                  errors.files ? "border-red-500" : "border-border"
                }`}
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
                  Maximum file size: 10MB per file, Maximum 10 files
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
              {errors.files && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.files.message}
                </p>
              )}
            </div>

            {/* Uploaded Files List */}
            {watchedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">
                  Uploaded Files ({watchedFiles.length}):
                </h4>
                {watchedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 border-2 border-border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
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
              <h4 className="font-semibold text-foreground mb-3">Job Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium text-foreground">{job.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium text-foreground">{job.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-foreground">{job.location}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-border bg-muted/20 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || watchedFiles.length === 0}
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