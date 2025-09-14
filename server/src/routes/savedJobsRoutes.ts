import { Router } from 'express';
import {
  saveJob,
  removeSavedJob,
  getSavedJobs,
  checkIfJobSaved,
  toggleSaveJob,
  getSavedJobsCount
} from '../controllers/savedJobsController.js';
import { authMiddleware, jobSeekerOnly } from '../middleware/auth.js';

const router = Router();

// All saved job routes require authentication and job seeker role
router.use(authMiddleware);
router.use(jobSeekerOnly);

router.post('/save', saveJob);
router.post('/remove', removeSavedJob);
router.get('/', getSavedJobs);
router.get('/count', getSavedJobsCount);
router.get('/check/:jobId', checkIfJobSaved);
router.post('/toggle', toggleSaveJob);

export default router;
