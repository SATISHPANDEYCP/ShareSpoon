import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Loader from './Loader';

/**
 * RequestModal Component
 * Modal for requesting food from a post
 */
const RequestModal = ({ post, isOpen, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/requests/${post._id}`, {
        message,
        pickupTime: pickupTime || undefined,
      });

      toast.success('Request sent successfully!');
      onSuccess();
      onClose();
      setMessage('');
      setPickupTime('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Request Food</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Post Info */}
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              <img
                src={post.images?.[0]?.url || 'https://via.placeholder.com/100'}
                alt={post.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  by {post.donor?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quantity: {post.quantity}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message */}
            <div>
              <label className="label">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Let the donor know why you need this food..."
                rows={4}
                className="input resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>

            {/* Pickup Time */}
            <div>
              <label className="label">Preferred Pickup Time (Optional)</label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="input"
              />
            </div>

            {/* Safety Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                Safety Guidelines:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Meet in a public place</li>
                <li>• Inspect food quality before accepting</li>
                <li>• Check for allergens if you have allergies</li>
                <li>• Refrigerate perishable items immediately</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? <Loader size="sm" color="white" /> : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
