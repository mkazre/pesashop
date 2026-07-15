import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { autoposterAPI, categoriesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import Checkbox from '@/components/common/Checkbox';
import Table from '@/components/common/Table';
import toast from '@/utils/toast';
import AutoposterApprovalQueuePage from './AutoposterApprovalQueuePage';
import {
  IoRefreshOutline,
  IoBanOutline,
  IoPricetagOutline,
  IoEyeOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCreateOutline,
} from 'react-icons/io5';

const PLATFORMS = ['facebook', 'instagram', 'x', 'linkedin', 'tiktok'];

const TABS = [
  { key: 'trends', label: 'Live Trends' },
  { key: 'approvals', label: 'Approval Queue' },
  { key: 'calendar', label: 'Cultural Calendar' },
  { key: 'insights', label: 'Performance Insights' },
  { key: 'config', label: 'Configuration' },
];

// A single-series sparkline over real per-run trendScore snapshots (never
// fabricated — a trend with < 2 ingestion runs simply has no line to draw
// yet). Series color matches the dataviz palette's single-hue default.
function Sparkline({ history }) {
  const points = (history || []).map((h) => h.trendScore).filter((v) => typeof v === 'number');
  if (points.length < 2) {
    return <span className="text-xs text-gray-400">not enough history yet</span>;
  }
  const w = 64, h = 20, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const path = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * step} ${h - pad - ((v - min) / range) * (h - pad * 2)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={path} fill="none" stroke="#2a78d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendsTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ sensitivity: '', audience: '', minScore: '' });
  const [candidatesModal, setCandidatesModal] = useState(null);

  const { data, isLoading } = useQuery(
    ['autoposter-trends', filters],
    () => autoposterAPI.listTrends(filters),
    { keepPreviousData: true }
  );
  const trends = data?.data?.data || [];

  const { data: candidatesData, isLoading: candidatesLoading } = useQuery(
    ['autoposter-trend-candidates', candidatesModal?._id],
    () => autoposterAPI.getTrendCandidates(candidatesModal._id),
    { enabled: !!candidatesModal }
  );

  const invalidate = () => queryClient.invalidateQueries('autoposter-trends');

  const refreshMutation = useMutation(() => autoposterAPI.refreshTrends(), {
    onSuccess: (res) => { toast.success(`Ingestion run complete — ${res.data?.data?.termsProcessed ?? 0} terms processed`); invalidate(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Refresh failed'),
  });

  const blockMutation = useMutation((id) => autoposterAPI.blockTrend(id, { addToBlocklist: true }), {
    onSuccess: () => { toast.success('Trend blocked'); invalidate(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Block failed'),
  });

  const pinMutation = useMutation((id) => autoposterAPI.pinTrend(id, 24), {
    onSuccess: () => { toast.success('Pinned for 24 hours'); invalidate(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Pin failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Sensitivity"
          value={filters.sensitivity}
          onChange={(e) => setFilters((f) => ({ ...f, sensitivity: e.target.value }))}
          options={[{ value: '', label: 'All' }, { value: 'safe', label: 'Safe' }, { value: 'review', label: 'Review' }, { value: 'blocked', label: 'Blocked' }]}
        />
        <Select
          label="Audience"
          value={filters.audience}
          onChange={(e) => setFilters((f) => ({ ...f, audience: e.target.value }))}
          options={[{ value: '', label: 'All' }, { value: 'local_zw', label: 'Local ZW' }, { value: 'diaspora', label: 'Diaspora' }, { value: 'global', label: 'Global' }]}
        />
        <Input
          label="Min score"
          type="number"
          step="0.05"
          min="0"
          max="1"
          value={filters.minScore}
          onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))}
        />
        <Button variant="secondary" loading={refreshMutation.isLoading} onClick={() => refreshMutation.mutate()}>
          <IoRefreshOutline className="mr-1" /> Force-refresh (run ingestion now)
        </Button>
      </div>

      <Card>
        <Table
          loading={isLoading}
          emptyMessage="No trends yet — run a force-refresh, or wait for the hourly ingestion cron."
          columns={[
            { key: 'term', title: 'Term', render: (v, row) => (
              <div>
                <span className="font-medium">{v}</span>
                {row.pinnedUntil && new Date(row.pinnedUntil) > new Date() && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">pinned</span>
                )}
              </div>
            ) },
            { key: 'sources', title: 'Sources', render: (v) => (v || []).join(', ') },
            { key: 'trendScore', title: 'Score', render: (v) => v?.toFixed(3) },
            { key: 'scoreHistory', title: 'Velocity', render: (v) => <Sparkline history={v} /> },
            { key: 'audience', title: 'Audience' },
            { key: 'sensitivityFlag', title: 'Sensitivity', render: (v) => (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                v === 'blocked' ? 'bg-red-100 text-red-700' : v === 'review' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>{v}</span>
            ) },
            { key: 'lastRefreshed', title: 'Last refreshed', render: (v) => v ? new Date(v).toLocaleString() : '—' },
            { key: '_actions', title: 'Actions', render: (_, row) => (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setCandidatesModal(row)} title="View matched products">
                  <IoEyeOutline size={16} />
                </Button>
                <Button variant="ghost" size="sm" loading={pinMutation.isLoading && pinMutation.variables === row._id} onClick={() => pinMutation.mutate(row._id)} title="Pin for 24h">
                  <IoPricetagOutline size={16} />
                </Button>
                <Button variant="danger" size="sm" loading={blockMutation.isLoading && blockMutation.variables === row._id} onClick={() => blockMutation.mutate(row._id)} title="Block">
                  <IoBanOutline size={16} />
                </Button>
              </div>
            ) },
          ]}
          data={trends}
        />
      </Card>

      <Modal isOpen={!!candidatesModal} onClose={() => setCandidatesModal(null)} title={`Matched products — "${candidatesModal?.term}"`} size="lg" showFooter={false}>
        {candidatesLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-2">
            {(candidatesData?.data?.data || []).length === 0 && <p className="text-sm text-gray-500">No matched products found for this trend.</p>}
            {(candidatesData?.data?.data || []).map((c) => (
              <div key={c._id} className="flex items-center gap-3 border rounded-lg p-2">
                {c.product?.featuredImage && <img src={c.product.featuredImage} alt="" className="w-10 h-10 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.product?.name}</p>
                  <p className="text-xs text-gray-500">similarity {c.similarity?.toFixed(3)}{c.weight != null ? ` · weight ${c.weight.toFixed(3)}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function CalendarTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // event being edited, or {} for new

  const { data, isLoading } = useQuery('autoposter-cultural-events', () => autoposterAPI.listCulturalEvents());
  const events = data?.data?.data || [];

  const invalidate = () => { queryClient.invalidateQueries('autoposter-cultural-events'); setModal(null); };

  const saveMutation = useMutation(
    (event) => (event._id ? autoposterAPI.updateCulturalEvent(event._id, event) : autoposterAPI.createCulturalEvent(event)),
    { onSuccess: () => { toast.success('Saved'); invalidate(); }, onError: (error) => toast.error(error.response?.data?.message || 'Save failed') }
  );
  const deleteMutation = useMutation((id) => autoposterAPI.deleteCulturalEvent(id), {
    onSuccess: () => { toast.success('Deleted'); invalidate(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Delete failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModal({ recurrence: { type: 'once', date: '' }, boost: 1.3, leadTimeDays: 0, active: true })}>
          <IoAddOutline className="mr-1" /> Add one-off event
        </Button>
      </div>

      <Card>
        {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No cultural events configured yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e._id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium">{e.name} {!e.active && <span className="text-xs text-gray-400">(inactive)</span>}</p>
                  <p className="text-xs text-gray-500">
                    {e.recurrence?.type} · boost {e.boost}x · lead-time {e.leadTimeDays || 0}d
                    {e.notes ? ` · ${e.notes}` : ''}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => setModal(e)}><IoCreateOutline size={16} /></Button>
                  <Button variant="danger" size="sm" onClick={() => window.confirm(`Delete "${e.name}"?`) && deleteMutation.mutate(e._id)}><IoTrashOutline size={16} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?._id ? 'Edit event' : 'Add one-off event'}
        onConfirm={() => saveMutation.mutate(modal)}
        confirmLoading={saveMutation.isLoading}
        confirmText="Save"
      >
        {modal && (
          <div className="space-y-3">
            <Input label="Name" fullWidth value={modal.name || ''} onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))} />
            {modal.recurrence?.type === 'once' ? (
              <Input
                label="Date"
                type="date"
                fullWidth
                value={modal.recurrence?.date || ''}
                onChange={(e) => setModal((m) => ({ ...m, recurrence: { ...m.recurrence, date: e.target.value } }))}
              />
            ) : (
              <p className="text-xs text-gray-500">Recurrence: {JSON.stringify(modal.recurrence)} (edit via the seeded data for recurring types — this form is for one-off events)</p>
            )}
            <Input
              label="Boost (1.0 – 2.0)"
              type="number" step="0.1" min="1" max="2" fullWidth
              value={modal.boost ?? 1}
              onChange={(e) => setModal((m) => ({ ...m, boost: parseFloat(e.target.value) }))}
            />
            <Input
              label="Lead-time (days before the event to start ramping)"
              type="number" min="0" fullWidth
              value={modal.leadTimeDays ?? 0}
              onChange={(e) => setModal((m) => ({ ...m, leadTimeDays: parseInt(e.target.value, 10) || 0 }))}
              helperText="0 = boost only applies on the exact day"
            />
            <Input label="Notes" fullWidth value={modal.notes || ''} onChange={(e) => setModal((m) => ({ ...m, notes: e.target.value }))} />
            <Checkbox label="Active" checked={modal.active !== false} onChange={(e) => setModal((m) => ({ ...m, active: e.target.checked }))} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function InsightsTab() {
  const { data, isLoading } = useQuery('autoposter-insights', () => autoposterAPI.getAutoPostInsights());
  const insights = data?.data?.data;

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (!insights) return null;

  return (
    <div className="space-y-4">
      {insights.note && (
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">{insights.note}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Decisions by status">
          <div className="space-y-1">
            {insights.decisionsByApprovalStatus.map((d) => (
              <div key={d._id} className="flex justify-between text-sm">
                <span className="text-gray-600">{d._id}</span>
                <span className="font-medium tabular-nums">{d.count}</span>
              </div>
            ))}
            {insights.decisionsByApprovalStatus.length === 0 && <p className="text-sm text-gray-400">No decisions recorded yet.</p>}
          </div>
        </Card>

        <Card title="Top rejected trends">
          <div className="space-y-1">
            {insights.topRejectedTrends.map((r) => (
              <div key={r._id} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate">{r.term || '(deleted trend)'}</span>
                <span className="font-medium tabular-nums">{r.count}</span>
              </div>
            ))}
            {insights.topRejectedTrends.length === 0 && <p className="text-sm text-gray-400">No rejections yet.</p>}
          </div>
        </Card>

        <Card title="Variant style performance">
          <p className="text-sm text-gray-400">
            {insights.variantStylePerformance.length === 0
              ? 'No data yet — populated once the Phase 12 insights worker starts recording engagement per variant style.'
              : `${insights.variantStylePerformance.length} (platform, category, style) cells tracked.`}
          </p>
        </Card>
      </div>

      <Card title="Approval rate by platform">
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Platform</th><th>Status</th><th className="text-right">Count</th></tr></thead>
            <tbody>
              {insights.approvalRateByPlatform.map((r) => (
                <tr key={`${r._id.platform}-${r._id.status}`}>
                  <td>{r._id.platform}</td>
                  <td>{r._id.status}</td>
                  <td className="text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {insights.approvalRateByPlatform.length === 0 && <p className="text-sm text-gray-400 py-4">No data yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function ConfigTab() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(null);
  const [blocklistDraft, setBlocklistDraft] = useState({ term: '', type: 'exact', reason: '' });

  const { data: configData } = useQuery('autoposter-engine-config', () => autoposterAPI.getEngineConfig(), {
    onSuccess: (res) => { if (!draft) setDraft(res.data.data); },
  });
  const { data: categoriesData } = useQuery('categories-for-autoposter-config', () => categoriesAPI.getAll({ limit: 200 }));
  const categories = categoriesData?.data?.data || categoriesData?.data?.categories || [];

  const { data: blocklistData } = useQuery('autoposter-blocklist', () => autoposterAPI.listBlocklist());
  const blocklist = blocklistData?.data?.data || [];

  const config = draft || configData?.data?.data;

  const saveMutation = useMutation((body) => autoposterAPI.updateEngineConfig(body), {
    onSuccess: (res) => { toast.success('Configuration saved'); setDraft(res.data.data); queryClient.invalidateQueries('autoposter-engine-config'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Save failed'),
  });

  const addBlocklistMutation = useMutation(() => autoposterAPI.addBlocklistEntry(blocklistDraft), {
    onSuccess: () => { toast.success('Added to blocklist'); setBlocklistDraft({ term: '', type: 'exact', reason: '' }); queryClient.invalidateQueries('autoposter-blocklist'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Add failed'),
  });
  const deleteBlocklistMutation = useMutation((id) => autoposterAPI.deleteBlocklistEntry(id), {
    onSuccess: () => queryClient.invalidateQueries('autoposter-blocklist'),
  });

  if (!config) return <p className="text-sm text-gray-400">Loading…</p>;

  const platformsObj = config.platforms instanceof Map ? Object.fromEntries(config.platforms) : (config.platforms || {});

  const updatePlatform = (platform, field, value) => {
    setDraft((d) => {
      const platforms = d.platforms instanceof Map ? Object.fromEntries(d.platforms) : { ...d.platforms };
      platforms[platform] = { ...platforms[platform], [field]: value };
      return { ...d, platforms };
    });
  };

  const updateWeight = (field, value) => setDraft((d) => ({ ...d, samplerWeights: { ...d.samplerWeights, [field]: value } }));
  const updateCooldown = (field, value) => setDraft((d) => ({ ...d, cooldown: { ...d.cooldown, [field]: value } }));

  return (
    <div className="space-y-4">
      <Card title="Per-platform">
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Platform</th><th>Enabled</th><th>Auto-publish</th><th>Hourly cap</th></tr></thead>
            <tbody>
              {PLATFORMS.map((p) => {
                const pc = platformsObj[p] || {};
                return (
                  <tr key={p}>
                    <td className="capitalize">{p}</td>
                    <td><Checkbox checked={pc.enabled !== false} onChange={(e) => updatePlatform(p, 'enabled', e.target.checked)} /></td>
                    <td><Checkbox checked={!!pc.autoPublish} onChange={(e) => updatePlatform(p, 'autoPublish', e.target.checked)} /></td>
                    <td>
                      <Input
                        type="number" min="0" className="w-24"
                        value={pc.hourlyCap ?? ''}
                        placeholder="no cap"
                        onChange={(e) => updatePlatform(p, 'hourlyCap', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Sampler weight tuning (advanced — weights should sum to ~1.0)">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['volume', 'velocity', 'sourceConfidence', 'culturalEventBoost', 'crossSourceValidation'].map((key) => (
            <Input
              key={key} label={key} type="number" step="0.05" min="0" max="1"
              value={config.samplerWeights?.[key] ?? ''}
              onChange={(e) => updateWeight(key, parseFloat(e.target.value))}
            />
          ))}
        </div>
      </Card>

      <Card title="Cool-down windows">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input label="Max/region/7d" type="number" value={config.cooldown?.maxPostsPerProductRegionPer7d ?? ''} onChange={(e) => updateCooldown('maxPostsPerProductRegionPer7d', parseInt(e.target.value, 10))} />
          <Input label="Max global/7d" type="number" value={config.cooldown?.maxPostsPerProductGlobalPer7d ?? ''} onChange={(e) => updateCooldown('maxPostsPerProductGlobalPer7d', parseInt(e.target.value, 10))} />
          <Input label="Min spacing, same region (min)" type="number" value={config.cooldown?.minSpacingSameRegionMinutes ?? ''} onChange={(e) => updateCooldown('minSpacingSameRegionMinutes', parseInt(e.target.value, 10))} />
          <Input label="Min spacing, same platform (min)" type="number" value={config.cooldown?.minSpacingSamePlatformMinutes ?? ''} onChange={(e) => updateCooldown('minSpacingSamePlatformMinutes', parseInt(e.target.value, 10))} />
          <Input label="Max category share (%)" type="number" value={config.cooldown?.maxCategorySharePercent ?? ''} onChange={(e) => updateCooldown('maxCategorySharePercent', parseInt(e.target.value, 10))} />
        </div>
      </Card>

      <Card title="Category graduation">
        <div className="max-h-64 overflow-y-auto space-y-1">
          {categories.map((cat) => {
            const existing = (config.categories || []).find((c) => (c.category?._id || c.category) === cat._id);
            const graduated = existing ? existing.graduated !== false : true;
            return (
              <div key={cat._id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span>{cat.name}</span>
                <Checkbox
                  label="Graduated"
                  checked={graduated}
                  onChange={(e) => {
                    setDraft((d) => {
                      const list = [...(d.categories || [])];
                      const idx = list.findIndex((c) => (c.category?._id || c.category) === cat._id);
                      if (idx === -1) list.push({ category: cat._id, graduated: e.target.checked });
                      else list[idx] = { ...list[idx], graduated: e.target.checked };
                      return { ...d, categories: list };
                    });
                  }}
                />
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-sm text-gray-400">No categories found.</p>}
        </div>
      </Card>

      <Card title="Blocklist editor">
        <div className="space-y-2 mb-3">
          {blocklist.map((b) => (
            <div key={b._id} className="flex items-center justify-between text-sm border-b py-1.5 last:border-0">
              <span><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">{b.type}</span>{b.term} {b.reason && <span className="text-gray-400">— {b.reason}</span>}</span>
              <Button variant="ghost" size="sm" onClick={() => deleteBlocklistMutation.mutate(b._id)}><IoTrashOutline size={14} /></Button>
            </div>
          ))}
          {blocklist.length === 0 && <p className="text-sm text-gray-400">No blocklist entries yet.</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input label="Term / pattern" value={blocklistDraft.term} onChange={(e) => setBlocklistDraft((b) => ({ ...b, term: e.target.value }))} />
          <Select label="Type" value={blocklistDraft.type} onChange={(e) => setBlocklistDraft((b) => ({ ...b, type: e.target.value }))} options={[{ value: 'exact', label: 'Exact' }, { value: 'regex', label: 'Regex' }, { value: 'category', label: 'Category' }]} />
          <Input label="Reason" value={blocklistDraft.reason} onChange={(e) => setBlocklistDraft((b) => ({ ...b, reason: e.target.value }))} />
          <Button loading={addBlocklistMutation.isLoading} disabled={!blocklistDraft.term} onClick={() => addBlocklistMutation.mutate()}>Add</Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button loading={saveMutation.isLoading} onClick={() => saveMutation.mutate({ platforms: platformsObj, categories: config.categories, samplerWeights: config.samplerWeights, cooldown: config.cooldown })}>
          Save configuration
        </Button>
      </div>
    </div>
  );
}

export default function AutoposterTrendDashboardPage() {
  const [tab, setTab] = useState('trends');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Auto-Poster — Trend Dashboard</h1>
        <p className="text-gray-500 mt-1">Full visibility and control over the trend engine (Spec Section 12).</p>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'trends' && <TrendsTab />}
      {tab === 'approvals' && <AutoposterApprovalQueuePage />}
      {tab === 'calendar' && <CalendarTab />}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'config' && <ConfigTab />}
    </div>
  );
}
