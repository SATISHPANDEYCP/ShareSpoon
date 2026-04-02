import express from 'express';
import {
  register,
  login,
  verifyEmailOtp,
  resendOtp,
  emailHealthCheck,
  getMe,
  updateProfile,
  updatePassword,
  logout
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendOtpValidation
} from '../middleware/validation.js';

const router = express.Router();

/**
 * Auth routes
 */
router.post('/register', registerValidation, register);
router.post('/verify-otp', verifyOtpValidation, verifyEmailOtp);
router.post('/resend-otp', resendOtpValidation, resendOtp);
router.post('/login', loginValidation, login);
router.get('/email-health', protect, authorize('admin'), emailHealthCheck);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);

export default router;
