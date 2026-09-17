import { findNodeHandle } from 'react-native';

// Shared imperative state for the account tour: a registry of each menu
// row's ref plus the account tab's ScrollView ref, so we can scroll the
// next/previous target into view before rn-tourguide measures it.
// rn-tourguide re-measures the current step's target on every step change
// but has no idea the target lives inside a scrollable list, so we drive the
// scroll ourselves. Measuring fresh (via measureLayout) on every call rather
// than caching an offset once at mount avoids the cache going stale if
// content above the menu shifts after first layout.
export const TOUR_ORDER = [
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

export const tourScrollRef: { current: any } = { current: null };
export const tourRowRefs: Record<string, any> = {};

export async function scrollToTourZone(order: number) {
  const tourId = TOUR_ORDER[order - 1];
  const rowRef = tourId ? tourRowRefs[tourId] : null;
  const scrollView = tourScrollRef.current;
  if (!rowRef?.measureLayout || !scrollView) return;

  const scrollHandle = findNodeHandle(scrollView);
  if (!scrollHandle) return;

  await new Promise<void>((resolve) => {
    rowRef.measureLayout(
      scrollHandle,
      (_x: number, y: number) => {
        scrollView.scrollTo({ y: Math.max(y - 120, 0), animated: true });
        setTimeout(resolve, 400);
      },
      () => resolve()
    );
  });
}
