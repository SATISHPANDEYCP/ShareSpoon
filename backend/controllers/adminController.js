import User from '../models/User.js';
import FoodPost from '../models/FoodPost.js';
import Request from '../models/Request.js';
import Review from '../models/Review.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getAdminStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalPosts = await FoodPost.countDocuments();
    const totalRequests = await Request.countDocuments();
    const completedDonations = await FoodPost.countDocuments({ status: 'completed' });
    const activePosts = await FoodPost.countDocuments({ status: 'available' });

    // User stats
    const activeUsers = await User.countDocuments({ isActive: true, isBanned: false });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Post stats by status
    const postsByStatus = await FoodPost.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Post stats by food type
    const postsByFoodType = await FoodPost.aggregate([
      {
        $group: {
          _id: '$foodType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email avatar createdAt');

    const recentPosts = await FoodPost.find()
      .populate('donor', 'name avatar')
      .sort('-createdAt')
      .limit(5);

    // Top donors
    const topDonors = await User.find()
      .sort('-foodDonated')
      .limit(5)
      .select('name avatar foodDonated rating');

    // Reported content
    const reportedPosts = await FoodPost.countDocuments({ isReported: true });
    const reportedReviews = await Review.countDocuments({ isReported: true });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers
        },
        posts: {
          total: totalPosts,
          active: activePosts,
          completed: completedDonations,
          byStatus: postsByStatus,
          byFoodType: postsByFoodType
        },
        requests: {
          total: totalRequests
        },
        reported: {
          posts: reportedPosts,
          reviews: reportedReviews
        }
      },
      recentActivity: {
        users: recentUsers,
        posts: recentPosts
      },
      topDonors
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get all users with filters
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isActive = true;
      query.isBanned = false;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * @desc    Get all food posts with filters
 * @route   GET /api/admin/posts
 * @access  Private/Admin
 */
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, reported } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (reported === 'true') {
      query.isReported = true;
    }

    const posts = await FoodPost.find(query)
      .populate('donor', 'name email avatar')
      .populate('receiver', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await FoodPost.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      posts
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

/**
 * @desc    Ban/Unban a user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Private/Admin
 */
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot ban admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      user
    });
  } catch (error) {
    console.error('Toggle ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user ban status',
      error: error.message
    });
  }
};

/**
 * @desc    Remove a food post
 * @route   DELETE /api/admin/posts/:id
 * @access  Private/Admin
 */
export const removePost = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.isRemoved = true;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post removed successfully'
    });
  } catch (error) {
    console.error('Remove post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing post',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a user permanently
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

/**
 * @desc    Get reported content
 * @route   GET /api/admin/reported
 * @access  Private/Admin
 */
export const getReportedContent = async (req, res) => {
  try {
    const reportedPosts = await FoodPost.find({ isReported: true })
      .populate('donor', 'name email avatar')
      .sort('-createdAt')
      .limit(20);

    const reportedReviews = await Review.find({ isReported: true })
      .populate('reviewer', 'name avatar')
      .populate('reviewee', 'name avatar')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      reported: {
        posts: reportedPosts,
        reviews: reportedReviews
      }
    });
  } catch (error) {
    console.error('Get reported content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reported content',
      error: error.message
    });
  }
};

/**
 * @desc    Hide/Unhide a review
 * @route   PUT /api/admin/reviews/:id/hide
 * @access  Private/Admin
 */
export const toggleHideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    res.status(200).json({
      success: true,
      message: review.isHidden ? 'Review hidden successfully' : 'Review unhidden successfully',
      review
    });
  } catch (error) {
    console.error('Toggle hide review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review visibility',
      error: error.message
    });
  }
};
