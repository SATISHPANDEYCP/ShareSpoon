import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      setUser(response.data.user);
      setReviews(response.data.reviews || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load user profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4">
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <UserAvatar src={user.avatar} name={user.name} sizeClass="w-16 h-16" textClass="text-xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-300">Rating</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{Number(user.rating || 0).toFixed(1)}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-300">Reviews</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.totalReviews || 0}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-300">Total Posts</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.stats?.totalPosts || 0}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-300">Completed</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.stats?.completedDonations || 0}</p>
            </div>
          </div>

          {user.bio && (
            <div className="mt-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Bio</h2>
              <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No reviews available yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      src={review.reviewer?.avatar}
                      name={review.reviewer?.name || 'Anonymous'}
                      sizeClass="w-8 h-8"
                      textClass="text-sm"
                    />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{review.reviewer?.name || 'Anonymous'}</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment || 'No comment'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
