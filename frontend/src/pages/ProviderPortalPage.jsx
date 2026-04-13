import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';
import toast from '@/utils/toast';

const PORTAL_TOKEN_KEY = 'sp_portal_token';
const PORTAL_PROVIDER_KEY = 'sp_portal_provider';

function getPortalToken() { return localStorage.getItem(PORTAL_TOKEN_KEY); }
function getPortalProvider() {
  try { return JSON.parse(localStorage.getItem(PORTAL_PROVIDER_KEY)); } catch { return null; }
}
function setPortalSession(token, provider) {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
  localStorage.setItem(PORTAL_PROVIDER_KEY, JSON.stringify(provider));
}
function clearPortalSession() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_PROVIDER_KEY);
}
function portalApi() {
  const token = getPortalToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─── Status badges ─────────────────────────────────────────
const SUB_BADGE = {
  none: 'bg-gray-100 text-gray-500',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-400',
  pending_payment: 'bg-amber-100 text-amber-700',
};
const AD_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-500',
  expired: 'bg-red-100 text-red-600',
  rejected: 'bg-red-100 text-red-600',
};

// ─── Login Screen ──────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await api.post('/api/service-providers/portal/login', { email, password });
      const { token, provider } = res.data;
      setPortalSession(token, provider);
      onLogin(provider);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Portal</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to manage your subscription and ads</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8 space-y-5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
              {err}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Not yet a provider?{' '}
          <a href="/service-providers" className="text-primary hover:underline">Apply here</a>
        </p>
        <p className="text-center text-xs text-gray-400 mt-1">
          Pending approval? Contact us to check your application status.
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────
function Dashboard({ provider: initialProvider, onLogout }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview'); // 'overview' | 'ads' | 'new-ad' | 'plans'

  // Refresh provider profile
  const { data: profileData } = useQuery(
    'sp-portal-me',
    () => api.get('/api/service-providers/me', portalApi()).then(r => r.data.data),
    { staleTime: 60000, initialData: initialProvider }
  );
  const provider = profileData || initialProvider;

  // Ads
  const { data: adsData, isLoading: adsLoading } = useQuery(
    'sp-portal-ads',
    () => api.get('/api/service-providers/me/ads', portalApi()).then(r => r.data.data || []),
    { staleTime: 30000 }
  );
  const ads = adsData || [];

  // Slots (for new ad form)
  const { data: slotsData } = useQuery(
    'sp-portal-slots',
    () => api.get('/api/service-providers/portal/slots', portalApi()).then(r => r.data.data || []),
    { staleTime: 5 * 60 * 1000 }
  );
  const slots = slotsData || [];

  // Plans
  const { data: plansData } = useQuery(
    'sp-portal-plans',
    () => api.get('/api/service-providers/plans/public').then(r => r.data.data || []),
    { staleTime: 5 * 60 * 1000 }
  );
  const plans = plansData || [];

  const subStatus = provider?.subscriptionStatus || 'none';
  const subPlan = provider?.subscriptionPlan;
  const subExpiry = provider?.subscriptionExpiry;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'ads', label: `📢 My Ads (${ads.length})` },
    { id: 'new-ad', label: '➕ Create Ad' },
    { id: 'plans', label: '📋 Subscription Plans' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{provider?.businessName}</h1>
            <p className="text-xs text-gray-500">{provider?.email} · Provider Portal</p>
          </div>
          <button
            onClick={() => { clearPortalSession(); onLogout(); }}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'overview' && <OverviewTab provider={provider} subStatus={subStatus} subPlan={subPlan} subExpiry={subExpiry} ads={ads} onGoToAds={() => setTab('ads')} onGoToPlans={() => setTab('plans')} />}
        {tab === 'ads' && <AdsTab ads={ads} adsLoading={adsLoading} onCreateNew={() => setTab('new-ad')} />}
        {tab === 'new-ad' && <NewAdForm slots={slots} onSuccess={() => { qc.invalidateQueries('sp-portal-ads'); setTab('ads'); }} />}
        {tab === 'plans' && <PlansTab plans={plans} currentPlan={subPlan} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────
function OverviewTab({ provider, subStatus, subPlan, subExpiry, ads, onGoToAds, onGoToPlans }) {
  const activeAds = ads.filter(a => a.status === 'active').length;
  const pendingAds = ads.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <div className={`p-6 border rounded-lg ${subStatus === 'active' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Subscription Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SUB_BADGE[subStatus] || 'bg-gray-100 text-gray-500'}`}>
                {subStatus.replace('_', ' ').toUpperCase()}
              </span>
              {subPlan?.name && <span className="text-sm text-gray-600">{subPlan.name}</span>}
            </div>
            {subExpiry && (
              <p className="text-xs text-gray-500 mt-1">
                {subStatus === 'expired' ? 'Expired' : 'Expires'}: {new Date(subExpiry).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          {subStatus !== 'active' && (
            <button onClick={onGoToPlans} className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
              View Plans
            </button>
          )}
        </div>
        {subStatus !== 'active' && (
          <div className="mt-3 p-3 bg-white/70 rounded text-xs text-gray-600">
            <strong>To activate a subscription:</strong> View the available plans below and contact us at{' '}
            <a href="mailto:providers@pesashop.co.za" className="text-primary underline">providers@pesashop.co.za</a>{' '}
            to arrange payment. Your account will be activated within 24 hours.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Ads', value: ads.length, icon: '📢' },
          { label: 'Active Ads', value: activeAds, icon: '✅' },
          { label: 'Pending Review', value: pendingAds, icon: '⏳' },
          { label: 'Max Allowed', value: subPlan?.maxActiveAds ?? '—', icon: '🎯' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={onGoToAds} className="px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
            📢 Manage My Ads
          </button>
          <button onClick={onGoToPlans} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50">
            📋 View Subscription Plans
          </button>
          <a href="/service-providers" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 inline-flex items-center">
            🔙 Back to Services Page
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">How Ad Subscriptions Work</h3>
        <ol className="space-y-3">
          {[
            { n: '1', t: 'Choose a subscription plan', d: 'Each plan defines how many active ads you can run at once.' },
            { n: '2', t: 'Contact us to activate', d: 'Email providers@pesashop.co.za to arrange payment. We activate within 24 hours.' },
            { n: '3', t: 'Create your ads', d: 'Design your ad (title, image, CTA) and choose which page slots to advertise on.' },
            { n: '4', t: 'Admin reviews & approves', d: 'We review your ad creative (usually within 24 hours) then publish it live.' },
            { n: '5', t: 'Your ads go live', d: 'Your ads appear contextually on relevant pages to customers matching your target audience.' },
          ].map(s => (
            <li key={s.n} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{s.n}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{s.t}</p>
                <p className="text-xs text-gray-500">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Ads Tab ───────────────────────────────────────────────
function AdsTab({ ads, adsLoading, onCreateNew }) {
  if (adsLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">My Ads</h2>
        <button onClick={onCreateNew} className="px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
          ➕ Create New Ad
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-gray-500 text-sm">No ads yet. Create your first ad to start reaching customers.</p>
          <button onClick={onCreateNew} className="mt-4 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
            Create Your First Ad
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad._id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt={ad.title} className="w-16 h-16 object-cover rounded border border-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{ad.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${AD_BADGE[ad.status] || 'bg-gray-100 text-gray-500'}`}>
                      {ad.status.toUpperCase()}
                    </span>
                  </div>
                  {ad.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.body}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {ad.placementSlot?.slotLabel && <span>📍 {ad.placementSlot.slotLabel}</span>}
                    {ad.startDate && <span>📅 From {new Date(ad.startDate).toLocaleDateString()}</span>}
                    {ad.endDate && <span>→ {new Date(ad.endDate).toLocaleDateString()}</span>}
                  </div>
                  {ad.ctaText && ad.ctaUrl && (
                    <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded hover:bg-primary/20">
                      {ad.ctaText} →
                    </a>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  {new Date(ad.createdAt).toLocaleDateString()}
                </div>
              </div>
              {ad.status === 'rejected' && ad.rejectionReason && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                  <strong>Rejection reason:</strong> {ad.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New Ad Form ───────────────────────────────────────────
function NewAdForm({ slots, onSuccess }) {
  const [form, setForm] = useState({
    title: '', body: '', ctaText: '', ctaUrl: '', imageUrl: '',
    placementSlot: '', startDate: '', endDate: '', aiKeywords: ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.placementSlot) {
      setErr('Please fill in ad title and select a placement slot.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        ctaText: form.ctaText,
        ctaUrl: form.ctaUrl,
        imageUrl: form.imageUrl,
        placementSlot: form.placementSlot,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        aiKeywords: form.aiKeywords ? form.aiKeywords.split(',').map(k => k.trim()).filter(Boolean) : []
      };
      await api.post('/api/service-providers/me/ads', payload, portalApi());
      toast.success('Ad submitted! We\'ll review it within 24 hours.');
      onSuccess();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  const groupedSlots = slots.reduce((acc, s) => {
    const page = s.slotPage || 'Other';
    if (!acc[page]) acc[page] = [];
    acc[page].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Create New Ad</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-5">
        {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{err}</div>}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ad Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Expert Electrical Services"
            className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ad Body Text</label>
          <textarea
            value={form.body}
            onChange={e => set('body', e.target.value)}
            placeholder="Brief description of your service offer…"
            rows={3}
            className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">CTA Button Text</label>
            <input
              type="text"
              value={form.ctaText}
              onChange={e => set('ctaText', e.target.value)}
              placeholder="e.g. Get a Free Quote"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">CTA Link URL</label>
            <input
              type="url"
              value={form.ctaUrl}
              onChange={e => set('ctaUrl', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ad Image URL</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={e => set('imageUrl', e.target.value)}
            placeholder="https://… or upload via media library"
            className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-auto object-contain border border-gray-100 rounded" />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Placement Slot *</label>
          <select
            required
            value={form.placementSlot}
            onChange={e => set('placementSlot', e.target.value)}
            className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">Select where your ad will appear</option>
            {Object.entries(groupedSlots).map(([page, pageSlots]) => (
              <optgroup key={page} label={page}>
                {pageSlots.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.slotLabel} {s.monthlyRate ? `(R${s.monthlyRate}/month)` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {slots.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No placement slots configured yet. Contact admin to set up slots.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => set('endDate', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Targeting Keywords</label>
          <input
            type="text"
            value={form.aiKeywords}
            onChange={e => set('aiKeywords', e.target.value)}
            placeholder="e.g. electrical, wiring, renovations (comma separated)"
            className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-gray-400 mt-1">Keywords help our AI show your ad to the most relevant customers.</p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit Ad for Review'}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-400 mt-3">
        Ads are reviewed by our team within 24 hours before going live. You'll be notified by email.
      </p>
    </div>
  );
}

// ─── Plans Tab ─────────────────────────────────────────────
function PlansTab({ plans, currentPlan }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Subscription Plans</h2>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-400 text-sm">No plans published yet. Contact us for pricing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isCurrent = currentPlan?._id === plan._id || currentPlan?.name === plan.name;
            return (
              <div key={plan._id} className={`bg-white border-2 rounded-lg p-5 ${isCurrent ? 'border-primary' : 'border-gray-200'}`}>
                {isCurrent && (
                  <span className="inline-block mb-2 px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                    CURRENT PLAN
                  </span>
                )}
                <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-primary">R{plan.price}</span>
                  <span className="text-sm text-gray-500">/{plan.billingCycle || 'month'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Up to {plan.maxActiveAds || 1} active ads</p>

                {(plan.featuresIncluded || []).length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {plan.featuresIncluded.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!isCurrent && (
                  <a
                    href={`mailto:providers@pesashop.co.za?subject=Subscribe to ${plan.name}&body=Hi, I would like to subscribe to the ${plan.name} plan (R${plan.price}/${plan.billingCycle}).`}
                    className="mt-4 block text-center py-2 border border-gray-900 text-gray-900 text-xs font-semibold hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    Subscribe to This Plan →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>How to subscribe:</strong> Click "Subscribe to This Plan" to send us an email, or contact{' '}
        <a href="mailto:providers@pesashop.co.za" className="underline">providers@pesashop.co.za</a> directly.
        Include your business name and preferred plan. We'll confirm payment details and activate your subscription within 24 hours.
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────
export default function ProviderPortalPage() {
  const [provider, setProvider] = useState(getPortalProvider);
  const token = getPortalToken();
  const isLoggedIn = !!(token && provider);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(p) => setProvider(p)} />;
  }

  return <Dashboard provider={provider} onLogout={() => setProvider(null)} />;
}
