import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from '@/utils/toast';

const PORTAL_BASE = import.meta.env.VITE_API_URL || '';
const portalHttp = axios.create({ baseURL: PORTAL_BASE });

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
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
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
      const res = await portalHttp.post('/api/service-providers/portal/login', { email, password });
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
  const [tab, setTab] = useState('overview'); // 'overview' | 'ads' | 'new-ad' | 'book-slot' | 'orders'

  // Refresh provider profile
  const { data: profileData } = useQuery(
    'sp-portal-me',
    () => portalHttp.get('/api/service-providers/me', portalApi()).then(r => r.data.data),
    { staleTime: 60000, initialData: initialProvider }
  );
  const provider = profileData || initialProvider;

  // Ads
  const { data: adsData, isLoading: adsLoading } = useQuery(
    'sp-portal-ads',
    () => portalHttp.get('/api/service-providers/me/ads', portalApi()).then(r => r.data.data || []),
    { staleTime: 30000 }
  );
  const ads = adsData || [];

  // Slots (for new ad form + booking)
  const { data: slotsData } = useQuery(
    'sp-portal-slots',
    () => portalHttp.get('/api/service-providers/portal/slots', portalApi()).then(r => r.data.data || []),
    { staleTime: 5 * 60 * 1000 }
  );
  const slots = slotsData || [];

  // Ad Orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    'sp-portal-ad-orders',
    () => portalHttp.get('/api/service-providers/portal/ad-orders', portalApi()).then(r => r.data.data || []),
    { staleTime: 30000 }
  );
  const adOrders = ordersData || [];
  const pendingOrders = adOrders.filter(o => o.status === 'pending_payment').length;

  const subStatus = provider?.subscriptionStatus || 'none';
  const subPlan = provider?.subscriptionPlan;
  const subExpiry = provider?.subscriptionExpiry;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'book-slot', label: '🛒 Book Ad Slot' },
    { id: 'orders', label: `📋 My Orders${pendingOrders > 0 ? ` (${pendingOrders} pending)` : ''}` },
    { id: 'ads', label: `📢 My Ads (${ads.length})` },
    { id: 'new-ad', label: '➕ Create Ad' },
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
        {tab === 'overview' && <OverviewTab provider={provider} subStatus={subStatus} subPlan={subPlan} subExpiry={subExpiry} ads={ads} adOrders={adOrders} onGoToAds={() => setTab('ads')} onGoToBook={() => setTab('book-slot')} onGoToOrders={() => setTab('orders')} />}
        {tab === 'book-slot' && <BookSlotTab slots={slots} onOrderPlaced={() => { qc.invalidateQueries('sp-portal-ad-orders'); setTab('orders'); }} />}
        {tab === 'orders' && <MyOrdersTab orders={adOrders} loading={ordersLoading} onBookSlot={() => setTab('book-slot')} />}
        {tab === 'ads' && <AdsTab ads={ads} adsLoading={adsLoading} onCreateNew={() => setTab('new-ad')} />}
        {tab === 'new-ad' && <NewAdForm slots={slots} onSuccess={() => { qc.invalidateQueries('sp-portal-ads'); setTab('ads'); }} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────
function OverviewTab({ provider, subStatus, subPlan, subExpiry, ads, adOrders, onGoToAds, onGoToBook, onGoToOrders }) {
  const activeAds = ads.filter(a => a.status === 'active').length;
  const pendingAds = ads.filter(a => a.status === 'pending').length;
  const pendingOrders = adOrders.filter(o => o.status === 'pending_payment').length;
  const activeOrders = adOrders.filter(o => o.status === 'active').length;

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
            <button onClick={onGoToBook} className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
              Book an Ad Slot
            </button>
          )}
        </div>
        {pendingOrders > 0 && (
          <div className="mt-3 p-3 bg-white/70 rounded text-xs text-amber-700">
            <strong>{pendingOrders} order{pendingOrders > 1 ? 's' : ''} awaiting payment confirmation.</strong>{' '}
            <button onClick={onGoToOrders} className="underline font-semibold">View your orders</button>.
            Once we confirm your payment, your subscription will be activated within 24 hours.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Ads', value: ads.length, icon: '📢' },
          { label: 'Active Ads', value: activeAds, icon: '✅' },
          { label: 'Pending Review', value: pendingAds, icon: '⏳' },
          { label: 'Active Orders', value: activeOrders, icon: '🎯' },
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
          <button onClick={onGoToBook} className="px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
            🛒 Book an Ad Slot
          </button>
          <button onClick={onGoToOrders} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50">
            📋 My Orders
          </button>
          <button onClick={onGoToAds} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50">
            📢 Manage My Ads
          </button>
          <a href="/service-providers" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 inline-flex items-center">
            🔙 Back to Services Page
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">How Ad Booking Works</h3>
        <ol className="space-y-3">
          {[
            { n: '1', t: 'Browse available ad slots', d: 'Each slot appears on a specific page (home, product detail, checkout, etc.) with daily/weekly/monthly/yearly rates.' },
            { n: '2', t: 'Place your order', d: 'Select a slot, duration, quantity and payment method. Your order is saved immediately.' },
            { n: '3', t: 'Make payment', d: 'For EFT, transfer to our bank account using your order reference. We also accept cash and card.' },
            { n: '4', t: 'Admin confirms & activates', d: 'Once we verify your payment, your subscription is activated within 24 hours.' },
            { n: '5', t: 'Create your ad creatives', d: 'With an active subscription, create and submit your ad (title, image, CTA) for review. We publish within 24 hours.' },
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
      await portalHttp.post('/api/service-providers/me/ads', payload, portalApi());
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

// ─── Book Slot Tab ─────────────────────────────────────────
const DURATION_OPTIONS = [
  { value: 'daily', label: 'Daily', rateKey: 'dailyRate' },
  { value: 'weekly', label: 'Weekly', rateKey: 'weeklyRate' },
  { value: 'monthly', label: 'Monthly', rateKey: 'monthlyRate' },
  { value: 'yearly', label: 'Yearly', rateKey: 'yearlyRate' },
];

function BookSlotTab({ slots, onOrderPlaced }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ durationType: 'monthly', quantity: 1, paymentMethod: 'eft', notes: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(null);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const getRate = (slot, durationType) => {
    const opt = DURATION_OPTIONS.find(o => o.value === durationType);
    return opt ? (slot[opt.rateKey] || 0) : 0;
  };

  const unitPrice = selectedSlot ? getRate(selectedSlot, form.durationType) : 0;
  const totalAmount = unitPrice * Math.max(1, parseInt(form.quantity) || 1);

  const handleBook = (slot) => {
    setSelectedSlot(slot);
    setShowForm(true);
    setErr('');
    setSuccess(null);
    setForm({ durationType: 'monthly', quantity: 1, paymentMethod: 'eft', notes: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (unitPrice <= 0) {
      setErr(`No rate configured for "${form.durationType}" on this slot. Choose a different duration.`);
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const res = await portalHttp.post('/api/service-providers/portal/ad-orders', {
        slotId: selectedSlot.slotId,
        durationType: form.durationType,
        quantity: parseInt(form.quantity) || 1,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      }, portalApi());
      setSuccess(res.data.data);
      setShowForm(false);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const groupedSlots = slots.reduce((acc, s) => {
    const page = s.slotPage || 'other';
    if (!acc[page]) acc[page] = [];
    acc[page].push(s);
    return acc;
  }, {});

  if (success) {
    return (
      <div className="max-w-xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-lg font-bold text-green-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-sm text-green-700 mb-4">
            Your order reference is: <strong className="font-mono">{success._id?.slice(-8).toUpperCase()}</strong>
          </p>
          <div className="bg-white rounded border border-green-200 p-4 text-left text-sm text-gray-700 space-y-1.5 mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Slot:</span><span className="font-medium">{success.slotLabel}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Duration:</span><span className="font-medium">{success.durationType} × {success.quantity}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total:</span><span className="font-bold text-gray-900">R{(success.totalAmount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment:</span><span className="font-medium">{success.paymentMethod?.toUpperCase()}</span></div>
          </div>
          {success.paymentMethod === 'eft' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700 text-left mb-4">
              <strong>EFT Payment Instructions:</strong><br />
              Please transfer <strong>R{(success.totalAmount || 0).toLocaleString()}</strong> to:<br />
              Bank: FNB · Account: 62XXXXXXXX · Branch: 250655<br />
              Reference: <strong className="font-mono">{success._id?.slice(-8).toUpperCase()}</strong><br />
              Email proof of payment to <a href="mailto:providers@pesashop.co.za" className="underline">providers@pesashop.co.za</a>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={onOrderPlaced} className="px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
              View My Orders
            </button>
            <button onClick={() => { setSuccess(null); setSelectedSlot(null); }} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50">
              Book Another Slot
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Available Ad Slots</h2>
        <p className="text-sm text-gray-500 mt-1">Select a slot to book. Each slot appears on a specific page of the platform.</p>
      </div>

      {slots.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-400 text-sm">No ad slots configured yet. Contact us to set up available slots.</p>
        </div>
      )}

      {Object.entries(groupedSlots).map(([page, pageSlots]) => (
        <div key={page} className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {page.replace('_', ' ')} Page
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pageSlots.map(slot => (
              <div key={slot._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{slot.slotLabel}</h4>
                    {slot.description && <p className="text-xs text-gray-500 mt-0.5">{slot.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">Max {slot.maxAds || 1} ad{slot.maxAds !== 1 ? 's' : ''} simultaneously</p>
                  </div>
                </div>
                {/* Rates */}
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {DURATION_OPTIONS.map(opt => {
                    const rate = slot[opt.rateKey] || 0;
                    if (!rate) return null;
                    return (
                      <div key={opt.value} className="text-xs text-gray-600">
                        <span className="text-gray-400">{opt.label}: </span>
                        <span className="font-semibold text-gray-800">R{rate.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => handleBook(slot)}
                  className="mt-3 w-full py-2 border border-gray-900 text-gray-900 text-xs font-semibold hover:bg-gray-900 hover:text-white transition-colors"
                >
                  Book This Slot
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Inline Checkout Form */}
      {showForm && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Book: {selectedSlot.slotLabel}</h3>
                <p className="text-xs text-gray-500">{selectedSlot.slotPage} page</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{err}</div>}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Duration Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map(opt => {
                    const rate = selectedSlot[opt.rateKey] || 0;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField('durationType', opt.value)}
                        disabled={!rate}
                        className={`px-3 py-2 text-sm border rounded transition-colors text-left ${
                          form.durationType === opt.value
                            ? 'border-primary bg-primary/5 text-primary font-semibold'
                            : rate
                            ? 'border-gray-200 text-gray-700 hover:border-gray-400'
                            : 'border-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <span className="block font-medium">{opt.label}</span>
                        <span className="text-xs">{rate ? `R${rate.toLocaleString()}` : 'N/A'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Quantity (number of {form.durationType || 'periods'})
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={form.quantity}
                  onChange={e => setField('quantity', e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">e.g. 3 = 3 {form.durationType}s</p>
              </div>

              {/* Price summary */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Rate per {form.durationType}:</span>
                  <span>R{unitPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Quantity:</span>
                  <span>× {form.quantity || 1}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total:</span>
                  <span>R{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'eft', l: 'EFT' }, { v: 'cash', l: 'Cash' }, { v: 'card', l: 'Card' }].map(pm => (
                    <button
                      key={pm.v}
                      type="button"
                      onClick={() => setField('paymentMethod', pm.v)}
                      className={`py-2 text-sm border rounded font-medium transition-colors ${
                        form.paymentMethod === pm.v
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {pm.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Any special requests or information…"
                  rows={2}
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || unitPrice <= 0}
                  className="flex-1 py-2.5 bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Placing Order…' : `Place Order — R${totalAmount.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── My Orders Tab ─────────────────────────────────────────
const ORDER_BADGE = {
  pending_payment: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
  expired: 'bg-gray-100 text-gray-400',
  cancelled: 'bg-gray-100 text-gray-500',
};

function MyOrdersTab({ orders, loading, onBookSlot }) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">My Ad Orders</h2>
        <button onClick={onBookSlot} className="px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
          + Book New Slot
        </button>
      </div>

      {/* EFT bank details notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>EFT Payment Details:</strong> FNB · Account: 62XXXXXXXX · Branch: 250655<br />
        Use your <strong>order reference</strong> (last 8 chars of Order ID) as payment reference.<br />
        Email proof of payment to <a href="mailto:providers@pesashop.co.za" className="underline font-medium">providers@pesashop.co.za</a>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">No orders yet. Book your first ad slot to get started.</p>
          <button onClick={onBookSlot} className="mt-4 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90">
            Book an Ad Slot
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <p className="text-gray-400 font-mono mt-0.5">{order._id?.slice(-8).toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 font-medium">{order.slotLabel || order.slotId}</p>
                      {order.slotPage && <p className="text-xs text-gray-400">{order.slotPage}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{order.durationType}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">R{(order.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 uppercase">{order.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ORDER_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                        {order.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      {order.status === 'active' && order.endDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Until {new Date(order.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {order.status === 'declined' && order.declineReason && (
                        <p className="text-xs text-red-500 mt-0.5">{order.declineReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
