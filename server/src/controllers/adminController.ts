import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync, AppError } from "../middleware/errorHandler.js";

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

    const response = {
      stats: {
        totalUsers,
        totalJobs,
        totalApplications,
        activeEmployers: totalEmployers,
        activeJobSeekers: totalJobSeekers,
        pendingApplications,
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
          role: true,
          isActive: true,
          createdAt: true,
          jobSeeker: {
            select: {
              location: true,
              skills: true,
            },
          },
          employer: {
            select: {
              companyName: true,
              location: true,
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
      select: { id: true, isActive: true, email: true },
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
      },
    });

    res.status(200).json({
      success: true,
      message: `User ${
        updatedUser.isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedUser,
    });
  }
);

// Toggle user verification status (Admin only)
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
      select: { id: true, isVerified: true, email: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isVerified: !user.isVerified },
      select: {
        id: true,
        email: true,
        isVerified: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User ${
        updatedUser.isVerified ? "verified" : "unverified"
      } successfully`,
      data: updatedUser,
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

// Manage job (activate/deactivate/feature)
export const manageJob = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin privileges required.", 403);
    }

    const { id } = req.params;
    const { action } = req.body;

    if (!["activate", "deactivate", "feature", "unfeature"].includes(action)) {
      throw new AppError("Invalid action", 400);
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, title: true, isActive: true, isFeatured: true },
    });

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    let updateData: any = {};

    switch (action) {
      case "activate":
        updateData.isActive = true;
        break;
      case "deactivate":
        updateData.isActive = false;
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
          include: { user: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

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
