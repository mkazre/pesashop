import React, { useEffect, useRef, useState } from 'react';
import { IoMenuOutline, IoNotificationsOutline, IoPersonCircleOutline, IoLogOutOutline, IoCartOutline } from 'react-icons/io5';
import { useUIStore, useAuthStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '@/services/api';
import classNames from 'classnames';

// Play a short notification beep using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {}
}

const Header = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const lastSeenRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    // Initialise the last-seen timestamp from localStorage
    const stored = localStorage.getItem('admin_last_order_seen');
    lastSeenRef.current = stored ? new Date(stored) : new Date();

    const checkNewOrders = async () => {
      try {
        const res = await ordersAPI.getAll({ sort: '-createdAt', limit: 5 });
        const orders = res.data?.data || res.data?.orders || [];
        const since = lastSeenRef.current;
        const fresh = orders.filter((o) => new Date(o.createdAt) > since);
        if (fresh.length > 0) {
          setNewOrderCount((prev) => prev + fresh.length);
          setRecentOrders(orders.slice(0, 5));
          playNotificationSound();
          lastSeenRef.current = new Date();
          localStorage.setItem('admin_last_order_seen', lastSeenRef.current.toISOString());
        } else {
          setRecentOrders(orders.slice(0, 5));
        }
      } catch {}
    };

    checkNewOrders();
    pollingRef.current = setInterval(checkNewOrders, 30000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const handleBellClick = () => {
    setShowNotifDropdown((prev) => !prev);
    setNewOrderCount(0);
    lastSeenRef.current = new Date();
    localStorage.setItem('admin_last_order_seen', lastSeenRef.current.toISOString());
  };

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
      <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 transition-colors">
        <IoMenuOutline size={24} />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 hover:bg-gray-100 transition-colors"
            title="New orders"
          >
            <IoNotificationsOutline size={24} />
            {newOrderCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1">
                {newOrderCount > 9 ? '9+' : newOrderCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 shadow-xl z-50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">Recent Orders</span>
                <button
                  onClick={() => { setShowNotifDropdown(false); navigate('/orders'); }}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </button>
              </div>
              {recentOrders.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No recent orders</div>
              ) : (
                recentOrders.map((order) => (
                  <button
                    key={order._id}
                    onClick={() => { setShowNotifDropdown(false); navigate(`/orders/${order._id}`); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IoCartOutline size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        #{order.orderNumber || order._id?.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.shippingAddress?.firstName || 'Customer'} · R {(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

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
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-gray-200 shadow-lg z-50">
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
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

      {/* Click-outside to close dropdowns */}
      {(showNotifDropdown || showProfileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifDropdown(false); setShowProfileMenu(false); }}
        />
      )}
    </header>
  );
};

export default Header;
