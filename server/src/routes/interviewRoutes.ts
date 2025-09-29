import { Router } from "express";
import {
  updateInterview,
  getInterview,
  deleteInterview,
} from "../controllers/interviewController.js";
import { authMiddleware, employerOnly } from "../middleware/auth.js";

const router = Router();

// All interview routes require authentication
router.use(authMiddleware);

// Interview management routes
router.get("/:id", getInterview);
router.put("/:id", employerOnly, updateInterview);
router.delete("/:id", employerOnly, deleteInterview);

export default router;
