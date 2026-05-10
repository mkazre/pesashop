import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function generateDeviceId() {
  return 'kiosk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

export const useKioskStore = create(
  persist(
    (set, get) => ({
      deviceId: null,
      kioskMode: false,
      screensaverActive: false,
      lastInteractionAt: Date.now(),
      sessionStartedAt: null,

      enterKioskMode: (queryDeviceId) => {
        let deviceId = queryDeviceId || get().deviceId;
        if (!deviceId) deviceId = generateDeviceId();
        set({
          kioskMode: true,
          deviceId,
          sessionStartedAt: Date.now(),
          lastInteractionAt: Date.now(),
          screensaverActive: false,
        });
      },

      exitKioskMode: () => set({ kioskMode: false, screensaverActive: false }),

      noteInteraction: () => set({ lastInteractionAt: Date.now() }),

      activateScreensaver: () => set({ screensaverActive: true }),
      dismissScreensaver: () => set({ screensaverActive: false, lastInteractionAt: Date.now() }),

      newSession: () => set({ sessionStartedAt: Date.now(), lastInteractionAt: Date.now() }),
    }),
    {
      name: 'kiosk-storage',
      partialize: (state) => ({ deviceId: state.deviceId }),
    }
  )
);
