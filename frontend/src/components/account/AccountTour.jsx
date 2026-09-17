import { useEffect, useRef } from 'react';
import { useJoyride, EVENTS, STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useTourStore } from '@/store';
import { authAPI } from '@/services/api';
import { CURRENT_ACCOUNT_TOUR_VERSION, ACCOUNT_TOUR_LOCAL_KEY } from '@/constants/onboarding';
import TourTooltip from './TourTooltip';

// Every stop spotlights a sidebar nav entry (see data-tour="nav-<key>" in
// AccountPage.jsx). The sidebar is always mounted regardless of which
// account sub-route is active, so the tour never needs to navigate — it
// just tells the user what each feature is and where to find it.
const TOUR_KEYS = [
  'dashboard',
  'loyaltyPoints',
  'referrals',
  'laybyes',
  'orders',
  'coupons',
  'giftCards',
  'addresses',
  'recurringOrders',
  'returns',
  'invoices',
  'settings',
];

export default function AccountTour() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const runToken = useTourStore((s) => s.runToken);
  const hasAutoCheckedRef = useRef(false);
  const prevRunTokenRef = useRef(runToken);

  const steps = TOUR_KEYS.map((key) => ({
    target: `[data-tour="nav-${key}"]`,
    placement: 'right',
    title: t(`onboarding.tour.${key}.title`),
    content: t(`onboarding.tour.${key}.body`),
  }));

  const finishTour = (markSeen) => {
    if (!markSeen) return;
    const onboarding = {
      ...(user?.onboarding || {}),
      accountTourVersion: CURRENT_ACCOUNT_TOUR_VERSION,
      accountTourDismissedAt: new Date().toISOString(),
    };
    updateUser({ onboarding });
    try {
      localStorage.setItem(ACCOUNT_TOUR_LOCAL_KEY, String(CURRENT_ACCOUNT_TOUR_VERSION));
    } catch { /* localStorage unavailable */ }
    authAPI.updateOnboarding({ accountTourVersion: CURRENT_ACCOUNT_TOUR_VERSION }).catch(() => {});
  };

  const { controls, Tour } = useJoyride({
    steps,
    continuous: true,
    onEvent: (data) => {
      if (data.type === EVENTS.STEP_BEFORE) {
        // Scroll the target into view ourselves, using the browser's native
        // scrollIntoView (which correctly accounts for position:sticky)
        // instead of Joyride's own scroll heuristic (skipScroll below),
        // which got confused by the sticky sidebar and scrolled to the
        // wrong place.
        const target =
          typeof data.step.target === 'string' ? document.querySelector(data.step.target) : data.step.target;
        target?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
      if (data.type === EVENTS.TOUR_END) {
        finishTour(data.status === STATUS.FINISHED);
      }
    },
    tooltipComponent: (props) => (
      <TourTooltip
        {...props}
        onClose={() => controls.stop()}
        onDontShowAgain={() => {
          controls.stop();
          finishTour(true);
        }}
      />
    ),
    // skipScroll: we drive scrolling ourselves in onEvent (STEP_BEFORE) via
    // scrollIntoView — Joyride's own scroll heuristic doesn't account for
    // position:sticky and scrolls the sidebar to the wrong place.
    options: { primaryColor: '#0e604a', zIndex: 10000, skipBeacon: true, skipScroll: true },
  });

  // Auto-run once per version. Re-fetches the user record so a dismissal
  // saved from another browser/device is respected even if this browser's
  // persisted auth store is stale.
  useEffect(() => {
    if (hasAutoCheckedRef.current) return;
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
      } catch { /* fall back to the locally-known version */ }

      if (version < CURRENT_ACCOUNT_TOUR_VERSION) {
        setTimeout(() => controls.start(0), 600);
      }
    })();
    // Runs once on mount only — intentionally ignores changing deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run trigger: the account nav "?" button and the Pesa Assistant menu
  // both bump useTourStore's runToken to (re)start the tour on demand.
  useEffect(() => {
    if (runToken !== prevRunTokenRef.current) {
      prevRunTokenRef.current = runToken;
      controls.start(0);
    }
  }, [runToken, controls]);

  return Tour;
}
