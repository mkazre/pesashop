import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { referralsAPI } from '../../services/api';

const ReferralsPage = () => {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data, isLoading } = useQuery('my-referrals', () => referralsAPI.getMine());
  const invite = useMutation((email) => referralsAPI.invite({ email, channel: 'email' }), {
    onSuccess: () => { qc.invalidateQueries('my-referrals'); setInviteEmail(''); }
  });

  const r = data?.data?.data;
  if (isLoading || !r) return <div className="p-6 max-w-3xl mx-auto">Loading...</div>;

  const copy = () => {
    navigator.clipboard.writeText(r.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">Invite & Earn</h1>
      <p className="text-sm text-gray-600 mb-6">Share your code. Friends get a signup bonus. You get PESA Coins when they buy.</p>

      <div className="rounded-xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-6">
        <p className="text-sm opacity-80">Your referral code</p>
        <p className="text-3xl font-bold tracking-widest my-2">{r.code}</p>
        <p className="text-sm opacity-80 break-all">{r.shareUrl}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={copy} className="px-3 py-2 bg-white text-blue-700 rounded text-sm font-semibold">{copied ? 'Copied!' : 'Copy link'}</button>
          <a href={r.whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-500 text-white rounded text-sm font-semibold">Share on WhatsApp</a>
        </div>
        <p className="text-xs mt-3 opacity-80">Tier: <strong>{r.tier.label}</strong> ({r.tier.multiplier}× rewards)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Sent" value={r.summary.sent} />
        <Stat label="Signed up" value={r.summary.signedUp} />
        <Stat label="Made first purchase" value={r.summary.qualified} />
        <Stat label="Coins earned" value={r.summary.pointsEarned} />
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <p className="font-semibold mb-2">Invite by email</p>
        <div className="flex gap-2">
          <input type="email" placeholder="friend@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="border rounded flex-1 p-2" />
          <button onClick={() => invite.mutate(inviteEmail)} disabled={!inviteEmail || invite.isLoading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Send</button>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Invite history</h2>
      <div className="space-y-2">
        {r.referrals.length === 0 && <p className="text-sm text-gray-500">No invites yet. Share your code above to get started.</p>}
        {r.referrals.map(inv => (
          <div key={inv._id} className="border rounded p-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{inv.referee?.firstName || inv.refereeEmail || 'Pending'}</p>
              <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded ${inv.status === 'rewarded' || inv.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{inv.status.replace('_', ' ')}</span>
              {inv.referrerBonusPoints > 0 && <p className="text-xs text-green-700 mt-1">+{inv.referrerBonusPoints} coins</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="border rounded-lg p-3 text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default ReferralsPage;
