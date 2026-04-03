import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiCheck, FiClock, FiEdit2, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import UserAvatar from '../components/UserAvatar';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { normalizeQuantityUnit } from '../utils/validation';

const statusClasses = {
  pending: 'badge-warning',
  accepted: 'badge-info',
  rejected: 'badge-danger',
  completed: 'badge-success',
  cancelled: 'badge',
};

const RequestCard = ({
  request,
  type,
  onAction,
  existingReview,
  reviewDraft,
  onReviewDraftChange,
  onSubmitReview,
  onStartEdit,
  onCancelEdit,
  isEditing,
  ratingLoadingId,
  showRatingForm,
}) => {
  const maxApprovableQuantity = Math.max(1, Number.parseInt(String(request.requestedQuantity || 1), 10) || 1);
  const [approveQuantityInput, setApproveQuantityInput] = useState('1');
  const statusClass = statusClasses[request.status] || 'badge';
  const title = request.post?.title || 'Food Post';
  const servingsPerUnit = Number(request.post?.servingsPerUnit || 0);
  const quantityUnit = normalizeQuantityUnit(request.post?.quantityUnit || 'servings');
  const requestedServingEstimate = servingsPerUnit > 0
    ? (request.requestedQuantity || 0) * servingsPerUnit
    : null;
  const approvedServingEstimate = servingsPerUnit > 0 && request.approvedQuantity
    ? request.approvedQuantity * servingsPerUnit
    : null;
  const isCompleted = request.status === 'completed';
  const canRateThisRequest = isCompleted && (type === 'sent' || type === 'received');
  const ratingTargetLabel = type === 'sent' ? 'Rate Donor' : 'Rate Requester';
  const profileUser = type === 'sent' ? request.donor : request.requester;
  const profileLabel = type === 'sent' ? 'Donor' : 'Requester';

  useEffect(() => {
    setApproveQuantityInput('1');
  }, [request._id, request.requestedQuantity]);

  const normalizedApproveQuantity = Math.min(
    Math.max(1, Number.parseInt(approveQuantityInput || '1', 10) || 1),
    maxApprovableQuantity
  );

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <UserAvatar
            src={profileUser?.avatar}
            name={profileUser?.name || 'Unknown'}
            sizeClass="w-10 h-10"
            textClass="text-sm"
          />
          <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {profileLabel}: {profileUser?.name || 'Unknown'}
          </p>
          </div>
        </div>
        <span className={statusClass}>{request.status}</span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Created: <span className="text-gray-900 dark:text-gray-200">{formatRelativeTime(request.createdAt)}</span>
        </p>
        {request.pickupTime && (
          <p>
            Pickup time: <span className="text-gray-900 dark:text-gray-200">{formatDateTime(request.pickupTime)}</span>
          </p>
        )}
        {request.message && <p className="italic">&quot;{request.message}&quot;</p>}
        {request.responseMessage && (
          <p>
            Response: <span className="text-gray-900 dark:text-gray-200">{request.responseMessage}</span>
          </p>
        )}
        <p>
          Requested: <span className="text-gray-900 dark:text-gray-200">{request.requestedQuantity || 1} {quantityUnit}</span>
        </p>
        {requestedServingEstimate !== null && (
          <p>
            Requested servings: <span className="text-gray-900 dark:text-gray-200">~{requestedServingEstimate}</span>
          </p>
        )}
        {request.approvedQuantity && (
          <p>
            Approved: <span className="text-gray-900 dark:text-gray-200">{request.approvedQuantity} {quantityUnit}</span>
          </p>
        )}
        {approvedServingEstimate !== null && (
          <p>
            Approved servings: <span className="text-gray-900 dark:text-gray-200">~{approvedServingEstimate}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {type === 'received' && request.status === 'pending' && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={maxApprovableQuantity}
                value={approveQuantityInput}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  if (rawValue === '') {
                    setApproveQuantityInput('');
                    return;
                  }

                  if (!/^\d+$/.test(rawValue)) {
                    return;
                  }

                  const parsedValue = Number.parseInt(rawValue, 10);
                  const clampedValue = Math.min(Math.max(1, parsedValue), maxApprovableQuantity);
                  setApproveQuantityInput(String(clampedValue));
                }}
                onBlur={() => setApproveQuantityInput(String(normalizedApproveQuantity))}
                placeholder="Enter qty"
                className="input w-28"
              />
            </div>
            <button onClick={() => onAction('accept', request._id, normalizedApproveQuantity)} className="btn-primary inline-flex items-center gap-2">
              <FiCheck />
              Accept
            </button>
            <button onClick={() => onAction('reject', request._id)} className="btn-danger inline-flex items-center gap-2">
              <FiX />
              Reject
            </button>
          </>
        )}

        {type === 'received' && request.status === 'accepted' && (
          <button onClick={() => onAction('confirm', request._id)} className="btn-primary inline-flex items-center gap-2">
            <FiCheck />
            Confirm Pickup
          </button>
        )}

        {type === 'sent' && request.status === 'pending' && (
          <button onClick={() => onAction('cancel', request._id)} className="btn-secondary inline-flex items-center gap-2">
            <FiTrash2 />
            Cancel Request
          </button>
        )}
      </div>

      {canRateThisRequest && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{ratingTargetLabel}</h4>

          {existingReview && !isEditing ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p>
                You rated this pickup: <strong>{existingReview.rating}/5</strong>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {existingReview.comment || 'No comment added'}
              </p>
              <button
                type="button"
                onClick={() => onStartEdit(request._id)}
                className="btn-secondary mt-3 inline-flex items-center gap-2"
              >
                <FiEdit2 />
                Edit Rating
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitReview(request._id, existingReview);
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onReviewDraftChange(request._id, { rating: value })}
                    className={`w-9 h-9 rounded-md border ${
                      (reviewDraft?.rating || 5) >= value
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                value={reviewDraft?.comment || ''}
                onChange={(e) => onReviewDraftChange(request._id, { comment: e.target.value })}
                className="input resize-none text-sm"
                rows={3}
                placeholder="Share your pickup experience"
                maxLength={500}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={ratingLoadingId === request._id}
                >
                  {ratingLoadingId === request._id
                    ? 'Submitting...'
                    : existingReview
                      ? 'Update Rating'
                      : 'Submit Rating'}
                </button>

                {existingReview && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onCancelEdit(request._id)}
                    disabled={ratingLoadingId === request._id}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {showRatingForm && !existingReview && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              You arrived from a reminder email. You can rate this completed request here.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const MyRequests = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('sent');
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myReviewsByRequestId, setMyReviewsByRequestId] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [editingReviewByRequestId, setEditingReviewByRequestId] = useState({});
  const [ratingLoadingId, setRatingLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [pickupOtpModal, setPickupOtpModal] = useState({
    isOpen: false,
    requestId: null,
    otp: '',
    submitting: false,
  });

  const highlightedRequestId = searchParams.get('rateRequest');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'sent' || tab === 'received') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [sentResponse, receivedResponse, myReviewsResponse] = await Promise.all([
        api.get('/requests/sent'),
        api.get('/requests/received'),
        api.get('/reviews/my-reviews'),
      ]);

      setSentRequests(sentResponse.data.requests || []);
      setReceivedRequests(receivedResponse.data.requests || []);

      const reviews = myReviewsResponse.data.reviews || [];
      const reviewMap = reviews.reduce((acc, review) => {
        const requestId = typeof review.request === 'string' ? review.request : review.request?._id;
        if (requestId) {
          acc[requestId] = review;
        }
        return acc;
      }, {});

      setMyReviewsByRequestId(reviewMap);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDraftChange = (requestId, patch) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [requestId]: {
        rating: prev[requestId]?.rating || myReviewsByRequestId[requestId]?.rating || 5,
        comment: prev[requestId]?.comment || '',
        ...patch,
      },
    }));
  };

  const handleStartEdit = (requestId) => {
    const existingReview = myReviewsByRequestId[requestId];
    if (!existingReview) return;

    setReviewDrafts((prev) => ({
      ...prev,
      [requestId]: {
        rating: existingReview.rating,
        comment: existingReview.comment || '',
      },
    }));

    setEditingReviewByRequestId((prev) => ({ ...prev, [requestId]: true }));
  };

  const handleCancelEdit = (requestId) => {
    setEditingReviewByRequestId((prev) => ({ ...prev, [requestId]: false }));
    setReviewDrafts((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
  };

  const handleSubmitReview = async (requestId, existingReview) => {
    try {
      setRatingLoadingId(requestId);
      const draft = reviewDrafts[requestId] || {
        rating: existingReview?.rating || 5,
        comment: existingReview?.comment || '',
      };

      const payload = {
        rating: draft.rating,
        comment: draft.comment.trim() || undefined,
      };

      if (existingReview) {
        await api.put(`/reviews/${existingReview._id}`, payload);
      } else {
        await api.post(`/reviews/${requestId}`, payload);
      }

      toast.success(existingReview ? 'Rating updated successfully' : 'Rating submitted successfully');
      setEditingReviewByRequestId((prev) => ({ ...prev, [requestId]: false }));
      await loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save rating');
    } finally {
      setRatingLoadingId(null);
    }
  };

  const handleAction = async (action, requestId, approvedQuantity) => {
    try {
      setActionLoadingId(requestId);

      if (action === 'accept') {
        await api.put(`/requests/${requestId}/accept`, {
          approvedQuantity,
          responseMessage: 'Pickup approved. See you soon.',
        });
        toast.success('Request accepted');
      }

      if (action === 'reject') {
        await api.put(`/requests/${requestId}/reject`, {
          responseMessage: 'Unable to fulfill this request right now.',
        });
        toast.success('Request rejected');
      }

      if (action === 'confirm') {
        const otpInitResponse = await api.put(`/requests/${requestId}/confirm`);

        if (otpInitResponse.data?.requiresOtp) {
          toast.success(otpInitResponse.data.message || 'OTP sent to requester email');
          setPickupOtpModal({
            isOpen: true,
            requestId,
            otp: '',
            submitting: false,
          });
          return;
        }

        toast.success('Pickup confirmed');
      }

      if (action === 'cancel') {
        await api.delete(`/requests/${requestId}`);
        toast.success('Request cancelled');
      }

      await loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseOtpModal = () => {
    setPickupOtpModal({
      isOpen: false,
      requestId: null,
      otp: '',
      submitting: false,
    });
  };

  const handleSubmitPickupOtp = async (e) => {
    e.preventDefault();

    const otp = pickupOtpModal.otp.trim();
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setPickupOtpModal((prev) => ({ ...prev, submitting: true }));
      await api.put(`/requests/${pickupOtpModal.requestId}/confirm`, { otp });
      toast.success('Pickup confirmed');
      handleCloseOtpModal();
      await loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
      setPickupOtpModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const requests = activeTab === 'sent' ? sentRequests : receivedRequests;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Requests</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track requests you sent and requests you received.
            </p>
          </div>
          <button onClick={loadRequests} className="btn-secondary inline-flex items-center gap-2">
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('sent')}
            className={`btn ${activeTab === 'sent' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Sent ({sentRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`btn ${activeTab === 'received' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Received ({receivedRequests.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="card p-10 text-center">
            <FiClock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">No requests found</h2>
            <p className="text-gray-600 dark:text-gray-400">Requests in this tab will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className={actionLoadingId === request._id ? 'opacity-70 pointer-events-none' : ''}>
                <RequestCard
                  request={request}
                  type={activeTab}
                  onAction={handleAction}
                  existingReview={myReviewsByRequestId[request._id]}
                  reviewDraft={reviewDrafts[request._id]}
                  onReviewDraftChange={handleReviewDraftChange}
                  onSubmitReview={handleSubmitReview}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  isEditing={Boolean(editingReviewByRequestId[request._id])}
                  ratingLoadingId={ratingLoadingId}
                  showRatingForm={highlightedRequestId === request._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {pickupOtpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Pickup with OTP</h3>
              <button
                type="button"
                onClick={handleCloseOtpModal}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={pickupOtpModal.submitting}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPickupOtp} className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter the 6-digit OTP sent to requester email to complete pickup.
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pickupOtpModal.otp}
                onChange={(e) => setPickupOtpModal((prev) => ({
                  ...prev,
                  otp: e.target.value.replace(/\D/g, '').slice(0, 6),
                }))}
                placeholder="Enter 6-digit OTP"
                className="input text-center tracking-[0.35em]"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseOtpModal}
                  className="btn-secondary flex-1"
                  disabled={pickupOtpModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={pickupOtpModal.submitting}
                >
                  {pickupOtpModal.submitting ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
