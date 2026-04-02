import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Store
import useAuthStore from './store/authStore';

// Components
import Navbar from './components/Navbar';
import PrivateRoute, { AdminRoute } from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadFood from './pages/UploadFood';

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

          {/* Placeholder routes - implement remaining pages similarly */}
          <Route
            path="/nearby"
            element={
              <PrivateRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Nearby Food - Coming Soon</h1>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">My Requests - Coming Soon</h1>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Profile - Coming Soon</h1>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/post/:id"
            element={
              <PrivateRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Post Details - Coming Soon</h1>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Admin Panel - Coming Soon</h1>
                </div>
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
      </div>
    </Router>
  );
}

export default App;
