import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiKey, FiLock, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Loader from '../components/Loader';

const getErrorMessage = (error, fallback) => (
  error.response?.data?.errors?.[0]?.message
  || error.response?.data?.message
  || fallback
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }));
    setError(null);
  };

  const requestCode = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/forgot-password', { email: formData.email });
      setStep('reset');
      toast.success(response.data.message);
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Unable to send a reset code');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      const message = 'Passwords do not match';
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      toast.success(response.data.message);
      navigate('/login', { replace: true });
    } catch (resetError) {
      const message = getErrorMessage(resetError, 'Unable to reset password');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/icon.png" alt="Share Spoon" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {step === 'request' ? 'Forgot your password?' : 'Create a new password'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {step === 'request'
              ? 'Enter your account email and we will send you a reset code.'
              : `Enter the 6-digit code sent to ${formData.email}.`}
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={step === 'request' ? requestCode : resetPassword} className="space-y-5">
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
                  disabled={step === 'reset'}
                  autoComplete="email"
                  className="input pl-10 disabled:opacity-70"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {step === 'reset' && (
              <>
                <div>
                  <label className="label">Reset Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiKey className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                      minLength={6}
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="input pl-10 tracking-widest"
                      placeholder="123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input pl-10"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
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
                      minLength={6}
                      autoComplete="new-password"
                      className="input pl-10"
                      placeholder="Repeat your new password"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2">
                <FiAlertCircle className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
              {loading
                ? <Loader size="sm" color="white" />
                : step === 'request' ? 'Send Reset Code' : 'Reset Password'}
            </button>

            {step === 'reset' && (
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={loading}
                  className="font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  disabled={loading}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Change email
                </button>
              </div>
            )}

            <div className="text-center">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
