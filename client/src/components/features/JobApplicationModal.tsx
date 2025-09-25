import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { HiX, HiUpload, HiDocumentText, HiUser } from "react-icons/hi";
import { MdAttachFile, MdDelete } from "react-icons/md";
import Button from "../ui/Button";
import { applicationsAPI, attachmentAPI } from "../../services/api";

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
  type: "resume" | "cover_letter";
}

const JobApplicationModal = ({
  isOpen,
  onClose,
  job,
  onApplicationSuccess,
}: JobApplicationModalProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

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
        type: file.name.toLowerCase().includes("cover")
          ? "cover_letter"
          : "resume",
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
    setIsSubmitting(true);

    try {
      // First upload files if any
      if (uploadedFiles.length > 0) {
        const files = uploadedFiles.map((upload) => upload.file);
        const uploadResponse = await attachmentAPI.upload(
          files,
          "APPLICATION",
          undefined
        );

        if (!uploadResponse.success) {
          throw new Error("Failed to upload files");
        }
      }

      // Submit application
      await applicationsAPI.apply(job.id);

      alert("Application submitted successfully!");
      onApplicationSuccess();
      onClose();

      // Clean up
      setUploadedFiles([]);
      setCurrentStep(1);
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

  const getStepIcon = (step: number) => {
    if (step === 1) return <HiDocumentText className="w-5 h-5" />;
    if (step === 2) return <HiUpload className="w-5 h-5" />;
    return <HiUser className="w-5 h-5" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Apply for Job
            </h2>
            <p className="text-muted-foreground mt-1">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {getStepIcon(step)}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step === 1 && "Upload Resume"}
                    {step === 2 && "Upload Cover Letter"}
                    {step === 3 && "Review & Submit"}
                  </p>
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-px mx-4 ${
                      currentStep > step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Resume Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <HiUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload Your Resume
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX (Max 5MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Uploaded Resume Files */}
              {uploadedFiles.filter((f) => f.type === "resume").length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Uploaded Resume:
                  </h4>
                  {uploadedFiles
                    .filter((f) => f.type === "resume")
                    .map((fileUpload, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
                      >
                        <div className="flex items-center">
                          <MdAttachFile className="w-5 h-5 text-primary mr-3" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {fileUpload.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fileUpload.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removeFile(uploadedFiles.indexOf(fileUpload))
                          }
                          className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Cover Letter Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => coverLetterInputRef.current?.click()}
              >
                <HiDocumentText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload Your Cover Letter
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your cover letter here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                </p>
                <input
                  ref={coverLetterInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const fileUpload: FileUpload = {
                        file,
                        preview: URL.createObjectURL(file),
                        type: "cover_letter",
                      };
                      setUploadedFiles((prev) => [...prev, fileUpload]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Uploaded Cover Letter Files */}
              {uploadedFiles.filter((f) => f.type === "cover_letter").length >
                0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Uploaded Cover Letter:
                  </h4>
                  {uploadedFiles
                    .filter((f) => f.type === "cover_letter")
                    .map((fileUpload, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
                      >
                        <div className="flex items-center">
                          <MdAttachFile className="w-5 h-5 text-primary mr-3" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {fileUpload.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fileUpload.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removeFile(uploadedFiles.indexOf(fileUpload))
                          }
                          className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Application Summary
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground">Position:</h4>
                    <p className="text-muted-foreground">{job.title}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground">Company:</h4>
                    <p className="text-muted-foreground">{job.company}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground">Location:</h4>
                    <p className="text-muted-foreground">{job.location}</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground">
                        Attachments:
                      </h4>
                      <div className="space-y-2 mt-2">
                        {uploadedFiles.map((fileUpload, index) => (
                          <div key={index} className="flex items-center">
                            <MdAttachFile className="w-4 h-4 text-primary mr-2" />
                            <span className="text-sm text-muted-foreground">
                              {fileUpload.file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 &&
                    uploadedFiles.filter((f) => f.type === "resume").length ===
                      0) ||
                  (currentStep === 2 &&
                    uploadedFiles.filter((f) => f.type === "cover_letter")
                      .length === 0)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || uploadedFiles.length === 0}
                isLoading={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JobApplicationModal;
