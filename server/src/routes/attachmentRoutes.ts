import { Router } from 'express';
import {
  uploadAttachment,
  getAttachments,
  getAttachmentById,
  deleteAttachment,
  updateAttachment,
  getUserAttachments
} from '../controllers/attachmentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All attachment routes require authentication
router.use(authMiddleware);

router.post('/upload', uploadAttachment);
router.get('/my-attachments', getUserAttachments);
router.get('/:entityType/:entityId', getAttachments); // Get attachments for job, user, or application
router.get('/single/:id', getAttachmentById);
router.put('/:id', updateAttachment);
router.delete('/:id', deleteAttachment);

export default router;
