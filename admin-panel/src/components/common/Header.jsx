import React from 'react';
import { IoMenuOutline, IoNotificationsOutline, IoPersonCircleOutline, IoLogOutOutline } from 'react-icons/io5';
import { useUIStore, useAuthStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';

const Header = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header
      className={classNames(
        'fixed top-0 right-0 h-16 bg-white border-b-2 border-gray-200 flex items-center justify-between px-6 transition-all duration-300 z-30',
        {
          'left-64': sidebarOpen,
          'left-20': !sidebarOpen,
        }
      )}
    >
      {/* Left side */}
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 transition-colors"
      >
        <IoMenuOutline size={24} />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 transition-colors">
          <IoNotificationsOutline size={24} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500"></span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 transition-colors"
          >
            <IoPersonCircleOutline size={32} />
            <div className="text-left">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-gray-200 shadow-lg">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <IoPersonCircleOutline size={20} />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
              >
                <IoLogOutOutline size={20} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
