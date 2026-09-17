import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { WELCOME_PROMPT_DISMISSED_KEY } from '@/constants/onboarding';

const SHOW_DELAY_MS = 2500;

export default function WelcomePrompt() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(WELCOME_PROMPT_DISMISSED_KEY) === 'true';
    } catch { /* localStorage unavailable (e.g. private browsing) */ }
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(WELCOME_PROMPT_DISMISSED_KEY, 'true');
    } catch { /* ignore */ }
  };

  const handleSignIn = () => {
    dismiss();
    openAuthModal('login');
  };

  if (isAuthenticated) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:left-auto sm:right-6"
          role="dialog"
          aria-live="polite"
        >
          <button
            onClick={dismiss}
            aria-label={t('onboarding.welcome.dismiss')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
          <h3 className="pr-6 text-sm font-semibold text-gray-900">
            {t('onboarding.welcome.title')}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{t('onboarding.welcome.body')}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSignIn}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              {t('onboarding.welcome.ctaSignIn')}
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              {t('onboarding.welcome.ctaMaybeLater')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
