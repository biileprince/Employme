import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync, AppError } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

const VALID_JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
] as const;

const VALID_JOB_CATEGORIES = [
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
  "OTHER",
  "REAL_ESTATE",
  "TELECOMMUNICATIONS",
] as const;

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const ensureAllowedValues = (
  values: string[],
  allowedValues: readonly string[],
  label: string,
): void => {
  const invalidValue = values.find((value) => !allowedValues.includes(value));
  if (invalidValue) {
    throw new AppError(`Invalid ${label}: ${invalidValue}`, 400);
  }
};

const ensureJobSeeker = (req: Request): string => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can manage job alerts", 403);
  }

  return req.user.id;
};

const validateAlertPayload = (payload: {
  keywords: string[];
  locations: string[];
  jobTypes: string[];
  categories: string[];
  emailEnabled: boolean;
  inAppEnabled: boolean;
}): void => {
  ensureAllowedValues(payload.jobTypes, VALID_JOB_TYPES, "job type");
  ensureAllowedValues(payload.categories, VALID_JOB_CATEGORIES, "job category");

  if (!payload.emailEnabled && !payload.inAppEnabled) {
    throw new AppError("Select at least one delivery mode", 400);
  }

  const hasAtLeastOneFilter =
    payload.keywords.length > 0 ||
    payload.locations.length > 0 ||
    payload.jobTypes.length > 0 ||
    payload.categories.length > 0;

  if (!hasAtLeastOneFilter) {
    throw new AppError("Add at least one filter for your alert", 400);
  }
};

// Get current user's job alerts
export const getMyJobAlerts = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);

    const alerts = await prisma.jobAlert.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  },
);

// Create a job alert
export const createJobAlert = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);

    const {
      name,
      keywords,
      locations,
      jobTypes,
      categories,
      emailEnabled = true,
      inAppEnabled = true,
      isActive = true,
    } = req.body;

    if (!name || typeof name !== "string") {
      throw new AppError("Alert name is required", 400);
    }

    const payload = {
      keywords: sanitizeStringArray(keywords),
      locations: sanitizeStringArray(locations),
      jobTypes: sanitizeStringArray(jobTypes),
      categories: sanitizeStringArray(categories),
      emailEnabled: Boolean(emailEnabled),
      inAppEnabled: Boolean(inAppEnabled),
    };

    validateAlertPayload(payload);

    const alert = await prisma.jobAlert.create({
      data: {
        userId,
        name: name.trim(),
        keywords: payload.keywords,
        locations: payload.locations,
        jobTypes: payload.jobTypes as any,
        categories: payload.categories as any,
        emailEnabled: payload.emailEnabled,
        inAppEnabled: payload.inAppEnabled,
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      message: "Job alert created successfully",
      data: {
        alert,
      },
    });
  },
);

// Update a job alert
export const updateJobAlert = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);
    const { id } = req.params;

    const existingAlert = await prisma.jobAlert.findFirst({
      where: { id, userId },
    });

    if (!existingAlert) {
      throw new AppError("Job alert not found", 404);
    }

    const nextKeywords =
      req.body.keywords !== undefined
        ? sanitizeStringArray(req.body.keywords)
        : existingAlert.keywords;
    const nextLocations =
      req.body.locations !== undefined
        ? sanitizeStringArray(req.body.locations)
        : existingAlert.locations;
    const nextJobTypes =
      req.body.jobTypes !== undefined
        ? sanitizeStringArray(req.body.jobTypes)
        : existingAlert.jobTypes;
    const nextCategories =
      req.body.categories !== undefined
        ? sanitizeStringArray(req.body.categories)
        : existingAlert.categories;

    const nextEmailEnabled =
      req.body.emailEnabled !== undefined
        ? Boolean(req.body.emailEnabled)
        : existingAlert.emailEnabled;
    const nextInAppEnabled =
      req.body.inAppEnabled !== undefined
        ? Boolean(req.body.inAppEnabled)
        : existingAlert.inAppEnabled;

    validateAlertPayload({
      keywords: nextKeywords,
      locations: nextLocations,
      jobTypes: nextJobTypes,
      categories: nextCategories,
      emailEnabled: nextEmailEnabled,
      inAppEnabled: nextInAppEnabled,
    });

    const alert = await prisma.jobAlert.update({
      where: { id },
      data: {
        ...(typeof req.body.name === "string"
          ? { name: req.body.name.trim() }
          : {}),
        keywords: nextKeywords,
        locations: nextLocations,
        jobTypes: nextJobTypes as any,
        categories: nextCategories as any,
        emailEnabled: nextEmailEnabled,
        inAppEnabled: nextInAppEnabled,
        ...(req.body.isActive !== undefined
          ? { isActive: Boolean(req.body.isActive) }
          : {}),
      },
    });

    res.status(200).json({
      success: true,
      message: "Job alert updated successfully",
      data: {
        alert,
      },
    });
  },
);

// Delete a job alert
export const deleteJobAlert = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);
    const { id } = req.params;

    const alert = await prisma.jobAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new AppError("Job alert not found", 404);
    }

    await prisma.jobAlert.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Job alert deleted successfully",
    });
  },
);

// Get current user's in-app notifications
export const getMyNotifications = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.filter((item) => !item.isRead).length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  },
);

// Mark a notification as read
export const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);
    const { id } = req.params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError("Notification not found", 404);
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: { notification },
    });
  },
);

// Mark all notifications as read
export const markAllNotificationsAsRead = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = ensureJobSeeker(req);

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  },
);
