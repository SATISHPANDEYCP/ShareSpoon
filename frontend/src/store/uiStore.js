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

}));

export default useUIStore;
