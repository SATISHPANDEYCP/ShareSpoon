import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiCheck, FiClock, FiEdit2, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

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
  const statusClass = statusClasses[request.status] || 'badge';
  const title = request.post?.title || 'Food Post';
  const isCompleted = request.status === 'completed';
  const canRateThisRequest = isCompleted && (type === 'sent' || type === 'received');
  const ratingTargetLabel = type === 'sent' ? 'Rate Donor' : 'Rate Requester';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {type === 'sent' ? `Donor: ${request.donor?.name || 'Unknown'}` : `Requester: ${request.requester?.name || 'Unknown'}`}
          </p>
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
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {type === 'received' && request.status === 'pending' && (
          <>
            <button onClick={() => onAction('accept', request._id)} className="btn-primary inline-flex items-center gap-2">
              <FiCheck />
              Accept
            </button>
            <button onClick={() => onAction('reject', request._id)} className="btn-danger inline-flex items-center gap-2">
              <FiX />
              Reject
            </button>
          </>
        )}

        {((type === 'sent' && request.status === 'accepted') ||
          (type === 'received' && request.status === 'accepted')) && (
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

  const handleAction = async (action, requestId) => {
    try {
      setActionLoadingId(requestId);

      if (action === 'accept') {
        await api.put(`/requests/${requestId}/accept`, {
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
        await api.put(`/requests/${requestId}/confirm`);
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
    </div>
  );
};

export default MyRequests;
