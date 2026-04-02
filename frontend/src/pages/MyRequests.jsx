import { useEffect, useState } from 'react';
import { FiCheck, FiClock, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
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

const RequestCard = ({ request, type, onAction }) => {
  const statusClass = statusClasses[request.status] || 'badge';
  const title = request.post?.title || 'Food Post';

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
    </div>
  );
};

const MyRequests = () => {
  const [activeTab, setActiveTab] = useState('sent');
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [sentResponse, receivedResponse] = await Promise.all([
        api.get('/requests/sent'),
        api.get('/requests/received'),
      ]);

      setSentRequests(sentResponse.data.requests || []);
      setReceivedRequests(receivedResponse.data.requests || []);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
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
                <RequestCard request={request} type={activeTab} onAction={handleAction} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
