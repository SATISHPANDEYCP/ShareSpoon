import mongoose from 'mongoose';

/**
 * Review Schema
 * Handles ratings and reviews between users
 */
const reviewSchema = new mongoose.Schema(
  {
    // Related Entities
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodPost',
      required: true
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Review Content
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    },
    
    // Review Type
    type: {
      type: String,
      enum: ['donor', 'receiver'], // Review for donor or receiver
      required: true
    },
    
    // Moderation
    isReported: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ reviewer: 1, reviewee: 1, post: 1 }, { unique: true }); // One review per transaction

/**
 * Static method to calculate average rating for a user
 * @param {ObjectId} userId - User ID to calculate rating for
 * @returns {Promise<Object>} Average rating and count
 */
reviewSchema.statics.calculateAverageRating = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { reviewee: userId, isHidden: false }
    },
    {
      $group: {
        _id: '$reviewee',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    return {
      rating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: stats[0].totalReviews
    };
  }

  return { rating: 0, totalReviews: 0 };
};

/**
 * Post-save middleware to update user rating
 */
reviewSchema.post('save', async function () {
  const User = mongoose.model('User');
  const stats = await this.constructor.calculateAverageRating(this.reviewee);
  
  await User.findByIdAndUpdate(this.reviewee, {
    rating: stats.rating,
    totalReviews: stats.totalReviews
  });
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
