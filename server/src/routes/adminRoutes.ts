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

// Employer verification management
router.get("/employers", getAllEmployers);
router.get("/employers/pending", getPendingEmployers);
router.patch("/employers/:employerId/verification", updateEmployerVerification);

// Job management routes
router.get("/jobs", getAllJobs);
router.get("/jobs/pending", getPendingJobs);
router.patch("/jobs/:id", manageJob);
router.delete("/jobs/:id", deleteJob);

// Application management routes
router.get("/applications", getAllApplications);
router.delete("/applications/:id", deleteApplication);
router.patch("/applications/:id/status", updateApplicationStatus);

// Admin creation route
router.post("/create-admin", createAdminUser);

// Admin profile
router.get("/profile", getAdminProfile);

export default router;
