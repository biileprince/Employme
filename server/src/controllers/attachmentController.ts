import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { body } from "express-validator";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { handleValidationErrors } from "../middleware/validation.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

// Configure Cloudinary
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage (development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Configure multer for memory storage (production with Cloudinary)
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: process.env.NODE_ENV === "production" ? memoryStorage : localStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Invalid file type. Only images and documents are allowed.",
          400
        )
      );
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (
  buffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith("image/") ? "image" : "raw";

    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          folder: "employme/attachments",
          public_id: `${Date.now()}-${path.parse(originalname).name}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(buffer);
  });
};

// Helper function to determine file type
const getFileType = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype === "application/pdf") return "DOCUMENT";
  if (mimetype.includes("word") || mimetype === "text/plain") return "DOCUMENT";
  return "OTHER";
};

// Helper function to determine file type from MIME type
const getFileTypeFromMime = (mimetype: string) => {
  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype === "application/pdf") return "DOCUMENT";
  if (mimetype.includes("word") || mimetype === "text/plain") return "DOCUMENT";
  return "OTHER";
};

// Upload files endpoint
export const uploadFiles = [
  upload.array("files", 10), // Allow up to 10 files
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    const { entityType, entityId } = req.body;

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    const uploadedBy = req.user?.id || "mock-user-id";
    const attachments = [];

    for (const file of files) {
      let fileUrl = "";
      let publicId = "";

      if (process.env.NODE_ENV === "production") {
        // Upload to Cloudinary in production
        try {
          const result = await uploadToCloudinary(
            file.buffer,
            file.mimetype,
            `employme/${entityType || "misc"}`
          );
          fileUrl = result.secure_url;
          publicId = result.public_id;
        } catch (error) {
          console.error("Cloudinary upload failed:", error);
          throw new AppError("File upload failed", 500);
        }
      } else {
        // Use local file in development
        fileUrl = `/uploads/${file.filename}`;
        publicId = file.filename;
      }

      const fileType = getFileTypeFromMime(file.mimetype);

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          filename: file.originalname,
          url: fileUrl,
          publicId,
          fileType,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy,
          userId: entityType === "user" ? entityId || uploadedBy : null,
          jobId: entityType === "job" ? entityId : null,
          applicationId: entityType === "application" ? entityId : null,
        },
      });

      attachments.push(attachment);
    }

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      data: { attachments },
    });
  }),
];

// Upload attachment (for direct data)
export const uploadAttachment = [
  body("filename").notEmpty().withMessage("Filename is required"),
  body("url").notEmpty().withMessage("File URL is required"),
  body("fileType")
    .isIn([
      "IMAGE",
      "DOCUMENT",
      "RESUME",
      "COVER_LETTER",
      "PORTFOLIO",
      "CERTIFICATE",
      "OTHER",
    ])
    .withMessage("Invalid file type"),
  body("fileSize")
    .optional()
    .isNumeric()
    .withMessage("File size must be a number"),
  body("mimeType")
    .optional()
    .isString()
    .withMessage("MIME type must be a string"),
  body("jobId").optional().isString().withMessage("Job ID must be a string"),
  body("applicationId")
    .optional()
    .isString()
    .withMessage("Application ID must be a string"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const {
      filename,
      url,
      publicId,
      fileType,
      fileSize,
      mimeType,
      jobId,
      applicationId,
    } = req.body;

    const uploadedBy = req.user?.id || "mock-user-id";
    const userId = jobId || applicationId ? null : uploadedBy; // Only set userId for profile attachments

    const attachment = await prisma.attachment.create({
      data: {
        filename,
        url,
        publicId,
        fileType,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType,
        uploadedBy,
        userId,
        jobId,
        applicationId,
      },
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: { attachment },
    });
  }),
];

// Get attachments for a specific entity
export const getAttachments = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { entityType, entityId } = req.params;
    const { fileType } = req.query;

    if (!entityType || !entityId) {
      throw new AppError("Entity type and ID are required", 400);
    }

    const where: any = {};

    // Set the appropriate entity field based on type
    switch (entityType.toLowerCase()) {
      case "job":
        where.jobId = entityId;
        break;
      case "user":
        where.userId = entityId;
        break;
      case "application":
        where.applicationId = entityId;
        break;
      default:
        throw new AppError("Invalid entity type", 400);
    }

    if (fileType) {
      where.fileType = fileType;
    }

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: { attachments },
    });
  }
);

// Get single attachment by ID
export const getAttachmentById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Attachment ID is required", 400);
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        application: {
          select: {
            id: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { attachment },
    });
  }
);

// Delete attachment
export const deleteAttachment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Attachment ID is required", 400);
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    // TODO: Delete file from cloud storage (Cloudinary, AWS S3, etc.)
    // if (attachment.publicId) {
    //   await cloudinary.uploader.destroy(attachment.publicId);
    // }

    await prisma.attachment.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  }
);

// Update attachment metadata
export const updateAttachment = [
  body("filename")
    .optional()
    .notEmpty()
    .withMessage("Filename cannot be empty"),
  body("fileType")
    .optional()
    .isIn([
      "IMAGE",
      "DOCUMENT",
      "RESUME",
      "COVER_LETTER",
      "PORTFOLIO",
      "CERTIFICATE",
      "OTHER",
    ])
    .withMessage("Invalid file type"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new AppError("Attachment ID is required", 400);
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    const updatedAttachment = await prisma.attachment.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Attachment updated successfully",
      data: { attachment: updatedAttachment },
    });
  }),
];

// Get user's attachments (profile images, resumes, etc.)
export const getUserAttachments = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { fileType } = req.query;
    const userId = req.user?.id || "mock-user-id";

    const where: any = { userId };

    if (fileType) {
      where.fileType = fileType;
    }

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: { attachments },
    });
  }
);
