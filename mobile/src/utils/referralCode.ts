// Mirrors ReferLandingPage.jsx's localStorage persistence — a mobile
// equivalent of "pesa_referral_code" so a referral code still attributes a
// signup even if the visitor taps "Just browse" first and registers later
// via a different path than the /refer/[code] screen's own CTA.
export const REFERRAL_CODE_STORAGE_KEY = "pesa_referral_code";
