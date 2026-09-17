import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQ_KEYS = ['tracking', 'returns', 'loyalty', 'support', 'referrals'];

export default function FAQPanel() {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState(FAQ_KEYS[0]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">{t('chat.faq.title')}</h4>
      <div className="space-y-2">
        {FAQ_KEYS.map((key) => {
          const isOpen = openKey === key;
          return (
            <div key={key} className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpenKey(isOpen ? null : key)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                {t(`chat.faq.items.${key}.q`)}
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <p className="px-3 pb-3 text-sm text-gray-600">{t(`chat.faq.items.${key}.a`)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
