import { Router } from "express";
import {
  applyForJob,
  getJobApplications,
  getEmployerApplications,
  getMyApplications,
  updateApplicationStatus,
  getApplicationById,
  scheduleInterview,
  getApplicationInterviews,
} from "../controllers/applicationController.js";
import { authMiddleware, employerOnly } from "../middleware/auth.js";

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

// Job seeker routes
router.post("/apply", applyForJob);
router.get("/my-applications", getMyApplications);

// Employer routes (must come before /:id route)
router.get("/employer", employerOnly, getEmployerApplications);
router.get("/:id", getApplicationById);
router.get("/job/:jobId", employerOnly, getJobApplications);
router.patch("/:id/status", employerOnly, updateApplicationStatus);

// Interview scheduling routes
router.post("/:id/schedule-interview", employerOnly, scheduleInterview);
router.get("/:id/interviews", getApplicationInterviews);

export default router;
