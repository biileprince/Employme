import { Router } from "express";
import {
  getSystemStats,
  getAllUsers,
  toggleUserStatus,
  toggleUserVerification,
  deleteUser,
  getAllJobs,
  manageJob,
  deleteJob,
  getAllApplications,
  createAdminUser,
  getAdminProfile,
} from "../controllers/adminController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Admin dashboard routes
router.get("/stats", getSystemStats);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.patch("/users/:id/toggle-verification", toggleUserVerification);
router.delete("/users/:id", deleteUser);

// Job management routes (to be implemented)
router.get("/jobs", getAllJobs);
router.patch("/jobs/:id", manageJob);
router.delete("/jobs/:id", deleteJob);

// Application management routes (to be implemented)
router.get("/applications", getAllApplications);

// Admin creation route
router.post("/create-admin", createAdminUser);

// Admin profile
router.get("/profile", getAdminProfile);

export default router;
