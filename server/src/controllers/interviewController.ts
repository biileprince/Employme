import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { body } from "express-validator";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { sendInterviewUpdateNotification } from "../services/emailService.js";

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
      include: {
        application: {
          include: {
            job: {
              include: {
                employer: {
                  select: {
                    companyName: true,
                    user: {
                      select: {
                        email: true,
                      },
                    },
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

    // Send email notification to job seeker about the interview update
    try {
      if (existingInterview.application.jobSeeker.user) {
        const jobSeekerName =
          `${existingInterview.application.jobSeeker.user.firstName || ""} ${
            existingInterview.application.jobSeeker.user.lastName || ""
          }`.trim() || "Job Seeker";

        // Use updated data or fall back to existing data
        const finalScheduledDate =
          updateData.scheduledDate ||
          existingInterview.scheduledDate.toISOString().split("T")[0];
        const finalScheduledTime =
          updateData.scheduledTime || existingInterview.scheduledTime;
        const finalDescription =
          updateData.description ||
          existingInterview.description ||
          `Interview for ${existingInterview.application.job.title}`;
        const finalLocation =
          updateData.location ||
          existingInterview.location ||
          (existingInterview.isVirtual ? "Virtual Meeting" : "");
        const finalMeetingLink =
          updateData.meetingLink || existingInterview.meetingLink;

        await sendInterviewUpdateNotification(
          existingInterview.application.jobSeeker.user.email,
          jobSeekerName,
          existingInterview.application.job.title,
          existingInterview.application.job.employer.companyName,
          existingInterview.application.job.employer.user.email,
          finalScheduledDate,
          finalScheduledTime,
          finalDescription,
          finalLocation,
          existingInterview.isVirtual,
          finalMeetingLink
        );
      }
    } catch (error) {
      console.error("Failed to send interview update notification:", error);
      // Don't fail the interview update if email sending fails
    }

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
