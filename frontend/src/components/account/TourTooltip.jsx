import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TourTooltip({
  index,
  step,
  size,
  isLastStep,
  backProps,
  primaryProps,
  tooltipProps,
  onClose,
  onDontShowAgain,
}) {
  const { t } = useTranslation();

  return (
    <div
      {...tooltipProps}
      className="w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
        <button
          onClick={onClose}
          aria-label={t('onboarding.tour.nav.close')}
          className="-mr-1 -mt-1 shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-600">{step.content}</p>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onDontShowAgain}
          className="text-xs text-gray-400 underline decoration-dotted hover:text-gray-600"
        >
          {t('onboarding.tour.nav.dontShowAgain')}
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              {t('onboarding.tour.nav.back')}
            </button>
          )}
          <button
            {...primaryProps}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            {isLastStep ? t('onboarding.tour.nav.finish') : t('onboarding.tour.nav.next')}
          </button>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-gray-400">
        {index + 1} / {size}
      </div>
    </div>
  );
}
