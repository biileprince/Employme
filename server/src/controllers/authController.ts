import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync, AppError } from "../middleware/errorHandler.js";
import { generateToken } from "../middleware/auth.js";
import {
  generateVerificationCode,
  generatePasswordResetCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../services/emailService.js";
import passport from "../middleware/passport.js";

const prisma = new PrismaClient();

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

    // Generate JWT token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

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
        token,
      },
    });
  }
);

// Logout user
export const logout = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

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

    // Generate JWT token for automatic login after verification
    const jwtToken = generateToken(updatedUser.id);

    // Set cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

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
        token: jwtToken,
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

    // Generate JWT token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Determine if user needs to complete profile
    const hasProfile =
      !!(user.role === "JOB_SEEKER" && user.jobSeeker) ||
      !!(user.role === "EMPLOYER" && user.employer) ||
      !!(user.role === "ADMIN" && user.admin);

    // Redirect to frontend with success
    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const redirectUrl = hasProfile
      ? `${frontendUrl}/dashboard?auth=success`
      : `${frontendUrl}/onboarding?auth=success`;

    res.redirect(redirectUrl);
  }
);

// Social Authentication Failure Handler
export const socialAuthFailure = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth?error=social_auth_failed`);
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
