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
} from "../controllers/userController.js";

const router = Router();

// All user routes already have authentication via middleware in main app
router.get("/me", getCurrentUser);
router.get("/employer/:id", getEmployerProfile); // Public route for company profiles
router.get("/candidates", getCandidates);
router.put("/profile", updateProfile);

// Profile creation routes
router.post("/profile/job-seeker", createJobSeekerProfile);
router.post("/profile/employer", createEmployerProfile);

// Profile update routes
router.put("/profile/job-seeker", updateJobSeekerProfile);
router.put("/profile/employer", updateEmployerProfile);

// Account management
router.delete("/account", deleteAccount);

export default router;
