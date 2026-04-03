import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiGithub, FiHeart, FiInstagram, FiLinkedin, FiMail, FiMapPin } from 'react-icons/fi';
import { FaXTwitter } from 'react-icons/fa6';
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
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <div className="h-px w-full bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300 dark:from-primary-900 dark:via-primary-700 dark:to-primary-900" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-[0.12em]">
              About
            </h4>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-primary-400 to-transparent dark:from-primary-600" />
            <h3 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight text-primary-600 dark:text-primary-400">
              Share Spoon
            </h3>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-7 max-w-sm">
              Community-first platform to reduce food waste by sharing extra meals with nearby people.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-[0.12em]">
              Quick Links
            </h4>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-primary-400 to-transparent dark:from-primary-600" />
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-1 gap-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/nearby" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                  Nearby Food
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                  Donate Food
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-[0.12em]">
              Contact
            </h4>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-primary-400 to-transparent dark:from-primary-600" />
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <ul className="space-y-2">
                <li className="grid grid-cols-[1rem,1fr] items-center gap-x-3">
                  <FiMail className="w-4 h-4 shrink-0" />
                  <a href="mailto:scrptix@gmail.com" className="break-all hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  scrptix@gmail.com
                  </a>
                </li>
                <li className="grid grid-cols-[1rem,1fr] items-center gap-x-3">
                  <FiMapPin className="w-4 h-4 shrink-0" />
                  <span>Built for local communities</span>
                </li>
                <li className="grid grid-cols-[1rem,1fr] items-start gap-x-3">
                  <FiClock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md inline-flex flex-col leading-5 w-fit max-w-[240px]">
                    <span>Current India Time (IST):</span>
                    <span>{indiaTime}</span>
                  </span>
                </li>
              </ul>

              <div className="pt-2 pl-7 flex items-center gap-2">
                <a
                  href="https://instagram.com/satishpandeycp"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <FiInstagram className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/in/satishpandeycp"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <FiLinkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/satishpandeycp"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <FaXTwitter className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/satishpandeycp"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <FiGithub className="w-4 h-4" />
                </a>
                <a
                  href="mailto:scrptix@gmail.com"
                  aria-label="Gmail"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <FiMail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-center md:text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {year} Share Spoon. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center justify-center md:justify-start gap-1">
            Made with <FiHeart className="text-red-500" /> to reduce food waste
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
