import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, useEffect } from 'react';

// Store
import useAuthStore from './store/authStore';

// Components
import Navbar from './components/Navbar';
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
import { initializeSocket } from './utils/socket';

function App() {
  const { loadUser, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Load user from localStorage on app start
    loadUser();
  }, []);

  useEffect(() => {
    // Initialize socket if authenticated
    if (isAuthenticated && user) {
      initializeSocket(user._id);
    }
  }, [isAuthenticated, user]);

  return (
    <Router>
      <div className="App">
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
      </div>
    </Router>
  );
}

export default App;
