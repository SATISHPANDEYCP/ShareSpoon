import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiUser, FiStar } from 'react-icons/fi';
import { getTimeUntilExpiry } from '../utils/dateUtils';
import { calculateDistance, formatDistance } from '../utils/locationUtils';
import useAuthStore from '../store/authStore';
import { normalizeQuantityUnit } from '../utils/validation';

/**
 * FoodCard Component
 * Displays a food post card with image, details, and actions
 */
const FoodCard = ({ post, onRequestFood, userLocation }) => {
  const { user } = useAuthStore();

  const parsedQuantityFromText = Number((post?.quantity || '').match(/\d+/)?.[0] || 0);
  const totalQuantity = typeof post?.totalQuantity === 'number' ? post.totalQuantity : parsedQuantityFromText;
  const availableQuantity = typeof post?.availableQuantity === 'number' ? post.availableQuantity : totalQuantity;
  const quantityUnit = normalizeQuantityUnit(post?.quantityUnit || 'servings');
  const servingsPerUnit = typeof post?.servingsPerUnit === 'number' ? post.servingsPerUnit : null;
  const hasStock = Number.isFinite(availableQuantity) ? availableQuantity > 0 : post.status === 'available';
  const donorRating = Number(post?.donor?.rating);
  const donorTotalReviews = Number(post?.donor?.totalReviews || 0);
  const showDonorRating = Number.isFinite(donorRating) && donorRating > 0 && donorTotalReviews > 0;

  const getStockBadgeClass = () => {
    if (!Number.isFinite(totalQuantity) || totalQuantity <= 0 || !Number.isFinite(availableQuantity)) {
      return 'bg-black/70 text-white';
    }

    const ratio = availableQuantity / totalQuantity;
    if (ratio > 0.5) return 'bg-green-600/90 text-white';
    if (ratio >= 0.2) return 'bg-yellow-500/90 text-white';
    return 'bg-red-600/90 text-white';
  };

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
          {Number.isFinite(totalQuantity) && Number.isFinite(availableQuantity) && (
            <div className="absolute bottom-2 left-2">
              <span className={`badge ${getStockBadgeClass()} shadow-md`}>
                {availableQuantity}/{totalQuantity} {quantityUnit} left
              </span>
            </div>
          )}
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
            {showDonorRating && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-xs font-medium">
                <FiStar className="w-3.5 h-3.5" />
                {donorRating.toFixed(1)} ({donorTotalReviews})
              </span>
            )}
            {!showDonorRating && (
              <span className="text-xs text-gray-500 dark:text-gray-400">No ratings yet</span>
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
            <span className="font-medium">Quantity:</span>{' '}
            {Number.isFinite(totalQuantity) ? `${totalQuantity} ${quantityUnit}` : post.quantity}
          </div>
          {Number.isFinite(servingsPerUnit) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              1 {quantityUnit} ~= {servingsPerUnit} servings
            </div>
          )}
        </div>

        {/* Actions */}
        {post.status === 'available' && hasStock && user?._id !== post.donor?._id && (
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

        {((post.status !== 'available') || !hasStock) && user?._id !== post.donor?._id && (
          <Link to={`/post/${post._id}`} className="btn-secondary w-full block text-center">
            View Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default FoodCard;
