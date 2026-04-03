import FoodPost from '../models/FoodPost.js';
import Request from '../models/Request.js';
import { uploadMultipleToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils.js';

/**
 * @desc    Create a new food post
 * @route   POST /api/posts
 * @access  Private
 */
export const createPost = async (req, res) => {
  try {
    const {
      title,
      description,
      foodType,
      quantity,
      expiryTime,
      pickupTimeStart,
      pickupTimeEnd,
      pickupLocation,
      address,
      hygieneChecklist,
      allergenInfo
    } = req.body;

    const parsedPickupLocation = typeof pickupLocation === 'string'
      ? JSON.parse(pickupLocation)
      : pickupLocation;

    const parsedHygieneChecklist = typeof hygieneChecklist === 'string'
      ? JSON.parse(hygieneChecklist)
      : hygieneChecklist;

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        'food-sharing/posts'
      );
      images = uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId
      }));
    }

    // Create post
    const post = await FoodPost.create({
      donor: req.user.id,
      title,
      description,
      foodType,
      quantity,
      expiryTime,
      pickupTimeStart,
      pickupTimeEnd,
      images,
      pickupLocation: parsedPickupLocation,
      address: address || parsedPickupLocation?.address,
      hygieneChecklist: parsedHygieneChecklist,
      allergenInfo
    });

    // Populate donor info
    await post.populate('donor', 'name avatar rating');

    // Emit socket event for new post
    const io = req.app.get('io');
    io.emit('newPost', post);

    res.status(201).json({
      success: true,
      message: 'Food post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating food post',
      error: error.message
    });
  }
};

/**
 * @desc    Get all food posts with filters
 * @route   GET /api/posts
 * @access  Public
 */
export const getPosts = async (req, res) => {
  try {
    const {
      status,
      foodType,
      longitude,
      latitude,
      radius = 10,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { isRemoved: false };

    if (status) {
      query.status = status;
    } else {
      query.status = 'available'; // Default to available posts
    }

    if (foodType) {
      query.foodType = foodType;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let posts;
    let total;

    // Location-based search using aggregation
    if (longitude && latitude) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const maxDistance = radius * 1000; // Convert km to meters

      // Use aggregation with $geoNear for location-based sorting
      const aggregation = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            distanceField: 'distance',
            maxDistance: maxDistance,
            spherical: true,
            query: query
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'donor',
            foreignField: '_id',
            as: 'donor'
          }
        },
        {
          $unwind: '$donor'
        },
        {
          $project: {
            title: 1,
            description: 1,
            foodType: 1,
            quantity: 1,
            expiryTime: 1,
            pickupTimeStart: 1,
            pickupTimeEnd: 1,
            pickupLocation: 1,
            address: 1,
            images: 1,
            status: 1,
            hygieneChecklist: 1,
            allergenInfo: 1,
            createdAt: 1,
            updatedAt: 1,
            distance: 1,
            'donor._id': 1,
            'donor.name': 1,
            'donor.avatar': 1,
            'donor.rating': 1
          }
        },
        { $sort: { distance: 1 } },
        { $skip: skip },
        { $limit: limitNum }
      ];

      posts = await FoodPost.aggregate(aggregation);

      // Count total without pagination for location-based query
      const countAggregation = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            distanceField: 'distance',
            maxDistance: maxDistance,
            spherical: true,
            query: query
          }
        },
        { $count: 'total' }
      ];

      const countResult = await FoodPost.aggregate(countAggregation);
      total = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      // Regular query without location
      posts = await FoodPost.find(query)
        .populate('donor', 'name avatar rating')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

      total = await FoodPost.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food posts',
      error: error.message
    });
  }
};

/**
 * @desc    Get single food post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
export const getPostById = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id)
      .populate('donor', 'name avatar rating phone email')
      .populate('receiver', 'name avatar')
      .populate({
        path: 'activeRequests',
        populate: { path: 'requester', select: 'name avatar rating' }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Food post not found'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food post',
      error: error.message
    });
  }
};

/**
 * @desc    Update food post
 * @route   PUT /api/posts/:id
 * @access  Private (Owner only)
 */
export const updatePost = async (req, res) => {
  try {
    let post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Food post not found'
      });
    }

    // Check ownership
    if (post.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Update fields
    const allowedUpdates = [
      'title',
      'description',
      'quantity',
      'expiryTime',
      'pickupTimeStart',
      'pickupTimeEnd',
      'allergenInfo',
      'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating food post',
      error: error.message
    });
  }
};

/**
 * @desc    Delete food post
 * @route   DELETE /api/posts/:id
 * @access  Private (Owner only)
 */
export const deletePost = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Food post not found'
      });
    }

    // Check ownership
    if (post.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete images from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const image of post.images) {
        if (image.publicId) {
          await deleteFromCloudinary(image.publicId);
        }
      }
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting food post',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's own posts
 * @route   GET /api/posts/my/posts
 * @access  Private
 */
export const getMyPosts = async (req, res) => {
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
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your posts',
      error: error.message
    });
  }
};

/**
 * @desc    Mark post as expired
 * @route   PUT /api/posts/:id/expire
 * @access  Private (Owner only)
 */
export const expirePost = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Food post not found'
      });
    }

    // Check ownership
    if (post.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to expire this post'
      });
    }

    post.status = 'expired';
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post marked as expired',
      post
    });
  } catch (error) {
    console.error('Expire post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error expiring post',
      error: error.message
    });
  }
};

/**
 * @desc    Search posts by keyword
 * @route   GET /api/posts/search
 * @access  Public
 */
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Search in title and description
    const posts = await FoodPost.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ],
      status: 'available',
      isRemoved: false
    })
      .populate('donor', 'name avatar rating')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await FoodPost.countDocuments({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ],
      status: 'available',
      isRemoved: false
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      posts
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    });
  }
};
