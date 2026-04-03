import express from 'express';
import {
  createReview,
  getUserReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  reportReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  createReviewValidation,
  updateReviewValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation.js';

const router = express.Router();

/**
 * Review routes
 */
router.get('/my-reviews', protect, getMyReviews);
router.get('/user/:userId', paginationValidation, getUserReviews);
router.post('/:requestId', protect, createReviewValidation, createReview);
router.put('/:id', protect, idValidation, updateReviewValidation, updateReview);
router.delete('/:id', protect, idValidation, deleteReview);
router.put('/:id/report', protect, idValidation, reportReview);

export default router;
