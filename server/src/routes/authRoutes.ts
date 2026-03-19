import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  verifyEmail,
  resendVerificationEmail,
  resetPassword,
  socialAuthSuccess,
  socialAuthFailure,
  linkSocialAccount,
  unlinkSocialAccount,
  completeSocialAuthRegistration,
  getSocketToken,
} from "../controllers/authController.js";
import {
  initiateLinkedInAuth,
  handleLinkedInCallback,
} from "../controllers/linkedinAuthController.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
} from "../middleware/validation.js";
import {
  signupRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
} from "../middleware/rateLimiter.js";
import passport from "../middleware/passport.js";

const router = express.Router();

// Public routes
router.post("/register", signupRateLimiter, validateRegistration, register);
router.post("/login", loginRateLimiter, validateLogin, login);
router.post("/refresh", refreshToken);
router.post(
  "/logout",
  (req, res, next) => {
    // Clear passport session
    req.logout(() => {});
    next();
  },
  logout,
);
router.post("/forgot-password", passwordResetRateLimiter, requestPasswordReset);
router.post("/reset-password", passwordResetRateLimiter, resetPassword);
router.post("/verify-email", emailVerificationRateLimiter, verifyEmail);
router.post(
  "/resend-verification",
  emailVerificationRateLimiter,
  resendVerificationEmail,
);
router.post("/complete-social-auth", completeSocialAuthRegistration);

// Social Authentication Routes
// Middleware to store role in session before OAuth
const storeRoleInSession = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const role = req.query.role as string;
  if (role && (role === "JOB_SEEKER" || role === "EMPLOYER")) {
    req.session.pendingOAuthRole = role;
    console.log("Stored OAuth role in session:", role);
  }

  // Persist frontend origin so callback redirects return to the same app (Next.js/Vite).
  const referer = req.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      const allowedOrigins = new Set(
        [
          process.env.NEXT_CLIENT_URL,
          process.env.CLIENT_URL,
          "http://localhost:3000",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
        ].filter(Boolean) as string[],
      );

      if (allowedOrigins.has(refererOrigin)) {
        (req.session as any).pendingOAuthOrigin = refererOrigin;
      }
    } catch {
      // Ignore malformed referer
    }
  }

  next();
};

// Google OAuth
router.get(
  "/google",
  storeRoleInSession,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/failure",
  }),
  socialAuthSuccess,
);

// LinkedIn OAuth (Manual Implementation)
router.get("/linkedin", storeRoleInSession, initiateLinkedInAuth);
router.get("/linkedin/callback", handleLinkedInCallback);

// Facebook OAuth
router.get(
  "/facebook",
  storeRoleInSession,
  passport.authenticate("facebook", {
    scope: ["email"],
  }),
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/api/auth/failure",
  }),
  socialAuthSuccess,
);

// Social auth failure route
router.get("/failure", socialAuthFailure);

// OAuth configuration debug route (development only)
router.get("/oauth-config", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Missing",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `http://localhost:${process.env.PORT || 5001}/api/auth/google/callback`,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID ? "Set" : "Missing",
      appSecret: process.env.FACEBOOK_APP_SECRET ? "Set" : "Missing",
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        `http://localhost:${
          process.env.PORT || 5001
        }/api/auth/facebook/callback`,
    },
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    nextClientUrl: process.env.NEXT_CLIENT_URL || "http://localhost:3000",
  });
});

// Clear session route (to fix OAuth issues)
router.post("/clear-session", (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.clearCookie("connect.sid"); // Default session cookie name
      res.clearCookie("token");
      res.clearCookie("access_token");
      res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
      res.json({ success: true, message: "Session cleared" });
    });
  });
});

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);
router.get("/socket-token", authMiddleware, getSocketToken);
router.post("/change-password", authMiddleware, changePassword);
router.post("/link-social", authMiddleware, linkSocialAccount);
router.post("/unlink-social", authMiddleware, unlinkSocialAccount);

export default router;
