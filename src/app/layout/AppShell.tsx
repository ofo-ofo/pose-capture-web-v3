import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fix100vh } from '../../utils/device';
// The virtual:pwa-register import is provided by vite-plugin-pwa at build time
// eslint-disable-next-line import/no-unresolved
import { registerSW } from 'virtual:pwa-register';

/**
 * AppShell wraps the content in a basic layout and performs global side effects
 * such as registering the service worker and adjusting CSS variables on resize.
 */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Fix iOS 100vh unit issues
    fix100vh();
    const handleResize = () => fix100vh();
    window.addEventListener('resize', handleResize);
    // Register service worker for PWA; immediate so it registers on first load
    registerSW({ immediate: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen-ios">
      <header className="bg-teal-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Pose Capture</h1>
        <nav className="space-x-4">
          <Link
            to="/"
            className={`${
              location.pathname === '/' ? 'font-bold underline' : 'hover:underline'
            }`}
          >
            Çekim
          </Link>
          <Link
            to="/settings"
            className={`${
              location.pathname === '/settings' ? 'font-bold underline' : 'hover:underline'
            }`}
          >
            Ayarlar
          </Link>
          <Link
            to="/test"
            className={`${
              location.pathname === '/test' ? 'font-bold underline' : 'hover:underline'
            }`}
          >
            Test
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default AppShell;