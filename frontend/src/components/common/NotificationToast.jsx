import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';
import { IoNotifications, IoClose, IoChevronForward, IoMegaphone, IoCart, IoPricetag, IoTime, IoCheckmarkCircle } from 'react-icons/io5';

const TYPE_ICONS = {
  promotion: { icon: IoPricetag, color: '#F97316', bg: '#FFF7ED' },
  product: { icon: IoCart, color: '#3B82F6', bg: '#EFF6FF' },
  order_update: { icon: IoCheckmarkCircle, color: '#22C55E', bg: '#F0FDF4' },
  announcement: { icon: IoMegaphone, color: '#A855F7', bg: '#FAF5FF' },
  coupon: { icon: IoPricetag, color: '#EC4899', bg: '#FDF2F8' },
  reminder: { icon: IoTime, color: '#EAB308', bg: '#FEFCE8' },
  custom: { icon: IoNotifications, color: '#6B7280', bg: '#F9FAFB' },
};

const TOAST_DURATION = 6000; // auto-dismiss after 6 seconds

const NotificationToast = () => {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const lastCheckRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const pollRef = useRef(null);

  const isLoggedIn = useCallback(() => !!localStorage.getItem('token'), []);

  // Poll for new notifications and show toast for any unseen ones
  const checkForNew = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await notificationsAPI.getMy({ limit: 5 });
      const items = res.data?.data?.notifications || [];

      items.forEach((item) => {
        const n = item.notification;
        if (!n) return;
        // Only show toast for notifications we haven't seen yet and that are unread
        if (!item.read && !seenIdsRef.current.has(item._id)) {
          seenIdsRef.current.add(item._id);
          // Only show if notification was created in last 2 minutes (recently sent)
          const createdAt = new Date(n.createdAt).getTime();
          const twoMinsAgo = Date.now() - 120000;
          if (createdAt > twoMinsAgo) {
            addToast({
              id: item._id,
              title: n.title,
              body: n.body,
              image: n.image,
              icon: n.icon,
              type: n.type,
              actionUrl: n.actionUrl,
              actionLabel: n.actionLabel,
            });
          }
        }
      });
    } catch {
      // silently fail
    }
  }, [isLoggedIn]);

  const addToast = (toast) => {
    setToasts((prev) => {
      // Max 3 toasts visible at once
      const next = [toast, ...prev].slice(0, 3);
      return next;
    });

    // Auto-dismiss after TOAST_DURATION
    setTimeout(() => {
      removeToast(toast.id);
    }, TOAST_DURATION);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClick = async (toast) => {
    removeToast(toast.id);
    try {
      await notificationsAPI.recordClick(toast.id);
    } catch { /* */ }
    if (toast.actionUrl) {
      if (toast.actionUrl.startsWith('http')) {
        window.open(toast.actionUrl, '_blank');
      } else {
        navigate(toast.actionUrl);
      }
    }
  };

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    removeToast(id);
  };

  // Start polling every 15 seconds for new notifications
  useEffect(() => {
    // Initial check after 3s delay
    const initialTimeout = setTimeout(() => {
      checkForNew();
    }, 3000);

    pollRef.current = setInterval(checkForNew, 15000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollRef.current);
    };
  }, [checkForNew]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 400 }}>
      {toasts.map((toast, index) => {
        const typeInfo = TYPE_ICONS[toast.type] || TYPE_ICONS.custom;
        const TypeIcon = typeInfo.icon;

        return (
          <div
            key={toast.id}
            onClick={() => handleClick(toast)}
            className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl"
            style={{
              animation: `slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)`,
              animationFillMode: 'both',
              animationDelay: `${index * 0.08}s`,
            }}
          >
            {/* Progress bar */}
            <div className="h-0.5 bg-gray-100 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{
                  animation: `shrink ${TOAST_DURATION}ms linear forwards`,
                }}
              />
            </div>

            <div className="flex items-start gap-3 p-4">
              {/* Icon / Image */}
              {toast.image ? (
                <img src={toast.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
              ) : toast.icon ? (
                <img src={toast.icon} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: typeInfo.bg }}
                >
                  <TypeIcon size={20} style={{ color: typeInfo.color }} />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">PesaShop</p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-1">
                      {toast.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(e, toast.id)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                  >
                    <IoClose size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{toast.body}</p>
                {toast.actionUrl && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs font-medium text-blue-600 hover:text-blue-800">
                      {toast.actionLabel || 'View Details'}
                    </span>
                    <IoChevronForward size={12} className="text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
