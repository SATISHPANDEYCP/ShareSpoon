import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
  expirePost,
  unexpirePost,
  searchPosts
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import {
  createPostValidation,
  idValidation,
  paginationValidation
} from '../middleware/validation.js';

const router = express.Router();

/**
 * Food Post routes
 */
router.get('/search', searchPosts);
router.get('/my/posts', protect, getMyPosts);
router.post(
  '/',
  protect,
  upload.array('images', 5),
  handleUploadError,
  createPostValidation,
  createPost
);
router.get('/', paginationValidation, optionalAuth, getPosts);
router.get('/:id', idValidation, getPostById);
router.put('/:id', protect, idValidation, updatePost);
router.delete('/:id', protect, idValidation, deletePost);
router.put('/:id/expire', protect, idValidation, expirePost);
router.put('/:id/unexpire', protect, idValidation, unexpirePost);

export default router;
