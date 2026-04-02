import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { initializeSocket, disconnectSocket } from '../utils/socket';

/**
 * Auth Store - Manage authentication state
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      /**
       * Login user
       */
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          // Initialize socket
          initializeSocket(user._id);

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ loading: false, error: message });
          return { success: false, error: message };
        }
      },

      /**
       * Register user
       */
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          // Initialize socket
          initializeSocket(user._id);

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ loading: false, error: message });
          return { success: false, error: message };
        }
      },

      /**
       * Logout user
       */
      logout: () => {
        // Disconnect socket
        disconnectSocket();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      /**
       * Update user profile
       */
      updateProfile: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.put('/auth/profile', userData);
          const updatedUser = response.data.user;

          set({
            user: updatedUser,
            loading: false,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed';
          set({ loading: false, error: message });
          return { success: false, error: message };
        }
      },

      /**
       * Load user from localStorage on app start (handled by persist middleware)
       */
      loadUser: () => {
        const state = get();
        if (state.isAuthenticated && state.user) {
          // Initialize socket
          initializeSocket(state.user._id);
        }
      },

      /**
       * Clear error
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
