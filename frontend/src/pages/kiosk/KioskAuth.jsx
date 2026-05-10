import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { useKioskConfig } from '@/hooks/useKioskConfig';
import KioskHeader from '@/components/kiosk/KioskHeader';
import VirtualKeyboard from '@/components/kiosk/VirtualKeyboard';
import toast from 'react-hot-toast';
import { IoPersonOutline, IoLogInOutline, IoMailOutline, IoLockClosedOutline, IoCallOutline } from 'react-icons/io5';

export default function KioskAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { config } = useKioskConfig();
  const requirePhone = config?.signup?.requirePhone !== false;

  const redirect = searchParams.get('redirect') || '/kiosk';
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [activeField, setActiveField] = useState('email');

  const setField = (k) => (v) => setForm({ ...form, [k]: v });

  const handleLogin = async () => {
    if (!form.email || !form.password) return toast.error('Email and password required');
    setSubmitting(true);
    try {
      const res = await authAPI.login({ email: form.email.trim().toLowerCase(), password: form.password });
      const data = res.data?.data || res.data;
      const token = data?.token || res.data?.token;
      const user = data?.user || data;
      if (!token) throw new Error('No token returned');
      setAuth(user, token);
      toast.success(`Welcome back, ${user.firstName || ''}`.trim());
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return toast.error('Please fill in all required fields');
    }
    if (requirePhone && !form.phone) {
      return toast.error('Phone number is required');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setSubmitting(true);
    try {
      const res = await authAPI.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      const data = res.data?.data || res.data;
      const token = data?.token || res.data?.token;
      const user = data?.user || data;
      if (!token) throw new Error('No token returned');
      setAuth(user, token);
      toast.success('Account created — welcome to PESA Shop!');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = mode === 'login'
    ? [
        { id: 'email', label: 'Email', icon: IoMailOutline, type: 'email' },
        { id: 'password', label: 'Password', icon: IoLockClosedOutline, type: 'password' },
      ]
    : [
        { id: 'firstName', label: 'First name', icon: IoPersonOutline, type: 'text' },
        { id: 'lastName', label: 'Last name', icon: IoPersonOutline, type: 'text' },
        { id: 'email', label: 'Email', icon: IoMailOutline, type: 'email' },
        ...(requirePhone ? [{ id: 'phone', label: 'Phone', icon: IoCallOutline, type: 'tel' }] : []),
        { id: 'password', label: 'Password (min 8 chars)', icon: IoLockClosedOutline, type: 'password' },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)] gap-6 items-start">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-xl text-lg font-semibold transition ${mode === 'login' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 rounded-xl text-lg font-semibold transition ${mode === 'signup' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-600'}`}
              >
                Create Account
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your PESA account'}
            </h1>
            <p className="text-gray-500 mb-6">
              {mode === 'login'
                ? 'Sign in to access your orders, laybyes, PESA Coins and saved addresses.'
                : 'A quick account so we can deliver to you and track your loyalty rewards.'}
            </p>

            <div className="space-y-3">
              {fields.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveField(f.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${activeField === f.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                >
                  <f.icon size={24} className="text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 font-medium">{f.label}</div>
                    <div className="text-lg font-medium text-gray-900 truncate">
                      {form[f.id]
                        ? (f.type === 'password' ? '•'.repeat(form[f.id].length) : form[f.id])
                        : <span className="text-gray-300">Tap to enter</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={submitting}
              className="kiosk-tile mt-6 w-full inline-flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl text-xl font-bold shadow-lg disabled:bg-gray-300"
            >
              <IoLogInOutline size={26} />
              {submitting ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account & Continue')}
            </button>

            <button onClick={() => navigate(redirect, { replace: true })} className="mt-4 w-full text-center py-3 text-gray-500 hover:text-gray-700">
              Continue as guest →
            </button>
          </div>

          {/* Keyboard */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="mb-2 text-sm text-gray-500 px-2">
              Editing: <span className="font-semibold text-gray-800">{fields.find(f => f.id === activeField)?.label || activeField}</span>
            </div>
            <VirtualKeyboard
              value={form[activeField] || ''}
              onChange={setField(activeField)}
              layout={activeField === 'phone' ? 'numbers' : 'letters'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
