/**
 * Loader Component
 * Simple loading spinner
 */
const Loader = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
      ></div>
    </div>
  );
};

/**
 * FullPageLoader Component
 * Loading spinner for full page
 */
export const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col justify-center items-center z-50">
      <Loader size="xl" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  );
};

export default Loader;
