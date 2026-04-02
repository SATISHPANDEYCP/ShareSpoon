import User from '../models/User.js';
import FoodPost from '../models/FoodPost.js';
import Review from '../models/Review.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils.js';

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's stats
    const totalPosts = await FoodPost.countDocuments({ donor: user._id });
    const completedDonations = await FoodPost.countDocuments({ 
      donor: user._id, 
      status: 'completed' 
    });

    // Get recent reviews
    const reviews = await Review.find({ reviewee: user._id, isHidden: false })
      .populate('reviewer', 'name avatar')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          totalPosts,
          completedDonations
        }
      },
      reviews
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user avatar
 * @route   PUT /api/users/avatar
 * @access  Private
 */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Get current user
    const user = await User.findById(req.user.id);

    // Delete old avatar from Cloudinary if exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
      await deleteFromCloudinary(publicId);
    }

    // Upload new avatar
    const result = await uploadToCloudinary(req.file.buffer, 'food-sharing/avatars');

    // Update user
    user.avatar = result.url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: result.url
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating avatar',
      error: error.message
    });
  }
};

/**
 * @desc    Get users near a location
 * @route   GET /api/users/nearby
 * @access  Private
 */
export const getNearbyUsers = async (req, res) => {
  try {
    const { longitude, latitude, radius = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    // Find users within radius (in kilometers)
    const users = await User.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      _id: { $ne: req.user.id }, // Exclude current user
      isActive: true,
      isBanned: false
    }).select('name avatar rating totalReviews foodDonated foodReceived');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby users',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's donation history
 * @route   GET /api/users/donations
 * @access  Private
 */
export const getDonationHistory = async (req, res) => {
  try {
    const posts = await FoodPost.find({ donor: req.user.id })
      .populate('receiver', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation history',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's received food history
 * @route   GET /api/users/received
 * @access  Private
 */
export const getReceivedHistory = async (req, res) => {
  try {
    const posts = await FoodPost.find({ receiver: req.user.id })
      .populate('donor', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get received history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received history',
      error: error.message
    });
  }
};
