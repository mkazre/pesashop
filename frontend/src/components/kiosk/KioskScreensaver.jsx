import React, { useEffect, useRef, useState } from 'react';
import { resolveUrl } from '@/utils/kioskUrl';

export default function KioskScreensaver({ media = [], onDismiss, welcomeHeading, welcomeSubheading }) {
  const [index, setIndex] = useState(0);
  const advanceTimerRef = useRef(null);
  const videoRef = useRef(null);

  const items = Array.isArray(media) && media.length > 0 ? media : [{ type: 'fallback' }];

  useEffect(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const current = items[index];
    if (!current) return;
    if (current.type === 'image' || current.type === 'fallback') {
      const ms = ((current.duration && current.duration > 0) ? current.duration : 8) * 1000;
      advanceTimerRef.current = setTimeout(() => {
        setIndex(i => (i + 1) % items.length);
      }, ms);
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [index, items]);

  const handleVideoEnded = () => setIndex(i => (i + 1) % items.length);

  const current = items[index] || items[0];

  return (
    <div
      onClick={onDismiss}
      onTouchStart={onDismiss}
      className="fixed inset-0 z-[10000] bg-black overflow-hidden cursor-pointer select-none"
    >
      {/* Media layer */}
      <div className="absolute inset-0">
        {current.type === 'video' && (
          <video
            ref={videoRef}
            key={current.url}
            src={resolveUrl(current.url)}
            autoPlay
            muted
            playsInline
            loop={items.length === 1}
            onEnded={handleVideoEnded}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {current.type === 'image' && (
          <img
            key={current.url}
            src={resolveUrl(current.url)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover animate-kiosk-kenburns"
          />
        )}
        {current.type === 'fallback' && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-700 to-primary-900" />
        )}
      </div>

      {/* Bottom-aligned welcome overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-12 md:p-20 text-white text-center">
        <div className="text-[clamp(2.5rem,6vw,7rem)] font-bold leading-tight drop-shadow-lg">
          {welcomeHeading || 'Welcome to PESA Shop'}
        </div>
        <div className="mt-4 text-[clamp(1.25rem,2.5vw,2.5rem)] opacity-90 drop-shadow-md">
          {welcomeSubheading || 'Tap anywhere to start shopping'}
        </div>
        <div className="mt-10 inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] opacity-70">
          <span className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
          Touch to begin
        </div>
      </div>
    </div>
  );
}
