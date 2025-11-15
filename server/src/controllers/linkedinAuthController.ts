import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../middleware/auth.js";
import { catchAsync, AppError } from "../middleware/errorHandler.js";

// Extend session type
declare module "express-session" {
  interface SessionData {
    linkedinState?: string;
    pendingOAuthRole?: string;
  }
}

const prisma = new PrismaClient();

// LinkedIn OAuth Configuration
const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID || "",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  redirectUri:
    process.env.LINKEDIN_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 5001}/api/auth/linkedin/callback`,
  scope: "openid profile email",
  authURL: "https://www.linkedin.com/oauth/v2/authorization",
  tokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
  userInfoURL: "https://api.linkedin.com/v2/userinfo",
};

// Generate LinkedIn OAuth URL
export const initiateLinkedInAuth = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const state = Math.random().toString(36).substring(7); // Generate random state

    // Store state in session for security
    req.session.linkedinState = state;

    const authURL = new URL(LINKEDIN_CONFIG.authURL);
    authURL.searchParams.append("response_type", "code");
    authURL.searchParams.append("client_id", LINKEDIN_CONFIG.clientId);
    authURL.searchParams.append("redirect_uri", LINKEDIN_CONFIG.redirectUri);
    authURL.searchParams.append("state", state);
    authURL.searchParams.append("scope", LINKEDIN_CONFIG.scope);

    // Redirect to LinkedIn OAuth
    res.redirect(authURL.toString());
  }
);

// Handle LinkedIn OAuth callback
export const handleLinkedInCallback = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
      return res.redirect(
        `${frontendUrl}/auth?error=linkedin_auth_failed&message=${error}`
      );
    }

    // Verify state parameter for security
    if (state !== req.session.linkedinState) {
      throw new AppError("Invalid state parameter", 400);
    }

    if (!code) {
      throw new AppError("Authorization code not provided", 400);
    }

    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await fetch(LINKEDIN_CONFIG.tokenURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: LINKEDIN_CONFIG.redirectUri,
          client_id: LINKEDIN_CONFIG.clientId,
          client_secret: LINKEDIN_CONFIG.clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new AppError(`Failed to get access token: ${errorText}`, 400);
      }

      const tokenData = await tokenResponse.json();
      const { access_token } = tokenData;

      if (!access_token) {
        throw new AppError("No access token received", 400);
      }

      // Step 2: Get user profile
      const profileResponse = await fetch(LINKEDIN_CONFIG.userInfoURL, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new AppError(`Failed to get user profile: ${errorText}`, 400);
      }

      const profileData = await profileResponse.json();

      // Step 3: Find or create user
      let user = await findOrCreateUser(req, profileData);

      // Step 4: Generate JWT token
      const token = generateToken(user.id);

      // Step 5: Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Step 6: Clean up session
      delete req.session.linkedinState;
      delete (req.session as any).pendingOAuthRole;

      // Step 7: Redirect to frontend
      const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";

      // Determine if user needs to complete profile
      const hasProfile =
        !!(user.role === "JOB_SEEKER" && user.jobSeeker) ||
        !!(user.role === "EMPLOYER" && user.employer) ||
        !!(user.role === "ADMIN" && user.admin);

      let redirectUrl: string;

      if (!hasProfile) {
        // User needs to complete profile
        redirectUrl = `${frontendUrl}/onboarding?token=${token}&social=true&auth=success`;
      } else {
        // User has complete profile - redirect to appropriate dashboard
        if (user.role === "EMPLOYER") {
          redirectUrl = `${frontendUrl}/employer/dashboard?token=${token}&social=true&auth=success`;
        } else if (user.role === "JOB_SEEKER") {
          redirectUrl = `${frontendUrl}/job-seeker/dashboard?token=${token}&social=true&auth=success`;
        } else {
          redirectUrl = `${frontendUrl}/admin/dashboard?token=${token}&social=true&auth=success`;
        }
      }

      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error("LinkedIn OAuth error:", error);
      const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
      res.redirect(
        `${frontendUrl}/auth?error=linkedin_auth_failed&message=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }
);

// Helper function to find or create user
async function findOrCreateUser(req: Request, profileData: any) {
  const {
    sub: providerId,
    email,
    given_name,
    family_name,
    name,
    picture,
  } = profileData;

  if (!email) {
    throw new AppError("No email provided by LinkedIn", 400);
  }

  // Check if user already exists with this LinkedIn ID
  let user = await prisma.user.findFirst({
    where: {
      socialAccounts: {
        some: {
          provider: "linkedin",
          providerId: providerId,
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

  if (user) {
    return user;
  }

  // Check if user exists with the same email
  user = await prisma.user.findUnique({
    where: { email },
    include: {
      socialAccounts: true,
      jobSeeker: true,
      employer: true,
      admin: true,
    },
  });

  if (user) {
    // Link the social account to existing user
    await prisma.socialAccount.create({
      data: {
        userId: user.id,
        provider: "linkedin",
        providerId: providerId,
        email: email,
        displayName: name || `${given_name} ${family_name}`.trim(),
        photos: picture || null,
      },
    });

    // Refresh user data
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        socialAccounts: true,
        jobSeeker: true,
        employer: true,
        admin: true,
      },
    });

    return user!;
  }

  // Create new user with social account
  user = await prisma.user.create({
    data: {
      email,
      firstName: given_name || "",
      lastName: family_name || "",
      imageUrl: picture || null,
      password: "", // No password for social login
      isVerified: true, // Social accounts are pre-verified
      role: (req.session as any)?.pendingOAuthRole || "JOB_SEEKER",
      socialAccounts: {
        create: {
          provider: "linkedin",
          providerId: providerId,
          email: email,
          displayName: name || `${given_name} ${family_name}`.trim(),
          photos: picture || null,
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

  return user;
}
