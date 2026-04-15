import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  sectionTitle: 'Featured Services',
  showImage: true,
  showBody: true,
  showProviderName: false,
  enquireButtonText: 'Enquire',
  maxAdsPerSlot: 6,
  cardMinWidth: 180,
  cardMaxWidth: 220,
};

export default function ServiceProviderAdSettingsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_SETTINGS);

  const { data, isLoading } = useQuery(
    ['sp-ad-settings-admin'],
    () => api.get('/service-provider-ads/settings').then(r => r.data),
    { staleTime: 60000 }
  );

  useEffect(() => {
    if (data?.data) setForm({ ...DEFAULT_SETTINGS, ...data.data });
  }, [data]);

  const saveMutation = useMutation(
    (settings) => api.put('/service-provider-ads/settings', settings),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ad-settings-admin'); toast.success('Ad display settings saved'); },
      onError: e => toast.error(e.response?.data?.message || 'Error saving settings')
    }
  );

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const Toggle = ({ field, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => set(field, !form[field])}
        className={`relative w-10 h-5 rounded-full transition-colors ${form[field] ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        These settings control what appears on ad cards shown to customers on the website and mobile app. Changes take effect immediately after saving.
      </div>

      {/* Card Content Controls */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">Card Content</h3>
          <p className="text-xs text-gray-400 mt-0.5">Choose what information is displayed on each ad card</p>
        </div>
        <div className="px-6">
          <Toggle field="showImage" label="Show Ad Image / Banner" description="Display the banner image or branded placeholder at the top of each card" />
          <Toggle field="showBody" label="Show Ad Body Text" description="Display the ad description below the title" />
          <Toggle field="showProviderName" label="Show Provider Company Name" description="Display the service provider's business name on the card (currently off)" />
        </div>
      </div>

      {/* Text Labels */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">Labels &amp; Text</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Section Heading</label>
            <input
              type="text"
              value={form.sectionTitle}
              onChange={e => set('sectionTitle', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="e.g. Featured Services"
            />
            <p className="text-xs text-gray-400 mt-1">Heading shown above the ad carousel on the product page</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Enquire Button Text</label>
            <input
              type="text"
              value={form.enquireButtonText}
              onChange={e => set('enquireButtonText', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="e.g. Enquire"
            />
            <p className="text-xs text-gray-400 mt-1">Text on the call-to-action button on each ad card</p>
          </div>
        </div>
      </div>

      {/* Display Controls */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">Display Controls</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Max Ads Per Slot</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.maxAdsPerSlot}
              onChange={e => set('maxAdsPerSlot', Number(e.target.value))}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">Maximum number of ads shown in the carousel at once</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Card Min Width (px)</label>
              <input
                type="number"
                min={120}
                max={400}
                value={form.cardMinWidth}
                onChange={e => set('cardMinWidth', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Card Max Width (px)</label>
              <input
                type="number"
                min={120}
                max={400}
                value={form.cardMaxWidth}
                onChange={e => set('cardMaxWidth', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">Preview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Sample card with current settings</p>
        </div>
        <div className="p-6 bg-gray-50">
          <div style={{ display: 'inline-block', minWidth: form.cardMinWidth, maxWidth: form.cardMaxWidth, border: '1px solid #e5eae6', background: '#fff', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, fontWeight: 700, color: '#76889a', background: 'rgba(255,255,255,0.85)', padding: '1px 5px' }}>AD</div>
            {form.showImage && (
              <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg, #1b5e35, #2d7a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22 }}>🔧</span>
              </div>
            )}
            <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {form.showProviderName && <div style={{ fontSize: 10, color: '#76889a' }}>JoJa Group</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Expert Electrical Services</div>
              {form.showBody && <div style={{ fontSize: 11, color: '#76889a' }}>Professional electricians available 24/7 across the city.</div>}
              <div style={{ marginTop: 6, padding: '7px 10px', background: '#1b5e35', color: '#a8ffca', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
                {form.enquireButtonText}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate(form)}
        disabled={saveMutation.isLoading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {saveMutation.isLoading ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
