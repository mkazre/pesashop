import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { digitalKioskAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoTvOutline, IoSaveOutline } from 'react-icons/io5';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'signup', label: 'Signup & Auth' },
  { id: 'welcome', label: 'Welcome Screen' },
];

export default function DigitalKioskSettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery('digital-kiosk-config', digitalKioskAPI.getConfig, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.data?.data) {
      const c = data.data.data;
      setForm({
        screensaverEnabled: c.screensaverEnabled,
        idleTimeoutSeconds: c.idleTimeoutSeconds,
        autoLogoutSeconds: c.autoLogoutSeconds,
        successAutoReturnSeconds: c.successAutoReturnSeconds,
        branding: c.branding || {},
        signup: c.signup || {},
        welcomeHeading: c.welcomeHeading || '',
        welcomeSubheading: c.welcomeSubheading || '',
      });
    }
  }, [data]);

  const saveMutation = useMutation((payload) => digitalKioskAPI.updateConfig(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries('digital-kiosk-config');
      toast.success('Kiosk settings saved');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  if (isLoading || !form) {
    return <div className="p-6 text-gray-500">Loading kiosk settings…</div>;
  }

  const setField = (key, value) => setForm({ ...form, [key]: value });
  const setNested = (group, key, value) => setForm({ ...form, [group]: { ...form[group], [key]: value } });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IoTvOutline size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Digital Kiosk Settings</h1>
            <p className="text-sm text-gray-500">Global configuration applied to every kiosk device</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isLoading}>
          <IoSaveOutline size={18} className="mr-2" />
          {saveMutation.isLoading ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card>
          <div className="p-6 space-y-5">
            <Field label="Enable screensaver">
              <Toggle value={form.screensaverEnabled} onChange={(v) => setField('screensaverEnabled', v)} />
            </Field>
            <Field label="Idle timeout before screensaver (seconds)" hint="How long the kiosk waits without input before showing the screensaver">
              <input type="number" min={10} max={3600} value={form.idleTimeoutSeconds} onChange={(e) => setField('idleTimeoutSeconds', Number(e.target.value))} className="border rounded px-3 py-2 w-32" />
            </Field>
            <Field label="Auto-logout idle threshold (seconds)" hint="If a user is logged in and goes idle past this, they're logged out and the cart is cleared">
              <input type="number" min={30} max={3600} value={form.autoLogoutSeconds} onChange={(e) => setField('autoLogoutSeconds', Number(e.target.value))} className="border rounded px-3 py-2 w-32" />
            </Field>
            <Field label="Order success auto-return (seconds)" hint="How long the order success screen shows before returning to the home screen">
              <input type="number" min={5} max={120} value={form.successAutoReturnSeconds} onChange={(e) => setField('successAutoReturnSeconds', Number(e.target.value))} className="border rounded px-3 py-2 w-32" />
            </Field>
          </div>
        </Card>
      )}

      {tab === 'branding' && (
        <Card>
          <div className="p-6 space-y-5">
            <Field label="Primary colour"><ColorInput value={form.branding.primary} onChange={(v) => setNested('branding', 'primary', v)} /></Field>
            <Field label="Secondary colour"><ColorInput value={form.branding.secondary} onChange={(v) => setNested('branding', 'secondary', v)} /></Field>
            <Field label="Font family"><input type="text" value={form.branding.font || ''} onChange={(e) => setNested('branding', 'font', e.target.value)} className="border rounded px-3 py-2 w-64" /></Field>
            <Field label="Logo URL" hint="Shown in the kiosk header — leave blank to use the default site logo">
              <input type="text" value={form.branding.logoUrl || ''} onChange={(e) => setNested('branding', 'logoUrl', e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="https://…" />
            </Field>
          </div>
        </Card>
      )}

      {tab === 'signup' && (
        <Card>
          <div className="p-6 space-y-5">
            <Field label="Require phone on signup" hint="When ON, the kiosk signup form requires a phone number">
              <Toggle value={form.signup.requirePhone} onChange={(v) => setNested('signup', 'requirePhone', v)} />
            </Field>
            <Field label="Allow social login (Google / Facebook)" hint="If your social-login providers are configured in Settings, surface them on the kiosk login screen">
              <Toggle value={form.signup.allowSocialLogin} onChange={(v) => setNested('signup', 'allowSocialLogin', v)} />
            </Field>
          </div>
        </Card>
      )}

      {tab === 'welcome' && (
        <Card>
          <div className="p-6 space-y-5">
            <Field label="Welcome heading"><input type="text" value={form.welcomeHeading} onChange={(e) => setField('welcomeHeading', e.target.value)} className="border rounded px-3 py-2 w-full" /></Field>
            <Field label="Welcome subheading"><input type="text" value={form.welcomeSubheading} onChange={(e) => setField('welcomeSubheading', e.target.value)} className="border rounded px-3 py-2 w-full" /></Field>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="grid grid-cols-12 gap-4 items-start">
      <div className="col-span-12 md:col-span-4">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      </div>
      <div className="col-span-12 md:col-span-8">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${value ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="border rounded px-2 py-1 text-sm w-28 font-mono" />
    </div>
  );
}
