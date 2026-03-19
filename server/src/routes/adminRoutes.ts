import { Router } from "express";
import {
  getSystemStats,
  getAllUsers,
  toggleUserStatus,
  toggleUserVerification,
  deleteUser,
  getAllJobs,
  getPendingJobs,
  manageJob,
  deleteJob,
  getAllApplications,
  deleteApplication,
  updateApplicationStatus,
  createAdminUser,
  getAdminProfile,
  getAllEmployers,
  getPendingEmployers,
  updateEmployerVerification,
} from "../controllers/adminController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";
import { adminMutationRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Admin dashboard routes
router.get("/stats", getSystemStats);

// User management
router.get("/users", getAllUsers);
router.patch(
  "/users/:id/toggle-status",
  adminMutationRateLimiter,
  toggleUserStatus,
);
router.patch(
  "/users/:id/toggle-verification",
  adminMutationRateLimiter,
  toggleUserVerification,
);
router.delete("/users/:id", adminMutationRateLimiter, deleteUser);

// Employer verification management
router.get("/employers", getAllEmployers);
router.get("/employers/pending", getPendingEmployers);
router.patch(
  "/employers/:employerId/verification",
  adminMutationRateLimiter,
  updateEmployerVerification,
);

// Job management routes
router.get("/jobs", getAllJobs);
router.get("/jobs/pending", getPendingJobs);
router.patch("/jobs/:id", adminMutationRateLimiter, manageJob);
router.delete("/jobs/:id", adminMutationRateLimiter, deleteJob);

// Application management routes
router.get("/applications", getAllApplications);
router.delete("/applications/:id", adminMutationRateLimiter, deleteApplication);
router.patch(
  "/applications/:id/status",
  adminMutationRateLimiter,
  updateApplicationStatus,
);

// Admin creation route
router.post("/create-admin", adminMutationRateLimiter, createAdminUser);

// Admin profile
router.get("/profile", getAdminProfile);

export default router;
