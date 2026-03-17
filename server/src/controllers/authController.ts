import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateSocketToken,
  verifyRefreshToken,
} from "../middleware/auth.js";
import {
  generateVerificationCode,
  generatePasswordResetCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNewUserNotificationToAdmin,
} from "../services/emailService.js";
import passport from "../middleware/passport.js";

// Extend session type to include social profile data
declare module "express-session" {
  interface SessionData {
    pendingOAuthRole?: string;
    pendingOAuthOrigin?: string;
    socialProfileData?: {
      provider: string;
      providerId: string;
      email: string;
      firstName: string;
      lastName: string;
      imageUrl: string | null;
      displayName: string;
      photos: string | null;
    };
  }
}

const prisma = new PrismaClient();

const isProd = process.env.NODE_ENV === "production";

const setAuthCookies = (res: Response, userId: string) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh",
  });
};

const clearAuthCookies = (res: Response) => {
  res.cookie("access_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    expires: new Date(0),
  });

  res.cookie("refresh_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    expires: new Date(0),
    path: "/api/auth/refresh",
  });

  // Backward compatibility cleanup
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    expires: new Date(0),
  });
};

const resolveFrontendUrl = (req: Request): string => {
  return (
    (req.session as any)?.pendingOAuthOrigin ||
    process.env.NEXT_CLIENT_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:3000"
  );
};

// Register new user
export const register = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || "",
        role: role || "JOB_SEEKER",
        isVerified: false,
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        user.firstName || "User",
        verificationCode
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Don't fail registration if email sending fails
    }

    // Send admin notification about new user registration
    try {
      const userName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      await sendNewUserNotificationToAdmin(user.email, userName, user.role);
    } catch (error) {
      console.error("Failed to send admin notification:", error);
      // Don't fail registration if admin notification fails
    }

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  }
);

// Login user
export const login = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        jobSeeker: true,
        employer: true,
        admin: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email address before logging in. Check your inbox for the verification link.",
        403
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(
        "Account is deactivated. Please contact support.",
        403
      );
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    setAuthCookies(res, user.id);

    // Determine profile completeness
    const hasProfile =
      !!(user.role === "JOB_SEEKER" && user.jobSeeker) ||
      !!(user.role === "EMPLOYER" && user.employer) ||
      !!(user.role === "ADMIN" && user.admin);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          hasProfile,
          profile: user.jobSeeker || user.employer || user.admin || null,
        },
      },
    });
  }
);

// Logout user
export const logout = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);

// Get current user
export const getCurrentUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        jobSeeker: true,
        employer: true,
        admin: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const hasProfile =
      !!(user.role === "JOB_SEEKER" && user.jobSeeker) ||
      !!(user.role === "EMPLOYER" && user.employer) ||
      !!(user.role === "ADMIN" && user.admin);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          imageUrl: user.imageUrl,
          hasProfile,
          profile: user.jobSeeker || user.employer || user.admin || null,
        },
      },
    });
  }
);

// Change password
export const changePassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError(
        "New password must be at least 6 characters long",
        400
      );
    }

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  }
);

// Request password reset
export const requestPasswordReset = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, we have sent a password reset link.",
      });
      return;
    }

    // Generate reset code
    const { code: resetCode, expiresAt } = generatePasswordResetCode();

    // Update user with reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpiry: expiresAt,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(
        user.email,
        user.firstName || "User",
        resetCode
      );
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, we have sent a password reset link.",
    });
  }
);

// Reset password with token
export const resetPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
      throw new AppError("Code and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    // Find user with valid reset code
    const user = await prisma.user.findFirst({
      where: {
        resetCode: code,
        resetCodeExpiry: {
          gt: new Date(), // Code must not be expired
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  }
);

// Verify email with token
export const verifyEmail = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;

    if (!code) {
      throw new AppError("Verification code is required", 400);
    }

    // Find user with verification code
    const user = await prisma.user.findFirst({
      where: {
        verificationCode: code,
        verificationCodeExpiry: {
          gt: new Date(), // Code must not be expired
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    if (user.isVerified) {
      throw new AppError("Email is already verified", 400);
    }

    // Update user as verified and clear code
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(
        updatedUser.email,
        updatedUser.firstName || "User"
      );
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    setAuthCookies(res, updatedUser.id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to EmployMe!",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
        },
      },
    });
  }
);

// Resend verification email
export const resendVerificationEmail = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isVerified) {
      throw new AppError("Email is already verified", 400);
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with new code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        user.firstName || "User",
        verificationCode
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new AppError("Failed to send verification email", 500);
    }

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  }
);

// Social Authentication Success Handler
export const socialAuthSuccess = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Social authentication failed", 401);
    }

    const user = req.user as any;
    console.log("Social auth success for user:", user.id, user.email);

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    setAuthCookies(res, user.id);

    // Resolve redirect target before clearing session OAuth metadata.
    const frontendUrl = resolveFrontendUrl(req);

    // Clear the session after successful authentication
    delete (req.session as any).pendingOAuthRole;
    delete (req.session as any).pendingOAuthOrigin;
    req.logout((err) => {
      if (err) {
        console.error("Error logging out session:", err);
      }
    });

    // Determine if user needs to complete profile
    const hasProfile =
      !!(user.role === "JOB_SEEKER" && user.jobSeeker) ||
      !!(user.role === "EMPLOYER" && user.employer) ||
      !!(user.role === "ADMIN" && user.admin);

    // Determine redirect URL based on user role and profile completion
    let redirectUrl: string;

    if (!hasProfile) {
      // User needs to complete profile - redirect to onboarding
      redirectUrl = `${frontendUrl}/onboarding?social=true&auth=success`;
    } else {
      // User has complete profile - redirect to appropriate dashboard
      if (user.role === "EMPLOYER") {
        redirectUrl = `${frontendUrl}/employer/dashboard?social=true&auth=success`;
      } else if (user.role === "JOB_SEEKER") {
        redirectUrl = `${frontendUrl}/job-seeker/dashboard?social=true&auth=success`;
      } else {
        redirectUrl = `${frontendUrl}/admin/dashboard?social=true&auth=success`;
      }
    }

    console.log("Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  }
);

// Social Authentication Failure Handler
export const socialAuthFailure = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    console.error("Social auth failure:", req.query, req.params);
    const frontendUrl = resolveFrontendUrl(req);

    // Get error details from query parameters
    const error = req.query.error || "social_auth_failed";
    const errorDescription =
      req.query.error_description || "Authentication failed";

    res.redirect(
      `${frontendUrl}/auth/login?error=${error}&description=${encodeURIComponent(
        errorDescription as string
      )}`
    );
  }
);

// Link Social Account (for existing users)
export const linkSocialAccount = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { provider, socialId, socialEmail } = req.body;

    if (!provider || !socialId) {
      throw new AppError("Provider and social ID are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { socialAccounts: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if this social account is already linked
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        provider,
        providerId: socialId,
      },
    });

    if (existingAccount && existingAccount.userId !== user.id) {
      throw new AppError(
        "This social account is already linked to another user",
        400
      );
    }

    if (existingAccount && existingAccount.userId === user.id) {
      throw new AppError(
        "This social account is already linked to your account",
        400
      );
    }

    // Create new social account link
    await prisma.socialAccount.create({
      data: {
        userId: user.id,
        provider,
        providerId: socialId,
        email: socialEmail,
      },
    });

    res.status(200).json({
      success: true,
      message: `${provider} account linked successfully`,
    });
  }
);

// Unlink Social Account
export const unlinkSocialAccount = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { provider } = req.body;

    if (!provider) {
      throw new AppError("Provider is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { socialAccounts: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user has password (can't unlink all social accounts if no password)
    if (
      !user.password &&
      user.socialAccounts &&
      user.socialAccounts.length === 1 &&
      user.socialAccounts[0] &&
      user.socialAccounts[0].provider === provider
    ) {
      throw new AppError(
        "Cannot unlink last social account without setting a password first",
        400
      );
    }

    // Find and remove the social account
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        provider,
      },
    });

    if (!socialAccount) {
      throw new AppError(`${provider} account is not linked`, 400);
    }

    await prisma.socialAccount.delete({
      where: { id: socialAccount.id },
    });

    res.status(200).json({
      success: true,
      message: `${provider} account unlinked successfully`,
    });
  }
);

// Complete Social Auth Registration with Role
export const completeSocialAuthRegistration = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    let { role, email } = req.body;

    // Try to get role from session if not provided
    if (!role && req.session.pendingOAuthRole) {
      role = req.session.pendingOAuthRole;
      console.log("Using role from session:", role);
    }

    // Validate role
    const validRoles = ["JOB_SEEKER", "EMPLOYER"];
    if (!role || !validRoles.includes(role)) {
      throw new AppError(
        "Valid role is required (JOB_SEEKER or EMPLOYER)",
        400
      );
    }

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    // Get social profile data from session
    if (!req.session.socialProfileData) {
      throw new AppError(
        "No social authentication data found. Please try logging in again.",
        400
      );
    }

    const socialData = req.session.socialProfileData;

    // Verify email matches
    if (socialData.email !== email) {
      throw new AppError("Email mismatch. Please try again.", 400);
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: socialData.email },
      });

      if (existingUser) {
        throw new AppError("User already exists with this email", 400);
      }

      // Create user with selected role
      const user = await prisma.user.create({
        data: {
          email: socialData.email,
          firstName: socialData.firstName,
          lastName: socialData.lastName,
          imageUrl: socialData.imageUrl,
          password: "", // No password for social login
          isVerified: true, // Social accounts are pre-verified
          role: role,
          socialAccounts: {
            create: {
              provider: socialData.provider,
              providerId: socialData.providerId,
              email: socialData.email,
              displayName: socialData.displayName,
              photos: socialData.photos,
            },
          },
        },
        include: {
          socialAccounts: true,
          jobSeeker: true,
          employer: true,
          admin: true,
        },
      });

      // Clear social profile data and role from session
      delete req.session.socialProfileData;
      delete req.session.pendingOAuthRole;

      setAuthCookies(res, user.id);

      // Send response with user data and token
      res.status(201).json({
        success: true,
        message: "Social authentication completed successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            role: user.role,
            isVerified: user.isVerified,
            hasProfile: false, // New user, no profile yet
          },
        },
      });
    } catch (error) {
      // Clear session data on error
      delete req.session.socialProfileData;
      delete req.session.pendingOAuthRole;
      throw error;
    }
  }
);

// Refresh access token and rotate refresh token
export const refreshToken = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const refreshTokenCookie = req.cookies?.refresh_token;

    if (!refreshTokenCookie) {
      throw new AppError("Refresh token is required", 401);
    }

    const decoded = verifyRefreshToken(refreshTokenCookie);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Rotate both tokens on refresh
    setAuthCookies(res, user.id);

    res.status(200).json({
      success: true,
      message: "Session refreshed",
    });
  }
);

// Issue a short-lived socket token derived from authenticated cookie session
export const getSocketToken = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const socketToken = generateSocketToken(req.user.id);
    res.status(200).json({
      success: true,
      data: { token: socketToken },
    });
  }
);
