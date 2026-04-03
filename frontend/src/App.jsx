import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, useEffect } from 'react';
import toast from 'react-hot-toast';

// Store
import useAuthStore from './store/authStore';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute, { AdminRoute } from './components/PrivateRoute';

// Pages (lazy loaded for better code splitting)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UploadFood = lazy(() => import('./pages/UploadFood'));
const NearbyFood = lazy(() => import('./pages/NearbyFood'));
const MyRequests = lazy(() => import('./pages/MyRequests'));
const Profile = lazy(() => import('./pages/Profile'));
const PostDetails = lazy(() => import('./pages/PostDetails'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Settings = lazy(() => import('./pages/Settings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Socket connection
import { onSocketEvent, offSocketEvent } from './utils/socket';

function App() {
  const { loadUser, user, isAuthenticated } = useAuthStore();

  const buildRatingLink = (request) => {
    if (!request?._id || !user?._id) {
      return '/requests';
    }

    const tab = request.requester === user._id ? 'sent' : 'received';
    return `/requests?tab=${tab}&rateRequest=${request._id}`;
  };

  useEffect(() => {
    // Load user from localStorage on app start
    loadUser();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const showRequestToast = ({ message, ctaText, link }) => {
      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto border border-gray-200 dark:border-gray-700`}
        >
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.assign(link);
                }}
              >
                {ctaText}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => toast.dismiss(t.id)}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      ), { duration: 8000 });
    };

    const handleNewRequest = (payload) => {
      showRequestToast({
        message: payload?.message || 'You received a new food request.',
        ctaText: 'Review Request',
        link: '/requests?tab=received',
      });
    };

    const handleRequestAccepted = (payload) => {
      showRequestToast({
        message: payload?.message || 'Your request has been accepted.',
        ctaText: 'View Status',
        link: '/requests?tab=sent',
      });
    };

    const handleRequestRejected = (payload) => {
      showRequestToast({
        message: payload?.message || 'Your request was not accepted.',
        ctaText: 'View Requests',
        link: '/requests?tab=sent',
      });
    };

    const handleRequestCancelled = (payload) => {
      showRequestToast({
        message: payload?.message || 'A requester cancelled the request.',
        ctaText: 'Check Requests',
        link: '/requests?tab=received',
      });
    };

    const handlePickupConfirmed = (payload) => {
      const request = payload?.request;
      const message = payload?.message || 'Pickup completed. Please rate your experience.';
      const ratingLink = buildRatingLink(request);

      showRequestToast({
        message,
        ctaText: 'Rate Now',
        link: ratingLink,
      });
    };

    offSocketEvent('newRequest');
    offSocketEvent('requestAccepted');
    offSocketEvent('requestRejected');
    offSocketEvent('requestCancelled');
    offSocketEvent('pickupConfirmed');

    onSocketEvent('newRequest', handleNewRequest);
    onSocketEvent('requestAccepted', handleRequestAccepted);
    onSocketEvent('requestRejected', handleRequestRejected);
    onSocketEvent('requestCancelled', handleRequestCancelled);
    onSocketEvent('pickupConfirmed', handlePickupConfirmed);

    return () => {
      offSocketEvent('newRequest', handleNewRequest);
      offSocketEvent('requestAccepted', handleRequestAccepted);
      offSocketEvent('requestRejected', handleRequestRejected);
      offSocketEvent('requestCancelled', handleRequestCancelled);
      offSocketEvent('pickupConfirmed', handlePickupConfirmed);
    };
  }, [isAuthenticated, user]);

  return (
    <Router>
      <div className="App min-h-screen flex flex-col">
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Navbar */}
        <Navbar />

        {/* Routes */}
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          >
            <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <UploadFood />
              </PrivateRoute>
            }
          />

          <Route
            path="/nearby"
            element={
              <PrivateRoute>
                <NearbyFood />
              </PrivateRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <MyRequests />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />

          <Route
            path="/post/:id"
            element={
              <PrivateRoute>
                <PostDetails />
              </PrivateRoute>
            }
          />

          <Route
            path="/user/:id"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                    404
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    Page not found
                  </p>
                </div>
              </div>
            }
          />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
