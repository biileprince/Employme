import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { body } from "express-validator";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { handleValidationErrors } from "../middleware/validation.js";

const prisma = new PrismaClient();

// Helper function to update expired jobs
const updateExpiredJobs = async () => {
  const now = new Date();

  await prisma.job.updateMany({
    where: {
      deadline: {
        lt: now,
      },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
};

// Get all jobs with filtering and pagination
export const getJobs = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Update expired jobs before fetching
    await updateExpiredJobs();

    const {
      page = 1,
      limit = 10,
      category,
      experience,
      location,
      jobType,
      salaryMin,
      salaryMax,
      search,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build filter conditions
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (experience) {
      where.experience = experience;
    }

    if (location) {
      where.location = {
        contains: location as string,
        mode: "insensitive",
      };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (salaryMin) {
      where.salaryMin = {
        gte: Number(salaryMin),
      };
    }

    if (salaryMax) {
      where.salaryMax = {
        lte: Number(salaryMax),
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search as string,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search as string,
            mode: "insensitive",
          },
        },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          employer: {
            select: {
              companyName: true,
              logoUrl: true,
              location: true,
            },
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              url: true,
              fileType: true,
              fileSize: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        jobs,
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

// Get job by ID
export const getJobById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Job ID is required", 400);
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            companyName: true,
            logoUrl: true,
            location: true,
            website: true,
            description: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            url: true,
            fileType: true,
            fileSize: true,
          },
        },
      },
    });

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { job },
    });
  }
);

// Get current user's jobs (employers only)
export const getMyJobs = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Update expired jobs before fetching
    await updateExpiredJobs();

    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    if (req.user.role !== "EMPLOYER") {
      throw new AppError("Only employers can access this endpoint", 403);
    }

    // Find the employer profile
    const employer = await prisma.employer.findUnique({
      where: { userId: req.user.id },
    });

    if (!employer) {
      throw new AppError("Employer profile not found", 404);
    }

    const jobs = await prisma.job.findMany({
      where: { employerId: employer.id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            url: true,
            fileType: true,
            fileSize: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      type: job.jobType,
      status: job.isActive ? "ACTIVE" : "CLOSED",
      applicationsCount: job._count.applications,
      createdAt: job.createdAt,
      applicationDeadline: job.deadline,
    }));

    res.status(200).json({
      success: true,
      data: { jobs: formattedJobs },
    });
  }
);

// Create a new job (employers only)
export const createJob = [
  body("title").notEmpty().withMessage("Job title is required"),
  body("description").notEmpty().withMessage("Job description is required"),
  body("requirements").notEmpty().withMessage("Job requirements are required"),
  body("location")
    .optional()
    .custom((value, { req }) => {
      if (!req.body.isRemote && !value) {
        throw new Error("Location is required for non-remote jobs");
      }
      return true;
    }),
  body("category")
    .isIn([
      "TECHNOLOGY",
      "FINANCE",
      "HEALTHCARE",
      "EDUCATION",
      "MARKETING",
      "SALES",
      "DESIGN",
      "ENGINEERING",
      "OPERATIONS",
      "HUMAN_RESOURCES",
      "LEGAL",
      "CUSTOMER_SERVICE",
      "MANUFACTURING",
      "CONSULTING",
      "MEDIA",
      "GOVERNMENT",
      "NON_PROFIT",
      "AGRICULTURE",
      "CONSTRUCTION",
      "HOSPITALITY",
      "TRANSPORTATION",
      "RETAIL",
      "REAL_ESTATE",
      "TELECOMMUNICATIONS",
      "OTHER",
    ])
    .withMessage("Invalid job category"),
  body("experienceLevel")
    .optional()
    .isIn(["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL", "EXECUTIVE"])
    .withMessage("Invalid experience level"),
  body("type")
    .isIn(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"])
    .withMessage("Invalid job type"),
  body("salaryMin")
    .optional()
    .isNumeric()
    .withMessage("Salary min must be a number"),
  body("salaryMax")
    .optional()
    .isNumeric()
    .withMessage("Salary max must be a number"),
  body("benefits")
    .optional()
    .isArray()
    .withMessage("Benefits must be an array"),
  body("isRemote")
    .optional()
    .isBoolean()
    .withMessage("isRemote must be a boolean"),
  body("applicationDeadline")
    .optional()
    .isISO8601()
    .withMessage("Application deadline must be a valid date"),
  body("contactPhone")
    .optional()
    .matches(/^[0-9]{7,15}$/)
    .withMessage("Contact phone must be 7-15 digits"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      location,
      category,
      experienceLevel,
      type,
      salaryMin,
      salaryMax,
      isRemote,
      applicationDeadline,
      contactPhone,
      contactCountryCode,
    } = req.body;

    // Validate salary range
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      throw new AppError(
        "Minimum salary cannot be greater than maximum salary",
        400
      );
    }

    // Find the employer profile for the current user
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const employer = await prisma.employer.findUnique({
      where: { userId: req.user.id },
    });

    if (!employer) {
      throw new AppError(
        "Employer profile not found. Please complete your employer profile first.",
        404
      );
    }

    const employerId = employer.id;

    // Format contact phone if provided
    const formattedContactPhone =
      contactPhone && contactCountryCode
        ? `${contactCountryCode}${contactPhone}`
        : null;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements: Array.isArray(requirements)
          ? requirements
          : [requirements],
        responsibilities: Array.isArray(responsibilities)
          ? responsibilities
          : [responsibilities],
        benefits: benefits || [],
        location: isRemote ? "Remote" : location,
        category,
        experience: experienceLevel,
        jobType: type,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        isRemote: isRemote || false,
        deadline: applicationDeadline ? new Date(applicationDeadline) : null,
        contactPhone: formattedContactPhone,
        employerId,
      },
      include: {
        employer: {
          select: {
            companyName: true,
            logoUrl: true,
            location: true,
          },
        },
        attachments: true,
      },
    });

    // Handle image attachments if provided
    const { images } = req.body;
    if (images && Array.isArray(images) && images.length > 0) {
      // Only take the first image as hiring flyer (limit to one)
      const imageUrl = images[0];

      await prisma.attachment.create({
        data: {
          filename: "hiring-flyer.jpg",
          url: imageUrl,
          fileType: "IMAGE",
          mimeType: "image/jpeg",
          uploadedBy: req.user?.id,
          jobId: job.id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: { job },
    });
  }),
];

// Update a job (employers only)
export const updateJob = [
  body("title").optional().notEmpty().withMessage("Job title cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Job description cannot be empty"),
  body("location")
    .optional()
    .notEmpty()
    .withMessage("Job location cannot be empty"),
  body("experience")
    .optional()
    .isIn(["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL"])
    .withMessage("Invalid experience level"),
  body("jobType")
    .optional()
    .isIn(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])
    .withMessage("Invalid job type"),
  body("salaryMin")
    .optional()
    .isNumeric()
    .withMessage("Salary min must be a number"),
  body("salaryMax")
    .optional()
    .isNumeric()
    .withMessage("Salary max must be a number"),
  body("requirements")
    .optional()
    .isArray()
    .withMessage("Requirements must be an array"),
  body("isRemote")
    .optional()
    .isBoolean()
    .withMessage("isRemote must be a boolean"),
  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,

  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new AppError("Job ID is required", 400);
    }

    // Extract jobImages field for separate handling
    const { jobImages, ...validUpdateData } = updateData;

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { employerId: true },
    });

    if (!existingJob) {
      throw new AppError("Job not found", 404);
    }

    // Convert string numbers to numbers if provided
    if (validUpdateData.salaryMin) {
      validUpdateData.salaryMin = Number(validUpdateData.salaryMin);
    }
    if (validUpdateData.salaryMax) {
      validUpdateData.salaryMax = Number(validUpdateData.salaryMax);
    }
    if (validUpdateData.deadline) {
      validUpdateData.deadline = new Date(validUpdateData.deadline);
    }

    // Handle job images - only allow one job advertisement image
    if (jobImages && Array.isArray(jobImages)) {
      // Remove existing job image attachments
      await prisma.attachment.deleteMany({
        where: {
          jobId: id,
          fileType: "IMAGE", // Use IMAGE type for job advertisement images
        },
      });

      // Create new job image attachment (only take the first one)
      if (jobImages.length > 0) {
        const imageUrl = jobImages[0];
        // Only create attachment if it's a new image (not already formatted URL)
        if (imageUrl && !imageUrl.startsWith("http")) {
          await prisma.attachment.create({
            data: {
              filename: `job-image-${Date.now()}.jpg`,
              url: imageUrl,
              fileType: "IMAGE",
              mimeType: "image/jpeg",
              jobId: id,
              uploadedBy: req.user?.id || null,
            },
          });
        }
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: validUpdateData,
      include: {
        employer: {
          select: {
            companyName: true,
            logoUrl: true,
            location: true,
          },
        },
        attachments: {
          where: {
            fileType: "IMAGE",
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: { job },
    });
  }),
];

// Delete a job (employers only)
export const deleteJob = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Job ID is required", 400);
    }

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { employerId: true },
    });

    if (!existingJob) {
      throw new AppError("Job not found", 404);
    }

    await prisma.job.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  }
);
