import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuthStore, useCurrencyStore } from '@/store';
import { userAPI, authAPI, demographicsAPI } from '@/services/api';

const HOBBIES = [
  'Cooking', 'Baking', 'Gardening', 'Fitness', 'Running', 'Cycling', 'Hiking',
  'Swimming', 'Photography', 'Reading', 'Music', 'Gaming', 'DIY/Home Improvement',
  'Fashion', 'Beauty', 'Travel', 'Fishing', 'Arts & Crafts', 'Sports', 'Yoga',
  'Meditation', 'Technology', 'Cars', 'Pets', 'Kids Activities',
];

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors';
const selectClass = inputClass;
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

function ProfileCompletionBanner({ score, missingFields, rewardPoints }) {
  if (score >= 100) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-amber-600 font-bold text-sm">{score}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-900 text-sm">Complete your profile to earn {rewardPoints || 100} PESA Coins</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Still missing: {missingFields?.slice(0, 4).join(', ')}{missingFields?.length > 4 ? ` and ${missingFields.length - 4} more` : ''}
        </p>
        <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
          <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const { formatPrice, selectedCurrency } = useCurrencyStore();
  const currSymbol = selectedCurrency?.symbol || 'R';
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Demographics state — initialised empty, populated from fresh API fetch below
  const [demoData, setDemoData] = useState({
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    householdSize: '',
    employmentStatus: '',
    incomeRange: '',
    educationLevel: '',
    country: '',
    province: '',
    suburb: '',
    lifeStage: '',
    hobbies: [],
    interests: [],
    marketingOptIn: false,
    demographicsConsentGiven: false,
  });
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState('');
  const [demoError, setDemoError] = useState('');
  const [debouncedHobbies, setDebouncedHobbies] = useState(demoData.hobbies);
  const hobbyDebounceRef = useRef(null);

  // Fetch fresh profile from API on mount to get saved demographics
  useQuery('me-full', () => authAPI.getMe(), {
    staleTime: 0,
    onSuccess: (res) => {
      const freshUser = res?.data?.data || res?.data?.user || res?.data;
      if (freshUser && !demoLoaded) {
        updateUser(freshUser);
        setDemoData({
          gender: freshUser.gender || '',
          dateOfBirth: freshUser.dateOfBirth ? freshUser.dateOfBirth.substring(0, 10) : '',
          maritalStatus: freshUser.maritalStatus || '',
          householdSize: freshUser.householdSize || '',
          employmentStatus: freshUser.employmentStatus || '',
          incomeRange: freshUser.incomeRange || '',
          educationLevel: freshUser.educationLevel || '',
          country: freshUser.country || '',
          province: freshUser.province || '',
          suburb: freshUser.suburb || '',
          lifeStage: freshUser.lifeStage || '',
          hobbies: freshUser.hobbies || [],
          interests: freshUser.interests || [],
          marketingOptIn: freshUser.marketingOptIn ?? false,
          demographicsConsentGiven: freshUser.demographicsConsentGiven ?? false,
        });
        setDemoLoaded(true);
      }
    }
  });

  // Profile completion
  const { data: completionData, refetch: refetchCompletion } = useQuery(
    'profile-completion',
    () => demographicsAPI.getProfileCompletion(),
    { staleTime: 60000 }
  );
  const completion = completionData?.data?.data || {};

  const updateMutation = useMutation(
    (data) => userAPI.updateProfile(data),
    {
      onSuccess: (res) => {
        const updated = res?.data?.data || res?.data;
        if (updated) updateUser(updated);
        setSuccessMsg('Profile updated successfully');
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), 3000);
      },
      onError: (err) => {
        setErrorMsg(err.response?.data?.message || 'Failed to update profile');
        setSuccessMsg('');
      }
    }
  );

  const demoMutation = useMutation(
    (data) => demographicsAPI.updateProfile(data),
    {
      onSuccess: (res) => {
        const updated = res?.data?.data || res?.data?.user;
        if (updated) {
          updateUser(updated);
          // Re-sync demoData from the saved response so form stays populated
          setDemoData(prev => ({
            ...prev,
            gender: updated.gender || prev.gender,
            dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.substring(0, 10) : prev.dateOfBirth,
            maritalStatus: updated.maritalStatus || prev.maritalStatus,
            householdSize: updated.householdSize || prev.householdSize,
            employmentStatus: updated.employmentStatus || prev.employmentStatus,
            incomeRange: updated.incomeRange || prev.incomeRange,
            educationLevel: updated.educationLevel || prev.educationLevel,
            country: updated.country || prev.country,
            province: updated.province || prev.province,
            suburb: updated.suburb || prev.suburb,
            lifeStage: updated.lifeStage || prev.lifeStage,
            hobbies: updated.hobbies || prev.hobbies,
            marketingOptIn: updated.marketingOptIn ?? prev.marketingOptIn,
            demographicsConsentGiven: updated.demographicsConsentGiven ?? prev.demographicsConsentGiven,
          }));
        }
        setDemoSuccess('Demographics saved!');
        setDemoError('');
        refetchCompletion();
        setTimeout(() => setDemoSuccess(''), 3000);
      },
      onError: (err) => {
        setDemoError(err.response?.data?.message || 'Failed to save demographics');
      }
    }
  );

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    updateMutation.mutate({
      currentPassword: passwordData.currentPassword,
      password: passwordData.newPassword,
    });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    demoMutation.mutate(demoData);
  };

  const toggleHobby = useCallback((hobby) => {
    setDemoData(prev => {
      const updated = prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby];
      // Debounce hobby-product preview refresh
      if (hobbyDebounceRef.current) clearTimeout(hobbyDebounceRef.current);
      hobbyDebounceRef.current = setTimeout(() => setDebouncedHobbies(updated), 800);
      return { ...prev, hobbies: updated };
    });
  }, []);

  // Hobby product preview query
  const { data: hobbyProductsData, isFetching: loadingHobbyProducts } = useQuery(
    ['hobby-products', debouncedHobbies],
    () => demographicsAPI.getHobbyProducts(debouncedHobbies, 3),
    {
      enabled: debouncedHobbies.length > 0,
      staleTime: 60000,
      keepPreviousData: true,
    }
  );
  const hobbyProducts = hobbyProductsData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Account Settings</h1>
        <p className="text-gray-500 text-sm">Manage your personal information, demographics, and security</p>
      </div>

      {/* Profile completion banner */}
      {completion.score !== undefined && (
        <ProfileCompletionBanner
          score={completion.score}
          missingFields={completion.missingLabels}
          rewardPoints={completion.rewardPoints}
        />
      )}

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {errorMsg}
        </div>
      )}

      {/* Personal Information */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="tel" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button type="submit" disabled={updateMutation.isLoading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Demographics */}
      <form onSubmit={handleDemoSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">My Profile &amp; Interests</h2>
              <p className="text-xs text-gray-500 mt-0.5">Help us personalise your experience and earn PESA Coins when complete</p>
            </div>
            {completion.score !== undefined && completion.score < 100 && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                {completion.score}% complete
              </span>
            )}
            {completion.score >= 100 && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                ✓ Profile complete
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {demoSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              {demoSuccess}
            </div>
          )}
          {demoError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {demoError}
            </div>
          )}

          {/* Basic demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Gender</label>
              <select value={demoData.gender} onChange={(e) => setDemoData(p => ({ ...p, gender: e.target.value }))} className={selectClass}>
                <option value="">— select —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={demoData.dateOfBirth}
                onChange={(e) => setDemoData(p => ({ ...p, dateOfBirth: e.target.value }))}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Marital Status</label>
              <select value={demoData.maritalStatus} onChange={(e) => setDemoData(p => ({ ...p, maritalStatus: e.target.value }))} className={selectClass}>
                <option value="">— select —</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Household Size</label>
              <input type="number" min="1" max="20" value={demoData.householdSize}
                onChange={(e) => setDemoData(p => ({ ...p, householdSize: e.target.value }))}
                placeholder="e.g. 4" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Employment Status</label>
              <select value={demoData.employmentStatus} onChange={(e) => setDemoData(p => ({ ...p, employmentStatus: e.target.value }))} className={selectClass}>
                <option value="">— select —</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Monthly Income Range</label>
              <select value={demoData.incomeRange} onChange={(e) => setDemoData(p => ({ ...p, incomeRange: e.target.value }))} className={selectClass}>
                <option value="">— select —</option>
                <option value="<15k">Under {currSymbol}15,000</option>
                <option value="15k-30k">{currSymbol}15,000 – {currSymbol}30,000</option>
                <option value="30k-60k">{currSymbol}30,000 – {currSymbol}60,000</option>
                <option value="60k-120k">{currSymbol}60,000 – {currSymbol}120,000</option>
                <option value=">120k">Over {currSymbol}120,000</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Education Level</label>
              <input type="text" value={demoData.educationLevel}
                onChange={(e) => setDemoData(p => ({ ...p, educationLevel: e.target.value }))}
                placeholder="e.g. Bachelor's Degree" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Life Stage</label>
              <select value={demoData.lifeStage} onChange={(e) => setDemoData(p => ({ ...p, lifeStage: e.target.value }))} className={selectClass}>
                <option value="">— select —</option>
                <option value="student">Student</option>
                <option value="young_professional">Young Professional</option>
                <option value="new_parent">New Parent</option>
                <option value="established_family">Established Family</option>
                <option value="empty_nester">Empty Nester</option>
                <option value="retiree">Retiree</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={demoData.country}
                onChange={(e) => setDemoData(p => ({ ...p, country: e.target.value }))}
                placeholder="e.g. South Africa, Zimbabwe, Namibia" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Province / State / Region</label>
              <input type="text" value={demoData.province}
                onChange={(e) => setDemoData(p => ({ ...p, province: e.target.value }))}
                placeholder="e.g. Gauteng, Harare, Khomas" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City / Suburb / Area</label>
              <input type="text" value={demoData.suburb}
                onChange={(e) => setDemoData(p => ({ ...p, suburb: e.target.value }))}
                placeholder="e.g. Sandton, Borrowdale" className={inputClass} />
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <label className={labelClass}>
              Hobbies &amp; Interests
              <span className="text-gray-400 font-normal ml-1">— select all that apply</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {HOBBIES.map(hobby => {
                const active = demoData.hobbies.includes(hobby);
                return (
                  <button
                    key={hobby}
                    type="button"
                    onClick={() => toggleHobby(hobby)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {hobby}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hobby product preview */}
          {debouncedHobbies.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                {loadingHobbyProducts && <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                Products related to your hobbies
              </p>
              {hobbyProducts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {hobbyProducts.map(p => (
                    <Link key={p._id} to={`/product/${p.slug}`} className="group flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-400 transition-colors" style={{ maxWidth: '48%', flex: '1 1 160px' }}>
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.featuredImage ? (
                          <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 font-medium truncate leading-tight">{p.name}</p>
                        <p className="text-xs text-gray-900 font-semibold mt-0.5">{p.price != null ? formatPrice(p.price) : '—'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : !loadingHobbyProducts ? (
                <p className="text-xs text-gray-400">No products found for selected hobbies yet</p>
              ) : null}
              {debouncedHobbies.length > 0 && (
                <Link to={`/shop?hobby=${encodeURIComponent(debouncedHobbies[0])}`} className="text-xs text-gray-700 underline mt-2 block hover:text-gray-900">
                  Browse all {debouncedHobbies[0]} products →
                </Link>
              )}
            </div>
          )}

          {/* Consent */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preferences &amp; Consent</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={demoData.marketingOptIn}
                onChange={(e) => setDemoData(p => ({ ...p, marketingOptIn: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-800">Marketing communications</p>
                <p className="text-xs text-gray-500">Receive personalised offers, deals and product recommendations by email</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={demoData.demographicsConsentGiven}
                onChange={(e) => setDemoData(p => ({ ...p, demographicsConsentGiven: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-800">Personalisation consent</p>
                <p className="text-xs text-gray-500">Allow us to use your demographic information to personalise your shopping experience</p>
              </div>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button type="submit" disabled={demoMutation.isLoading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {demoMutation.isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <input type="password" value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className={inputClass} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>New Password</label>
              <input type="password" value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className={inputClass} required minLength={6} />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input type="password" value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={inputClass} required minLength={6} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button type="submit" disabled={updateMutation.isLoading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors">
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
