import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { settingsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { IoSave, IoSparkles, IoEye, IoEyeOff, IoAdd, IoTrash } from 'react-icons/io5';

const EMPTY_BANK = { bankName: '', accountName: '', accountNumber: '', branchCode: '', accountType: '', reference: '' };

const SettingsPage = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showFacebookSecret, setShowFacebookSecret] = useState(false);
  const [bankDetails, setBankDetails] = useState([]);
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      storeName: '',
      storeEmail: '',
      storePhone: '',
      storeAddress: '',
      taxRate: '15',
      currency: 'ZAR',
      dateFormat: 'dd/MM/yyyy',
      timeZone: 'Africa/Johannesburg',
      openaiApiKey: '',
      aiEnabled: false,
      enableGuestCheckout: true,
      enableProductReviews: true,
      showStockQuantities: true,
      allowBackorders: true,
      laybyEnabled: true,
      laybyGlobalMinimumProductValue: '0',
      laybyDefaultExpiryDays: '90',
      laybyAutoCancelOnExpiry: true,
      laybySendEmailReminders: true,
      laybyTermsAndConditions: '',
      laybyApplicationEmail: 'hello@pesashop.com',
      laybyWidgetEnabled: true,
      laybyWidgetButtonText: 'GET IT ON LAYBY',
      // Product Display - Text Clamping
      'productDisplay.detailPage.titleLines': '0',
      'productDisplay.detailPage.descriptionLines': '0',
      'productDisplay.detailPage.shortDescriptionLines': '0',
      'productDisplay.detailPage.reviewLines': '0',
      'productDisplay.otherLocations.titleLines': '2',
      'productDisplay.otherLocations.descriptionLines': '3',
      'productDisplay.otherLocations.shortDescriptionLines': '2',
      'productDisplay.otherLocations.reviewLines': '3',
      // Social Login
      socialLoginGoogleEnabled: false,
      socialLoginGoogleClientId: '',
      socialLoginGoogleClientSecret: '',
      socialLoginFacebookEnabled: false,
      socialLoginFacebookAppId: '',
      socialLoginFacebookAppSecret: '',
    }
  });

  const { data: settingsData, isLoading } = useQuery(
    'settings',
    () => settingsAPI.getAll(),
    {
      onSuccess: (response) => {
        const settings = response.data.data || response.data;
        reset({
          storeName: settings.storeName || '',
          storeEmail: settings.storeEmail || '',
          storePhone: settings.storePhone || '',
          storeAddress: settings.storeAddress || '',
          taxRate: settings.taxRate?.toString() || '15',
          currency: settings.currency || 'ZAR',
          dateFormat: settings.dateFormat || 'dd/MM/yyyy',
          timeZone: settings.timeZone || 'Africa/Johannesburg',
          openaiApiKey: settings.openaiApiKey === '***configured***' ? '' : (settings.openaiApiKey || ''),
          aiEnabled: settings.aiEnabled || false,
          enableGuestCheckout: settings.enableGuestCheckout !== undefined ? settings.enableGuestCheckout : true,
          enableProductReviews: settings.enableProductReviews !== undefined ? settings.enableProductReviews : true,
          showStockQuantities: settings.showStockQuantities !== undefined ? settings.showStockQuantities : true,
          allowBackorders: settings.allowBackorders !== undefined ? settings.allowBackorders : true,
          laybyTermsAndConditions: settings.layby?.termsAndConditions || '',
          laybyApplicationEmail: settings.layby?.applicationEmail || 'hello@pesashop.com',
          laybyWidgetEnabled: settings.layby?.widgetEnabled !== false,
          laybyWidgetButtonText: settings.layby?.widgetButtonText || 'GET IT ON LAYBY',
          // Product Display - Text Clamping
          'productDisplay.detailPage.titleLines': String(settings.productDisplay?.detailPage?.titleLines ?? 0),
          'productDisplay.detailPage.descriptionLines': String(settings.productDisplay?.detailPage?.descriptionLines ?? 0),
          'productDisplay.detailPage.shortDescriptionLines': String(settings.productDisplay?.detailPage?.shortDescriptionLines ?? 0),
          'productDisplay.detailPage.reviewLines': String(settings.productDisplay?.detailPage?.reviewLines ?? 0),
          'productDisplay.otherLocations.titleLines': String(settings.productDisplay?.otherLocations?.titleLines ?? 2),
          'productDisplay.otherLocations.descriptionLines': String(settings.productDisplay?.otherLocations?.descriptionLines ?? 3),
          'productDisplay.otherLocations.shortDescriptionLines': String(settings.productDisplay?.otherLocations?.shortDescriptionLines ?? 2),
          'productDisplay.otherLocations.reviewLines': String(settings.productDisplay?.otherLocations?.reviewLines ?? 3),
          // Social Login
          socialLoginGoogleEnabled: settings.socialLogin?.google?.enabled || false,
          socialLoginGoogleClientId: settings.socialLogin?.google?.clientId || '',
          socialLoginGoogleClientSecret: settings.socialLogin?.google?.clientSecret === '***configured***' ? '' : (settings.socialLogin?.google?.clientSecret || ''),
          socialLoginFacebookEnabled: settings.socialLogin?.facebook?.enabled || false,
          socialLoginFacebookAppId: settings.socialLogin?.facebook?.appId || '',
          socialLoginFacebookAppSecret: settings.socialLogin?.facebook?.appSecret === '***configured***' ? '' : (settings.socialLogin?.facebook?.appSecret || ''),
        });
        setBankDetails(settings.bankDetails || []);
      }
    }
  );

  const saveMutation = useMutation(
    (data) => settingsAPI.update(data),
    {
      onSuccess: () => toast.success('Settings saved successfully'),
      onError: () => toast.error('Failed to save settings'),
    }
  );

  const onSubmit = (data) => {
    // Remove flat dot-notation keys that react-hook-form creates for nested fields
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      if (key.startsWith('productDisplay.') || key.startsWith('layby') || key.startsWith('socialLogin')) {
        delete cleanData[key];
      }
    });
    saveMutation.mutate({
      ...cleanData,
      taxRate: parseFloat(data.taxRate),
      aiEnabled: data.aiEnabled || false,
      enableGuestCheckout: data.enableGuestCheckout || false,
      enableProductReviews: data.enableProductReviews || false,
      showStockQuantities: data.showStockQuantities || false,
      allowBackorders: data.allowBackorders || false,
      bankDetails: bankDetails.filter(b => b.bankName || b.accountNumber),
      layby: {
        enabled: data.laybyEnabled || false,
        globalMinimumProductValue: parseFloat(data.laybyGlobalMinimumProductValue) || 0,
        defaultExpiryDays: parseInt(data.laybyDefaultExpiryDays) || 90,
        autoCancelOnExpiry: data.laybyAutoCancelOnExpiry !== false,
        sendEmailReminders: data.laybySendEmailReminders !== false,
        termsAndConditions: data.laybyTermsAndConditions || '',
        applicationEmail: data.laybyApplicationEmail || 'hello@pesashop.com',
        widgetEnabled: data.laybyWidgetEnabled !== false,
        widgetButtonText: data.laybyWidgetButtonText || 'GET IT ON LAYBY',
      },
      socialLogin: {
        google: {
          enabled: data.socialLoginGoogleEnabled || false,
          clientId: data.socialLoginGoogleClientId || '',
          clientSecret: data.socialLoginGoogleClientSecret || '',
        },
        facebook: {
          enabled: data.socialLoginFacebookEnabled || false,
          appId: data.socialLoginFacebookAppId || '',
          appSecret: data.socialLoginFacebookAppSecret || '',
        },
      },
      productDisplay: {
        detailPage: {
          titleLines: parseInt(data['productDisplay.detailPage.titleLines']) || 0,
          descriptionLines: parseInt(data['productDisplay.detailPage.descriptionLines']) || 0,
          shortDescriptionLines: parseInt(data['productDisplay.detailPage.shortDescriptionLines']) || 0,
          reviewLines: parseInt(data['productDisplay.detailPage.reviewLines']) || 0,
        },
        otherLocations: {
          titleLines: parseInt(data['productDisplay.otherLocations.titleLines']) || 0,
          descriptionLines: parseInt(data['productDisplay.otherLocations.descriptionLines']) || 0,
          shortDescriptionLines: parseInt(data['productDisplay.otherLocations.shortDescriptionLines']) || 0,
          reviewLines: parseInt(data['productDisplay.otherLocations.reviewLines']) || 0,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Information */}
        <Card title="Store Information">
          <div className="space-y-4">
            <Input
              label="Store Name"
              {...register('storeName', { required: true })}
              error={errors.storeName && 'Required'}
              fullWidth
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Store Email"
                type="email"
                {...register('storeEmail', { required: true })}
                error={errors.storeEmail && 'Required'}
                fullWidth
              />
              <Input
                label="Store Phone"
                type="tel"
                {...register('storePhone')}
                fullWidth
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Store Address</label>
              <textarea
                {...register('storeAddress')}
                rows={3}
                className="input w-full resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Regional Settings */}
        <Card title="Regional Settings">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Currency</label>
              <select {...register('currency')} className="input w-full">
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Zone</label>
              <select {...register('timeZone')} className="input w-full">
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Format</label>
              <select {...register('dateFormat')} className="input w-full">
                <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              </select>
            </div>
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              {...register('taxRate', { required: true })}
              error={errors.taxRate && 'Required'}
              fullWidth
            />
          </div>
        </Card>

        {/* Email Settings */}
        <Card title="Email Settings">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-gray-700">
                Email configuration is managed in your backend .env file. Update SMTP settings there.
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm font-medium">Send order confirmation emails</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm font-medium">Send shipping notification emails</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm font-medium">Send laybye payment reminders</span>
              </label>
            </div>
          </div>
        </Card>

        {/* AI Configuration */}
        <Card title="AI Configuration">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <IoSparkles className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">OpenAI API Key</p>
                  <p className="text-xs text-blue-700">
                    Enter your OpenAI API key to enable AI-powered product description generation. 
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                OpenAI API Key
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  {...register('openaiApiKey')}
                  placeholder="sk-..."
                  fullWidth
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {watch('openaiApiKey') ? 'API key is configured' : 'API key is required for AI features'}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  {...register('aiEnabled')}
                />
                <span className="text-sm font-medium">Enable AI Description Generation</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, you can use AI to generate product descriptions automatically
              </p>
            </div>
          </div>
        </Card>

        {/* Product Display - Text Clamping */}
        <Card title="Product Display - Text Clamping">
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Control how many lines of text are shown before truncating. Set to <strong>0</strong> for no limit (show all text).
            </p>

            {/* Product Detail Page */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Product Detail Page</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title Lines</label>
                  <select {...register('productDisplay.detailPage.titleLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description Lines</label>
                  <select {...register('productDisplay.detailPage.descriptionLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Short Description Lines</label>
                  <select {...register('productDisplay.detailPage.shortDescriptionLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Review Lines</label>
                  <select {...register('productDisplay.detailPage.reviewLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Other Locations */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Other Locations (Grids, Lists, Archives, Search)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title Lines</label>
                  <select {...register('productDisplay.otherLocations.titleLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description Lines</label>
                  <select {...register('productDisplay.otherLocations.descriptionLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Short Description Lines</label>
                  <select {...register('productDisplay.otherLocations.shortDescriptionLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Review Lines</label>
                  <select {...register('productDisplay.otherLocations.reviewLines')} className="input w-full text-sm">
                    <option value="0">No limit</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} line{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Layby Settings */}
        <Card title="Layby Settings">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('laybyEnabled')}
                className="checkbox checkbox-primary"
              />
              <label className="text-sm font-medium">Enable Layby Payments</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Global Minimum Product Value (R)</label>
              <Input
                type="number"
                {...register('laybyGlobalMinimumProductValue')}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">0 = no global minimum (use plan-specific minimums)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Expiry Days</label>
              <Input
                type="number"
                {...register('laybyDefaultExpiryDays')}
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Default expiry days for laybyes (0 = no expiry)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('laybyAutoCancelOnExpiry')}
                className="checkbox checkbox-primary"
              />
              <label className="text-sm font-medium">Auto-cancel laybyes on expiry</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('laybySendEmailReminders')}
                className="checkbox checkbox-primary"
              />
              <label className="text-sm font-medium">Send email reminders for payments</label>
            </div>

            <hr className="my-4" />
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Layby Widget & Applications</h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('laybyWidgetEnabled')}
                className="checkbox checkbox-primary"
              />
              <label className="text-sm font-medium">Show "Get It On Layby" widget on product pages</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Widget Button Text</label>
              <Input
                {...register('laybyWidgetButtonText')}
                placeholder="GET IT ON LAYBY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Application Notification Email</label>
              <Input
                type="email"
                {...register('laybyApplicationEmail')}
                placeholder="hello@pesashop.com"
              />
              <p className="text-xs text-gray-500 mt-1">Layby applications and ID documents will be sent to this email</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
              <textarea
                {...register('laybyTermsAndConditions')}
                rows={8}
                className="input w-full resize-y"
                placeholder="Enter your layby terms and conditions here. This will be shown to customers before they apply for a layby."
              />
              <p className="text-xs text-gray-500 mt-1">Displayed in the layby application modal on product pages</p>
            </div>
          </div>
        </Card>

        {/* Bank Details for EFT Payments */}
        <Card title="Bank Details (EFT Payments)">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Add your bank account details here. These will be shown to customers who choose EFT as their payment method for layby installments.
            </p>
            {bankDetails.map((bank, idx) => (
              <div key={idx} className="p-4 border-2 border-gray-200 rounded-lg space-y-3 relative">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-gray-700">Account {idx + 1}</h4>
                  <button
                    type="button"
                    onClick={() => setBankDetails(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <IoTrash size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Bank Name *</label>
                    <Input
                      value={bank.bankName}
                      onChange={(e) => setBankDetails(prev => prev.map((b, i) => i === idx ? { ...b, bankName: e.target.value } : b))}
                      placeholder="e.g. FNB, Standard Bank"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Account Name</label>
                    <Input
                      value={bank.accountName}
                      onChange={(e) => setBankDetails(prev => prev.map((b, i) => i === idx ? { ...b, accountName: e.target.value } : b))}
                      placeholder="Business name"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Account Number *</label>
                    <Input
                      value={bank.accountNumber}
                      onChange={(e) => setBankDetails(prev => prev.map((b, i) => i === idx ? { ...b, accountNumber: e.target.value } : b))}
                      placeholder="Account number"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Branch Code</label>
                    <Input
                      value={bank.branchCode}
                      onChange={(e) => setBankDetails(prev => prev.map((b, i) => i === idx ? { ...b, branchCode: e.target.value } : b))}
                      placeholder="e.g. 250655"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Account Type</label>
                    <Input
                      value={bank.accountType}
                      onChange={(e) => setBankDetails(prev => prev.map((b, i) => i === idx ? { ...b, accountType: e.target.value } : b))}
                      placeholder="e.g. Cheque, Savings"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Reference Instructions</label>
                    <Input
                      value={bank.reference}
                      onChange={(e) => setBankDetails(prev => prev.map((b, i) => i === idx ? { ...b, reference: e.target.value } : b))}
                      placeholder="e.g. Use order number as reference"
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBankDetails(prev => [...prev, { ...EMPTY_BANK }])}
            >
              <IoAdd size={18} className="mr-2" />
              Add Bank Account
            </Button>
          </div>
        </Card>

        {/* Social Login */}
        <Card title="Social Login">
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Enable social login to allow customers to sign in with their Google or Facebook accounts.
            </p>

            {/* Google */}
            <div className="p-4 border-2 border-gray-200 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <h3 className="font-semibold text-sm">Google Login</h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" {...register('socialLoginGoogleEnabled')} />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client ID</label>
                  <Input {...register('socialLoginGoogleClientId')} placeholder="xxxx.apps.googleusercontent.com" fullWidth />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Client Secret</label>
                  <div className="relative">
                    <Input type={showGoogleSecret ? 'text' : 'password'} {...register('socialLoginGoogleClientSecret')} placeholder="GOCSPX-..." fullWidth className="pr-10" />
                    <button type="button" onClick={() => setShowGoogleSecret(!showGoogleSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showGoogleSecret ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Create credentials at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>. 
                Add your domain to Authorized JavaScript origins and <code className="bg-gray-100 px-1 rounded">/api/auth/google/callback</code> to Authorized redirect URIs.
              </p>
            </div>

            {/* Facebook */}
            <div className="p-4 border-2 border-gray-200 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <h3 className="font-semibold text-sm">Facebook Login</h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" {...register('socialLoginFacebookEnabled')} />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">App ID</label>
                  <Input {...register('socialLoginFacebookAppId')} placeholder="123456789012345" fullWidth />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">App Secret</label>
                  <div className="relative">
                    <Input type={showFacebookSecret ? 'text' : 'password'} {...register('socialLoginFacebookAppSecret')} placeholder="abc123def456..." fullWidth className="pr-10" />
                    <button type="button" onClick={() => setShowFacebookSecret(!showFacebookSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showFacebookSecret ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Create an app at <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta for Developers</a>. 
                Add Facebook Login product and set <code className="bg-gray-100 px-1 rounded">/api/auth/facebook/callback</code> as a Valid OAuth Redirect URI.
              </p>
            </div>
          </div>
        </Card>

        {/* Advanced Settings */}
        <Card title="Advanced Settings">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  {...register('enableGuestCheckout')}
                />
                <span className="text-sm font-medium">Enable guest checkout</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  {...register('enableProductReviews')}
                />
                <span className="text-sm font-medium">Enable product reviews</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  {...register('showStockQuantities')}
                />
                <span className="text-sm font-medium">Show stock quantities</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  {...register('allowBackorders')}
                />
                <span className="text-sm font-medium">Allow backorders</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" loading={saveMutation.isLoading}>
            <IoSave size={20} className="mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
