import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdCloudUpload, MdClose, MdError } from "react-icons/md";
import Button from "./Button";
import { formatImageUrl } from "../../services/api";

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  isUploading: boolean;
  error?: string;
  url?: string; // Set after successful upload
}

interface ImageUploadProps {
  onFilesUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  existingImages?: string[]; // URLs of existing images
  label?: string;
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onFilesUpload,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  className = "",
  disabled = false,
  existingImages = [],
  label = "Upload Images",
  accept = "image/*",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `File type ${
          file.type
        } is not supported. Please upload: ${acceptedTypes
          .map((type) => type.split("/")[1])
          .join(", ")}`;
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

      // Create preview objects
      const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
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
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadedFiles]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
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
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploadedFiles.length >= maxFiles}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={
              isDragOver ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }
            }
            className="p-4 rounded-full bg-primary/10"
          >
            <MdCloudUpload className="w-12 h-12 text-primary" />
          </motion.div>

          <div>
            <p className="text-lg font-medium text-foreground">
              {isDragOver ? "Drop files here" : label}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop images or{" "}
              <span className="text-primary font-medium">click to browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports:{" "}
              {acceptedTypes
                .map((type) => type.split("/")[1].toUpperCase())
                .join(", ")}{" "}
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

      {/* Existing Images - Only show if no new files are being uploaded */}
      {existingImages.length > 0 && uploadedFiles.length === 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2">
            {maxFiles === 1 ? "Current Image:" : "Current Images:"}
          </p>
          <div
            className={`grid gap-4 ${
              maxFiles === 1
                ? "grid-cols-1 max-w-xs"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            }`}
          >
            {existingImages.map((imageUrl, index) => (
              <div
                key={index}
                className={`aspect-square rounded-lg overflow-hidden bg-muted ${
                  maxFiles === 1 ? "w-32 h-32" : ""
                }`}
              >
                <img
                  src={formatImageUrl(imageUrl)}
                  alt={`${
                    maxFiles === 1
                      ? "Current image"
                      : `Existing image ${index + 1}`
                  }`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.warn("Failed to load image:", imageUrl);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Previews */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {uploadedFiles.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Loading Overlay */}
                  {uploadedFile.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Error Overlay */}
                  {uploadedFile.error && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <MdError className="w-8 h-8 text-red-500" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  >
                    <MdClose className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB
                </p>
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

export default ImageUpload;
