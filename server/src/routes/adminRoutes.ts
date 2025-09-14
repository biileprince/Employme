import { Router } from 'express';
import {
  getSystemStats,
  getAllUsers,
  toggleUserStatus
} from '../controllers/adminController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Admin dashboard routes
router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

export default router;
