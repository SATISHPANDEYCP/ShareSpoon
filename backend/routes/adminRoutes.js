import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  getAllPosts,
  toggleBanUser,
  removePost,
  deleteUser,
  getReportedContent,
  toggleHideReview
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { idValidation, paginationValidation } from '../middleware/validation.js';

const router = express.Router();

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * Admin routes
 */
router.get('/stats', getAdminStats);
router.get('/users', paginationValidation, getAllUsers);
router.get('/posts', paginationValidation, getAllPosts);
router.get('/reported', getReportedContent);
router.put('/users/:id/ban', idValidation, toggleBanUser);
router.delete('/users/:id', idValidation, deleteUser);
router.delete('/posts/:id', idValidation, removePost);
router.put('/reviews/:id/hide', idValidation, toggleHideReview);

export default router;
