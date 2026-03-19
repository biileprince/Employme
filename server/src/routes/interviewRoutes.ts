import { Router } from "express";
import {
  updateInterview,
  getInterview,
  deleteInterview,
} from "../controllers/interviewController.js";
import { authMiddleware, employerOnly } from "../middleware/auth.js";
import { interviewMutationRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All interview routes require authentication
router.use(authMiddleware);

// Interview management routes
router.get("/:id", getInterview);
router.put("/:id", employerOnly, interviewMutationRateLimiter, updateInterview);
router.delete(
  "/:id",
  employerOnly,
  interviewMutationRateLimiter,
  deleteInterview,
);

export default router;
