import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiClock, FiEdit2, FiMapPin, FiRotateCcw, FiStar, FiTrash2, FiXCircle } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import RequestModal from '../components/RequestModal';
import useAuthStore from '../store/authStore';
import { formatDateTime, getTimeUntilExpiry } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';
import { isValidQuantityUnit, normalizeQuantityUnit } from '../utils/validation';

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    foodType: 'Cooked Meal',
    totalQuantity: '',
    quantityUnit: '',
    servingsPerUnit: '',
    expiryTime: '',
    pickupTimeStart: '',
    pickupTimeEnd: '',
    allergenInfo: '',
  });

  const isOwner = post?.donor?._id === user?._id;
  const parsedAvailableFromText = Number((post?.quantity || '').match(/\d+/)?.[0] || 0);
  const availableQuantity = typeof post?.availableQuantity === 'number'
    ? post.availableQuantity
    : parsedAvailableFromText;
  const totalQuantity = typeof post?.totalQuantity === 'number' ? post.totalQuantity : parsedAvailableFromText;
  const quantityUnit = normalizeQuantityUnit(post?.quantityUnit || 'servings');
  const servingsPerUnit = typeof post?.servingsPerUnit === 'number' ? post.servingsPerUnit : null;
  const donorRating = Number(post?.donor?.rating || 0);
  const donorTotalReviews = Number(post?.donor?.totalReviews || 0);
  const showDonorRating = Number.isFinite(donorRating) && donorRating > 0 && donorTotalReviews > 0;

  const toLocalDateTimeInputValue = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const tzOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

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

  const handleUnexpire = async () => {
    try {
      setProcessing(true);
      await api.put(`/posts/${id}/unexpire`);
      toast.success('Post restored successfully');
      await fetchPost();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore post');
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

  const handleOpenEditModal = () => {
    if (!post) return;
    setEditForm({
      title: post.title || '',
      description: post.description || '',
      foodType: post.foodType || 'Cooked Meal',
      totalQuantity: post.totalQuantity || '',
      quantityUnit: post.quantityUnit || '',
      servingsPerUnit: post.servingsPerUnit || '',
      expiryTime: toLocalDateTimeInputValue(post.expiryTime),
      pickupTimeStart: toLocalDateTimeInputValue(post.pickupTimeStart),
      pickupTimeEnd: toLocalDateTimeInputValue(post.pickupTimeEnd),
      allergenInfo: post.allergenInfo || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isValidQuantityUnit(editForm.quantityUnit)) {
      toast.error('Unit must contain letters, e.g. plates, boxes, kg');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/posts/${id}`, {
        title: editForm.title,
        description: editForm.description,
        foodType: editForm.foodType,
        totalQuantity: Number(editForm.totalQuantity),
        quantityUnit: editForm.quantityUnit,
        servingsPerUnit: Number(editForm.servingsPerUnit),
        expiryTime: editForm.expiryTime,
        pickupTimeStart: editForm.pickupTimeStart || undefined,
        pickupTimeEnd: editForm.pickupTimeEnd || undefined,
        allergenInfo: editForm.allergenInfo || '',
      });
      toast.success('Post updated successfully');
      setIsEditModalOpen(false);
      await fetchPost();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update post');
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
                  <p>
                    Quantity: {Number.isFinite(totalQuantity) ? `${totalQuantity} ${quantityUnit}` : post.quantity}
                  </p>
                  {Number.isFinite(availableQuantity) && (
                    <p>
                      Available now: {availableQuantity} {quantityUnit}
                    </p>
                  )}
                  {Number.isFinite(servingsPerUnit) && (
                    <p>
                      1 {quantityUnit} ~= {servingsPerUnit} servings
                    </p>
                  )}
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
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={request.requester?.avatar}
                            name={request.requester?.name || 'User'}
                            sizeClass="w-9 h-9"
                            textClass="text-sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {request.requester?.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status: {request.status}</p>
                          </div>
                        </div>
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
                <UserAvatar src={post.donor?.avatar} name={post.donor?.name} sizeClass="w-12 h-12" textClass="text-base" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{post.donor?.name}</p>
                  {showDonorRating ? (
                    <p className="text-sm text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                      <FiStar className="w-4 h-4" />
                      {donorRating.toFixed(1)} ({donorTotalReviews} reviews)
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No ratings yet</p>
                  )}
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
                    onClick={handleOpenEditModal}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                    disabled={processing}
                  >
                    <FiEdit2 />
                    Edit Post
                  </button>
                  <button
                    onClick={post.status === 'expired' ? handleUnexpire : handleExpire}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                    disabled={
                      processing ||
                      post.status === 'completed' ||
                      (post.status === 'expired' && post.mediaCleaned)
                    }
                    title={post.status === 'expired' && post.mediaCleaned ? 'Cannot restore after media cleanup' : ''}
                  >
                    {post.status === 'expired' ? <FiRotateCcw /> : <FiXCircle />}
                    {post.status === 'expired' ? 'Revert Expired' : 'Mark as Expired'}
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
                  disabled={availableQuantity <= 0 || ['completed', 'expired', 'cancelled'].includes(post.status)}
                >
                  {availableQuantity > 0 ? 'Request Food' : 'Not Available'}
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

      {isOwner && isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Food Post</h2>
            </div>

            <form onSubmit={handleEditSubmit} className="p-3 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title *</label>
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    maxLength={100}
                    placeholder="e.g., Fresh Homemade Biryani"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Food Type *</label>
                  <select
                    name="foodType"
                    value={editForm.foodType}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Cooked Meal">Cooked Meal</option>
                    <option value="Raw Vegetables">Raw Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Packaged Food">Packaged Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description *</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  required
                  maxLength={1000}
                  rows={2}
                  placeholder="Describe food quality, ingredients, and pickup notes"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Total Quantity *</label>
                  <input
                    type="number"
                    name="totalQuantity"
                    value={editForm.totalQuantity}
                    onChange={handleEditChange}
                    required
                    min={1}
                    placeholder="e.g., 10"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Unit *</label>
                  <input
                    type="text"
                    name="quantityUnit"
                    value={editForm.quantityUnit}
                    onChange={handleEditChange}
                    required
                    maxLength={30}
                    placeholder="e.g., plates, boxes, kg"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Servings/Unit *</label>
                  <input
                    type="number"
                    name="servingsPerUnit"
                    value={editForm.servingsPerUnit}
                    onChange={handleEditChange}
                    required
                    min={1}
                    placeholder="e.g., 2"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Expiry Time *</label>
                  <input
                    type="datetime-local"
                    name="expiryTime"
                    value={editForm.expiryTime}
                    onChange={handleEditChange}
                    required
                    placeholder="Select expiry date and time"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Pickup Start</label>
                  <input
                    type="datetime-local"
                    name="pickupTimeStart"
                    value={editForm.pickupTimeStart}
                    onChange={handleEditChange}
                    placeholder="Optional pickup start time"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Pickup End</label>
                  <input
                    type="datetime-local"
                    name="pickupTimeEnd"
                    value={editForm.pickupTimeEnd}
                    onChange={handleEditChange}
                    placeholder="Optional pickup end time"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Allergen Info</label>
                <input
                  name="allergenInfo"
                  value={editForm.allergenInfo}
                  onChange={handleEditChange}
                  maxLength={200}
                  placeholder="e.g., contains nuts, dairy, gluten"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                  disabled={processing}
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
