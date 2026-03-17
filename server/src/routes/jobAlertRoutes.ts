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

const router = Router();

router.get("/", getMyJobAlerts);
router.post("/", createJobAlert);
router.patch("/:id", updateJobAlert);
router.delete("/:id", deleteJobAlert);

router.get("/notifications", getMyNotifications);
router.patch("/notifications/read-all", markAllNotificationsAsRead);
router.patch("/notifications/:id/read", markNotificationAsRead);

export default router;
