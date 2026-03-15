import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';
import { IoNotifications, IoClose, IoCheckmarkDone, IoChevronForward, IoMegaphone, IoCart, IoPricetag, IoTime, IoCheckmarkCircle } from 'react-icons/io5';

const TYPE_ICONS = {
  promotion: { icon: IoPricetag, bg: 'bg-orange-50', color: 'text-orange-500' },
  product: { icon: IoCart, bg: 'bg-blue-50', color: 'text-blue-500' },
  order_update: { icon: IoCheckmarkCircle, bg: 'bg-green-50', color: 'text-green-500' },
  announcement: { icon: IoMegaphone, bg: 'bg-purple-50', color: 'text-purple-500' },
  coupon: { icon: IoPricetag, bg: 'bg-pink-50', color: 'text-pink-500' },
  reminder: { icon: IoTime, bg: 'bg-yellow-50', color: 'text-yellow-500' },
  custom: { icon: IoNotifications, bg: 'bg-gray-50', color: 'text-gray-500' },
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  // Reactively check auth — re-check on storage changes and on interval
  const isLoggedIn = useCallback(() => !!localStorage.getItem('token'), []);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn()) { setUnreadCount(0); return; }
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data?.data?.count ?? res.data?.count ?? 0);
    } catch {
      // silently fail
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = async () => {
    if (!isLoggedIn()) return;
    setLoading(true);
    try {
      const res = await notificationsAPI.getMy({ limit: 15 });
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const toggleOpen = () => {
    if (!isLoggedIn()) {
      navigate('/account');
      return;
    }
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleClick = async (notif) => {
    const n = notif.notification;
    if (!n) return;

    // Mark as read + record click
    try {
      await notificationsAPI.recordClick(notif._id);
      setNotifications(prev => prev.map(item =>
        item._id === notif._id ? { ...item, read: true, clicked: true } : item
      ));
      setUnreadCount(prev => Math.max(0, prev - (notif.read ? 0 : 1)));
    } catch { /* */ }

    // Navigate to action URL
    if (n.actionUrl) {
      setOpen(false);
      if (n.actionUrl.startsWith('http')) {
        window.open(n.actionUrl, '_blank');
      } else {
        navigate(n.actionUrl);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* */ }
  };

  const handleDismiss = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationsAPI.dismiss(notifId);
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch { /* */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <IoNotifications size={22} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col"
          style={{ animation: 'fadeInDown 0.15s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <IoCheckmarkDone size={14} /> Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <IoNotifications size={36} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const n = notif.notification;
                if (!n) return null;
                const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS.custom;
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      !notif.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Image or Icon */}
                    {n.image ? (
                      <img src={n.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon size={18} className={typeInfo.color} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                        {n.actionUrl && (
                          <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                            {n.actionLabel || 'View'} <IoChevronForward size={10} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot + dismiss */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
                      {!notif.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                      <button
                        onClick={(e) => handleDismiss(e, notif._id)}
                        className="p-0.5 rounded hover:bg-gray-200 text-gray-300 hover:text-gray-500 transition-colors"
                        title="Dismiss"
                      >
                        <IoClose size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2 bg-gray-50 text-center">
              <button
                onClick={() => { setOpen(false); navigate('/account/notifications'); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
