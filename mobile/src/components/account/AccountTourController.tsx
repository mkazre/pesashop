import { useEffect, useRef } from "react";
import { useTourGuideController } from "rn-tourguide";
import { useAuthStore, useTourStore } from "@/store";
import { authAPI } from "@/services/api";
import { CURRENT_ACCOUNT_TOUR_VERSION } from "@/constants/onboarding";
import { scrollToTourZone } from "@/utils/accountTourTargets";

// Renders nothing — just owns the auto-run-once and re-run-trigger logic for
// the account tour, mirroring web's AccountTour. Must live inside a screen
// that's inside <TourGuideProvider> (mobile/app/_layout.tsx) so the 12
// TourGuideZone-wrapped menu rows have already registered.
export default function AccountTourController() {
  const { canStart, start } = useTourGuideController();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const runToken = useTourStore((s) => s.runToken);
  const hasAutoCheckedRef = useRef(false);
  const prevRunTokenRef = useRef(runToken);

  // Auto-run once per version. Re-fetches the user record so a dismissal
  // saved from another device/browser is respected even if this device's
  // persisted auth store is stale (mobile's updateUser doesn't rewrite the
  // AsyncStorage 'user' key, only in-memory state, so this refetch matters).
  useEffect(() => {
    if (!canStart || hasAutoCheckedRef.current) return;
    hasAutoCheckedRef.current = true;

    (async () => {
      let version = user?.onboarding?.accountTourVersion ?? 0;
      try {
        const res = await authAPI.getMe();
        const freshOnboarding = res?.data?.data?.onboarding;
        if (freshOnboarding) {
          version = freshOnboarding.accountTourVersion ?? version;
          updateUser({ onboarding: freshOnboarding });
        }
      } catch {
        // fall back to the locally-known version
      }

      if (version < CURRENT_ACCOUNT_TOUR_VERSION) {
        setTimeout(async () => {
          // Scroll back to the top first — if the menu was already scrolled
          // down, step 1's target would otherwise be off-screen and the
          // spotlight would appear to "miss".
          await scrollToTourZone(1);
          start(1);
        }, 600);
      }
    })();
    // Runs once when the tour becomes startable — intentionally ignores changing deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStart]);

  // Re-run trigger: the account tab's "?" button and the Pesa Assistant menu
  // both bump useTourStore's runToken to (re)start the tour on demand.
  useEffect(() => {
    if (runToken !== prevRunTokenRef.current) {
      prevRunTokenRef.current = runToken;
      (async () => {
        await scrollToTourZone(1);
        start(1);
      })();
    }
  }, [runToken, start]);

  return null;
}
