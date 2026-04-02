import { create } from 'zustand';

/**
 * UI Store - Manage UI state
 */
const useUIStore = create((set) => ({
  // State
  isDarkMode: false,
  isSidebarOpen: true,
  notifications: [],

  // Actions
  /**
   * Toggle dark mode
   */
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      // Apply dark class to html element
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: newMode };
    }),

  /**
   * Toggle sidebar
   */
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  /**
   * Add notification
   */
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now(), ...notification },
      ],
    })),

  /**
   * Remove notification
   */
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  /**
   * Clear all notifications
   */
  clearNotifications: () => set({ notifications: [] }),
}));

export default useUIStore;
