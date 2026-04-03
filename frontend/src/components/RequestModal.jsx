import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Loader from './Loader';
import { normalizeQuantityUnit } from '../utils/validation';

/**
 * RequestModal Component
 * Modal for requesting food from a post
 */
const RequestModal = ({ post, isOpen, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const getLocalDateTimeInputValue = (date = new Date()) => {
    const tzOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const getPositiveInt = (value) => {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const parsedQuantityFromText = getPositiveInt((post?.quantity || '').match(/\d+/)?.[0]);
  const maxAvailableQuantity =
    getPositiveInt(post?.availableQuantity) ||
    getPositiveInt(post?.totalQuantity) ||
    parsedQuantityFromText ||
    1;
  const quantityUnit = normalizeQuantityUnit(post?.quantityUnit || 'servings');
  const servingsPerUnit = post?.servingsPerUnit || 1;
  const normalizedRequestedQuantity = Math.min(
    Math.max(1, Number.parseInt(requestedQuantity || '1', 10) || 1),
    maxAvailableQuantity
  );
  const estimatedServings = normalizedRequestedQuantity * servingsPerUnit;

  useEffect(() => {
    if (!isOpen) return;
    setRequestedQuantity('1');
    setPickupTime('');
  }, [isOpen, maxAvailableQuantity, post?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const quantityToSend = Math.min(
      Math.max(1, Number.parseInt(requestedQuantity || '1', 10) || 1),
      maxAvailableQuantity
    );

    setLoading(true);

    try {
      await api.post(`/requests/${post._id}`, {
        requestedQuantity: quantityToSend,
        message,
        pickupTime: pickupTime || undefined,
      });

      onSuccess();
      onClose();
      setMessage('');
      setPickupTime('');
      setRequestedQuantity('1');
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
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Request Food</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Post Info */}
          <div className="mb-2.5">
            <div className="flex items-start gap-3">
              <img
                src={post.images?.[0]?.url || 'https://via.placeholder.com/100'}
                alt={post.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-base leading-tight">{post.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                  by {post.donor?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                  Quantity: {post.quantity}
                </p>
                {typeof post.availableQuantity === 'number' && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 leading-tight">
                    Available now: {post.availableQuantity} {quantityUnit}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                  1 {quantityUnit} ≈ {servingsPerUnit} servings
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Requested Quantity *</label>
              <input
                type="number"
                min={1}
                max={maxAvailableQuantity}
                value={requestedQuantity}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  if (rawValue === '') {
                    setRequestedQuantity('');
                    return;
                  }

                  const parsedValue = Number.parseInt(rawValue, 10);
                  if (!Number.isFinite(parsedValue)) return;

                  const clamped = Math.min(Math.max(1, parsedValue), maxAvailableQuantity);
                  setRequestedQuantity(String(clamped));
                }}
                onBlur={() => {
                  const parsedValue = Number.parseInt(requestedQuantity || '1', 10);
                  const clamped = Math.min(
                    Math.max(1, Number.isFinite(parsedValue) ? parsedValue : 1),
                    maxAvailableQuantity
                  );
                  setRequestedQuantity(String(clamped));
                }}
                required
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Max available: {maxAvailableQuantity} {quantityUnit} · ~{estimatedServings} servings for your request
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Let the donor know why you need this food..."
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-0.5">
                {message.length}/500 characters
              </p>
            </div>

            {/* Pickup Time */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Preferred Pickup Time (Optional)</label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                min={getLocalDateTimeInputValue()}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Safety Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
              <h4 className="font-semibold text-xs text-blue-900 dark:text-blue-100 mb-1">
                Safety Guidelines
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 leading-tight">
                <li>• Meet in a public place</li>
                <li>• Inspect food quality before accepting</li>
                <li>• Check for allergens if you have allergies</li>
                <li>• Refrigerate perishable items immediately</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
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
