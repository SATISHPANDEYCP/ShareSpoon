import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiClock, FiMapPin, FiTrash2, FiXCircle } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import RequestModal from '../components/RequestModal';
import useAuthStore from '../store/authStore';
import { formatDateTime, getTimeUntilExpiry } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const isOwner = post?.donor?._id === user?._id;

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${id}`);
      setPost(response.data.post);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load post details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setProcessing(true);
      await api.delete(`/posts/${id}`);
      toast.success('Post deleted');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setProcessing(false);
    }
  };

  const handleExpire = async () => {
    try {
      setProcessing(true);
      await api.put(`/posts/${id}/expire`);
      toast.success('Post marked as expired');
      await fetchPost();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to expire post');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestAction = async (type, requestId) => {
    try {
      setProcessing(true);

      if (type === 'accept') {
        await api.put(`/requests/${requestId}/accept`, {
          responseMessage: 'Your request has been accepted.',
        });
      }

      if (type === 'reject') {
        await api.put(`/requests/${requestId}/reject`, {
          responseMessage: 'Unable to fulfill this request.',
        });
      }

      if (type === 'confirm') {
        await api.put(`/requests/${requestId}/confirm`);
      }

      toast.success('Request updated');
      await fetchPost();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request update failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card overflow-hidden">
              <img
                src={post.images?.[0]?.url || 'https://via.placeholder.com/800x450'}
                alt={post.title}
                className="w-full h-72 object-cover"
              />

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="badge bg-primary-100 text-primary-800">{post.foodType}</span>
                  <span className="badge-info capitalize">{post.status}</span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{post.title}</h1>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{post.description}</p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <FiClock className="inline mr-2" />
                    Expires: {getTimeUntilExpiry(post.expiryTime)}
                  </p>
                  <p>
                    <FiMapPin className="inline mr-2" />
                    {post.address?.fullAddress || 'Address not provided'}
                  </p>
                  {post.pickupTimeStart && (
                    <p>Pickup starts: {formatDateTime(post.pickupTimeStart)}</p>
                  )}
                  {post.pickupTimeEnd && <p>Pickup ends: {formatDateTime(post.pickupTimeEnd)}</p>}
                  <p>Quantity: {post.quantity}</p>
                  {post.allergenInfo && <p>Allergens: {post.allergenInfo}</p>}
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Manage Requests</h2>
                {!post.activeRequests?.length ? (
                  <p className="text-gray-600 dark:text-gray-400">No active requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {post.activeRequests.map((request) => (
                      <div key={request._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.requester?.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Status: {request.status}</p>
                        {request.message && (
                          <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-1">&quot;{request.message}&quot;</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRequestAction('accept', request._id)}
                                className="btn-primary"
                                disabled={processing}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRequestAction('reject', request._id)}
                                className="btn-danger"
                                disabled={processing}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {request.status === 'accepted' && (
                            <button
                              onClick={() => handleRequestAction('confirm', request._id)}
                              className="btn-secondary"
                              disabled={processing}
                            >
                              Confirm Pickup
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Donor</h2>
              <div className="flex items-center gap-3">
                <img
                  src={post.donor?.avatar || 'https://via.placeholder.com/60'}
                  alt={post.donor?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{post.donor?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rating: {Number(post.donor?.rating || 0).toFixed(1)}
                  </p>
                </div>
              </div>
              {post.donor?._id && (
                <Link to={`/user/${post.donor._id}`} className="btn-secondary w-full mt-4 text-center block">
                  View Public Profile
                </Link>
              )}
            </div>

            <div className="card p-6">
              {isOwner ? (
                <div className="space-y-2">
                  <button
                    onClick={handleExpire}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                    disabled={processing || post.status === 'expired' || post.status === 'completed'}
                  >
                    <FiXCircle />
                    Mark as Expired
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-danger w-full inline-flex items-center justify-center gap-2"
                    disabled={processing}
                  >
                    <FiTrash2 />
                    Delete Post
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="btn-primary w-full"
                  disabled={post.status !== 'available'}
                >
                  {post.status === 'available' ? 'Request Food' : 'Not Available'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RequestModal
        post={post}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchPost}
      />
    </div>
  );
};

export default PostDetails;
