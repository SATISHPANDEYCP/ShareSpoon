import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiAlertCircle, FiShield } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

/**
 * Register Page
 */
const Register = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, loading, error, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
  });
  const [otpStep, setOtpStep] = useState(false);

  const [errors, setErrors] = useState({});

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
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword: _confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success && result.requiresEmailVerification) {
      setOtpData((prev) => ({ ...prev, email: result.email || registerData.email }));
      setOtpStep(true);
      toast.success(result.message || 'OTP sent to your email');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otpData.otp || otpData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    const result = await verifyOtp(otpData.email, otpData.otp);
    if (result.success) {
      toast.success(result.message || 'Email verified successfully');
      navigate('/login');
    } else {
      toast.error(result.error || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    const result = await resendOtp(otpData.email);
    if (result.success) {
      toast.success(result.message || 'OTP resent');
    } else {
      toast.error(result.error || 'Failed to resend OTP');
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
            Join FoodShare
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Start sharing food and reducing waste
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          {!otpStep ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

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
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

              {/* Phone */}
            <div>
              <label className="label">Phone Number (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="+1234567890"
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

              {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
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
              {loading ? <Loader size="sm" color="white" /> : 'Create Account'}
            </button>

              {/* Divider */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <FiShield className="w-10 h-10 mx-auto text-primary-600 mb-2" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Verify Your Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  We sent a 6-digit OTP to <span className="font-medium">{otpData.email}</span>
                </p>
              </div>

              <div>
                <label className="label">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpData.otp}
                  onChange={(e) => setOtpData((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                  required
                  className="input text-center tracking-[0.35em] text-lg"
                  placeholder="123456"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2">
                  <FiAlertCircle className="text-red-600 dark:text-red-400 mt-0.5" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                {loading ? <Loader size="sm" color="white" /> : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="btn-secondary w-full"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="w-full text-sm text-primary-600 hover:text-primary-700"
              >
                Back to signup form
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
