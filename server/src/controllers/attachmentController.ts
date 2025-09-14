import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body } from 'express-validator';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { handleValidationErrors } from '../middleware/validation.js';

const prisma = new PrismaClient();

// Upload attachment
export const uploadAttachment = [
  body('filename').notEmpty().withMessage('Filename is required'),
  body('url').notEmpty().withMessage('File URL is required'),
  body('fileType').isIn(['IMAGE', 'DOCUMENT', 'RESUME', 'COVER_LETTER', 'PORTFOLIO', 'CERTIFICATE', 'OTHER'])
    .withMessage('Invalid file type'),
  body('fileSize').optional().isNumeric().withMessage('File size must be a number'),
  body('mimeType').optional().isString().withMessage('MIME type must be a string'),
  body('jobId').optional().isString().withMessage('Job ID must be a string'),
  body('applicationId').optional().isString().withMessage('Application ID must be a string'),
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
      applicationId
    } = req.body;

    const uploadedBy = req.user?.id || 'mock-user-id';
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
        applicationId
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { attachment }
    });
  })
];

// Get attachments for a specific entity
export const getAttachments = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { entityType, entityId } = req.params;
  const { fileType } = req.query;

  if (!entityType || !entityId) {
    throw new AppError('Entity type and ID are required', 400);
  }

  const where: any = {};

  // Set the appropriate entity field based on type
  switch (entityType) {
    case 'job':
      where.jobId = entityId;
      break;
    case 'user':
      where.userId = entityId;
      break;
    case 'application':
      where.applicationId = entityId;
      break;
    default:
      throw new AppError('Invalid entity type', 400);
  }

  if (fileType) {
    where.fileType = fileType;
  }

  const attachments = await prisma.attachment.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    data: { attachments }
  });
});

// Get single attachment by ID
export const getAttachmentById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw new AppError('Attachment ID is required', 400);
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          id: true,
          title: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      application: {
        select: {
          id: true,
          job: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { attachment }
  });
});

// Delete attachment
export const deleteAttachment = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw new AppError('Attachment ID is required', 400);
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id }
  });

  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  // TODO: Delete file from cloud storage (Cloudinary, AWS S3, etc.)
  // if (attachment.publicId) {
  //   await cloudinary.uploader.destroy(attachment.publicId);
  // }

  await prisma.attachment.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Attachment deleted successfully'
  });
});

// Update attachment metadata
export const updateAttachment = [
  body('filename').optional().notEmpty().withMessage('Filename cannot be empty'),
  body('fileType').optional().isIn(['IMAGE', 'DOCUMENT', 'RESUME', 'COVER_LETTER', 'PORTFOLIO', 'CERTIFICATE', 'OTHER'])
    .withMessage('Invalid file type'),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new AppError('Attachment ID is required', 400);
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    const updatedAttachment = await prisma.attachment.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Attachment updated successfully',
      data: { attachment: updatedAttachment }
    });
  })
];

// Get user's attachments (profile images, resumes, etc.)
export const getUserAttachments = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { fileType } = req.query;
  const userId = req.user?.id || 'mock-user-id';

  const where: any = { userId };

  if (fileType) {
    where.fileType = fileType;
  }

  const attachments = await prisma.attachment.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    data: { attachments }
  });
});
