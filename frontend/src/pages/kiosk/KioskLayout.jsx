import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useKioskStore } from '@/store/kioskStore';
import { useAuthStore, useCartStore } from '@/store';
import { useKioskConfig } from '@/hooks/useKioskConfig';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { digitalKioskAPI } from '@/services/api';
import KioskScreensaver from '@/components/kiosk/KioskScreensaver';
import '@/styles/kiosk.css';

const HEARTBEAT_INTERVAL_MS = 60_000;

export default function KioskLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    deviceId, kioskMode, screensaverActive,
    enterKioskMode, activateScreensaver, dismissScreensaver, newSession,
  } = useKioskStore();

  const { user } = useAuthStore();
  const { clearAuth } = useAuthStore.getState();
  const { items, removeItem } = useCartStore();

  const { config } = useKioskConfig();
  const branding = config?.branding || {};

  const fullscreenRequestedRef = useRef(false);
  const hadUserRef = useRef(!!user);

  // Initialize kiosk mode on first mount
  useEffect(() => {
    const queryDeviceId = searchParams.get('kiosk');
    enterKioskMode(queryDeviceId);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Register device with the backend (idempotent) once we have a deviceId
  useEffect(() => {
    if (!deviceId) return;
    digitalKioskAPI.registerDevice({
      deviceId,
      userAgent: navigator.userAgent,
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
    }).catch(() => { /* silent; route will retry next mount */ });
  }, [deviceId]);

  // Heartbeat every 60s
  useEffect(() => {
    if (!deviceId) return undefined;
    const tick = () => digitalKioskAPI.heartbeat(deviceId).catch(() => {});
    const interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [deviceId]);

  // Idle → screensaver
  const idleSeconds = config?.idleTimeoutSeconds || 60;
  const screensaverEnabled = config?.screensaverEnabled !== false;
  useIdleTimer({
    timeout: idleSeconds * 1000,
    enabled: kioskMode && screensaverEnabled && !screensaverActive,
    onIdle: () => activateScreensaver(),
  });

  // Auto-logout / session reset after longer idle
  const autoLogoutSeconds = config?.autoLogoutSeconds || 300;
  useIdleTimer({
    timeout: autoLogoutSeconds * 1000,
    enabled: kioskMode,
    onIdle: () => {
      // Clear auth + cart + session, return to home
      try {
        const { items: currentItems } = useCartStore.getState();
        for (let i = currentItems.length - 1; i >= 0; i--) removeItem(i);
      } catch {}
      try { localStorage.removeItem('token'); } catch {}
      try { clearAuth(); } catch {}
      newSession();
      activateScreensaver();
      navigate('/kiosk', { replace: true });
    },
  });

  // Apply branding variables
  const themeStyle = {
    '--kiosk-primary': branding.primary || '#0e604a',
    '--kiosk-secondary': branding.secondary || '#f7bd20',
    fontFamily: branding.font ? `${branding.font}, Inter, sans-serif` : undefined,
  };

  // Best-effort fullscreen on first user gesture
  const requestFullscreen = () => {
    if (fullscreenRequestedRef.current) return;
    fullscreenRequestedRef.current = true;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  return (
    <div className="kiosk-root min-h-screen bg-gray-50 text-gray-900" style={themeStyle} onPointerDownCapture={requestFullscreen}>
      <Outlet />
      {kioskMode && screensaverActive && (
        <KioskScreensaver
          media={config?.screensaverMedia || []}
          welcomeHeading={config?.welcomeHeading}
          welcomeSubheading={config?.welcomeSubheading}
          onDismiss={() => {
            dismissScreensaver();
            newSession();
            navigate('/kiosk', { replace: true });
          }}
        />
      )}
    </div>
  );
}
