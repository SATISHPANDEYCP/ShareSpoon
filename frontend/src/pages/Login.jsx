import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

/**
 * Login Page
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      navigate('/');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">🍕</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to continue sharing food
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2">
                <FiAlertCircle className="text-red-600 dark:text-red-400 mt-0.5" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? <Loader size="sm" color="white" /> : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Demo Credentials:
          </h3>
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Admin:</strong> admin@foodshare.com / admin123</p>
            <p><strong>User:</strong> john@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
