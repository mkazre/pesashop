import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { referralsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoFlag, IoTrophy, IoPeople, IoCheckmarkCircle, IoAdd, IoTrash } from 'react-icons/io5';

const STATUS_STYLES = {
  sent: 'badge-ghost',
  signed_up: 'badge-info',
  qualified: 'badge-success',
  rewarded: 'badge-success',
  fraud: 'badge-error'
};

const PRICE_BASE_OPTIONS = [
  { value: 'subtotal', label: 'Order subtotal (before shipping/tax/discounts)' },
  { value: 'total', label: 'Final order total (what the customer paid)' },
  { value: 'backend', label: 'Cost price (backend price) — matches regular PESA Coins default' },
  { value: 'regular', label: 'Regular price' },
  { value: 'sale', label: 'Sale price' },
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'settings', label: 'MLM Levels' },
  { id: 'ledger', label: 'Reward Ledger' },
];

const ReferralsPage = () => {
  const [tab, setTab] = useState('overview');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Referrals</h1>
        <p className="text-sm text-gray-500">Track invites, signups, qualifying purchases, and configure multi-level PESA Coins rewards.</p>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'ledger' && <LedgerTab />}
    </div>
  );
};

function OverviewTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ status: '' });

  const { data: refsData, isLoading } = useQuery(['referrals-admin', filter], () => referralsAPI.adminList(filter));
  const { data: statsData } = useQuery('referrals-stats', () => referralsAPI.adminStats());

  const referrals = refsData?.data?.data || [];
  const stats = statsData?.data?.data || {};

  const flag = useMutation(({ id, reason }) => referralsAPI.flag(id, reason), {
    onSuccess: () => { qc.invalidateQueries('referrals-admin'); toast.success('Updated'); }
  });

  const funnelMap = (stats.funnel || []).reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Invites Sent', value: (funnelMap.sent || 0) + (funnelMap.signed_up || 0) + (funnelMap.qualified || 0) + (funnelMap.rewarded || 0), icon: IoPeople, color: 'bg-blue-50 text-blue-600' },
          { label: 'Signed Up', value: (funnelMap.signed_up || 0) + (funnelMap.qualified || 0) + (funnelMap.rewarded || 0), icon: IoCheckmarkCircle, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Qualified Buyers', value: (funnelMap.qualified || 0) + (funnelMap.rewarded || 0), icon: IoTrophy, color: 'bg-green-50 text-green-600' },
          { label: 'MLM Coins Awarded (all levels)', value: stats.totalPointsAwarded || 0, icon: IoTrophy, color: 'bg-amber-50 text-amber-600' }
        ].map((s, i) => (
          <Card key={i}>
            <div className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b font-semibold">Top Earners (all MLM levels combined)</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>#</th><th>User</th><th>Rewards</th><th>Points Earned</th></tr></thead>
            <tbody>
              {(stats.topReferrers || []).map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td>{r.firstName} {r.lastName}<br/><span className="text-xs text-gray-500">{r.email}</span></td>
                  <td>{r.rewardCount}</td>
                  <td>{r.points}</td>
                </tr>
              ))}
              {(stats.topReferrers || []).length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-6">No rewards earned yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex gap-3">
        <select className="select select-bordered select-sm" value={filter.status} onChange={e => setFilter({ status: e.target.value })}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Referrer</th><th>Referee</th><th>Status</th><th>Welcome/1st reward</th><th>Fraud</th><th></th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center text-gray-500 py-8">Loading...</td></tr>}
              {!isLoading && referrals.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">No referrals yet.</td></tr>}
              {referrals.map(r => (
                <tr key={r._id}>
                  <td className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{r.referrer?.firstName} {r.referrer?.lastName}<br/><span className="text-xs text-gray-500">{r.referrer?.email} · {r.referrer?.referralCode}</span></td>
                  <td>{r.referee?.firstName || '—'} {r.referee?.lastName}<br/><span className="text-xs text-gray-500">{r.referee?.email || r.refereeEmail}</span></td>
                  <td><span className={`badge ${STATUS_STYLES[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                  <td>{r.referrerBonusPoints || 0} coins</td>
                  <td>{r.fraudFlags?.length ? <span className="text-rose-600 text-xs">{r.fraudFlags.join(', ')}</span> : '—'}</td>
                  <td>
                    {r.status !== 'fraud' && <button className="btn btn-xs btn-ghost" title="Flag as fraud" onClick={() => { const reason = prompt('Fraud reason:'); if (reason) flag.mutate({ id: r._id, reason }); }}><IoFlag /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-gray-400">
        This table tracks first-touch attribution (who invited whom, and whether they've bought at least once). For the full
        multi-level reward history — every payout, at every level, for every purchase — see the <strong>Reward Ledger</strong> tab.
      </p>
    </div>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery('referral-mlm-settings', () => referralsAPI.adminGetSettings());
  const settings = data?.data?.data;
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation((payload) => referralsAPI.adminUpdateSettings(payload), {
    onSuccess: (res) => { qc.invalidateQueries('referral-mlm-settings'); setForm(res.data.data); toast.success('MLM settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading || !form) return <div className="text-gray-500 py-8 text-center">Loading...</div>;

  const addLevel = () => {
    const nextLevel = (form.levels.reduce((max, l) => Math.max(max, l.level), 0) || 0) + 1;
    if (nextLevel > form.maxLevels) { toast.error(`Max ${form.maxLevels} levels — raise the cap first`); return; }
    setForm({ ...form, levels: [...form.levels, {
      level: nextLevel, active: true, signupPoints: 0, purchaseRewardType: 'fixed', purchaseRewardValue: 0, monthlyCap: null, vestingDays: 0,
    }] });
  };

  const removeLevel = (level) => setForm({ ...form, levels: form.levels.filter(l => l.level !== level) });

  const updateLevel = (level, patch) => setForm({
    ...form,
    levels: form.levels.map(l => l.level === level ? { ...l, ...patch } : l),
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-5 space-y-4">
          <h3 className="font-semibold">Global</h3>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            <span className="text-sm font-medium">Enable multi-level PESA Coins rewards</span>
          </label>
          <p className="text-xs text-gray-500 -mt-2">
            While off, no MLM signup/purchase rewards are paid out — existing single-tier welcome bonuses (Settings → PESA Coins) still work.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max levels (1–10)</label>
              <Input type="number" min={1} max={10} value={form.maxLevels}
                onChange={e => setForm({ ...form, maxLevels: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Percentage reward base</label>
              <select className="select select-bordered w-full" value={form.purchaseRewardBase}
                onChange={e => setForm({ ...form, purchaseRewardBase: e.target.value })}>
                {PRICE_BASE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Only matters for levels using a "% of purchase" reward type below.</p>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={form.compressInactiveUplines}
              onChange={e => setForm({ ...form, compressInactiveUplines: e.target.checked })} />
            <span className="text-sm">Auto-compress past inactive/banned upline members (keep that level's reward flowing to the next valid ancestor instead of losing it)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={form.excludeFraudFlagged}
              onChange={e => setForm({ ...form, excludeFraudFlagged: e.target.checked })} />
            <span className="text-sm">Exclude fraud-flagged referrals from earning any level reward</span>
          </label>
        </div>
      </Card>

      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Levels</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addLevel}><IoAdd className="inline mr-1" />Add Level</Button>
          </div>
          {form.levels.length === 0 && <p className="text-sm text-gray-500">No levels configured yet — add one to start paying out MLM rewards.</p>}
          <div className="space-y-3">
            {[...form.levels].sort((a, b) => a.level - b.level).map(l => (
              <div key={l.level} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">Level {l.level}</span>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" className="w-4 h-4" checked={l.active} onChange={e => updateLevel(l.level, { active: e.target.checked })} />
                      Active
                    </label>
                  </div>
                  <button type="button" className="text-red-500 hover:text-red-700" onClick={() => removeLevel(l.level)}><IoTrash size={16} /></button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Signup bonus (coins)</label>
                    <Input type="number" min={0} value={l.signupPoints}
                      onChange={e => updateLevel(l.level, { signupPoints: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Purchase reward type</label>
                    <select className="select select-bordered select-sm w-full" value={l.purchaseRewardType}
                      onChange={e => updateLevel(l.level, { purchaseRewardType: e.target.value })}>
                      <option value="fixed">Fixed coins per order</option>
                      <option value="percentage">% of order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {l.purchaseRewardType === 'percentage' ? 'Percentage (%)' : 'Coins per order'}
                    </label>
                    <Input type="number" min={0} step={l.purchaseRewardType === 'percentage' ? 0.1 : 1} value={l.purchaseRewardValue}
                      onChange={e => updateLevel(l.level, { purchaseRewardValue: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Monthly cap (coins, blank = none)</label>
                    <Input type="number" min={0} value={l.monthlyCap ?? ''}
                      onChange={e => updateLevel(l.level, { monthlyCap: e.target.value === '' ? null : parseInt(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Vesting delay (days before purchase rewards become spendable, 0 = instant)</label>
                  <Input type="number" min={0} style={{ width: 120 }} value={l.vestingDays}
                    onChange={e => updateLevel(l.level, { vestingDays: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate(form)} loading={saveMutation.isLoading}>Save MLM Settings</Button>
      </div>
    </div>
  );
}

function LedgerTab() {
  const [filter, setFilter] = useState({ level: '', eventType: '' });
  const { data, isLoading } = useQuery(['referral-ledger-admin', filter], () => referralsAPI.adminLedger(filter));
  const rows = data?.data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select className="select select-bordered select-sm" value={filter.level} onChange={e => setFilter({ ...filter, level: e.target.value })}>
          <option value="">All levels</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(l => <option key={l} value={l}>Level {l}</option>)}
        </select>
        <select className="select select-bordered select-sm" value={filter.eventType} onChange={e => setFilter({ ...filter, eventType: e.target.value })}>
          <option value="">All event types</option>
          <option value="signup">Signup</option>
          <option value="purchase">Purchase</option>
        </select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Beneficiary</th><th>Level</th><th>Event</th><th>From</th><th>Order</th><th>Coins</th><th>Status</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center text-gray-500 py-8">Loading...</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={8} className="text-center text-gray-500 py-8">No reward ledger entries yet.</td></tr>}
              {rows.map(row => (
                <tr key={row._id}>
                  <td className="text-xs">{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.beneficiary?.firstName} {row.beneficiary?.lastName}<br/><span className="text-xs text-gray-500">{row.beneficiary?.email}</span></td>
                  <td><span className="badge badge-outline">L{row.level}</span></td>
                  <td className="capitalize">{row.eventType}</td>
                  <td>{row.sourceUser?.firstName} {row.sourceUser?.lastName}</td>
                  <td>{row.order?.orderNumber || '—'}</td>
                  <td className="font-semibold text-amber-700">+{row.pointsAwarded}</td>
                  <td><span className="badge badge-ghost">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ReferralsPage;
