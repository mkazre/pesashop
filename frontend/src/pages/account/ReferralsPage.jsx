import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { referralsAPI, loyaltyAPI } from '../../services/api';
import { useCurrencyStore } from '../../store';

const ReferralsPage = () => {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { formatPrice } = useCurrencyStore();

  const { data, isLoading } = useQuery('my-referrals', () => referralsAPI.getMine());
  const { data: loyaltySettingsData } = useQuery('loyalty-public-settings', () => loyaltyAPI.getPublicSettings(), { staleTime: 5 * 60 * 1000 });
  const invite = useMutation((email) => referralsAPI.invite({ email, channel: 'email' }), {
    onSuccess: () => { qc.invalidateQueries('my-referrals'); setInviteEmail(''); }
  });

  const r = data?.data?.data;
  const redemptionRate = loyaltySettingsData?.data?.data?.redemptionRate || 0;
  // Same cash-equivalent conversion LoyaltyPointsBadge.jsx uses: coins ->
  // ZAR (the store's base currency) via redemptionRate, then formatPrice
  // converts that into whatever currency the customer has selected.
  const cash = (points) => formatPrice(points * redemptionRate);

  if (isLoading || !r) return <div className="p-6 max-w-3xl mx-auto">Loading...</div>;

  const copy = () => {
    navigator.clipboard.writeText(r.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">Invite & Earn</h1>
      <p className="text-sm text-gray-600 mb-6">Share your code. You earn PESA Coins across multiple levels — not just your direct invites, but their invites too.</p>

      <div className="rounded-xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-6">
        <p className="text-sm opacity-80">Your referral code</p>
        <p className="text-3xl font-bold tracking-widest my-2">{r.code}</p>
        <p className="text-sm opacity-80 break-all">{r.shareUrl}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={copy} className="px-3 py-2 bg-white text-blue-700 rounded text-sm font-semibold">{copied ? 'Copied!' : 'Copy link'}</button>
          <a href={r.whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-500 text-white rounded text-sm font-semibold">Share on WhatsApp</a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Sent" value={r.summary.sent} />
        <Stat label="Signed up" value={r.summary.signedUp} />
        <Stat label="Made a purchase" value={r.summary.qualified} />
        <Stat label="Total MLM coins" value={r.totalMlmPoints} sub={redemptionRate ? cash(r.totalMlmPoints) : null} />
      </div>

      {r.levelBreakdown.length > 0 && (
        <div className="border rounded-lg p-4 mb-6">
          <p className="font-semibold mb-3">Earnings by level</p>
          <p className="text-xs text-gray-500 mb-3">
            Level 1 = people you directly referred. Level 2 = people <em>they</em> referred, and so on — you earn from every level PesaShop has enabled.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Level</th>
                  <th className="py-2 pr-4">Signups</th>
                  <th className="py-2 pr-4">Purchases</th>
                  <th className="py-2 pr-4">Coins earned</th>
                  {redemptionRate > 0 && <th className="py-2">Worth</th>}
                </tr>
              </thead>
              <tbody>
                {r.levelBreakdown.map(lvl => {
                  const totalPoints = lvl.signupPoints + lvl.purchasePoints;
                  return (
                    <tr key={lvl.level} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">Level {lvl.level}</td>
                      <td className="py-2 pr-4">{lvl.signupCount}</td>
                      <td className="py-2 pr-4">{lvl.purchaseCount}</td>
                      <td className="py-2 pr-4 font-semibold text-amber-700">{totalPoints}</td>
                      {redemptionRate > 0 && <td className="py-2 text-gray-500">{cash(totalPoints)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 mb-6">
        <p className="font-semibold mb-2">Invite by email</p>
        <div className="flex gap-2">
          <input type="email" placeholder="friend@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="border rounded flex-1 p-2" />
          <button onClick={() => invite.mutate(inviteEmail)} disabled={!inviteEmail || invite.isLoading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Send</button>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Invite history</h2>
      <div className="space-y-2 mb-8">
        {r.referrals.length === 0 && <p className="text-sm text-gray-500">No invites yet. Share your code above to get started.</p>}
        {r.referrals.map(inv => (
          <div key={inv._id} className="border rounded p-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{inv.referee?.firstName || inv.refereeEmail || 'Pending'}</p>
              <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded ${inv.status === 'rewarded' || inv.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{inv.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>

      <RewardLedger />
    </div>
  );
};

function RewardLedger() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(['my-referral-ledger', page], () => referralsAPI.getMyLedger({ page, limit: 15 }));
  const rows = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h2 className="font-semibold mb-3">Reward history</h2>
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {!isLoading && rows.length === 0 && <p className="text-sm text-gray-500">No reward history yet — it'll show up here as your network signs up and buys.</p>}
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row._id} className="border rounded p-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">
                Level {row.level} {row.eventType === 'signup' ? 'signup bonus' : 'purchase reward'}
                {row.sourceUser && <span className="text-gray-500"> — from {row.sourceUser.firstName}</span>}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(row.createdAt).toLocaleDateString()}
                {row.order?.orderNumber && ` · Order ${row.order.orderNumber}`}
              </p>
            </div>
            <span className="font-semibold text-amber-700">+{row.pointsAwarded}</span>
          </div>
        ))}
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
          <span className="text-gray-500">Page {page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

const Stat = ({ label, value, sub }) => (
  <div className="border rounded-lg p-3 text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default ReferralsPage;
