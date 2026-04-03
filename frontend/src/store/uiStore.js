import { create } from 'zustand';

const THEME_STORAGE_KEY = 'sharespoon-theme';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = (isDarkMode) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }
};

const initialDarkMode = getInitialDarkMode();
applyTheme(initialDarkMode);

/**
 * UI Store - Manage UI state
 */
const useUIStore = create((set) => ({
  // State
  isDarkMode: initialDarkMode,
  isSidebarOpen: true,
  notifications: [],

  // Actions
  /**
   * Toggle dark mode
   */
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;

      applyTheme(newMode);

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
