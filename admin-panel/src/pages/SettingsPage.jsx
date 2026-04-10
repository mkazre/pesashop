import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { settingsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoSave, IoSparkles, IoEye, IoEyeOff, IoAdd, IoTrash, IoMail, IoSend } from 'react-icons/io5';

const EMPTY_BANK = { bankName: '', accountName: '', accountNumber: '', branchCode: '', accountType: '', reference: '' };

const SettingsPage = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showFacebookSecret, setShowFacebookSecret] = useState(false);
  const [bankDetails, setBankDetails] = useState([]);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailConfigStatus, setEmailConfigStatus] = useState(null);
  const [brevoKeyConfigured, setBrevoKeyConfigured] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    shouldUnregister: false,
    defaultValues: {
      storeName: '',
      storeEmail: '',
      storePhone: '',
      storeAddress: '',
      taxRate: '15',
      currency: 'ZAR',
      dateFormat: 'dd/MM/yyyy',
      timeZone: 'Africa/Johannesburg',
      // Email
      emailProvider: 'smtp',
      brevoApiKey: '',
      // SMTP
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: '',
      fromName: '',
      replyToEmail: '',
      // Email Notification Toggles
      'emailNotifications.orderConfirmation': true,
      'emailNotifications.orderShipped': true,
      'emailNotifications.orderDelivered': true,
      'emailNotifications.orderCancelled': true,
      'emailNotifications.orderRefunded': true,
      'emailNotifications.orderNote': true,
      'emailNotifications.laybyeApplicationReceived': true,
      'emailNotifications.laybyeApplicationApproved': true,
      'emailNotifications.laybyeApplicationRejected': true,
      'emailNotifications.laybyeCreated': true,
      'emailNotifications.laybyePaymentReceived': true,
      'emailNotifications.laybyeCompleted': true,
      'emailNotifications.laybyeReminder': true,
      'emailNotifications.laybyeOverdueReminder': true,
      'emailNotifications.laybyeExpiryReminder': true,
      'emailNotifications.newAccount': true,
      'emailNotifications.passwordReset': true,
      'emailNotifications.loyaltyPointsEarned': true,
      'emailNotifications.loyaltyPointsRedeemed': true,
      'emailNotifications.giftCardIssued': true,
      'emailNotifications.couponFirstPurchase': true,
      'emailNotifications.couponNewUser': true,
      'emailNotifications.couponSpendingMilestone': true,
      'emailNotifications.couponBirthday': true,
      'emailNotifications.reviewReminder': true,
      'emailNotifications.adminNewOrder': true,
      'emailNotifications.adminLowStock': true,
      'emailNotifications.adminNewLaybyeApplication': true,
      // AI
      openaiApiKey: '',
      deepseekApiKey: '',
      anthropicApiKey: '',
      aiEnabled: false,
      aiFallbackProvider: 'openai',
      aiWebSearchEnabled: false,
      aiWebSearchApiKey: '',
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
      socialLoginGoogleMobileClientId: '',
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
        const n = settings.emailNotifications || {};
        reset({
          storeName: settings.storeName || '',
          storeEmail: settings.storeEmail || '',
          storePhone: settings.storePhone || '',
          storeAddress: settings.storeAddress || '',
          taxRate: settings.taxRate?.toString() || '15',
          currency: settings.currency || 'ZAR',
          dateFormat: settings.dateFormat || 'dd/MM/yyyy',
          timeZone: settings.timeZone || 'Africa/Johannesburg',
          // Email
          emailProvider: settings.emailProvider || 'smtp',
          brevoApiKey: (settings.brevoApiKey && settings.brevoApiKey !== '***configured***') ? settings.brevoApiKey : '',
          // SMTP
          smtpHost: settings.smtpHost || '',
          smtpPort: String(settings.smtpPort || 587),
          smtpUser: settings.smtpUser || '',
          smtpPassword: settings.smtpPassword === '***configured***' ? '' : (settings.smtpPassword || ''),
          smtpSecure: settings.smtpSecure || false,
          fromEmail: settings.fromEmail || '',
          fromName: settings.fromName || '',
          replyToEmail: settings.replyToEmail || '',
          // Email Notification Toggles
          'emailNotifications.orderConfirmation': n.orderConfirmation !== false,
          'emailNotifications.orderShipped': n.orderShipped !== false,
          'emailNotifications.orderDelivered': n.orderDelivered !== false,
          'emailNotifications.orderCancelled': n.orderCancelled !== false,
          'emailNotifications.orderRefunded': n.orderRefunded !== false,
          'emailNotifications.orderNote': n.orderNote !== false,
          'emailNotifications.laybyeApplicationReceived': n.laybyeApplicationReceived !== false,
          'emailNotifications.laybyeApplicationApproved': n.laybyeApplicationApproved !== false,
          'emailNotifications.laybyeApplicationRejected': n.laybyeApplicationRejected !== false,
          'emailNotifications.laybyeCreated': n.laybyeCreated !== false,
          'emailNotifications.laybyePaymentReceived': n.laybyePaymentReceived !== false,
          'emailNotifications.laybyeCompleted': n.laybyeCompleted !== false,
          'emailNotifications.laybyeReminder': n.laybyeReminder !== false,
          'emailNotifications.laybyeOverdueReminder': n.laybyeOverdueReminder !== false,
          'emailNotifications.laybyeExpiryReminder': n.laybyeExpiryReminder !== false,
          'emailNotifications.newAccount': n.newAccount !== false,
          'emailNotifications.passwordReset': n.passwordReset !== false,
          'emailNotifications.loyaltyPointsEarned': n.loyaltyPointsEarned !== false,
          'emailNotifications.loyaltyPointsRedeemed': n.loyaltyPointsRedeemed !== false,
          'emailNotifications.giftCardIssued': n.giftCardIssued !== false,
          'emailNotifications.couponFirstPurchase': n.couponFirstPurchase !== false,
          'emailNotifications.couponNewUser': n.couponNewUser !== false,
          'emailNotifications.couponSpendingMilestone': n.couponSpendingMilestone !== false,
          'emailNotifications.couponBirthday': n.couponBirthday !== false,
          'emailNotifications.reviewReminder': n.reviewReminder !== false,
          'emailNotifications.adminNewOrder': n.adminNewOrder !== false,
          'emailNotifications.adminLowStock': n.adminLowStock !== false,
          'emailNotifications.adminNewLaybyeApplication': n.adminNewLaybyeApplication !== false,
          // AI
          openaiApiKey: settings.openaiApiKey === '***configured***' ? '' : (settings.openaiApiKey || ''),
          deepseekApiKey: settings.deepseekApiKey === '***configured***' ? '' : (settings.deepseekApiKey || ''),
          anthropicApiKey: settings.anthropicApiKey === '***configured***' ? '' : (settings.anthropicApiKey || ''),
          aiEnabled: settings.aiEnabled || false,
          aiFallbackProvider: settings.aiFallbackProvider || 'openai',
          aiWebSearchEnabled: settings.aiWebSearchEnabled || false,
          aiWebSearchApiKey: settings.aiWebSearchApiKey === '***configured***' ? '' : (settings.aiWebSearchApiKey || ''),
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
          socialLoginGoogleMobileClientId: settings.socialLogin?.google?.mobileClientId || '',
          socialLoginFacebookEnabled: settings.socialLogin?.facebook?.enabled || false,
          socialLoginFacebookAppId: settings.socialLogin?.facebook?.appId || '',
          socialLoginFacebookAppSecret: settings.socialLogin?.facebook?.appSecret === '***configured***' ? '' : (settings.socialLogin?.facebook?.appSecret || ''),
        });
        setBankDetails(settings.bankDetails || []);
        setBrevoKeyConfigured(settings.brevoApiKey === '***configured***');
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

  const handleTestEmail = async () => {
    if (!testEmailAddress) { toast.error('Enter an email address'); return; }
    setTestingEmail(true);
    try {
      const res = await settingsAPI.testEmail(testEmailAddress);
      toast.success(res.data?.message || 'Test email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally { setTestingEmail(false); }
  };

  const handleVerifyEmailConfig = async () => {
    setVerifyingEmail(true);
    setEmailConfigStatus(null);
    try {
      const res = await settingsAPI.verifyEmailConfig();
      setEmailConfigStatus(res.data?.data || { status: 'unknown', issues: ['Unexpected response'] });
    } catch (err) {
      setEmailConfigStatus({ status: 'error', issues: [err.response?.data?.message || 'Failed to verify'] });
    } finally { setVerifyingEmail(false); }
  };

  const onSubmit = (data) => {
    // Remove flat dot-notation keys that react-hook-form creates for nested fields
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      if (key.startsWith('productDisplay.') || key.startsWith('layby') || key.startsWith('socialLogin') || key.startsWith('emailNotifications.')) {
        delete cleanData[key];
      }
    });
    saveMutation.mutate({
      ...cleanData,
      taxRate: parseFloat(data.taxRate),
      // Email provider
      emailProvider: data.emailProvider || 'smtp',
      ...(data.brevoApiKey && data.brevoApiKey.length > 20 ? { brevoApiKey: data.brevoApiKey } : {}),
      // SMTP
      smtpHost: data.smtpHost || '',
      smtpPort: parseInt(data.smtpPort) || 587,
      smtpUser: data.smtpUser || '',
      smtpPassword: data.smtpPassword || '',
      smtpSecure: data.smtpSecure || false,
      fromEmail: data.fromEmail || '',
      fromName: data.fromName || '',
      replyToEmail: data.replyToEmail || '',
      // Email Notification Toggles
      emailNotifications: {
        orderConfirmation: data['emailNotifications.orderConfirmation'] !== false,
        orderShipped: data['emailNotifications.orderShipped'] !== false,
        orderDelivered: data['emailNotifications.orderDelivered'] !== false,
        orderCancelled: data['emailNotifications.orderCancelled'] !== false,
        orderRefunded: data['emailNotifications.orderRefunded'] !== false,
        orderNote: data['emailNotifications.orderNote'] !== false,
        laybyeApplicationReceived: data['emailNotifications.laybyeApplicationReceived'] !== false,
        laybyeApplicationApproved: data['emailNotifications.laybyeApplicationApproved'] !== false,
        laybyeApplicationRejected: data['emailNotifications.laybyeApplicationRejected'] !== false,
        laybyeCreated: data['emailNotifications.laybyeCreated'] !== false,
        laybyePaymentReceived: data['emailNotifications.laybyePaymentReceived'] !== false,
        laybyeCompleted: data['emailNotifications.laybyeCompleted'] !== false,
        laybyeReminder: data['emailNotifications.laybyeReminder'] !== false,
        laybyeOverdueReminder: data['emailNotifications.laybyeOverdueReminder'] !== false,
        laybyeExpiryReminder: data['emailNotifications.laybyeExpiryReminder'] !== false,
        newAccount: data['emailNotifications.newAccount'] !== false,
        passwordReset: data['emailNotifications.passwordReset'] !== false,
        loyaltyPointsEarned: data['emailNotifications.loyaltyPointsEarned'] !== false,
        loyaltyPointsRedeemed: data['emailNotifications.loyaltyPointsRedeemed'] !== false,
        giftCardIssued: data['emailNotifications.giftCardIssued'] !== false,
        couponFirstPurchase: data['emailNotifications.couponFirstPurchase'] !== false,
        couponNewUser: data['emailNotifications.couponNewUser'] !== false,
        couponSpendingMilestone: data['emailNotifications.couponSpendingMilestone'] !== false,
        couponBirthday: data['emailNotifications.couponBirthday'] !== false,
        reviewReminder: data['emailNotifications.reviewReminder'] !== false,
        adminNewOrder: data['emailNotifications.adminNewOrder'] !== false,
        adminLowStock: data['emailNotifications.adminLowStock'] !== false,
        adminNewLaybyeApplication: data['emailNotifications.adminNewLaybyeApplication'] !== false,
      },
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
          mobileClientId: data.socialLoginGoogleMobileClientId || '',
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
            {/* Provider selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${watch('emailProvider') === 'brevo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value="brevo" {...register('emailProvider')} className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">Brevo (Recommended)</div>
                    <div className="text-xs text-gray-500">300 emails/day free. Works on all cloud hosts.</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${watch('emailProvider') === 'smtp' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value="smtp" {...register('emailProvider')} className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">Custom SMTP</div>
                    <div className="text-xs text-gray-500">Use your own SMTP server (cPanel, Gmail, etc.)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Brevo settings */}
            {watch('emailProvider') === 'brevo' && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  <strong>Setup:</strong> Sign up at <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">brevo.com</a> → Go to <strong>Settings → SMTP & API → API Keys</strong> → Generate or copy your <strong>v3 API Key</strong> below. Emails are sent via HTTPS (port 443), so it works on all cloud hosts.
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brevo API Key</label>
                  <Input
                    type="text"
                    autoComplete="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    {...register('brevoApiKey')}
                    placeholder={brevoKeyConfigured ? '(already saved — leave blank to keep current key)' : 'xkeysib-xxxxx...'}
                    fullWidth
                  />
                  {brevoKeyConfigured && !watch('brevoApiKey') && (
                    <p className="text-xs text-green-600 mt-1">✓ API key is saved. Leave blank to keep the existing key, or enter a new one to replace it.</p>
                  )}
                </div>
              </div>
            )}

            {/* Custom SMTP settings */}
            {watch('emailProvider') === 'smtp' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <IoMail className="inline mr-1" size={16} />
                  Configure your SMTP server. <strong>Tip:</strong> Use port <strong>587</strong> with SSL/TLS. Port 465 may be blocked by cloud providers.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="SMTP Host" {...register('smtpHost')} placeholder="mail.yourdomain.com" fullWidth />
                  <Input label="SMTP Port" type="number" {...register('smtpPort')} placeholder="587" fullWidth />
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4" {...register('smtpSecure')} />
                      <span className="text-sm font-medium">Use SSL/TLS</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="SMTP Username" {...register('smtpUser')} placeholder="your@email.com" fullWidth />
                  <div>
                    <label className="block text-sm font-medium mb-1">SMTP Password</label>
                    <div className="relative">
                      <Input type={showSmtpPassword ? 'text' : 'password'} {...register('smtpPassword')} placeholder="App password or SMTP password" fullWidth className="pr-10" />
                      <button type="button" onClick={() => setShowSmtpPassword(!showSmtpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {showSmtpPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* From / Reply-to — shared by both providers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="From Name" {...register('fromName')} placeholder="PesaShop" fullWidth />
              <Input label="From Email" type="email" {...register('fromEmail')} placeholder="noreply@yourdomain.com" fullWidth />
              <Input label="Reply-To Email" type="email" {...register('replyToEmail')} placeholder="support@yourdomain.com" fullWidth />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">Test Email Configuration</h4>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Send test email to"
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="your@email.com"
                    fullWidth
                  />
                </div>
                <Button type="button" variant="secondary" onClick={handleTestEmail} loading={testingEmail}>
                  <IoSend size={16} className="mr-1" />
                  Send Test
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Save your settings first, then send a test email to verify the SMTP configuration works.</p>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">Verify Email Configuration</h4>
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={handleVerifyEmailConfig} loading={verifyingEmail}>
                  <IoMail size={16} className="mr-1" />
                  Verify Config
                </Button>
                {emailConfigStatus && (
                  <div className={`flex-1 p-3 rounded text-sm ${emailConfigStatus.status === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    {emailConfigStatus.status === 'ok' ? (
                      <span>✅ SMTP connection successful — Host: {emailConfigStatus.config?.host}:{emailConfigStatus.config?.port}</span>
                    ) : (
                      <div>
                        <span className="font-semibold">❌ Issues found:</span>
                        <ul className="list-disc ml-5 mt-1">
                          {emailConfigStatus.issues?.map((issue, i) => <li key={i}>{issue}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Email Notification Toggles */}
        <Card title="Email Notifications">
          <div className="space-y-6">
            <p className="text-sm text-gray-500">Choose which emails are sent automatically. Disabling a notification here will prevent it from being sent even if a template exists.</p>

            {/* Order Notifications */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Order Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['emailNotifications.orderConfirmation', 'Order Confirmation', 'Sent when a new order is placed'],
                  ['emailNotifications.orderShipped', 'Order Shipped', 'Sent when order is marked as shipped'],
                  ['emailNotifications.orderDelivered', 'Order Delivered', 'Sent when order is marked as delivered'],
                  ['emailNotifications.orderCancelled', 'Order Cancelled', 'Sent when order is cancelled'],
                  ['emailNotifications.orderRefunded', 'Order Refunded', 'Sent when a refund is processed'],
                  ['emailNotifications.orderNote', 'Order Note', 'Sent when a note is added to an order'],
                ].map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mt-0.5" {...register(key)} />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Laybye Notifications */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Laybye Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['emailNotifications.laybyeApplicationReceived', 'Application Received', 'Confirmation sent to customer on new application'],
                  ['emailNotifications.laybyeApplicationApproved', 'Application Approved', 'Sent when application is approved'],
                  ['emailNotifications.laybyeApplicationRejected', 'Application Rejected', 'Sent when application is rejected'],
                  ['emailNotifications.laybyeCreated', 'Laybye Created', 'Sent when a laybye plan is set up'],
                  ['emailNotifications.laybyePaymentReceived', 'Payment Received', 'Sent when a laybye payment is recorded'],
                  ['emailNotifications.laybyeCompleted', 'Laybye Completed', 'Sent when all payments are complete'],
                  ['emailNotifications.laybyeReminder', 'Payment Reminder', 'Upcoming payment reminder'],
                  ['emailNotifications.laybyeOverdueReminder', 'Overdue Reminder', 'Sent when payment is overdue'],
                  ['emailNotifications.laybyeExpiryReminder', 'Expiry Reminder', 'Sent when laybye is about to expire'],
                ].map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mt-0.5" {...register(key)} />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Account & Auth Notifications */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Account & Auth</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['emailNotifications.newAccount', 'Welcome Email', 'Sent to new customers on registration'],
                  ['emailNotifications.passwordReset', 'Password Reset', 'Sent when password reset is requested'],
                ].map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mt-0.5" {...register(key)} />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Loyalty, Coupons & Gift Cards */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Loyalty, Coupons & Gift Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['emailNotifications.loyaltyPointsEarned', 'Points Earned', 'Sent when loyalty points are awarded'],
                  ['emailNotifications.loyaltyPointsRedeemed', 'Points Redeemed', 'Sent when loyalty points are used'],
                  ['emailNotifications.giftCardIssued', 'Gift Card Issued', 'Sent to gift card recipient'],
                  ['emailNotifications.couponFirstPurchase', 'Coupon — First Purchase', 'Sent after first purchase'],
                  ['emailNotifications.couponNewUser', 'Coupon — New User', 'Sent to new registrations'],
                  ['emailNotifications.couponSpendingMilestone', 'Coupon — Spending Milestone', 'Sent on spending milestones'],
                  ['emailNotifications.couponBirthday', 'Coupon — Birthday', 'Sent on customer birthday'],
                ].map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mt-0.5" {...register(key)} />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reviews & Admin */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Reviews & Admin</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['emailNotifications.reviewReminder', 'Review Reminder', 'Prompt customers to review purchases'],
                  ['emailNotifications.adminNewOrder', 'Admin — New Order', 'Notify admin of new orders'],
                  ['emailNotifications.adminLowStock', 'Admin — Low Stock', 'Notify admin of low stock items'],
                  ['emailNotifications.adminNewLaybyeApplication', 'Admin — New Laybye Application', 'Notify admin of new laybye applications'],
                ].map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mt-0.5" {...register(key)} />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* AI Configuration */}
        <Card title="AI Configuration">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <IoSparkles className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">AI Assistant Configuration</p>
                  <p className="text-xs text-blue-700">
                    Configure multiple AI providers for the product Q&A assistant. 
                    The system will use providers in order if one fails.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  {...register('aiEnabled')}
                />
                <span className="text-sm font-medium">Enable AI Assistant</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Enable the AI product assistant for customer questions
              </p>
            </div>

            {/* OpenAI */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                OpenAI (GPT-3.5)
              </h4>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
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
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
                </p>
              </div>
            </div>

            {/* DeepSeek */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                DeepSeek (Cost-Effective Alternative)
              </h4>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <Input
                  type="password"
                  {...register('deepseekApiKey')}
                  placeholder="Your DeepSeek API key"
                  fullWidth
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline">DeepSeek Platform</a>
                </p>
              </div>
            </div>

            {/* Anthropic */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                Anthropic Claude
              </h4>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <Input
                  type="password"
                  {...register('anthropicApiKey')}
                  placeholder="sk-ant-..."
                  fullWidth
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>
                </p>
              </div>
            </div>

            {/* Fallback Provider */}
            <div>
              <label className="block text-sm font-medium mb-1">Fallback Provider</label>
              <select {...register('aiFallbackProvider')} className="input w-full">
                <option value="openai">OpenAI (Default)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Which provider to use as the primary option
              </p>
            </div>

            {/* Web Search */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Web Search Integration</h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4" 
                      {...register('aiWebSearchEnabled')}
                    />
                    <span className="text-sm font-medium">Enable Web Search</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Allow AI to search the web for up-to-date product information
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Web Search API Key</label>
                  <Input
                    type="password"
                    {...register('aiWebSearchApiKey')}
                    placeholder="Search API key (SerpApi, Google, etc.)"
                    fullWidth
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: For enhanced web search capabilities
                  </p>
                </div>
              </div>
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
                  <label className="block text-sm font-medium mb-1">Web Client ID</label>
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
              <div>
                <label className="block text-sm font-medium mb-1">Mobile App Client ID <span className="text-xs text-gray-400 font-normal">(Android / iOS OAuth credential)</span></label>
                <Input {...register('socialLoginGoogleMobileClientId')} placeholder="xxxx.apps.googleusercontent.com" fullWidth />
                <p className="text-xs text-gray-400 mt-1">Create a separate Android or iOS OAuth 2.0 credential in Google Cloud Console for the mobile app. Leave blank to fall back to the Web Client ID.</p>
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
