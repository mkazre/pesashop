// Shared imperative state for the account tour: which menu row sits at
// which scroll offset, and a way to scroll the account tab's ScrollView to
// bring the next/previous target into view before the tour library measures
// it. rn-tourguide re-measures the current step's target on every step
// change but has no idea the target lives inside a scrollable list, so we
// drive the scroll ourselves and give the measurement a moment to settle.
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
export const tourRowOffsets: Record<string, number> = {};

export async function scrollToTourZone(order: number) {
  const tourId = TOUR_ORDER[order - 1];
  const y = tourId ? tourRowOffsets[tourId] : undefined;
  const scrollView = tourScrollRef.current;
  if (scrollView && y != null) {
    scrollView.scrollTo({ y: Math.max(y - 120, 0), animated: true });
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}
