import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { body } from "express-validator";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { handleValidationErrors } from "../middleware/validation.js";

const prisma = new PrismaClient();

// Get interview details
export const getInterview = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id: interviewId } = req.params;

    if (!interviewId) {
      throw new AppError("Interview ID is required", 400);
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        OR: [
          // Employer can see interviews for their jobs
          { application: { job: { employer: { userId: req.user!.id } } } },
          // Job seeker can see their own interviews
          { application: { jobSeekerId: req.user!.profile?.id } },
        ],
      },
      include: {
        application: {
          include: {
            job: {
              select: {
                title: true,
                employer: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
            jobSeeker: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new AppError("Interview not found or unauthorized", 404);
    }

    res.status(200).json({
      success: true,
      data: { interview },
    });
  }
);

// Update interview details
export const updateInterview = [
  body("scheduledDate")
    .optional()
    .isISO8601()
    .withMessage("Valid date is required"),
  body("scheduledTime").optional().notEmpty().withMessage("Time is required"),
  body("description").optional().trim(),
  body("location").optional().trim(),
  body("meetingLink")
    .optional()
    .isURL()
    .withMessage("Valid meeting link required"),
  body("status")
    .optional()
    .isIn(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"]),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id: interviewId } = req.params;
    const updateData = req.body;

    if (!interviewId) {
      throw new AppError("Interview ID is required", 400);
    }

    // Verify the interview exists and belongs to employer's job
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          job: {
            employer: {
              userId: req.user!.id,
            },
          },
        },
      },
    });

    if (!existingInterview) {
      throw new AppError("Interview not found or unauthorized", 404);
    }

    // Update the interview
    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId! }, // We already validated it's not undefined above
      data: {
        ...(updateData.scheduledDate && {
          scheduledDate: new Date(updateData.scheduledDate),
        }),
        ...(updateData.scheduledTime && {
          scheduledTime: updateData.scheduledTime,
        }),
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.location && { location: updateData.location }),
        ...(updateData.meetingLink && { meetingLink: updateData.meetingLink }),
        ...(updateData.status && { status: updateData.status }),
      },
    });

    res.status(200).json({
      success: true,
      data: { interview: updatedInterview },
      message: "Interview updated successfully",
    });
  }),
];

// Delete interview
export const deleteInterview = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id: interviewId } = req.params;

    if (!interviewId) {
      throw new AppError("Interview ID is required", 400);
    }

    // Verify the interview exists and belongs to employer's job
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          job: {
            employer: {
              userId: req.user!.id,
            },
          },
        },
      },
    });

    if (!interview) {
      throw new AppError("Interview not found or unauthorized", 404);
    }

    await prisma.interview.delete({
      where: { id: interviewId! }, // We already validated it's not undefined above
    });

    res.status(200).json({
      success: true,
      message: "Interview deleted successfully",
    });
  }
);
