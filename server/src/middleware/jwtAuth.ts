import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "./errorHandler.js";

const prisma = new PrismaClient();

// Extend Express Request type to include auth information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
        imageUrl?: string;
        profile?: any;
      };
      userId?: string;
    }
  }
}

// Generate JWT token
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }
};

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Get token from cookies as fallback
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError("Access denied. No token provided.", 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeeker: true,
        employer: true,
        admin: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as "JOB_SEEKER" | "EMPLOYER" | "ADMIN",
      profile: user.jobSeeker || user.employer || user.admin || null,
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
      ...(user.imageUrl && { imageUrl: user.imageUrl }),
    };

    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            jobSeeker: true,
            employer: true,
            admin: true,
          },
        });

        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role as "JOB_SEEKER" | "EMPLOYER" | "ADMIN",
            profile: user.jobSeeker || user.employer || user.admin || null,
            ...(user.firstName && { firstName: user.firstName }),
            ...(user.lastName && { lastName: user.lastName }),
            ...(user.imageUrl && { imageUrl: user.imageUrl }),
          };
          req.userId = user.id;
        }
      } catch (error) {
        // Token is invalid, but we don't throw error in optional middleware
        console.warn("Invalid token in optional auth middleware:", error);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Legacy middleware names for compatibility
export const requireAuth = authMiddleware;
export const optionalAuth = optionalAuthMiddleware;

// Admin only middleware
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "ADMIN") {
    throw new AppError("Access denied. Admin privileges required.", 403);
  }
  next();
};

// Employer only middleware
export const employerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "EMPLOYER") {
    throw new AppError("Access denied. Employer privileges required.", 403);
  }
  next();
};

// Job seeker only middleware
export const jobSeekerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "JOB_SEEKER") {
    throw new AppError("Access denied. Job seeker privileges required.", 403);
  }
  next();
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  };
};

// Legacy role middleware for compatibility
export const requireEmployer = requireRole(["EMPLOYER", "ADMIN"]);
export const requireAdmin = requireRole(["ADMIN"]);
export const requireJobSeeker = requireRole(["JOB_SEEKER", "ADMIN"]);
