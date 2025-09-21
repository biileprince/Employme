import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdCloudUpload,
  MdClose,
  MdError,
  MdInsertDriveFile,
  MdPictureAsPdf,
  MdDescription,
} from "react-icons/md";
import Button from "./Button";

export interface UploadedFile {
  id: string;
  file: File;
  isUploading: boolean;
  error?: string;
  url?: string; // Set after successful upload
}

interface FileUploadProps {
  onFilesUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUpload,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ],
  className = "",
  disabled = false,
  label = "Upload Files",
  description = "Upload documents, images, or other files",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();

    if (type.includes("pdf")) {
      return <MdPictureAsPdf className="w-8 h-8 text-red-500" />;
    }

    if (type.includes("word") || type.includes("document")) {
      return <MdDescription className="w-8 h-8 text-blue-500" />;
    }

    if (type.includes("image")) {
      return <MdInsertDriveFile className="w-8 h-8 text-green-500" />;
    }

    return <MdInsertDriveFile className="w-8 h-8 text-gray-500" />;
  };

  const getFileTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "application/msword": "DOC",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "DOCX",
      "text/plain": "TXT",
      "image/jpeg": "JPEG",
      "image/jpg": "JPG",
      "image/png": "PNG",
      "image/gif": "GIF",
      "image/webp": "WEBP",
    };

    return typeMap[type] || type.split("/")[1]?.toUpperCase() || "FILE";
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        const acceptedDisplayTypes = acceptedTypes
          .map((type) => getFileTypeDisplay(type))
          .join(", ");
        return `File type ${getFileTypeDisplay(
          file.type
        )} is not supported. Please upload: ${acceptedDisplayTypes}`;
      }

      if (file.size > maxFileSize) {
        return `File size ${(file.size / 1024 / 1024).toFixed(
          1
        )}MB exceeds limit of ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`;
      }

      return null;
    },
    [acceptedTypes, maxFileSize]
  );

  const processFiles = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);

      // Check total files limit
      if (uploadedFiles.length + fileArray.length > maxFiles) {
        setUploadError(`Cannot upload more than ${maxFiles} files`);
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate each file
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setUploadError(errors.join("\n"));
        return;
      }

      // Create file objects
      const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        isUploading: true,
      }));

      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
      setUploadError("");

      try {
        // Call the upload handler
        await onFilesUpload(validFiles);

        // Mark files as uploaded successfully
        setUploadedFiles((prev) =>
          prev.map((uploadedFile) =>
            newUploadedFiles.find((newFile) => newFile.id === uploadedFile.id)
              ? { ...uploadedFile, isUploading: false }
              : uploadedFile
          )
        );
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        // Mark files as failed
        setUploadedFiles((prev) =>
          prev.map((uploadedFile) =>
            newUploadedFiles.find((newFile) => newFile.id === uploadedFile.id)
              ? { ...uploadedFile, isUploading: false, error: "Upload failed" }
              : uploadedFile
          )
        );
        setUploadError("Failed to upload files. Please try again.");
      }
    },
    [uploadedFiles.length, maxFiles, onFilesUpload, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300
          ${
            isDragOver
              ? "border-primary bg-primary/5 scale-105"
              : "border-border hover:border-primary/50"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-muted/30"
          }
          ${
            uploadedFiles.length >= maxFiles
              ? "opacity-50 cursor-not-allowed"
              : ""
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        whileHover={
          !disabled && uploadedFiles.length < maxFiles ? { scale: 1.02 } : {}
        }
        whileTap={
          !disabled && uploadedFiles.length < maxFiles ? { scale: 0.98 } : {}
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploadedFiles.length >= maxFiles}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-3"
        >
          <motion.div
            animate={
              isDragOver ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }
            }
            className="p-3 rounded-full bg-primary/10"
          >
            <MdCloudUpload className="w-10 h-10 text-primary" />
          </motion.div>

          <div>
            <p className="font-medium text-foreground">
              {isDragOver ? "Drop files here" : label}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground">
              Drag & drop files or{" "}
              <span className="text-primary font-medium">click to browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports:{" "}
              {acceptedTypes.map((type) => getFileTypeDisplay(type)).join(", ")}{" "}
              • Max size: {(maxFileSize / 1024 / 1024).toFixed(0)}MB • Max
              files: {maxFiles}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-2">
              <MdError className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Upload Error</p>
                <pre className="text-sm text-red-600 whitespace-pre-wrap">
                  {uploadError}
                </pre>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadError("")}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            {uploadedFiles.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg group"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(uploadedFile.file)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{getFileTypeDisplay(uploadedFile.file.type)}</span>
                    <span>•</span>
                    <span>{(uploadedFile.file.size / 1024).toFixed(1)} KB</span>
                    {uploadedFile.isUploading && (
                      <>
                        <span>•</span>
                        <span className="text-primary">Uploading...</span>
                      </>
                    )}
                    {uploadedFile.error && (
                      <>
                        <span>•</span>
                        <span className="text-red-500">Failed</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Loading Indicator */}
                {uploadedFile.isUploading && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}

                {/* Error Indicator */}
                {uploadedFile.error && (
                  <MdError className="w-5 h-5 text-red-500" />
                )}

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadedFile.id);
                  }}
                  className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <MdClose className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {uploadedFiles.length} of {maxFiles} files uploaded
        </div>
      )}
    </div>
  );
};

export default FileUpload;
