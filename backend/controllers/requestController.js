import Request from '../models/Request.js';
import FoodPost from '../models/FoodPost.js';
import User from '../models/User.js';

/**
 * @desc    Create a food request
 * @route   POST /api/requests/:postId
 * @access  Private
 */
export const createRequest = async (req, res) => {
  try {
    const { postId } = req.params;
    const { message, pickupTime } = req.body;

    // Check if post exists
    const post = await FoodPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Food post not found'
      });
    }

    // Check if post is available
    if (post.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This food post is no longer available'
      });
    }

    // Check if user is the donor
    if (post.donor.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request your own food post'
      });
    }

    // Check if user already requested this post
    const existingRequest = await Request.findOne({
      post: postId,
      requester: req.user.id
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested this food post'
      });
    }

    // Create request
    const request = await Request.create({
      post: postId,
      requester: req.user.id,
      donor: post.donor,
      message,
      pickupTime
    });

    // Add request to post's activeRequests
    post.activeRequests.push(request._id);
    post.status = 'requested';
    await post.save();

    // Populate request data
    await request.populate('requester', 'name avatar rating');
    await request.populate('post', 'title images');

    // Send socket notification to donor
    const io = req.app.get('io');
    io.to(`user_${post.donor}`).emit('newRequest', {
      request,
      message: `${req.user.name} requested your food post`
    });

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
      .populate('post', 'title images foodType quantity')
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
      .populate('post', 'title images foodType quantity address')
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

    // Update request
    request.status = 'accepted';
    request.responseMessage = req.body.responseMessage;
    await request.save();

    // Update post
    const post = await FoodPost.findById(request.post);
    post.status = 'reserved';
    post.acceptedRequest = request._id;
    post.receiver = request.requester;
    
    // Reject all other pending requests
    const otherRequests = post.activeRequests.filter(
      reqId => reqId.toString() !== request._id.toString()
    );
    
    await Request.updateMany(
      { _id: { $in: otherRequests }, status: 'pending' },
      { status: 'rejected', responseMessage: 'Donor accepted another request' }
    );

    await post.save();

    // Populate request data
    await request.populate('requester', 'name avatar');
    await request.populate('post', 'title');

    // Send socket notifications
    const io = req.app.get('io');
    
    // Notify accepted requester
    io.to(`user_${request.requester}`).emit('requestAccepted', {
      request,
      message: 'Your request has been accepted!'
    });

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
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is donor or requester
    if (
      request.donor.toString() !== req.user.id &&
      request.requester.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this pickup'
      });
    }

    // Check if request is accepted
    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This request must be accepted first'
      });
    }

    // Update request
    request.status = 'completed';
    request.pickupConfirmed = true;
    await request.save();

    // Update post
    const post = await FoodPost.findById(request.post);
    post.status = 'completed';
    post.pickupConfirmed = true;
    post.completedAt = new Date();
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

    // Update request
    request.status = 'cancelled';
    request.cancelledBy = req.user.id;
    request.cancellationReason = req.body.reason;
    await request.save();

    // Update post
    const post = await FoodPost.findById(request.post);
    post.activeRequests = post.activeRequests.filter(
      reqId => reqId.toString() !== request._id.toString()
    );

    // If this was the accepted request, reset post status
    if (post.acceptedRequest && post.acceptedRequest.toString() === request._id.toString()) {
      post.status = 'available';
      post.acceptedRequest = null;
      post.receiver = null;
    } else if (post.activeRequests.length === 0) {
      post.status = 'available';
    }

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
