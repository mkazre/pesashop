import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { referralsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import toast from '@/utils/toast';
import { IoFlag, IoTrophy, IoPeople, IoCheckmarkCircle } from 'react-icons/io5';

const STATUS_STYLES = {
  sent: 'badge-ghost',
  signed_up: 'badge-info',
  qualified: 'badge-success',
  rewarded: 'badge-success',
  fraud: 'badge-error'
};

const ReferralsPage = () => {
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Referrals</h1>
        <p className="text-sm text-gray-500">Track invites, signups and qualifying purchases.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Invites Sent', value: (funnelMap.sent || 0) + (funnelMap.signed_up || 0) + (funnelMap.qualified || 0) + (funnelMap.rewarded || 0), icon: IoPeople, color: 'bg-blue-50 text-blue-600' },
          { label: 'Signed Up', value: (funnelMap.signed_up || 0) + (funnelMap.qualified || 0) + (funnelMap.rewarded || 0), icon: IoCheckmarkCircle, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Qualified Buyers', value: (funnelMap.qualified || 0) + (funnelMap.rewarded || 0), icon: IoTrophy, color: 'bg-green-50 text-green-600' },
          { label: 'Coins Awarded', value: stats.totalPointsAwarded || 0, icon: IoTrophy, color: 'bg-amber-50 text-amber-600' }
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
        <div className="p-4 border-b font-semibold">Top Referrers</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>#</th><th>Referrer</th><th>Qualified Referrals</th><th>Points Earned</th></tr></thead>
            <tbody>
              {(stats.topReferrers || []).map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td>{r.firstName} {r.lastName}<br/><span className="text-xs text-gray-500">{r.email}</span></td>
                  <td>{r.qualified}</td>
                  <td>{r.points}</td>
                </tr>
              ))}
              {(stats.topReferrers || []).length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-6">No qualified referrals yet.</td></tr>}
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
              <tr><th>Date</th><th>Referrer</th><th>Referee</th><th>Status</th><th>Reward</th><th>Fraud</th><th></th></tr>
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
    </div>
  );
};

export default ReferralsPage;
