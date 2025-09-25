import { Router } from "express";
import {
  getJobs,
  getJobById,
  getMyJobs,
  createJob,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import {
  requireAuth,
  requireEmployer,
  optionalAuth,
} from "../middleware/auth.js";

const router = Router();

// Public routes (with optional auth for enhanced features)
router.get("/", optionalAuth, getJobs);

// Protected routes (require authentication and employer role)
router.get("/my-jobs", requireAuth, requireEmployer, getMyJobs);

// Public route with dynamic parameter (must come after specific routes)
router.get("/:id", optionalAuth, getJobById);

// More protected routes
router.post("/", requireAuth, requireEmployer, createJob);
router.put("/:id", requireAuth, requireEmployer, updateJob);
router.delete("/:id", requireAuth, requireEmployer, deleteJob);

export default router;
