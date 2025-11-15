import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import {
  sendAccountStatusChangeNotification,
  sendJobDeactivationNotification,
} from "../services/emailService.js";

const prisma = new PrismaClient();

// Get system statistics (Admin only)
export const getSystemStats = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const [
      totalUsers,
      totalJobs,
      totalApplications,
      activeJobs,
      recentUsers,
      recentJobs,
      applicationsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          location: true,
          isActive: true,
          createdAt: true,
          employer: {
            select: {
              companyName: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      prisma.application.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
    ]);

    // Count users by role
    const usersByRole = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYER" } }),
      prisma.user.count({ where: { role: "JOB_SEEKER" } }),
    ]);

    const [totalEmployers, totalJobSeekers] = usersByRole;

    // Count pending applications
    const pendingApplications = await prisma.application.count({
      where: { status: "PENDING" },
    });

    // Count pending employer verifications
    const pendingEmployerVerifications = await prisma.employer.count({
      where: { isVerified: false },
    });

    // Count pending job approvals
    const pendingJobApprovals = await prisma.job.count({
      where: { isApproved: false, isActive: true },
    });

    const response = {
      stats: {
        totalUsers,
        totalJobs,
        totalApplications,
        activeEmployers: totalEmployers,
        activeJobSeekers: totalJobSeekers,
        pendingApplications,
        pendingEmployerVerifications,
        pendingJobApprovals,
      },
      recentUsers,
      recentJobs,
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  }
);

// Get all users (Admin only)
export const getAllUsers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: "insensitive" } },
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          jobSeeker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              location: true,
              bio: true,
              skills: true,
              experience: true,
              education: true,
              cvUrl: true,
              profileImageUrl: true,
              isProfilePublic: true,
              countryCode: true,
              phone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          employer: {
            select: {
              id: true,
              companyName: true,
              title: true,
              industry: true,
              location: true,
              website: true,
              description: true,
              logoUrl: true,
              founded: true,
              companySize: true,
              isVerified: true,
              countryCode: true,
              phone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          socialAccounts: {
            select: {
              id: true,
              provider: true,
              email: true,
              displayName: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              attachments: true,
              socialAccounts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// Toggle user status (Admin only)
export const toggleUserStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError("User ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
        email: true,
        firstName: true,
        lastName: true,
        jobSeeker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        employer: {
          select: {
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
        firstName: true,
        lastName: true,
      },
    });

    // Send email notification to the user
    try {
      let userName = "User";
      if (user.firstName && user.lastName) {
        userName = `${user.firstName} ${user.lastName}`;
      } else if (user.jobSeeker?.firstName && user.jobSeeker?.lastName) {
        userName = `${user.jobSeeker.firstName} ${user.jobSeeker.lastName}`;
      } else if (user.employer?.companyName) {
        userName = user.employer.companyName;
      } else if (user.email) {
        userName = (user.email as string).split("@")[0];
      }

      const adminName =
        req.user?.firstName && req.user?.lastName
          ? `${req.user.firstName} ${req.user.lastName}`
          : "Administrator";

      if (user.email) {
        await sendAccountStatusChangeNotification(
          user.email,
          userName,
          updatedUser.isActive,
          adminName
        );
      }
    } catch (emailError) {
      console.error(
        "Failed to send account status change notification:",
        emailError
      );
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: `User ${
        updatedUser.isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedUser,
    });
  }
);

// Toggle employer verification status (Admin only)
export const toggleUserVerification = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError("User ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { employer: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Only toggle employer verification if user is an employer
    if (user.role !== "EMPLOYER" || !user.employer) {
      throw new AppError("User is not an employer", 400);
    }

    const updatedEmployer = await prisma.employer.update({
      where: { id: user.employer.id },
      data: { isVerified: !user.employer.isVerified },
    });

    // Send notification email
    try {
      const emailService = await import("../services/emailService.js");
      await emailService.sendEmployerVerificationNotification(user.email, {
        companyName: updatedEmployer.companyName,
        firstName: user.firstName || "User",
        isVerified: updatedEmployer.isVerified,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: `Employer ${
        updatedEmployer.isVerified ? "verified" : "unverified"
      } successfully`,
      data: {
        id: user.id,
        email: user.email,
        employer: updatedEmployer,
      },
    });
  }
);

// Delete user (soft delete)
export const deleteUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user?.id) {
      throw new AppError("Cannot delete your own account", 400);
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
);

// Get all jobs with pagination
export const getAllJobs = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { page = "1", limit = "10", isActive, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { location: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [jobs, totalJobs] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          employer: {
            include: { user: true },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(totalJobs / limitNum);

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalJobs,
          pages: totalPages,
        },
      },
    });
  }
);

// Get pending job approvals (Admin only)
export const getPendingJobs = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const pendingJobs = await prisma.job.findMany({
      where: {
        isApproved: false,
        isActive: true, // Only show active jobs waiting for approval
      },
      include: {
        employer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "asc" }, // Oldest first
    });

    res.status(200).json({
      success: true,
      data: {
        jobs: pendingJobs,
        count: pendingJobs.length,
      },
    });
  }
);

// Manage job (activate/deactivate/feature)
export const manageJob = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;
    const { action } = req.body;

    if (
      ![
        "activate",
        "deactivate",
        "feature",
        "unfeature",
        "approve",
        "reject",
      ].includes(action)
    ) {
      throw new AppError("Invalid action", 400);
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    let updateData: any = {};
    let shouldSendEmail = false;

    switch (action) {
      case "activate":
        updateData.isActive = true;
        shouldSendEmail = !job.isActive; // Only send email if status is changing
        break;
      case "deactivate":
        updateData.isActive = false;
        shouldSendEmail = job.isActive; // Only send email if status is changing
        break;
      case "approve":
        updateData.isApproved = true;
        shouldSendEmail = !job.isApproved; // Send email when approving
        break;
      case "reject":
        updateData.isApproved = false;
        updateData.isActive = false; // Also deactivate rejected jobs
        shouldSendEmail = job.isApproved; // Send email when rejecting
        break;
      case "feature":
        updateData.isFeatured = true;
        break;
      case "unfeature":
        updateData.isFeatured = false;
        break;
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        employer: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    // Send email notification for job activation/deactivation
    if (shouldSendEmail && (action === "activate" || action === "deactivate")) {
      try {
        const employerUser = updatedJob.employer.user;
        let employerName = "Employer";

        if (employerUser.firstName && employerUser.lastName) {
          employerName = `${employerUser.firstName} ${employerUser.lastName}`;
        } else if (updatedJob.employer.companyName) {
          employerName = updatedJob.employer.companyName;
        } else if (employerUser.email) {
          employerName = (employerUser.email as string).split("@")[0];
        }

        const adminName =
          req.user?.firstName && req.user?.lastName
            ? `${req.user.firstName} ${req.user.lastName}`
            : "Administrator";

        if (employerUser.email) {
          await sendJobDeactivationNotification(
            employerUser.email,
            employerName,
            updatedJob.title,
            updatedJob.id,
            updatedJob.isActive,
            adminName
          );
        }
      } catch (emailError) {
        console.error(
          "Failed to send job status change notification:",
          emailError
        );
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Job ${action}d successfully`,
      data: { job: updatedJob },
    });
  }
);

// Delete job
export const deleteJob = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    // Delete job and cascade to applications
    await prisma.job.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  }
);

// Get all applications with pagination
export const getAllApplications = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { page = "1", limit = "10", status, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          job: {
            title: { contains: search as string, mode: "insensitive" },
          },
        },
        {
          jobSeeker: {
            OR: [
              {
                firstName: { contains: search as string, mode: "insensitive" },
              },
              { lastName: { contains: search as string, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [applications, totalApplications] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: "desc" },
        include: {
          job: {
            include: {
              employer: {
                include: { user: true },
              },
            },
          },
          jobSeeker: {
            include: { user: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    const totalPages = Math.ceil(totalApplications / limitNum);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalApplications,
          pages: totalPages,
        },
      },
    });
  }
);

// Delete application
export const deleteApplication = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            employer: {
              include: { user: true },
            },
          },
        },
        jobSeeker: {
          include: { user: true },
        },
      },
    });

    if (!application) {
      throw new AppError("Application not found", 404);
    }

    // Delete the application (this will also cascade delete related attachments)
    await prisma.application.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  }
);

// Update application status (admin can change any application status)
export const updateApplicationStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "PENDING",
      "REVIEWED",
      "SHORTLISTED",
      "REJECTED",
      "HIRED",
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid status", 400);
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new AppError("Application not found", 404);
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: {
        job: {
          include: {
            employer: {
              include: { user: true },
            },
          },
        },
        jobSeeker: {
          include: { user: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: { application: updatedApplication },
    });
  }
);

// Create new admin user
export const createAdminUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { email, password, firstName, lastName, secretKey } = req.body;

    // Verify secret key (environment variable)
    if (secretKey !== process.env.ADMIN_CREATION_SECRET) {
      throw new AppError("Unauthorized admin creation", 403);
    }

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user with transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "ADMIN",
          isVerified: true,
          isActive: true,
        },
      });

      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
        },
      });

      return { user, admin };
    });

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        },
      },
    });
  }
);

// Get admin profile
export const getAdminProfile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const userId = req.user?.id;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      throw new AppError("Admin not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive,
          isVerified: admin.isVerified,
          createdAt: admin.createdAt,
          profile: admin.admin,
        },
      },
    });
  }
);

// Get all employers (Admin only) - includes pending verification
export const getAllEmployers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { page = "1", limit = "10", verificationStatus = "all" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter based on verification status
    const whereClause: any = {};
    if (verificationStatus === "verified") {
      whereClause.isVerified = true;
    } else if (verificationStatus === "pending") {
      whereClause.isVerified = false;
    }
    // 'all' means no filter on isVerified

    const [employers, total] = await Promise.all([
      prisma.employer.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              isVerified: true,
              createdAt: true,
              lastLogin: true,
            },
          },
          _count: {
            select: {
              jobs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employer.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        employers,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  }
);

// Get pending employer verifications (Admin only)
export const getPendingEmployers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const pendingEmployers = await prisma.employer.findMany({
      where: { isVerified: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { createdAt: "asc" }, // Oldest first
    });

    res.status(200).json({
      success: true,
      data: {
        employers: pendingEmployers,
        count: pendingEmployers.length,
      },
    });
  }
);

// Verify or reject employer (Admin only)
export const updateEmployerVerification = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { employerId } = req.params;
    const { isVerified, rejectionReason } = req.body;

    if (typeof isVerified !== "boolean") {
      throw new AppError("Verification status is required", 400);
    }

    // Find the employer
    const employer = await prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!employer) {
      throw new AppError("Employer not found", 404);
    }

    // Update employer verification status
    const updatedEmployer = await prisma.employer.update({
      where: { id: employerId },
      data: { isVerified },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send email notification
    try {
      const emailService = await import("../services/emailService.js");
      await emailService.sendEmployerVerificationNotification(
        employer.user.email,
        {
          companyName: employer.companyName,
          firstName: employer.user.firstName || "User",
          isVerified,
          rejectionReason: rejectionReason || undefined,
        }
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: `Employer ${isVerified ? "verified" : "rejected"} successfully`,
      data: { employer: updatedEmployer },
    });
  }
);
