import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Settings, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePathForRole, getSettingsPathForRole } from '@/utils/dashboardPath';
import NotificationBell from '@/components/notifications/NotificationBell';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profilePath = getProfilePathForRole(user?.role);
  const settingsPath = getSettingsPathForRole(user?.role);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const goTo = (path: string) => {
    setIsProfileOpen(false);
    navigate(path);
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:block ml-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600 sm:text-sm"
                  type="text"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[15px] font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[13px] text-gray-500">{user?.email}</p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-lg font-semibold">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => goTo(profilePath)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <UserCircle className="h-5 w-5 mr-3 text-gray-400" />
                      Your Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo(settingsPath)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Settings className="h-5 w-5 mr-3 text-gray-400" />
                      {user?.role === 'Admin' ? 'Practice settings' : 'Settings'}
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
