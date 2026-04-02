import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * Auth routes
 */
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);

export default router;
