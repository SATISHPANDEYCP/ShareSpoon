import { useMemo, useState } from 'react';

const UserAvatar = ({ src, name = 'User', sizeClass = 'w-8 h-8', textClass = 'text-sm' }) => {
  const [hasError, setHasError] = useState(false);

  const initial = useMemo(() => {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
  }, [name]);

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center ${textClass}`}
        aria-label={name}
        title={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover`}
      onError={() => setHasError(true)}
    />
  );
};

export default UserAvatar;