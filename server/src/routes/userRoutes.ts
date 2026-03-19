import { Router } from "express";
import {
  getCurrentUser,
  getEmployerProfile,
  updateProfile,
  createJobSeekerProfile,
  createEmployerProfile,
  updateJobSeekerProfile,
  updateEmployerProfile,
  deleteAccount,
  getCandidates,
  getEmployerCandidates,
} from "../controllers/userController.js";
import { profileMutationRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All user routes already have authentication via middleware in main app
router.get("/me", getCurrentUser);
router.get("/employer/:id", getEmployerProfile); // Public route for company profiles
router.get("/candidates", getCandidates);
router.get("/my-candidates", getEmployerCandidates); // Get candidates who applied to employer's jobs
router.put("/profile", profileMutationRateLimiter, updateProfile);

// Profile creation routes
router.post(
  "/profile/job-seeker",
  profileMutationRateLimiter,
  createJobSeekerProfile,
);
router.post(
  "/profile/employer",
  profileMutationRateLimiter,
  createEmployerProfile,
);

// Profile update routes
router.put(
  "/profile/job-seeker",
  profileMutationRateLimiter,
  updateJobSeekerProfile,
);
router.put(
  "/profile/employer",
  profileMutationRateLimiter,
  updateEmployerProfile,
);

// Account management
router.delete("/account", profileMutationRateLimiter, deleteAccount);

export default router;
