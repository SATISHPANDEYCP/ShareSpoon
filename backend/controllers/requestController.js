import Request from '../models/Request.js';
import FoodPost from '../models/FoodPost.js';
import User from '../models/User.js';
import {
  sendNewRequestAlertEmail,
  sendPickupConfirmationOtpEmail,
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
} from '../utils/emailUtils.js';

const parseQuantityNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) {
      return Math.max(0, parseInt(match[0], 10));
    }
  }

  return 0;
};

const resolveAvailableQuantity = (post) => {
  if (typeof post.availableQuantity === 'number' && Number.isFinite(post.availableQuantity)) {
    return Math.max(0, Math.floor(post.availableQuantity));
  }

  if (typeof post.totalQuantity === 'number' && Number.isFinite(post.totalQuantity)) {
    return Math.max(0, Math.floor(post.totalQuantity));
  }

  return parseQuantityNumber(post.quantity) || 1;
};

const applyPostQuantityDefaults = (post) => {
  const total = (typeof post.totalQuantity === 'number' && Number.isFinite(post.totalQuantity))
    ? Math.max(1, Math.floor(post.totalQuantity))
    : (parseQuantityNumber(post.quantity) || 1);

  const available = resolveAvailableQuantity(post);
  post.totalQuantity = total;
  post.availableQuantity = Math.min(total, available);
  post.quantityUnit = post.quantityUnit || 'servings';
  post.quantity = `${post.totalQuantity} ${post.quantityUnit}`;
};

/**
 * @desc    Create a food request
 * @route   POST /api/requests/:postId
 * @access  Private
 */
export const createRequest = async (req, res) => {
  try {
    const { postId } = req.params;
    const { message, pickupTime, requestedQuantity } = req.body;

    const normalizedRequestedQuantity = Number(requestedQuantity);

    if (!Number.isFinite(normalizedRequestedQuantity) || normalizedRequestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be at least 1'
      });
    }

    // Check if post exists
    const post = await FoodPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Food post not found'
      });
    }

    applyPostQuantityDefaults(post);

    if (['expired', 'cancelled', 'completed', 'removed'].includes(post.status)) {
      return res.status(400).json({
        success: false,
        message: 'This food post is no longer available'
      });
    }

    if (post.availableQuantity < normalizedRequestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${post.availableQuantity} ${post.quantityUnit} available right now`
      });
    }

    // Check if user is the donor
    if (post.donor.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request your own food post'
      });
    }

    // Allow re-request only if previous attempt was rejected/cancelled.
    const existingRequest = await Request.findOne({
      post: postId,
      requester: req.user.id
    }).select('+pickupConfirmationOtp +pickupConfirmationOtpExpiry');

    let request;
    if (existingRequest) {
      if (!['rejected', 'cancelled'].includes(existingRequest.status)) {
        return res.status(400).json({
          success: false,
          message: 'You can request this post again only after rejected or cancelled status'
        });
      }

      existingRequest.donor = post.donor;
      existingRequest.message = message;
      existingRequest.pickupTime = pickupTime;
      existingRequest.requestedQuantity = normalizedRequestedQuantity;
      existingRequest.approvedQuantity = undefined;
      existingRequest.status = 'pending';
      existingRequest.responseMessage = undefined;
      existingRequest.respondedAt = undefined;
      existingRequest.completedAt = undefined;
      existingRequest.pickupConfirmed = false;
      existingRequest.pickupConfirmationOtp = undefined;
      existingRequest.pickupConfirmationOtpExpiry = undefined;
      existingRequest.cancelledBy = undefined;
      existingRequest.cancellationReason = undefined;
      existingRequest.ratingReminderDueAt = undefined;
      existingRequest.ratingReminderSent = false;
      existingRequest.ratingReminderSentAt = undefined;

      request = await existingRequest.save();
    } else {
      // Create first request
      request = await Request.create({
        post: postId,
        requester: req.user.id,
        donor: post.donor,
        message,
        pickupTime,
        requestedQuantity: normalizedRequestedQuantity
      });
    }

    // Add request to post's activeRequests
    if (!post.activeRequests.some((id) => id.toString() === request._id.toString())) {
      post.activeRequests.push(request._id);
    }
    post.status = post.availableQuantity > 0 ? 'available' : 'reserved';
    await post.save();

    // Populate request data
    await request.populate('requester', 'name avatar rating');
    await request.populate('post', 'title images quantity quantityUnit availableQuantity');

    // Send socket notification to donor
    const io = req.app.get('io');
    io.to(`user_${post.donor}`).emit('newRequest', {
      request,
      message: `${req.user.name} requested your food post`
    });

    // Send donor email notification without blocking API response
    try {
      const [donor, requester] = await Promise.all([
        User.findById(post.donor).select('name email'),
        User.findById(req.user.id).select('name')
      ]);

      if (donor?.email) {
        await sendNewRequestAlertEmail({
          to: donor.email,
          donorName: donor.name,
          requesterName: requester?.name || req.user.name,
          postTitle: post.title,
          requestId: request._id.toString(),
        });
      }
    } catch (emailError) {
      console.error('New request alert email error:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

/**
 * @desc    Get all requests (donor's received requests)
 * @route   GET /api/requests/received
 * @access  Private
 */
export const getReceivedRequests = async (req, res) => {
  try {
    const requests = await Request.find({ donor: req.user.id })
      .populate('requester', 'name avatar rating phone')
      .populate('post', 'title images foodType quantity quantityUnit totalQuantity availableQuantity')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received requests',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's sent requests
 * @route   GET /api/requests/sent
 * @access  Private
 */
export const getSentRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user.id })
      .populate('donor', 'name avatar rating phone')
      .populate('post', 'title images foodType quantity quantityUnit totalQuantity availableQuantity address')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sent requests',
      error: error.message
    });
  }
};

/**
 * @desc    Accept a request
 * @route   PUT /api/requests/:id/accept
 * @access  Private (Donor only)
 */
export const acceptRequest = async (req, res) => {
  try {
    const approvedQuantityInput = Number(req.body.approvedQuantity);
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the donor
    if (request.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Update post
    const post = await FoodPost.findById(request.post);
    applyPostQuantityDefaults(post);

    const approvedQuantity = Number.isFinite(approvedQuantityInput)
      ? Math.floor(approvedQuantityInput)
      : Math.floor(request.requestedQuantity);

    if (approvedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Approved quantity must be at least 1'
      });
    }

    if (approvedQuantity > request.requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Approved quantity cannot exceed requested quantity'
      });
    }

    if (approvedQuantity > post.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${post.availableQuantity} ${post.quantityUnit} available to approve`
      });
    }

    request.status = 'accepted';
    request.responseMessage = req.body.responseMessage;
    request.approvedQuantity = approvedQuantity;
    await request.save();

    post.availableQuantity = Math.max(0, post.availableQuantity - approvedQuantity);
    post.acceptedRequest = request._id;
    post.receiver = request.requester;

    const otherRequests = post.activeRequests.filter(
      reqId => reqId.toString() !== request._id.toString()
    );

    if (post.availableQuantity <= 0) {
      await Request.updateMany(
        { _id: { $in: otherRequests }, status: 'pending' },
        { status: 'rejected', responseMessage: 'No quantity left. Donor accepted other requests.' }
      );
      post.status = 'reserved';
    } else {
      post.status = 'available';
    }

    post.quantity = `${post.availableQuantity}/${post.totalQuantity} ${post.quantityUnit} available`;

    await post.save();

    // Populate request data
    await request.populate('requester', 'name avatar');
    await request.populate('post', 'title quantity quantityUnit availableQuantity');

    // Send socket notifications
    const io = req.app.get('io');
    
    // Notify accepted requester
    io.to(`user_${request.requester}`).emit('requestAccepted', {
      request,
      message: `Your request was accepted for ${request.approvedQuantity} ${post.quantityUnit}.`
    });

    // Send requester email notification without blocking API response
    try {
      const [requester, donor] = await Promise.all([
        User.findById(request.requester).select('name email'),
        User.findById(request.donor).select('name')
      ]);

      if (requester?.email) {
        await sendRequestAcceptedEmail({
          to: requester.email,
          requesterName: requester.name,
          donorName: donor?.name || req.user.name,
          postTitle: post.title,
          approvedQuantity: request.approvedQuantity,
          quantityUnit: post.quantityUnit,
        });
      }
    } catch (emailError) {
      console.error('Request accepted email error:', emailError.message);
    }

    // Notify rejected requesters
    const rejectedRequests = await Request.find({
      _id: { $in: otherRequests },
      status: 'rejected'
    }).populate('requester');

    rejectedRequests.forEach(req => {
      io.to(`user_${req.requester._id}`).emit('requestRejected', {
        request: req,
        message: 'Your request was not accepted'
      });
    });

    // Send rejection emails for auto-rejected requests without blocking response
    for (const rejectedRequest of rejectedRequests) {
      try {
        const [requester, donor] = await Promise.all([
          User.findById(rejectedRequest.requester?._id || rejectedRequest.requester).select('name email'),
          User.findById(request.donor).select('name')
        ]);

        if (requester?.email) {
          await sendRequestRejectedEmail({
            to: requester.email,
            requesterName: requester.name,
            donorName: donor?.name || req.user.name,
            postTitle: post.title,
            reason: rejectedRequest.responseMessage || 'No quantity left. Donor accepted other requests.',
          });
        }
      } catch (emailError) {
        console.error('Auto rejection email error:', emailError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Request accepted successfully',
      request
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting request',
      error: error.message
    });
  }
};

/**
 * @desc    Reject a request
 * @route   PUT /api/requests/:id/reject
 * @access  Private (Donor only)
 */
export const rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the donor
    if (request.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Update request
    request.status = 'rejected';
    request.responseMessage = req.body.responseMessage;
    await request.save();

    // Update post - remove from activeRequests
    const post = await FoodPost.findById(request.post);
    post.activeRequests = post.activeRequests.filter(
      reqId => reqId.toString() !== request._id.toString()
    );

    // If no more active requests, set status back to available
    if (post.activeRequests.length === 0) {
      post.status = 'available';
    }

    await post.save();

    // Populate request data
    await request.populate('requester', 'name avatar');

    // Send socket notification
    const io = req.app.get('io');
    io.to(`user_${request.requester}`).emit('requestRejected', {
      request,
      message: 'Your request was not accepted'
    });

    // Send requester rejection email without blocking API response
    try {
      const [requester, donor, post] = await Promise.all([
        User.findById(request.requester).select('name email'),
        User.findById(request.donor).select('name'),
        FoodPost.findById(request.post).select('title')
      ]);

      if (requester?.email) {
        await sendRequestRejectedEmail({
          to: requester.email,
          requesterName: requester.name,
          donorName: donor?.name || req.user.name,
          postTitle: post?.title,
          reason: request.responseMessage,
        });
      }
    } catch (emailError) {
      console.error('Request rejected email error:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Request rejected',
      request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
};

/**
 * @desc    Confirm pickup
 * @route   PUT /api/requests/:id/confirm
 * @access  Private (Donor or Requester)
 */
export const confirmPickup = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).select('+pickupConfirmationOtp +pickupConfirmationOtpExpiry');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Only donor can confirm pickup using requester's OTP.
    if (request.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only donor can confirm this pickup'
      });
    }

    // Check if request is accepted
    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This request must be accepted first'
      });
    }

    const submittedOtp = String(req.body?.otp || '').trim();

    // Step 1: issue OTP and send email to requester
    if (!submittedOtp) {
      const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
      request.pickupConfirmationOtp = otp;
      request.pickupConfirmationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await request.save();

      try {
        const [requester, donor, post] = await Promise.all([
          User.findById(request.requester).select('name email'),
          User.findById(request.donor).select('name'),
          FoodPost.findById(request.post).select('title')
        ]);

        if (requester?.email) {
          await sendPickupConfirmationOtpEmail({
            to: requester.email,
            requesterName: requester.name,
            donorName: donor?.name,
            postTitle: post?.title,
            otp,
          });
        }
      } catch (emailError) {
        console.error('Pickup confirmation OTP email error:', emailError.message);
      }

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        message: 'Pickup OTP sent to requester email. Enter OTP to confirm pickup.'
      });
    }

    // Step 2: verify OTP and complete pickup
    if (!request.pickupConfirmationOtp || !request.pickupConfirmationOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP not generated. Please request OTP first.'
      });
    }

    if (request.pickupConfirmationOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (request.pickupConfirmationOtp !== submittedOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Update request
    request.status = 'completed';
    request.pickupConfirmed = true;
    request.pickupConfirmationOtp = undefined;
    request.pickupConfirmationOtpExpiry = undefined;
    request.ratingReminderDueAt = new Date(Date.now() + 5 * 60 * 1000);
    request.ratingReminderSent = false;
    request.ratingReminderSentAt = null;
    await request.save();

    // Update post
    const post = await FoodPost.findById(request.post);
    applyPostQuantityDefaults(post);

    const openRequestsCount = await Request.countDocuments({
      post: request.post,
      status: { $in: ['pending', 'accepted'] }
    });

    if (post.availableQuantity <= 0 && openRequestsCount === 0) {
      post.status = 'completed';
      post.pickupConfirmed = true;
      post.completedAt = new Date();
      post.mediaCleaned = false;
      post.mediaCleanedAt = null;
    } else {
      post.status = post.availableQuantity > 0 ? 'available' : 'reserved';
      post.pickupConfirmed = false;
      post.completedAt = null;
      post.mediaCleaned = false;
      post.mediaCleanedAt = null;
    }

    if (post.acceptedRequest && post.acceptedRequest.toString() === request._id.toString()) {
      post.acceptedRequest = null;
      post.receiver = null;
    }

    post.quantity = `${post.availableQuantity}/${post.totalQuantity} ${post.quantityUnit} available`;
    await post.save();

    // Update user stats
    await User.findByIdAndUpdate(request.donor, {
      $inc: { foodDonated: 1 }
    });

    await User.findByIdAndUpdate(request.requester, {
      $inc: { foodReceived: 1 }
    });

    // Send socket notification
    const io = req.app.get('io');
    const otherUserId = req.user.id === request.donor.toString() 
      ? request.requester 
      : request.donor;

    io.to(`user_${otherUserId}`).emit('pickupConfirmed', {
      request,
      message: 'Pickup has been confirmed!'
    });

    res.status(200).json({
      success: true,
      message: 'Pickup confirmed successfully',
      request
    });
  } catch (error) {
    console.error('Confirm pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming pickup',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel a request
 * @route   DELETE /api/requests/:id
 * @access  Private (Requester only)
 */
export const cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the requester
    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    const wasAccepted = request.status === 'accepted';
    const approvedQuantity = request.approvedQuantity || 0;

    // Update request
    request.status = 'cancelled';
    request.cancelledBy = req.user.id;
    request.cancellationReason = req.body.reason;
    await request.save();

    // Update post
    const post = await FoodPost.findById(request.post);
    applyPostQuantityDefaults(post);

    if (wasAccepted && approvedQuantity > 0) {
      post.availableQuantity = Math.min(post.totalQuantity, post.availableQuantity + approvedQuantity);
    }

    post.activeRequests = post.activeRequests.filter(
      reqId => reqId.toString() !== request._id.toString()
    );

    // If this was the accepted request, reset post status
    if (post.acceptedRequest && post.acceptedRequest.toString() === request._id.toString()) {
      post.acceptedRequest = null;
      post.receiver = null;
    }

    if (post.availableQuantity > 0) {
      post.status = 'available';
    } else if (post.activeRequests.length === 0) {
      post.status = 'completed';
    } else {
      post.status = 'reserved';
    }

    post.quantity = `${post.availableQuantity}/${post.totalQuantity} ${post.quantityUnit} available`;

    await post.save();

    // Send socket notification to donor
    const io = req.app.get('io');
    io.to(`user_${request.donor}`).emit('requestCancelled', {
      request,
      message: 'A request has been cancelled'
    });

    res.status(200).json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling request',
      error: error.message
    });
  }
};
