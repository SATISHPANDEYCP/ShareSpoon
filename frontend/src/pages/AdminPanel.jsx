import { useEffect, useState } from 'react';
import { FiBarChart2, FiRefreshCw, FiSlash, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, postsResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users', { params: { limit: 10 } }),
        api.get('/admin/posts', { params: { limit: 10 } }),
      ]);

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setPosts(postsResponse.data.posts || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (userId) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${userId}/ban`);
      toast.success('User status updated');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserDelete = async (userId) => {
    try {
      setActionLoading(true);
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostRemove = async (postId) => {
    try {
      setActionLoading(true);
      await api.delete(`/admin/posts/${postId}`);
      toast.success('Post removed');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove post');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Moderate users, posts, and review platform activity.</p>
          </div>
          <button className="btn-secondary inline-flex items-center gap-2" onClick={fetchData}>
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users.total}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.posts.active}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.posts.completed}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.requests.total}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
              <FiBarChart2 />
              Users
            </h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                    <span className={`badge ${user.isBanned ? 'badge-danger' : 'badge-success'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleBanToggle(user._id)}
                      className="btn-secondary inline-flex items-center gap-2"
                      disabled={actionLoading || user.role === 'admin'}
                    >
                      <FiSlash />
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      onClick={() => handleUserDelete(user._id)}
                      className="btn-danger inline-flex items-center gap-2"
                      disabled={actionLoading || user.role === 'admin'}
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Posts</h2>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">By {post.donor?.name || 'Unknown'}</p>
                    </div>
                    <span className="badge-info capitalize">{post.status}</span>
                  </div>

                  <button
                    onClick={() => handlePostRemove(post._id)}
                    className="btn-danger mt-3 inline-flex items-center gap-2"
                    disabled={actionLoading}
                  >
                    <FiTrash2 />
                    Remove Post
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
