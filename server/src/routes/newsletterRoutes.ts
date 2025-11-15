import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getNewsletterSubscriptions,
  getNewsletterAnalytics,
  deleteNewsletterSubscription,
  exportNewsletterEmails,
} from "../controllers/newsletterController.js";

const router = Router();

// Public routes
router.post("/subscribe", subscribeNewsletter);
router.post("/unsubscribe", unsubscribeNewsletter);

// Admin-only routes
router.get(
  "/subscriptions",
  authMiddleware,
  requireAdmin,
  getNewsletterSubscriptions
);

router.get("/analytics", authMiddleware, requireAdmin, getNewsletterAnalytics);

router.delete(
  "/subscriptions/:id",
  authMiddleware,
  requireAdmin,
  deleteNewsletterSubscription
);

router.get("/export", authMiddleware, requireAdmin, exportNewsletterEmails);

export default router;
