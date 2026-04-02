import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiMapPin, FiTrendingUp, FiSliders } from 'react-icons/fi';
import api from '../utils/api';
import FoodCard from '../components/FoodCard';
import RequestModal from '../components/RequestModal';
import Loader from '../components/Loader';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { getCurrentLocation } from '../utils/locationUtils';

/**
 * Home/Dashboard Page
 */
const Home = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10); // Default 10km

  // Fetch user location
  useEffect(() => {
    getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
      })
      .catch((error) => {
        console.error('Error getting location:', error);
      });
  }, []);

  // Fetch posts
  useEffect(() => {
    fetchPosts();
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [userLocation, searchRadius]); // Re-fetch when location or radius changes

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};

      if (userLocation) {
        params.longitude = userLocation.longitude;
        params.latitude = userLocation.latitude;
        params.radius = searchRadius; // Use selected radius
      }

      const response = await api.get('/posts', { params });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch food posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRequestFood = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleRequestSuccess = () => {
    fetchPosts();
    toast.success('Request sent successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Share Food, Reduce Waste 🌍
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              Join our community in fighting food waste by sharing extra food with neighbors
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/upload" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg">
                <FiPlusCircle className="inline mr-2" />
                Donate Food
              </Link>
              <Link to="/nearby" className="btn bg-primary-700 hover:bg-primary-800 text-white px-8 py-3 text-lg border border-primary-500">
                <FiMapPin className="inline mr-2" />
                Find Food
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section (Admin Only) */}
      {user?.role === 'admin' && stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.users.total}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.posts.total}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Active Posts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.posts.active}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.posts.completed}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Header with Radius Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Available Food Near You
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Fresh food donations from your neighbors
            </p>
          </div>

          {/* Search Radius Selector */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <FiSliders className="text-primary-600 w-5 h-5" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Radius:
            </label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={20}>20 km</option>
              <option value={30}>30 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader size="lg" />
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🍽️</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No food posts available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to share food in your area!
            </p>
            <Link to="/upload" className="btn-primary">
              <FiPlusCircle className="inline mr-2" />
              Donate Food
            </Link>
          </div>
        ) : (
          /* Food Posts Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <FoodCard
                key={post._id}
                post={post}
                onRequestFood={handleRequestFood}
                userLocation={userLocation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <RequestModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
};

export default Home;
