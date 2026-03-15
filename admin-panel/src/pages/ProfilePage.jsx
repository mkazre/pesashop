import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import {
  IoPersonCircle, IoShieldCheckmark, IoKey, IoSave,
  IoEye, IoEyeOff, IoMail, IoCall, IoCalendar,
} from 'react-icons/io5';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');

  // Profile form
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  });

  // Password form
  const [pw, setPw] = useState({ currentPassword: '', password: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const profileMutation = useMutation(data => authAPI.updateProfile(data), {
    onSuccess: (res) => {
      toast.success('Profile updated');
      if (res.data?.data) updateUser(res.data.data);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update profile'),
  });

  const passwordMutation = useMutation(data => authAPI.updateProfile(data), {
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPw({ currentPassword: '', password: '', confirmPassword: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    profileMutation.mutate(profile);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (pw.password !== pw.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pw.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    passwordMutation.mutate({ currentPassword: pw.currentPassword, password: pw.password });
  };

  const ROLE_LABELS = { admin: 'Administrator', shop_manager: 'Shop Manager', customer: 'Customer' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  <IoShieldCheckmark size={12} /> {ROLE_LABELS[user?.role] || user?.role}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <IoMail size={14} /> {user?.email}
                </span>
              </div>
              {user?.createdAt && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <IoCalendar size={12} /> Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-gray-200">
        {[
          { id: 'profile', label: 'Profile Details', icon: IoPersonCircle },
          { id: 'password', label: 'Change Password', icon: IoKey },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white border-2 border-gray-200">
          <div className="px-6 py-4 border-b-2 border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Update your personal details</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name</label>
                <input required value={profile.firstName}
                  onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name</label>
                <input required value={profile.lastName}
                  onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <IoMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input required type="email" value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
              <div className="relative">
                <IoCall className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. +27 82 123 4567"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            {/* Read-only info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 border-2 border-gray-100">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last Login</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Account Status</p>
                <p className="text-sm font-medium text-green-600 mt-0.5">Active</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={profileMutation.isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                <IoSave size={16} />
                {profileMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="bg-white border-2 border-gray-200">
          <div className="px-6 py-4 border-b-2 border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ensure your account uses a strong, unique password</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
              <div className="relative">
                <input required type={showCurrent ? 'text' : 'password'} value={pw.currentPassword}
                  onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <div className="relative">
                <input required type={showNew ? 'text' : 'password'} value={pw.password} minLength={6}
                  onChange={e => setPw(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                </button>
              </div>
              {pw.password && pw.password.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Must be at least 6 characters</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
              <input required type="password" value={pw.confirmPassword}
                onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors" />
              {pw.confirmPassword && pw.password !== pw.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={passwordMutation.isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                <IoKey size={16} />
                {passwordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
