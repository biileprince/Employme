import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { body } from "express-validator";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { handleValidationErrors } from "../middleware/validation.js";

const prisma = new PrismaClient();

// Apply for a job
export const applyForJob = [
  body("jobId").notEmpty().withMessage("Job ID is required"),
  body("coverLetter").optional().trim(),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { jobId, coverLetter } = req.body;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            companyName: true,
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        },
      },
    });

    if (!job || !job.isActive) {
      throw new AppError("Job not found or no longer active", 404);
    }

    // Check if deadline has passed
    if (job.deadline && new Date() > job.deadline) {
      throw new AppError("Application deadline has passed", 400);
    }

    // Check if user has already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId,
        },
      },
    });

    if (existingApplication) {
      throw new AppError("You have already applied for this job", 400);
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        jobSeekerId,
        coverLetter,
      },
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
          select: {
            firstName: true,
            lastName: true,
            cvUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: { application },
    });
  }),
];

// Get applications for a job (employers only)
// Get all applications for an employer across all their jobs
export const getEmployerApplications = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Get employer profile
    const employer = await prisma.employer.findUnique({
      where: { userId: req.user.id },
    });

    if (!employer) {
      // If no employer profile exists, return empty applications
      res.status(200).json({
        success: true,
        data: {
          applications: [],
          pagination: {
            current: 1,
            total: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {
      job: {
        employerId: employer.id,
      },
    };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              jobType: true,
            },
          },
          jobSeeker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              location: true,
              bio: true,
              skills: true,
              experience: true,
              education: true,
              cvUrl: true,
              profileImageUrl: true,
              phone: true,
              countryCode: true,
              user: {
                select: {
                  email: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          appliedAt: "desc",
        },
      }),
      prisma.application.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          current: Number(page),
          total: totalPages,
          totalItems: total,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  }
);

export const getJobApplications = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    if (!jobId) {
      throw new AppError("Job ID is required", 400);
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { employerId: true, title: true },
    });

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { jobId };
    if (status) {
      where.status = status;
    }

    try {
      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          skip,
          take,
          include: {
            jobSeeker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                location: true,
                bio: true,
                skills: true,
                experience: true,
                education: true,
                cvUrl: true,
                profileImageUrl: true,
                phone: true,
                countryCode: true,
                user: {
                  select: {
                    email: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            appliedAt: "desc",
          },
        }),
        prisma.application.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      res.status(200).json({
        success: true,
        data: {
          applications: applications || [],
          job: {
            id: jobId,
            title: job.title,
            applicationsCount: total,
          },
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
    } catch (error) {
      console.error("Error fetching job applications:", error);
      // If there's an error fetching applications, return empty array instead of throwing
      res.status(200).json({
        success: true,
        data: {
          applications: [],
          job: {
            id: jobId,
            title: job.title,
            applicationsCount: 0,
          },
          pagination: {
            page: Number(page),
            limit: take,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    }
  }
);

// Get job seeker's own applications
export const getMyApplications = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { status, page = 1, limit = 10 } = req.query;

    // For now, use a mock job seeker ID until auth is properly implemented
    const jobSeekerId = req.user?.profile?.id || "mock-jobseeker-id";

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { jobSeekerId };
    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
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
          appliedAt: "desc",
        },
      }),
      prisma.application.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        applications,
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

// Update application status (employers only)
export const updateApplicationStatus = [
  body("status")
    .isIn(["PENDING", "REVIEWING", "ACCEPTED", "REJECTED"])
    .withMessage("Invalid status value"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      throw new AppError("Application ID is required", 400);
    }

    // Find application and verify it exists
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            employerId: true,
            title: true,
          },
        },
        jobSeeker: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new AppError("Application not found", 404);
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
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
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: { application: updatedApplication },
    });
  }),
];

// Get single application by ID
export const getApplicationById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Application ID is required", 400);
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            employer: {
              select: {
                companyName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
        jobSeeker: {
          select: {
            firstName: true,
            lastName: true,
            location: true,
            bio: true,
            skills: true,
            experience: true,
            education: true,
            cvUrl: true,
            profileImageUrl: true,
            user: {
              select: {
                email: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new AppError("Application not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { application },
    });
  }
);
