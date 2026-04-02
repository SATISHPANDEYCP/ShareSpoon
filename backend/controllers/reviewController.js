import Review from '../models/Review.js';
import Request from '../models/Request.js';
import FoodPost from '../models/FoodPost.js';

/**
 * @desc    Create a review
 * @route   POST /api/reviews/:requestId
 * @access  Private
 */
export const createReview = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rating, comment } = req.body;

    // Check if request exists
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if request is completed
    if (request.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed transactions'
      });
    }

    // Determine reviewer and reviewee
    let reviewee, type;
    if (req.user.id === request.requester.toString()) {
      // Requester reviewing donor
      reviewee = request.donor;
      type = 'donor';
    } else if (req.user.id === request.donor.toString()) {
      // Donor reviewing requester
      reviewee = request.requester;
      type = 'receiver';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this transaction'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      reviewee,
      post: request.post
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this transaction'
      });
    }

    // Create review
    const review = await Review.create({
      post: request.post,
      request: requestId,
      reviewer: req.user.id,
      reviewee,
      rating,
      comment,
      type
    });

    // Populate reviewer data
    await review.populate('reviewer', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({
      reviewee: userId,
      isHidden: false
    })
      .populate('reviewer', 'name avatar')
      .populate('post', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments({
      reviewee: userId,
      isHidden: false
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      reviews
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews written by a user
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user.id })
      .populate('reviewee', 'name avatar')
      .populate('post', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private (Owner only)
 */
export const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, comment } = req.body;

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Owner only)
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    // Recalculate user rating
    const stats = await Review.calculateAverageRating(review.reviewee);
    const User = require('../models/User');
    await User.findByIdAndUpdate(review.reviewee, {
      rating: stats.rating,
      totalReviews: stats.totalReviews
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

/**
 * @desc    Report a review
 * @route   PUT /api/reviews/:id/report
 * @access  Private
 */
export const reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isReported = true;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting review',
      error: error.message
    });
  }
};
