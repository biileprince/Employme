import { Request, Response } from "express";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import prisma from "../utils/database.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

// Subscribe to newsletter
export const subscribeNewsletter = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    // Get client IP and user agent for analytics
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      // Check if email already exists
      const existingSubscription = await prisma.newsletter.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingSubscription) {
        if (existingSubscription.isActive) {
          throw new AppError(
            "This email is already subscribed to our newsletter",
            409,
          );
        } else {
          // Re-activate subscription
          await prisma.newsletter.update({
            where: { email: email.toLowerCase() },
            data: {
              isActive: true,
              unsubscribedAt: null,
              updatedAt: new Date(),
            },
          });

          return res.status(200).json({
            success: true,
            message: "Successfully resubscribed to newsletter!",
          });
        }
      }

      // Create new subscription
      const subscription = await prisma.newsletter.create({
        data: {
          email: email.toLowerCase(),
          source: "homepage",
          ipAddress,
          userAgent,
        },
      });

      res.status(201).json({
        success: true,
        message: "Successfully subscribed to newsletter!",
        data: {
          id: subscription.id,
          email: subscription.email,
        },
      });
      return;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to subscribe to newsletter", 500);
    }
  },
);

// Unsubscribe from newsletter
export const unsubscribeNewsletter = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const subscription = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscription) {
      throw new AppError("Email not found in newsletter subscriptions", 404);
    }

    if (!subscription.isActive) {
      throw new AppError("Email is already unsubscribed", 409);
    }

    await prisma.newsletter.update({
      where: { email: email.toLowerCase() },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from newsletter",
    });
  },
);

// Get all newsletter subscriptions (Admin only)
export const getNewsletterSubscriptions = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(
      req.query as Record<string, unknown>,
      {
        defaultLimit: 20,
        maxLimit: 100,
      },
    );
    const status = req.query.status as string; // 'active', 'inactive', or 'all'
    const search = req.query.search as string;

    // Build filter conditions
    const whereClause: any = {};

    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause.email = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Get subscriptions with pagination
    const [subscriptions, total] = await Promise.all([
      prisma.newsletter.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsletter.count({ where: whereClause }),
    ]);

    // Get summary statistics
    const stats = await prisma.newsletter.groupBy({
      by: ["isActive"],
      _count: {
        id: true,
      },
    });

    const activeCount =
      stats.find((stat: any) => stat.isActive)?._count.id || 0;
    const inactiveCount =
      stats.find((stat: any) => !stat.isActive)?._count.id || 0;

    const pagination = buildPaginationMeta({ page, limit, total });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          ...pagination,
          currentPage: pagination.current,
          itemsPerPage: pagination.limit,
        },
        stats: {
          active: activeCount,
          inactive: inactiveCount,
          total: activeCount + inactiveCount,
        },
      },
    });
  },
);

// Get newsletter analytics (Admin only)
export const getNewsletterAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get subscription trends
    const subscriptionTrends = await prisma.newsletter.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        source: true,
      },
    });

    // Group by date
    const trendsByDate = subscriptionTrends.reduce(
      (acc: Record<string, number>, sub: any) => {
        const date = sub.createdAt.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get source breakdown
    const sourceBreakdown = await prisma.newsletter.groupBy({
      by: ["source"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Get recent subscriptions
    const recentSubscriptions = await prisma.newsletter.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        email: true,
        createdAt: true,
        source: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        trends: trendsByDate,
        sourceBreakdown: sourceBreakdown.map((item: any) => ({
          source: item.source || "unknown",
          count: item._count.id,
        })),
        recentSubscriptions,
        totalNewSubscriptions: subscriptionTrends.length,
      },
    });
  },
);

// Delete newsletter subscription (Admin only)
export const deleteNewsletterSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError("Newsletter subscription not found", 404);
    }

    await prisma.newsletter.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Newsletter subscription deleted successfully",
    });
  },
);

// Export newsletter emails (Admin only)
export const exportNewsletterEmails = catchAsync(
  async (req: Request, res: Response) => {
    const status = req.query.status as string; // 'active', 'inactive', or 'all'

    const whereClause: any = {};
    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    const subscriptions = await prisma.newsletter.findMany({
      where: whereClause,
      select: {
        email: true,
        isActive: true,
        createdAt: true,
        source: true,
        unsubscribedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        count: subscriptions.length,
      },
    });
  },
);
