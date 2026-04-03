import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMail, FiMapPin } from 'react-icons/fi';
import { getCurrentIndiaDateTime } from '../utils/dateUtils';

const Footer = () => {
  const year = new Date().getFullYear();
  const [indiaTime, setIndiaTime] = useState(getCurrentIndiaDateTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndiaTime(getCurrentIndiaDateTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400">Share Spoon</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Community-first platform to reduce food waste by sharing extra meals with nearby people.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/nearby" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  Nearby Food
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  Donate Food
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Contact
            </h4>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="inline-flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                support@sharespoon.com
              </p>
              <p className="inline-flex items-center gap-2">
                <FiMapPin className="w-4 h-4" />
                Built for local communities
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300">
                Current India Time (IST): {indiaTime}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {year} Share Spoon. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
            Made with <FiHeart className="text-red-500" /> to reduce food waste
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
