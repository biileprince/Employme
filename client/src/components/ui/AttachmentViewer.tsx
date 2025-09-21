import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdImage,
  MdPictureAsPdf,
  MdDescription,
  MdInsertDriveFile,
  MdDownload,
  MdFullscreen,
  MdClose,
  MdZoomIn,
  MdZoomOut,
} from "react-icons/md";
import { formatImageUrl } from "../../services/api";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  fileType: string; // Changed from mimeType to fileType to match API
  fileSize: number;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
  className?: string;
  maxPreviewImages?: number;
  showDownloadButton?: boolean;
  showFullscreenButton?: boolean;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  className = "",
  maxPreviewImages = 4,
  showDownloadButton = true,
  showFullscreenButton = true,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <MdImage className="w-6 h-6 text-blue-500" />;
    }
    if (fileType === "application/pdf") {
      return <MdPictureAsPdf className="w-6 h-6 text-red-500" />;
    }
    if (fileType.includes("word") || fileType.includes("document")) {
      return <MdDescription className="w-6 h-6 text-blue-600" />;
    }
    return <MdInsertDriveFile className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeName = (fileType: string): string => {
    const typeMap: { [key: string]: string } = {
      IMAGE: "Image",
      DOCUMENT: "Document",
      RESUME: "Resume",
      COVER_LETTER: "Cover Letter",
      PORTFOLIO: "Portfolio",
      CERTIFICATE: "Certificate",
      OTHER: "File",
    };
    return typeMap[fileType] || "File";
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(formatImageUrl(attachment.url));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    if (showFullscreenButton) {
      setSelectedImage(imageUrl);
      setImageZoom(1);
    }
  };

  const closeFullscreen = () => {
    setSelectedImage(null);
    setImageZoom(1);
  };

  const zoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const images = attachments.filter((att) => att.fileType.startsWith("image/"));
  const documents = attachments.filter(
    (att) => !att.fileType.startsWith("image/")
  );
  const previewImages = images.slice(0, maxPreviewImages);
  const remainingImagesCount = Math.max(0, images.length - maxPreviewImages);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Images Section */}
      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {previewImages.map((attachment, index) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div
                  className="aspect-square rounded-lg overflow-hidden bg-muted border border-border cursor-pointer transition-transform hover:scale-105"
                  onClick={() =>
                    handleImageClick(formatImageUrl(attachment.url))
                  }
                >
                  <img
                    src={formatImageUrl(attachment.url)}
                    alt={attachment.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex space-x-2">
                      {showFullscreenButton && (
                        <button
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(formatImageUrl(attachment.url));
                          }}
                        >
                          <MdFullscreen className="w-4 h-4" />
                        </button>
                      )}
                      {showDownloadButton && (
                        <button
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(attachment);
                          }}
                        >
                          <MdDownload className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {attachment.filename}
                </p>
              </motion.div>
            ))}

            {/* Show remaining count */}
            {remainingImagesCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => {
                  // Could show a modal with all images
                  console.log("Show all images modal");
                }}
              >
                <div className="text-center">
                  <MdImage className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-medium text-foreground">
                    +{remainingImagesCount}
                  </p>
                  <p className="text-xs text-muted-foreground">more</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Documents
          </h3>
          <div className="space-y-2">
            {documents.map((attachment, index) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.fileType)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {attachment.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{getFileTypeName(attachment.fileType)}</span>
                    <span>•</span>
                    <span>{formatFileSize(attachment.fileSize)}</span>
                  </div>
                </div>

                {showDownloadButton && (
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MdDownload className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={closeFullscreen}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-screen max-h-screen"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Controls */}
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                <button
                  onClick={zoomOut}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <MdZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={zoomIn}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <MdZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={closeFullscreen}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              <motion.img
                src={selectedImage}
                alt="Fullscreen view"
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${imageZoom})` }}
                animate={{ scale: imageZoom }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttachmentViewer;
