import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI } from '@/services/api';
import { useKioskConfig } from '@/hooks/useKioskConfig';
import { useCartStore, useCurrencyStore } from '@/store';
import { IoCheckmarkCircle, IoHomeOutline } from 'react-icons/io5';
import KioskConfetti from '@/components/kiosk/KioskConfetti';

export default function KioskOrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { config } = useKioskConfig();
  const { formatPrice } = useCurrencyStore();
  const clearCart = useCartStore(s => () => {
    const items = useCartStore.getState().items;
    for (let i = items.length - 1; i >= 0; i--) useCartStore.getState().removeItem(i);
  });

  const { data } = useQuery(['kiosk-order', orderId], () => ordersAPI.getOne(orderId), { enabled: !!orderId, refetchOnWindowFocus: false });
  const order = data?.data?.data;

  const seconds = config?.successAutoReturnSeconds || 30;
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => { clearCart(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          navigate('/kiosk', { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary-700 to-primary-900 text-white px-6 text-center relative overflow-hidden">
      <KioskConfetti />
      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center animate-[ping_1.5s_ease-out_1] mb-6">
        <IoCheckmarkCircle size={120} className="text-white" />
      </div>
      <div className="text-5xl md:text-7xl font-extrabold mb-4">Thank You!</div>
      <div className="text-xl md:text-2xl opacity-90">Your order has been placed successfully.</div>

      {order && (
        <div className="mt-8 bg-white/10 rounded-2xl px-8 py-6 backdrop-blur">
          <div className="text-sm uppercase tracking-widest opacity-70">Order Number</div>
          <div className="text-3xl md:text-4xl font-bold mt-1">{order.orderNumber || order._id?.slice(-8).toUpperCase()}</div>
          {order.totalAmount != null && (
            <div className="mt-3 text-lg opacity-90">Total: {formatPrice(order.totalAmount)}</div>
          )}
        </div>
      )}

      <div className="mt-10 text-base md:text-lg opacity-80">
        Track this order in <span className="font-semibold">My Account → Orders</span> at <span className="underline">pesashop.com</span>
      </div>

      <button
        onClick={() => navigate('/kiosk', { replace: true })}
        className="mt-10 inline-flex items-center gap-3 px-8 py-4 bg-white text-primary rounded-2xl text-xl font-bold shadow-xl"
      >
        <IoHomeOutline size={26} /> Back to Home now
      </button>
      <div className="mt-4 text-sm opacity-60">Returning home in {countdown}s…</div>
    </div>
  );
}
