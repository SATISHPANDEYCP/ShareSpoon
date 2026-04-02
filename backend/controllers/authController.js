import User from '../models/User.js';
import { sendTokenResponse } from '../utils/tokenUtils.js';
import { sendOtpEmail } from '../utils/emailUtils.js';

const OTP_EXPIRY_MINUTES = 10;

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const generateFallbackPassword = () => {
  const randomPart = Math.random().toString(36).slice(-10);
  return `Admin#${randomPart}A1`;
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, location } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();

    if (adminEmail && normalizedEmail === adminEmail) {
      return res.status(403).json({
        success: false,
        message: 'This email is reserved for admin login and cannot be registered'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    let user;

    if (existingUser && !existingUser.emailVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.phone = phone;
      existingUser.address = address;
      existingUser.location = location;
      existingUser.emailVerificationOtp = otp;
      existingUser.emailVerificationOtpExpiry = otpExpiry;
      user = await existingUser.save();
    } else {
      // Create user
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        phone,
        address,
        location,
        emailVerified: false,
        emailVerificationOtp: otp,
        emailVerificationOtpExpiry: otpExpiry
      });
    }

    await sendOtpEmail({
      to: normalizedEmail,
      name,
      otp
    });

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Verify to continue.',
      requiresEmailVerification: true,
      email: user.email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in user registration',
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword && normalizedEmail === adminEmail) {
      if (password !== adminPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'System Admin',
          email: adminEmail,
          password: generateFallbackPassword(),
          role: 'admin',
          emailVerified: true
        });
      } else {
        adminUser.role = 'admin';
        adminUser.emailVerified = true;
        adminUser.isBanned = false;
        await adminUser.save();
      }

      return sendTokenResponse(adminUser, 200, res, 'Admin login successful');
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned. Contact support.'
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, address, location } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone) fieldsToUpdate.phone = phone;
    if (bio) fieldsToUpdate.bio = bio;
    if (address) fieldsToUpdate.address = address;
    if (location) fieldsToUpdate.location = location;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationOtp +emailVerificationOtpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified'
      });
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP found. Please request a new OTP.'
      });
    }

    if (user.emailVerificationOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    if (user.emailVerificationOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    user.emailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

/**
 * @desc    Resend verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationOtp +emailVerificationOtpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const otp = generateOtp();
    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp
    });

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

/**
 * @desc    Check OTP email delivery health
 * @route   GET /api/auth/email-health
 * @access  Private/Admin
 */
export const emailHealthCheck = async (req, res) => {
  try {
    await sendOtpEmail({
      to: req.user.email,
      name: req.user.name,
      otp: '112233'
    });

    return res.status(200).json({
      success: true,
      message: 'Email service is healthy. Test OTP sent successfully.'
    });
  } catch (error) {
    console.error('Email health check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email service check failed',
      error: error.message
    });
  }
};
