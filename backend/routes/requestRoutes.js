import express from 'express';
import {
  createRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  confirmPickup,
  cancelRequest
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createRequestValidation, idValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * Request routes
 */
router.get('/received', protect, getReceivedRequests);
router.get('/sent', protect, getSentRequests);
router.post('/:postId', protect, createRequestValidation, createRequest);
router.put('/:id/accept', protect, idValidation, acceptRequest);
router.put('/:id/reject', protect, idValidation, rejectRequest);
router.put('/:id/confirm', protect, idValidation, confirmPickup);
router.delete('/:id', protect, idValidation, cancelRequest);

export default router;
