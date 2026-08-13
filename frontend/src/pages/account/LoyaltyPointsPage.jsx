import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import toast from '@/utils/toast';
import SmartIcon from '@/components/common/SmartIcon';

export default function LoyaltyPointsPage() {
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview | history | share | convert
  const { formatPrice } = useCurrencyStore();

  // Share form
  const [shareEmail, setShareEmail] = useState('');
  const [sharePoints, setSharePoints] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  // Convert form
  const [convertPoints, setConvertPoints] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await loyaltyAPI.getMyOverview();
      if (res.data?.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty overview', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    try {
      const res = await loyaltyAPI.getHistory({ page, limit: 15 });
      if (res.data?.success) {
        setHistory(res.data.data);
        setHistoryPages(res.data.pagination?.pages || 1);
        setHistoryPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (tab === 'history') {
      fetchHistory(1);
    }
  }, [tab]);

  const handleShare = async (e) => {
    e.preventDefault();
    const pts = parseInt(sharePoints);
    if (!shareEmail || !pts || pts <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSharing(true);
    try {
      const res = await loyaltyAPI.sharePoints({
        recipientEmail: shareEmail,
        points: pts,
        message: shareMessage
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setShareEmail('');
        setSharePoints('');
        setShareMessage('');
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share points');
    } finally {
      setSharing(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    const pts = parseInt(convertPoints);
    if (!pts || pts <= 0) {
      toast.error('Enter a valid points amount');
      return;
    }
    setConverting(true);
    try {
      const res = await loyaltyAPI.convertPoints(pts);
      if (res.data?.success) {
        toast.success(res.data.message);
        setConvertPoints('');
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert points');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!overview || !overview.enabled) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">PESA Coins program is currently not available.</p>
      </div>
    );
  }

  const labels = overview.labels || { points: 'PESA Coins', point: 'PESA Coin', redeem: 'Redeem', earned: 'Earned' };
  const redemptionRate = overview.redemptionRate || 0;

  const getTypeLabel = (type) => {
    const map = {
      earned: 'Earned',
      redeemed: 'Redeemed',
      expired: 'Expired',
      adjusted: 'Adjusted',
      signup_bonus: 'Signup Bonus',
      daily_login: 'Daily Login',
      profile_complete: 'Profile Complete',
      referral_registration: 'Referral',
      referral_purchase: 'Referral Purchase',
      top_customer: 'Top Customer',
      level_achievement: 'Level Up',
      birthday_bonus: 'Birthday',
      review_bonus: 'Review',
      order_count_bonus: 'Order Milestone',
      cart_total_bonus: 'Cart Milestone',
      total_spent_bonus: 'Spending Milestone',
      shared_out: 'Shared (Sent)',
      shared_in: 'Shared (Received)',
      converted: 'Converted to Credit',
      mlm_referral_signup: 'Referral Network — Signup',
      mlm_referral_purchase: 'Referral Network — Purchase',
    };
    return map[type] || type;
  };

  const getTypeColor = (type) => {
    if (['earned', 'signup_bonus', 'daily_login', 'profile_complete', 'referral_registration', 'referral_purchase', 'top_customer', 'level_achievement', 'birthday_bonus', 'review_bonus', 'order_count_bonus', 'cart_total_bonus', 'total_spent_bonus', 'shared_in', 'mlm_referral_signup', 'mlm_referral_purchase'].includes(type)) {
      return 'text-green-600';
    }
    if (['redeemed', 'expired', 'shared_out', 'converted'].includes(type)) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{labels.points}</h1>
        <p className="text-gray-500 mt-1">Earn, share, and convert your reward {labels.points.toLowerCase()}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <p className="text-amber-100 text-sm font-medium">Your Balance</p>
          <p className="text-3xl font-bold mt-1">{overview.balance.toLocaleString()}</p>
          <p className="text-amber-200 text-sm mt-1">{labels.points}</p>
        </div>

        {/* Cash Value */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-gray-500 text-sm font-medium">Cash Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(overview.cashValueZAR)}</p>
          <p className="text-gray-400 text-xs mt-1">1 {labels.point} = {formatPrice(redemptionRate)}</p>
        </div>

        {/* Level */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-gray-500 text-sm font-medium">Current Level</p>
          <p className="text-2xl font-bold mt-1" style={{ color: overview.currentLevel?.color || '#0e604a' }}>
            {overview.currentLevel?.name || 'None'}
          </p>
          {overview.currentLevel?.badgeIcon && (
            <p className="mt-1"><SmartIcon value={overview.currentLevel.badgeIcon} size={20} color={overview.currentLevel?.color || '#0e604a'} /></p>
          )}
        </div>

        {/* Next Level */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-gray-500 text-sm font-medium">Next Level</p>
          {overview.nextLevel ? (
            <>
              <p className="text-lg font-bold text-gray-900 mt-1">{overview.nextLevel.name}</p>
              <p className="text-sm text-gray-500 mt-1">{overview.pointsToNextLevel.toLocaleString()} {labels.points.toLowerCase()} to go</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, overview.nextLevel.minPoints > 0 ? ((overview.balance / overview.nextLevel.minPoints) * 100) : 0)}%`
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-lg font-bold text-green-600 mt-1">Max Level!</p>
          )}
        </div>
      </div>

      {/* Expiring Points Warning */}
      {overview.expiringPoints > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm text-red-700">
            <span className="font-bold">{overview.expiringPoints.toLocaleString()}</span> {labels.points.toLowerCase()} expiring in the next 30 days.
            Use them before they expire!
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'overview', label: 'Recent Activity' },
            { key: 'history', label: 'Full History' },
            { key: 'share', label: `Share ${labels.points}` },
            { key: 'convert', label: 'Convert to Money' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          {overview.recentTransactions && overview.recentTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {overview.recentTransactions.map((tx) => (
                <div key={tx._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.reason || getTypeLabel(tx.type)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.points >= 0 ? '+' : ''}{tx.points}
                    </p>
                    <p className="text-xs text-gray-400">{formatPrice(Math.abs(tx.points) * redemptionRate)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No transactions yet</div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">{labels.points}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Value</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length > 0 ? history.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(tx.type)} bg-gray-100`}>
                        {getTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{tx.reason || '-'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.points >= 0 ? '+' : ''}{tx.points}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatPrice(Math.abs(tx.points) * redemptionRate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {tx.balanceAfter != null ? tx.balanceAfter.toLocaleString() : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {historyPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => fetchHistory(historyPage - 1)}
                disabled={historyPage <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {historyPage} of {historyPages}</span>
              <button
                onClick={() => fetchHistory(historyPage + 1)}
                disabled={historyPage >= historyPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'share' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Share {labels.points} with a Friend</h3>
          <p className="text-sm text-gray-500 mb-6">
            Send your {labels.points.toLowerCase()} to another customer on this platform.
            They must have an existing account.
          </p>

          <form onSubmit={handleShare} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email *</label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {labels.points} to Share *
                <span className="text-gray-400 font-normal ml-1">(Balance: {overview.balance.toLocaleString()})</span>
              </label>
              <input
                type="number"
                min="1"
                max={overview.balance}
                value={sharePoints}
                onChange={(e) => setSharePoints(e.target.value)}
                placeholder="e.g. 100"
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              />
              {sharePoints && parseInt(sharePoints) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Value: {formatPrice(parseInt(sharePoints) * redemptionRate)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="A gift for you!"
                rows={2}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sharing}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {sharing ? 'Sharing...' : `Share ${labels.points}`}
            </button>
          </form>
        </div>
      )}

      {tab === 'convert' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Convert {labels.points} to Store Credit</h3>
          <p className="text-sm text-gray-500 mb-6">
            Convert your {labels.points.toLowerCase()} into real money (store credit) that you can use to buy anything on the platform.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Your {labels.points}</span>
              <span className="font-bold">{overview.balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-medium">1 {labels.point} = {formatPrice(redemptionRate)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-600">Total Value</span>
              <span className="font-bold text-green-600">{formatPrice(overview.cashValueZAR)}</span>
            </div>
          </div>

          <form onSubmit={handleConvert} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {labels.points} to Convert *
              </label>
              <input
                type="number"
                min="1"
                max={overview.balance}
                value={convertPoints}
                onChange={(e) => setConvertPoints(e.target.value)}
                placeholder="e.g. 500"
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              />
              {convertPoints && parseInt(convertPoints) > 0 && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  You'll receive {formatPrice(parseInt(convertPoints) * redemptionRate)} in store credit
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={converting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {converting ? 'Converting...' : 'Convert to Store Credit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
