import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiUser, FiHeart } from 'react-icons/fi';
import { formatRelativeTime, getTimeUntilExpiry } from '../utils/dateUtils';
import { calculateDistance, formatDistance } from '../utils/locationUtils';
import useAuthStore from '../store/authStore';

/**
 * FoodCard Component
 * Displays a food post card with image, details, and actions
 */
const FoodCard = ({ post, onRequestFood, userLocation }) => {
  const { user } = useAuthStore();

  // Calculate distance if user location is available
  const distance =
    userLocation && post.pickupLocation?.coordinates
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          post.pickupLocation.coordinates[1],
          post.pickupLocation.coordinates[0]
        )
      : null;

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'badge-success';
      case 'requested':
        return 'badge-warning';
      case 'reserved':
        return 'badge-info';
      case 'completed':
        return 'badge-success';
      case 'expired':
        return 'badge-danger';
      default:
        return 'badge';
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Image */}
      <Link to={`/post/${post._id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className={`${getStatusColor(post.status)}`}>
              {post.status}
            </span>
          </div>
          {/* Food Type Badge */}
          <div className="absolute top-2 left-2">
            <span className="badge bg-white text-gray-800 shadow-md">
              {post.foodType}
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link to={`/post/${post._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 mb-2">
            {post.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {post.description}
        </p>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          {/* Donor */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <FiUser className="w-4 h-4" />
            <Link
              to={`/user/${post.donor?._id}`}
              className="hover:text-primary-600"
            >
              {post.donor?.name}
            </Link>
            {post.donor?.rating && (
              <span className="flex items-center">
                <FiHeart className="w-4 h-4 text-red-500 mr-1" />
                {post.donor.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Location */}
          {distance !== null && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <FiMapPin className="w-4 h-4" />
              <span>{formatDistance(distance)}</span>
            </div>
          )}

          {/* Expiry Time */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <FiClock className="w-4 h-4" />
            <span>Expires {getTimeUntilExpiry(post.expiryTime)}</span>
          </div>

          {/* Quantity */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Quantity:</span> {post.quantity}
          </div>
        </div>

        {/* Actions */}
        {post.status === 'available' && user?._id !== post.donor?._id && (
          <button
            onClick={() => onRequestFood(post)}
            className="btn-primary w-full"
          >
            Request Food
          </button>
        )}

        {user?._id === post.donor?._id && (
          <Link to={`/post/${post._id}`} className="btn-secondary w-full block text-center">
            Manage Post
          </Link>
        )}

        {post.status !== 'available' && user?._id !== post.donor?._id && (
          <Link to={`/post/${post._id}`} className="btn-secondary w-full block text-center">
            View Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default FoodCard;
