import { useEffect, useState } from 'react';
import { FiMapPin, FiSliders, FiRefreshCw } from 'react-icons/fi';
import api from '../utils/api';
import FoodCard from '../components/FoodCard';
import Loader from '../components/Loader';
import RequestModal from '../components/RequestModal';
import { getCurrentLocation } from '../utils/locationUtils';
import toast from 'react-hot-toast';

const foodTypes = [
  'All',
  'Cooked Meal',
  'Raw Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Bakery',
  'Packaged Food',
  'Other',
];

const NearbyFood = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(10);
  const [foodType, setFoodType] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadLocationAndPosts();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [radius, foodType, userLocation]);

  const loadLocationAndPosts = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      toast.error('Location unavailable. Showing latest posts.');
      fetchPosts();
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = { radius };

      if (foodType !== 'All') {
        params.foodType = foodType;
      }

      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }

      const response = await api.get('/posts', { params });
      setPosts(response.data.posts || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch nearby food');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nearby Food</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Explore food posts near your current location.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <FiSliders className="text-primary-600" />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-transparent focus:outline-none text-sm"
              >
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="bg-transparent focus:outline-none text-sm"
              >
                {foodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={fetchPosts} className="btn-secondary inline-flex items-center gap-2">
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </div>

        {!userLocation && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 px-4 py-3 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200 inline-flex items-center gap-2">
            <FiMapPin />
            Showing latest posts because location access is disabled.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No matching posts found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Try increasing radius or changing the food type filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <FoodCard
                key={post._id}
                post={post}
                onRequestFood={(value) => {
                  setSelectedPost(value);
                  setIsModalOpen(true);
                }}
                userLocation={userLocation}
              />
            ))}
          </div>
        )}
      </div>

      <RequestModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPosts}
      />
    </div>
  );
};

export default NearbyFood;
