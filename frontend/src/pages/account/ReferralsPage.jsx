import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { referralsAPI, loyaltyAPI } from '../../services/api';
import { useCurrencyStore } from '../../store';

const LEVEL_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-indigo-50 border-indigo-200 text-indigo-700',
  'bg-purple-50 border-purple-200 text-purple-700',
  'bg-pink-50 border-pink-200 text-pink-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-teal-50 border-teal-200 text-teal-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-cyan-50 border-cyan-200 text-cyan-700',
  'bg-orange-50 border-orange-200 text-orange-700',
  'bg-rose-50 border-rose-200 text-rose-700',
];

const ReferralsPage = () => {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { formatPrice } = useCurrencyStore();

  const { data, isLoading, isError, error, refetch } = useQuery('my-referrals', () => referralsAPI.getMine());
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

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto text-gray-500">Loading your referral dashboard...</div>;

  if (isError || !r) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-red-700 text-sm">
          <p className="font-semibold mb-1">Couldn't load your referral dashboard</p>
          <p>{error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'}</p>
          <button onClick={() => refetch()} className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  const copy = () => {
    navigator.clipboard.writeText(r.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const trendUp = r.pointsThisMonth >= r.pointsLastMonth;
  const trendDiff = r.pointsLastMonth > 0
    ? Math.round(((r.pointsThisMonth - r.pointsLastMonth) / r.pointsLastMonth) * 100)
    : (r.pointsThisMonth > 0 ? 100 : 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">Invite & Earn</h1>
      <p className="text-sm text-gray-600 mb-6">Share your code. You earn PESA Coins across multiple levels — not just your direct invites, but their invites too, forever.</p>

      {/* Hero: code + share */}
      <div className="rounded-xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-6">
        <p className="text-sm opacity-80">Your referral code</p>
        <p className="text-3xl font-bold tracking-widest my-2">{r.code}</p>
        <p className="text-sm opacity-80 break-all">{r.shareUrl}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={copy} className="px-3 py-2 bg-white text-blue-700 rounded text-sm font-semibold">{copied ? 'Copied!' : 'Copy link'}</button>
          <a href={r.whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-500 text-white rounded text-sm font-semibold">Share on WhatsApp</a>
        </div>
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <WidgetCard
          label="Spendable PESA Coins"
          value={r.spendableBalance.toLocaleString()}
          sub={redemptionRate ? `Worth ${cash(r.spendableBalance)} — usable on any purchase now` : 'Usable on any purchase now'}
          accent="text-amber-700"
        />
        <WidgetCard
          label="Lifetime referral coins"
          value={r.totalMlmPoints.toLocaleString()}
          sub={redemptionRate ? cash(r.totalMlmPoints) : null}
          accent="text-indigo-700"
        />
        <WidgetCard
          label="This month"
          value={r.pointsThisMonth.toLocaleString()}
          sub={r.pointsLastMonth > 0 || r.pointsThisMonth > 0 ? `${trendUp ? '▲' : '▼'} ${Math.abs(trendDiff)}% vs last month` : 'No activity yet'}
          accent={trendUp ? 'text-green-700' : 'text-red-600'}
        />
        <WidgetCard
          label="Your network"
          value={r.networkSize.toLocaleString()}
          sub={`Rank #${r.rank} among all earners`}
          accent="text-blue-700"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Invites sent" value={r.summary.sent} />
        <Stat label="Signed up" value={r.summary.signedUp} />
        <Stat label="Made a purchase" value={r.summary.qualified} />
        <Stat label="Reward levels active" value={r.levelBreakdown.length} />
      </div>

      <EarningPotential redemptionRate={redemptionRate} cash={cash} />

      {r.levelBreakdown.length > 0 && (
        <div className="border rounded-lg p-4 mb-8">
          <p className="font-semibold mb-3">Your actual earnings by level</p>
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

      <NetworkTree />

      <div className="border rounded-lg p-4 mb-8">
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

function WidgetCard({ label, value, sub, accent }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || ''}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function EarningPotential({ redemptionRate, cash }) {
  const { data, isLoading } = useQuery('referral-levels-public', () => referralsAPI.getLevels(), { staleTime: 5 * 60 * 1000 });
  const info = data?.data?.data;

  if (isLoading || !info?.enabled || !info.levels?.length) return null;

  return (
    <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg p-4 mb-8">
      <p className="font-semibold mb-1">💰 What you can earn at every level</p>
      <p className="text-xs text-gray-600 mb-3">
        The deeper your network grows, the more levels start paying you — every signup and every purchase, at every level, forever.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {info.levels.map((lvl, i) => (
          <div key={lvl.level} className={`border rounded-lg p-2.5 text-center ${LEVEL_COLORS[i % LEVEL_COLORS.length]}`}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1">Level {lvl.level}</p>
            <p className="text-sm font-semibold">{lvl.signupPoints} coins</p>
            <p className="text-[11px] text-gray-500">per signup</p>
            <p className="text-sm font-semibold mt-1.5">
              {lvl.purchaseRewardType === 'percentage' ? `${lvl.purchaseRewardValue}%` : `${lvl.purchaseRewardValue} coins`}
            </p>
            <p className="text-[11px] text-gray-500">per purchase</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkTree() {
  const [expanded, setExpanded] = useState({});
  const { data, isLoading } = useQuery('my-referral-network', () => referralsAPI.getMyNetwork());
  const info = data?.data?.data;

  if (isLoading) return null;
  if (!info || info.totalNetworkSize === 0) {
    return (
      <div className="border rounded-lg p-4 mb-8">
        <p className="font-semibold mb-1">Your network</p>
        <p className="text-sm text-gray-500">Nobody in your downline yet — share your code above to start building your network.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 mb-8">
      <p className="font-semibold mb-1">Your network ({info.totalNetworkSize} {info.totalNetworkSize === 1 ? 'person' : 'people'})</p>
      <p className="text-xs text-gray-500 mb-3">Everyone in your downline, grouped by how many hops removed they are from you.</p>
      <div className="space-y-2">
        {info.levels.map((lvl, i) => (
          <div key={lvl.level} className={`border rounded-lg overflow-hidden ${LEVEL_COLORS[i % LEVEL_COLORS.length]}`}>
            <button
              onClick={() => setExpanded(e => ({ ...e, [lvl.level]: !e[lvl.level] }))}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold"
            >
              <span>Level {lvl.level} — {lvl.count} {lvl.count === 1 ? 'person' : 'people'}</span>
              <span>{expanded[lvl.level] ? '−' : '+'}</span>
            </button>
            {expanded[lvl.level] && (
              <div className="bg-white/70 px-3 py-2 space-y-1">
                {lvl.members.map(m => (
                  <div key={m._id} className="flex items-center justify-between text-xs text-gray-700 py-1">
                    <span>{m.firstName} {m.lastName?.charAt(0) || ''}.</span>
                    <span className="text-gray-400">{new Date(m.joinedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

const Stat = ({ label, value }) => (
  <div className="border rounded-lg p-3 text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default ReferralsPage;
