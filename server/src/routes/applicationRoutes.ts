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
import { applicationSubmissionRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

// IMPORTANT: Specific routes MUST come before dynamic parameter routes
// Job seeker routes - specific paths first
router.get("/my-applications", getMyApplications);
router.post("/apply", applicationSubmissionRateLimiter, applyForJob); // Accept jobId in request body

// Employer routes - specific paths first
router.get("/employer", employerOnly, getEmployerApplications);

// Dynamic parameter routes - must come after specific routes
router.post("/:id/apply", applicationSubmissionRateLimiter, applyForJob); // Legacy route - accept jobId as URL param
router.get("/:id", getApplicationById);
router.get("/job/:jobId", employerOnly, getJobApplications);
router.patch("/:id/status", employerOnly, updateApplicationStatus);

// Interview scheduling routes
router.post("/:id/schedule-interview", employerOnly, scheduleInterview);
router.get("/:id/interviews", getApplicationInterviews);

export default router;
