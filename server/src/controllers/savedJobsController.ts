import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { body } from "express-validator";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { handleValidationErrors } from "../middleware/validation.js";

const prisma = new PrismaClient();

// Save a job
export const saveJob = [
  body("jobId").notEmpty().withMessage("Job ID is required"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.body;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        isActive: true,
        employer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    if (!job || !job.isActive) {
      throw new AppError("Job not found or no longer active", 404);
    }

    // Check if job is already saved
    const existingSavedJob = await prisma.savedJob.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId,
        },
      },
    });

    if (existingSavedJob) {
      throw new AppError("Job is already saved", 400);
    }

    // Save the job
    const savedJob = await prisma.savedJob.create({
      data: {
        jobId,
        jobSeekerId,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            jobType: true,
            employer: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      data: { savedJob },
    });
  }),
];

// Remove a saved job
export const removeSavedJob = [
  body("jobId").notEmpty().withMessage("Job ID is required"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.body;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    // Check if job is saved
    const savedJob = await prisma.savedJob.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId,
        },
      },
    });

    if (!savedJob) {
      throw new AppError("Job is not saved", 404);
    }

    // Remove the saved job
    await prisma.savedJob.delete({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  }),
];

// Get all saved jobs for a job seeker
export const getSavedJobs = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, category, location, jobType } = req.query;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build job filter conditions
    const jobWhere: any = {
      isActive: true,
    };

    if (category) {
      jobWhere.category = category;
    }

    if (location) {
      jobWhere.location = {
        contains: location as string,
        mode: "insensitive",
      };
    }

    if (jobType) {
      jobWhere.jobType = jobType;
    }

    const [savedJobs, total] = await Promise.all([
      prisma.savedJob.findMany({
        where: {
          jobSeekerId,
          job: jobWhere,
        },
        skip,
        take,
        include: {
          job: {
            include: {
              employer: {
                select: {
                  companyName: true,
                  logoUrl: true,
                  user: {
                    select: {
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          savedAt: "desc",
        },
      }),
      prisma.savedJob.count({
        where: {
          jobSeekerId,
          job: jobWhere,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        savedJobs,
        pagination: {
          page: Number(page),
          limit: take,
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  }
);

// Check if a job is saved
export const checkIfJobSaved = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    if (!jobId) {
      throw new AppError("Job ID is required", 400);
    }

    const savedJob = await prisma.savedJob.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        isSaved: !!savedJob,
        savedAt: savedJob?.savedAt || null,
      },
    });
  }
);

// Toggle save status of a job
export const toggleSaveJob = [
  body("jobId").notEmpty().withMessage("Job ID is required"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.body;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        isActive: true,
        employer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    if (!job || !job.isActive) {
      throw new AppError("Job not found or no longer active", 404);
    }

    // Check if job is already saved
    const existingSavedJob = await prisma.savedJob.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId,
        },
      },
    });

    if (existingSavedJob) {
      // Remove from saved jobs
      await prisma.savedJob.delete({
        where: {
          jobId_jobSeekerId: {
            jobId,
            jobSeekerId,
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Job removed from saved jobs",
        data: { isSaved: false },
      });
    } else {
      // Save the job
      const savedJob = await prisma.savedJob.create({
        data: {
          jobId,
          jobSeekerId,
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              salaryMin: true,
              salaryMax: true,
              jobType: true,
              employer: {
                select: {
                  companyName: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Job saved successfully",
        data: {
          isSaved: true,
          savedJob,
        },
      });
    }
  }),
];

// Get saved jobs count
export const getSavedJobsCount = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    const count = await prisma.savedJob.count({
      where: {
        jobSeekerId,
        job: {
          isActive: true,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  }
);
