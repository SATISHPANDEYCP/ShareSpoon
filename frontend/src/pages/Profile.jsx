import { useEffect, useState } from 'react';
import { FiCamera, FiSave } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import Loader from '../components/Loader';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, loading } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [received, setReceived] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const [donationResponse, receivedResponse] = await Promise.all([
        api.get('/users/donations'),
        api.get('/users/received'),
      ]);

      setDonations(donationResponse.data.posts || []);
      setReceived(receivedResponse.data.posts || []);
    } catch (error) {
      toast.error('Could not load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      return;
    }

    const data = new FormData();
    data.append('avatar', avatarFile);

    try {
      setSubmitting(true);
      const response = await api.put('/users/avatar', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      useAuthStore.setState((state) => ({
        user: {
          ...state.user,
          avatar: response.data.avatar,
        },
      }));

      setAvatarFile(null);
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update avatar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      phone: formData.phone,
      bio: formData.bio,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
    };

    const result = await updateProfile(payload);

    if (result.success) {
      toast.success('Profile updated');
    } else {
      toast.error(result.error || 'Profile update failed');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="text-center">
              <img
                src={user?.avatar || 'https://via.placeholder.com/120'}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover mx-auto"
              />
              <h2 className="text-xl font-semibold mt-3 text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>

            <div className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>Food donated: <strong>{user?.foodDonated || 0}</strong></p>
              <p>Food received: <strong>{user?.foodReceived || 0}</strong></p>
              <p>Rating: <strong>{Number(user?.rating || 0).toFixed(1)}</strong></p>
            </div>

            <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="label">Update Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="input"
              />
              <button
                type="button"
                className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2"
                onClick={handleAvatarUpload}
                disabled={!avatarFile || submitting}
              >
                <FiCamera />
                Upload
              </button>
            </div>
          </div>

          <div className="card p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="input" required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="input resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Street</label>
                  <input name="street" value={formData.street} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input name="state" value={formData.state} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Zip Code</label>
                  <input name="zipCode" value={formData.zipCode} onChange={handleChange} className="input" />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary inline-flex items-center gap-2"
                disabled={loading || submitting}
              >
                <FiSave />
                Save Changes
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Donation History</h3>
            {historyLoading ? (
              <Loader />
            ) : donations.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No donations yet.</p>
            ) : (
              <div className="space-y-3">
                {donations.slice(0, 5).map((item) => (
                  <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <span className="capitalize">{item.status}</span> | Created: {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Received History</h3>
            {historyLoading ? (
              <Loader />
            ) : received.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No received food yet.</p>
            ) : (
              <div className="space-y-3">
                {received.slice(0, 5).map((item) => (
                  <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Donor: {item.donor?.name || 'Unknown'} | Received: {formatDate(item.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
