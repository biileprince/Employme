import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// Get system statistics (Admin only)
export const getSystemStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const [
    totalUsers,
    totalJobs,
    totalApplications,
    activeJobs,
    recentUsers,
    recentJobs,
    applicationsByStatus
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.job.count({ where: { isActive: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    }),
    prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        employer: {
          select: {
            companyName: true
          }
        },
        createdAt: true
      }
    }),
    prisma.application.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
  ]);

  const stats = {
    overview: {
      totalUsers,
      totalJobs,
      totalApplications,
      activeJobs
    },
    recent: {
      users: recentUsers,
      jobs: recentJobs
    },
    applications: {
      byStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>)
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Get all users (Admin only)
export const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
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
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        jobSeeker: {
          select: {
            location: true,
            skills: true
          }
        },
        employer: {
          select: {
            companyName: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
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
        hasPrev: Number(page) > 1
      }
    }
  });
});

// Toggle user status (Admin only)
export const toggleUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const { id } = req.params;

  if (!id) {
    throw new AppError('User ID is required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true, email: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      email: true,
      isActive: true
    }
  });

  res.status(200).json({
    success: true,
    message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedUser
  });
});
