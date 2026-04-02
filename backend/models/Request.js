import mongoose from 'mongoose';

/**
 * Request Schema
 * Handles food pickup requests from receivers to donors
 */
const requestSchema = new mongoose.Schema(
  {
    // Related Entities
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodPost',
      required: true
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Request Details
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      trim: true
    },
    pickupTime: {
      type: Date
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },
    
    // Response
    responseMessage: {
      type: String,
      maxlength: [500, 'Response message cannot exceed 500 characters']
    },
    respondedAt: Date,
    
    // Completion
    completedAt: Date,
    pickupConfirmed: {
      type: Boolean,
      default: false
    },
    
    // Cancellation
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancellationReason: String
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
requestSchema.index({ post: 1, requester: 1 }, { unique: true }); // One request per user per post
requestSchema.index({ requester: 1, status: 1 });
requestSchema.index({ donor: 1, status: 1 });
requestSchema.index({ post: 1, status: 1 });

/**
 * Pre-save middleware to set timestamps
 */
requestSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'accepted' || this.status === 'rejected') {
      this.respondedAt = new Date();
    }
    if (this.status === 'completed') {
      this.completedAt = new Date();
    }
  }
  next();
});

const Request = mongoose.model('Request', requestSchema);

export default Request;
