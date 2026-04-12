import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { demographicsAPI } from '@/services/api';

/**
 * ProfileCompletionPopup — shown on account page load when profile < 100%.
 * Dismissed for the session when user clicks away, re-appears next session.
 */
export default function ProfileCompletionPopup() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    // Dismissed flag resets each browser session (sessionStorage)
    return sessionStorage.getItem('profile-popup-dismissed') === 'true';
  });

  const { data } = useQuery(
    'profile-completion',
    () => demographicsAPI.getProfileCompletion(),
    {
      enabled: isAuthenticated && !dismissed,
      staleTime: 60000,
    }
  );

  const completion = data?.data?.data || {};

  // Don't show if: dismissed this session, not logged in, or already complete
  if (!isAuthenticated || dismissed || (completion.score !== undefined && completion.score >= 100)) {
    return null;
  }

  // No data yet
  if (!completion.score && completion.score !== 0) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('profile-popup-dismissed', 'true');
    setDismissed(true);
  };

  const handleComplete = () => {
    handleDismiss();
    navigate('/account/settings');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={handleDismiss}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Coin icon */}
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🪙</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center">Complete Your Profile</h3>
        <p className="text-sm text-gray-500 text-center mt-1">
          Earn <strong className="text-amber-600">{completion.rewardPoints || 100} PESA Coins</strong> when you reach 100%
        </p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span className="font-medium text-gray-800">{completion.score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-amber-400 h-2.5 rounded-full transition-all"
              style={{ width: `${completion.score}%` }}
            />
          </div>
        </div>

        {/* Missing fields checklist */}
        {completion.missingLabels?.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-medium text-gray-500">Still to complete:</p>
            <div className="grid grid-cols-2 gap-1">
              {completion.missingLabels.slice(0, 8).map((field, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  {field}
                </div>
              ))}
              {completion.missingLabels.length > 8 && (
                <p className="text-xs text-gray-400 col-span-2">
                  + {completion.missingLabels.length - 8} more fields
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Remind me later
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}
