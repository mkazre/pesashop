import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { demographicsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import { IoArrowBack, IoDownload, IoPeople, IoStatsChart, IoLocationSharp, IoHeart } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

// Simple bar chart using Tailwind
const BarChart = ({ data = [], labelKey = '_id', valueKey = 'count', title, colorClass = 'bg-primary' }) => {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0);

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>}
      <div className="space-y-2">
        {data.map((item, i) => {
          const label = item[labelKey] || 'Unknown';
          const value = item[valueKey] || 0;
          const pct = Math.round((value / max) * 100);
          const share = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-32 truncate capitalize">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full ${colorClass} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">{value} ({share}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Stat card
const StatCard = ({ label, value, sub, icon: Icon, color = 'bg-blue-50 text-blue-600' }) => (
  <Card>
    <div className="p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  </Card>
);

const CustomerDemographicsDashboard = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    'demographics-stats',
    () => demographicsAPI.getStats(),
    { refetchOnWindowFocus: false }
  );

  const stats = data?.data?.data;

  const handleExport = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Customers', stats.totalCustomers],
      ['Profile Completed', stats.profileCompletedCount],
      ['Profile Completion Rate', `${stats.profileCompletionRate}%`],
      ['Avg Profile Score', stats.avgProfileScore],
      ...stats.genderStats.map(g => [`Gender: ${g._id || 'Unknown'}`, g.count]),
      ...stats.segmentStats.map(s => [`Segment: ${s._id || 'Unknown'}`, s.count]),
      ...stats.provinceStats.map(p => [`Province: ${p._id || 'Unknown'}`, p.count]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demographics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SEGMENT_COLORS = { budget: 'bg-gray-400', value: 'bg-blue-500', premium: 'bg-purple-500', luxury: 'bg-amber-500' };
  const CHURN_COLORS = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customers')} className="btn btn-ghost btn-sm btn-square">
            <IoArrowBack size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Customer Demographics</h1>
            <p className="text-sm text-gray-500">AI-powered insights into your customer base</p>
          </div>
        </div>
        <button className="btn btn-outline btn-sm gap-2" onClick={handleExport} disabled={isLoading}>
          <IoDownload size={16} /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : !stats ? (
        <Card><div className="p-8 text-center text-gray-400">No demographic data available yet.</div></Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Customers"
              value={stats.totalCustomers?.toLocaleString()}
              icon={IoPeople}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Profiles Complete"
              value={`${stats.profileCompletionRate}%`}
              sub={`${stats.profileCompletedCount} customers`}
              icon={IoStatsChart}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              label="Avg Profile Score"
              value={`${stats.avgProfileScore}%`}
              sub="Out of 100"
              icon={IoStatsChart}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              label="Top Province"
              value={stats.provinceStats?.[0]?._id || '—'}
              sub={stats.provinceStats?.[0] ? `${stats.provinceStats[0].count} customers` : ''}
              icon={IoLocationSharp}
              color="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Row 1: Gender + Segment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <BarChart
                  data={stats.genderStats}
                  title="Gender Distribution"
                  colorClass="bg-pink-400"
                />
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Customer Segments</p>
                <div className="space-y-2">
                  {stats.segmentStats.map((s, i) => {
                    const label = s._id || 'Unclassified';
                    const total = stats.segmentStats.reduce((a, b) => a + b.count, 0);
                    const share = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    const max = Math.max(...stats.segmentStats.map(x => x.count), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-28 capitalize">{label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-4 rounded-full ${SEGMENT_COLORS[label] || 'bg-gray-400'} transition-all`}
                            style={{ width: `${Math.round((s.count / max) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{s.count} ({share}%)</span>
                      </div>
                    );
                  })}
                  {stats.segmentStats.length === 0 && <p className="text-xs text-gray-400 italic">No segment data yet — AI insights will populate as customers complete profiles.</p>}
                </div>
              </div>
            </Card>
          </div>

          {/* Row 2: Age + Life Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <BarChart
                  data={stats.ageGroupStats}
                  title="Age Group Distribution"
                  colorClass="bg-blue-400"
                />
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <BarChart
                  data={stats.lifeStageStats}
                  title="Life Stage"
                  colorClass="bg-teal-400"
                />
              </div>
            </Card>
          </div>

          {/* Row 3: Churn Risk + Income */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Churn Risk</p>
                <div className="space-y-2">
                  {stats.churnStats.map((s, i) => {
                    const label = s._id || 'Unclassified';
                    const max = Math.max(...stats.churnStats.map(x => x.count), 1);
                    const total = stats.churnStats.reduce((a, b) => a + b.count, 0);
                    const share = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-24 capitalize">{label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-4 rounded-full ${CHURN_COLORS[label] || 'bg-gray-400'} transition-all`}
                            style={{ width: `${Math.round((s.count / max) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{s.count} ({share}%)</span>
                      </div>
                    );
                  })}
                  {stats.churnStats.length === 0 && <p className="text-xs text-gray-400 italic">No churn data yet.</p>}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <BarChart
                  data={stats.incomeStats}
                  title="Income Range"
                  colorClass="bg-amber-400"
                />
              </div>
            </Card>
          </div>

          {/* Row 4: Province + Top Hobbies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <BarChart
                  data={stats.provinceStats.slice(0, 10)}
                  title="Top Provinces"
                  colorClass="bg-orange-400"
                />
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  <IoHeart className="inline mr-1 text-red-400" /> Top Hobbies
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.hobbyStats.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                    >
                      {h._id}
                      <span className="ml-1 bg-rose-200 text-rose-800 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{h.count}</span>
                    </span>
                  ))}
                  {stats.hobbyStats.length === 0 && <p className="text-xs text-gray-400 italic">No hobby data yet.</p>}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerDemographicsDashboard;
