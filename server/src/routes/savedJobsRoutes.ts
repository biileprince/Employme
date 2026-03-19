import { Router } from "express";
import {
  saveJob,
  removeSavedJob,
  getSavedJobs,
  checkIfJobSaved,
  toggleSaveJob,
  getSavedJobsCount,
} from "../controllers/savedJobsController.js";
import { authMiddleware, jobSeekerOnly } from "../middleware/auth.js";
import { savedJobMutationRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All saved job routes require job seeker role (auth already applied at app level)
router.use(jobSeekerOnly);

router.post("/save", savedJobMutationRateLimiter, saveJob);
router.post("/remove", savedJobMutationRateLimiter, removeSavedJob);
router.get("/", getSavedJobs);
router.get("/count", getSavedJobsCount);
router.get("/check/:jobId", checkIfJobSaved);
router.post("/toggle", savedJobMutationRateLimiter, toggleSaveJob);

export default router;
