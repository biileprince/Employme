import { Router } from "express";
import {
  createJobAlert,
  deleteJobAlert,
  getMyJobAlerts,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateJobAlert,
} from "../controllers/jobAlertController.js";
import { jobAlertMutationRateLimiter } from "../middleware/rateLimiter.js";
import { validateNotificationQuery } from "../middleware/validation.js";

const router = Router();

router.get("/", getMyJobAlerts);
router.post("/", jobAlertMutationRateLimiter, createJobAlert);
router.patch("/:id", jobAlertMutationRateLimiter, updateJobAlert);
router.delete("/:id", jobAlertMutationRateLimiter, deleteJobAlert);

router.get("/notifications", validateNotificationQuery, getMyNotifications);
router.patch(
  "/notifications/read-all",
  jobAlertMutationRateLimiter,
  markAllNotificationsAsRead,
);
router.patch(
  "/notifications/:id/read",
  jobAlertMutationRateLimiter,
  markNotificationAsRead,
);

export default router;
