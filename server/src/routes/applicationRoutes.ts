import { Router } from 'express';
import {
  applyForJob,
  getJobApplications,
  getEmployerApplications,
  getMyApplications,
  updateApplicationStatus,
  getApplicationById
} from '../controllers/applicationController.js';
import { authMiddleware, employerOnly } from '../middleware/auth.js';

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

// Job seeker routes
router.post('/apply', applyForJob);
router.get('/my-applications', getMyApplications);
router.get('/:id', getApplicationById);

// Employer routes
router.get('/employer', employerOnly, getEmployerApplications);
router.get('/job/:jobId', employerOnly, getJobApplications);
router.patch('/:id/status', employerOnly, updateApplicationStatus);

export default router;
