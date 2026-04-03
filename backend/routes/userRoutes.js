import express from 'express';
import {
  getUserProfile,
  updateAvatar,
  getNearbyUsers,
  getDonationHistory,
  getReceivedHistory,
  deleteMyProfile
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { idValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * User routes
 */
router.get('/nearby', protect, getNearbyUsers);
router.get('/donations', protect, getDonationHistory);
router.get('/received', protect, getReceivedHistory);
router.put('/avatar', protect, upload.single('avatar'), handleUploadError, updateAvatar);
router.delete('/me', protect, deleteMyProfile);
router.get('/:id', idValidation, getUserProfile);

export default router;
