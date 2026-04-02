import mongoose from 'mongoose';

/**
 * Food Post Schema
 * Represents a food donation post with location and hygiene info
 */
const foodPostSchema = new mongoose.Schema(
  {
    // Post Creator
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Food Details
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    foodType: {
      type: String,
      required: [true, 'Please specify food type'],
      enum: [
        'Cooked Meal',
        'Raw Vegetables',
        'Fruits',
        'Grains',
        'Dairy',
        'Bakery',
        'Packaged Food',
        'Other'
      ]
    },
    quantity: {
      type: String,
      required: [true, 'Please specify quantity']
    },
    
    // Timing
    expiryTime: {
      type: Date,
      required: [true, 'Please specify expiry time']
    },
    pickupTimeStart: {
      type: Date
    },
    pickupTimeEnd: {
      type: Date
    },
    
    // Images
    images: [{
      url: {
        type: String,
        required: true
      },
      publicId: String
    }],
    
    // Location
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      fullAddress: String
    },
    
    // Hygiene & Safety
    hygieneChecklist: {
      freshFood: {
        type: Boolean,
        default: false
      },
      properStorage: {
        type: Boolean,
        default: false
      },
      allergenFree: {
        type: Boolean,
        default: false
      },
      noContamination: {
        type: Boolean,
        default: false
      }
    },
    allergenInfo: {
      type: String,
      maxlength: [200, 'Allergen info cannot exceed 200 characters']
    },
    
    // Status Management
    status: {
      type: String,
      enum: ['available', 'requested', 'reserved', 'completed', 'expired', 'cancelled'],
      default: 'available'
    },
    
    // Request & Receiver
    activeRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request'
    }],
    acceptedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request'
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Completion
    completedAt: Date,
    pickupConfirmed: {
      type: Boolean,
      default: false
    },
    
    // Moderation
    isReported: {
      type: Boolean,
      default: false
    },
    reportCount: {
      type: Number,
      default: 0
    },
    isRemoved: {
      type: Boolean,
      default: false
    },
    
    // Engagement
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
foodPostSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
foodPostSchema.index({ status: 1, expiryTime: 1 });
foodPostSchema.index({ donor: 1, status: 1 });

/**
 * Check if post is expired
 * @returns {boolean} True if expired
 */
foodPostSchema.methods.isExpired = function () {
  return this.expiryTime < new Date();
};

/**
 * Auto-expire posts that are past expiry time
 */
foodPostSchema.pre('find', function () {
  // This middleware can be used to auto-update expired posts
  // For now, we'll handle this in the controller
});

const FoodPost = mongoose.model('FoodPost', foodPostSchema);

export default FoodPost;
