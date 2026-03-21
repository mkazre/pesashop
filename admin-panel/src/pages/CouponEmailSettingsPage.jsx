import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { couponsAPI, emailsAPI, productsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoSave, IoAdd, IoTrash, IoMail, IoCheckmarkCircle } from 'react-icons/io5';

const CouponEmailSettingsPage = () => {
  const queryClient = useQueryClient();
  
  // Default settings
  const defaultSettings = {
    enabled: true,
    templates: {},
    automations: {
      firstPurchase: { enabled: false, delayHours: 0 },
      newUser: { enabled: false, delayHours: 0 },
      spendingMilestone: { enabled: false, milestones: [] },
      orderCount: { enabled: false, milestones: [] },
      productPurchase: { enabled: false, rules: [] },
      birthday: { enabled: false, sendDaysBefore: 0 },
      daysSinceLastPurchase: { enabled: false, days: 30, sendOnce: false }
    },
    checkout: {
      allowAcceptReject: false,
      showCouponInCheckout: true
    }
  };
  
  const [settings, setSettings] = useState(defaultSettings);
  const [testEmailModal, setTestEmailModal] = useState(false);

  const { data, isLoading, error } = useQuery(
    'coupon-email-settings',
    () => couponsAPI.getEmailSettings(),
    {
      onSuccess: (response) => {
        const settingsData = response.data?.data || response.data;
        setSettings(settingsData || {
          enabled: true,
          templates: {},
          automations: {
            firstPurchase: { enabled: false, delayHours: 0 },
            newUser: { enabled: false, delayHours: 0 },
            spendingMilestone: { enabled: false, milestones: [] },
            orderCount: { enabled: false, milestones: [] },
            productPurchase: { enabled: false, rules: [] },
            birthday: { enabled: false, sendDaysBefore: 0 },
            daysSinceLastPurchase: { enabled: false, days: 30, sendOnce: false }
          },
          checkout: {
            allowAcceptReject: false,
            showCouponInCheckout: true
          }
        });
      },
      onError: (error) => {
        console.error('Error loading coupon email settings:', error);
        // Set default settings if API fails
        setSettings({
          enabled: true,
          templates: {},
          automations: {
            firstPurchase: { enabled: false, delayHours: 0 },
            newUser: { enabled: false, delayHours: 0 },
            spendingMilestone: { enabled: false, milestones: [] },
            orderCount: { enabled: false, milestones: [] },
            productPurchase: { enabled: false, rules: [] },
            birthday: { enabled: false, sendDaysBefore: 0 },
            daysSinceLastPurchase: { enabled: false, days: 30, sendOnce: false }
          },
          checkout: {
            allowAcceptReject: false,
            showCouponInCheckout: true
          }
        });
      },
      retry: false
    }
  );

  const { data: couponsData } = useQuery(
    'coupons-for-email',
    () => couponsAPI.getAll({ limit: 1000 }),
    { 
      enabled: !!settings,
      retry: false,
      refetchOnWindowFocus: false,
      onError: () => {
        // Silently fail - we'll just show empty dropdowns
      }
    }
  );

  const { data: emailTemplatesData } = useQuery(
    'email-templates-for-coupons',
    () => emailsAPI.getAll(),
    { 
      enabled: !!settings,
      retry: false,
      refetchOnWindowFocus: false,
      onError: () => {
        // Silently fail - we'll just show empty dropdowns
      }
    }
  );

  const { data: productsData } = useQuery(
    'products-for-coupon-rules',
    () => productsAPI.getAll({ limit: 1000 }),
    { 
      enabled: !!settings,
      retry: false,
      refetchOnWindowFocus: false,
      onError: () => {
        // Silently fail - we'll just show empty dropdowns
      }
    }
  );

  const updateMutation = useMutation(
    (data) => couponsAPI.updateEmailSettings(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupon-email-settings');
        toast.success('Settings saved successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
      },
    }
  );

  const testEmailMutation = useMutation(
    (data) => couponsAPI.sendTestEmail(data),
    {
      onSuccess: () => {
        toast.success('Test email sent successfully');
        setTestEmailModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send test email');
      },
    }
  );

  const handleSave = () => {
    if (!settings) return;
    updateMutation.mutate(settings);
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const addArrayItem = (path, item = {}) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      if (!current[keys[keys.length - 1]]) current[keys[keys.length - 1]] = [];
      current[keys[keys.length - 1]].push(item);
      return newSettings;
    });
  };

  const removeArrayItem = (path, index) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]].splice(index, 1);
      return newSettings;
    });
  };

  // Only show loading if we don't have settings yet (shouldn't happen since we initialize with defaults)
  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const coupons = couponsData?.data?.data || couponsData?.data || [];
  const emailTemplates = emailTemplatesData?.data?.data || emailTemplatesData?.data || [];
  const products = productsData?.data?.data || productsData?.data || [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <IoCheckmarkCircle className="text-yellow-600" size={20} />
            <div>
              <p className="text-sm font-medium text-yellow-800">Backend server not connected</p>
              <p className="text-xs text-yellow-700">Settings are shown with default values. Start the backend server to load saved settings.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupon Email Settings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setTestEmailModal(true)}
          >
            <IoMail size={18} className="mr-2" />
            Send Test Email
          </Button>
          <Button onClick={handleSave} loading={updateMutation.isLoading}>
            <IoSave size={18} className="mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card title="General Settings">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enabled || false}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Enable Coupon Email System</label>
          </div>
        </div>
      </Card>

      {/* Email Templates */}
      <Card title="Email Templates">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Select email templates for different coupon scenarios. These templates will be used when sending coupon emails to customers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Purchase Template</label>
              <select
                value={settings.templates?.firstPurchase || ''}
                onChange={(e) => updateSetting('templates.firstPurchase', e.target.value || null)}
                className="input w-full"
              >
                <option value="">Use Default</option>
                {emailTemplates
                  .filter(t => t.type === 'coupon_first_purchase' || t.type === 'promotional')
                  .map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New User Template</label>
              <select
                value={settings.templates?.newUser || ''}
                onChange={(e) => updateSetting('templates.newUser', e.target.value || null)}
                className="input w-full"
              >
                <option value="">Use Default</option>
                {emailTemplates
                  .filter(t => t.type === 'coupon_new_user' || t.type === 'promotional')
                  .map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Spending Milestone Template</label>
              <select
                value={settings.templates?.spendingMilestone || ''}
                onChange={(e) => updateSetting('templates.spendingMilestone', e.target.value || null)}
                className="input w-full"
              >
                <option value="">Use Default</option>
                {emailTemplates
                  .filter(t => t.type === 'coupon_spending_milestone' || t.type === 'promotional')
                  .map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Birthday Template</label>
              <select
                value={settings.templates?.birthday || ''}
                onChange={(e) => updateSetting('templates.birthday', e.target.value || null)}
                className="input w-full"
              >
                <option value="">Use Default</option>
                {emailTemplates
                  .filter(t => t.type === 'coupon_birthday' || t.type === 'promotional')
                  .map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Automation Rules */}
      <Card title="Automation Rules">
        <div className="space-y-6">
          {/* First Purchase */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send After First Purchase</h3>
                <p className="text-sm text-gray-600">Automatically send a coupon to customers after their first purchase</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.firstPurchase?.enabled || false}
                onChange={(e) => updateSetting('automations.firstPurchase.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.firstPurchase?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Coupon Template</label>
                  <select
                    value={settings.automations?.firstPurchase?.couponTemplate || ''}
                    onChange={(e) => updateSetting('automations.firstPurchase.couponTemplate', e.target.value || null)}
                    className="input w-full"
                  >
                    <option value="">Select a coupon template</option>
                    {coupons.map(coupon => (
                      <option key={coupon._id} value={coupon._id}>
                        {coupon.code} - {coupon.description || `${coupon.type} ${coupon.value}${coupon.type === 'percentage' ? '%' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Delay (Hours)</label>
                  <Input
                    type="number"
                    value={settings.automations?.firstPurchase?.delayHours || 0}
                    onChange={(e) => updateSetting('automations.firstPurchase.delayHours', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Hours to wait before sending the coupon email (0 = send immediately)</p>
                </div>
              </div>
            )}
          </div>

          {/* New User */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send to New Registered Users</h3>
                <p className="text-sm text-gray-600">Automatically send a coupon when a new user registers</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.newUser?.enabled || false}
                onChange={(e) => updateSetting('automations.newUser.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.newUser?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Coupon Template</label>
                  <select
                    value={settings.automations?.newUser?.couponTemplate || ''}
                    onChange={(e) => updateSetting('automations.newUser.couponTemplate', e.target.value || null)}
                    className="input w-full"
                  >
                    <option value="">Select a coupon template</option>
                    {coupons.map(coupon => (
                      <option key={coupon._id} value={coupon._id}>
                        {coupon.code} - {coupon.description || `${coupon.type} ${coupon.value}${coupon.type === 'percentage' ? '%' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Delay (Hours)</label>
                  <Input
                    type="number"
                    value={settings.automations?.newUser?.delayHours || 0}
                    onChange={(e) => updateSetting('automations.newUser.delayHours', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spending Milestone */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send Based on Spending Amount</h3>
                <p className="text-sm text-gray-600">Send coupons when customers reach spending milestones</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.spendingMilestone?.enabled || false}
                onChange={(e) => updateSetting('automations.spendingMilestone.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.spendingMilestone?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Spending Milestones</label>
                  <div className="space-y-2">
                    {(settings.automations?.spendingMilestone?.milestones || []).map((milestone, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                        <Input
                          type="number"
                          value={milestone.amount || ''}
                          onChange={(e) => {
                            const milestones = [...(settings.automations?.spendingMilestone?.milestones || [])];
                            milestones[index].amount = parseFloat(e.target.value) || 0;
                            updateSetting('automations.spendingMilestone.milestones', milestones);
                          }}
                          placeholder="Amount (R)"
                          className="flex-1"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-sm">=</span>
                        <select
                          value={milestone.couponTemplate || ''}
                          onChange={(e) => {
                            const milestones = [...(settings.automations?.spendingMilestone?.milestones || [])];
                            milestones[index].couponTemplate = e.target.value || null;
                            updateSetting('automations.spendingMilestone.milestones', milestones);
                          }}
                          className="input flex-1"
                        >
                          <option value="">Select coupon</option>
                          {coupons.map(coupon => (
                            <option key={coupon._id} value={coupon._id}>
                              {coupon.code}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={milestone.sendOnce !== false}
                            onChange={(e) => {
                              const milestones = [...(settings.automations?.spendingMilestone?.milestones || [])];
                              milestones[index].sendOnce = e.target.checked;
                              updateSetting('automations.spendingMilestone.milestones', milestones);
                            }}
                            className="checkbox checkbox-primary"
                            title="Send only once"
                          />
                          <button
                            onClick={() => removeArrayItem('automations.spendingMilestone.milestones', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <IoTrash size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addArrayItem('automations.spendingMilestone.milestones', { amount: 0, couponTemplate: null, sendOnce: true })}
                    >
                      <IoAdd size={18} className="mr-1" />
                      Add Milestone
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Count */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send Based on Order Count</h3>
                <p className="text-sm text-gray-600">Send coupons when customers reach order count milestones</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.orderCount?.enabled || false}
                onChange={(e) => updateSetting('automations.orderCount.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.orderCount?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Order Count Milestones</label>
                  <div className="space-y-2">
                    {(settings.automations?.orderCount?.milestones || []).map((milestone, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                        <Input
                          type="number"
                          value={milestone.orderCount || ''}
                          onChange={(e) => {
                            const milestones = [...(settings.automations?.orderCount?.milestones || [])];
                            milestones[index].orderCount = parseInt(e.target.value) || 0;
                            updateSetting('automations.orderCount.milestones', milestones);
                          }}
                          placeholder="Order count"
                          className="flex-1"
                          min="0"
                        />
                        <span className="text-sm">orders =</span>
                        <select
                          value={milestone.couponTemplate || ''}
                          onChange={(e) => {
                            const milestones = [...(settings.automations?.orderCount?.milestones || [])];
                            milestones[index].couponTemplate = e.target.value || null;
                            updateSetting('automations.orderCount.milestones', milestones);
                          }}
                          className="input flex-1"
                        >
                          <option value="">Select coupon</option>
                          {coupons.map(coupon => (
                            <option key={coupon._id} value={coupon._id}>
                              {coupon.code}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={milestone.sendOnce !== false}
                            onChange={(e) => {
                              const milestones = [...(settings.automations?.orderCount?.milestones || [])];
                              milestones[index].sendOnce = e.target.checked;
                              updateSetting('automations.orderCount.milestones', milestones);
                            }}
                            className="checkbox checkbox-primary"
                            title="Send only once"
                          />
                          <button
                            onClick={() => removeArrayItem('automations.orderCount.milestones', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <IoTrash size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addArrayItem('automations.orderCount.milestones', { orderCount: 0, couponTemplate: null, sendOnce: true })}
                    >
                      <IoAdd size={18} className="mr-1" />
                      Add Milestone
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Purchase */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send Based on Product Purchase</h3>
                <p className="text-sm text-gray-600">Send coupons when customers purchase specific products</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.productPurchase?.enabled || false}
                onChange={(e) => updateSetting('automations.productPurchase.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.productPurchase?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Purchase Rules</label>
                  <div className="space-y-2">
                    {(settings.automations?.productPurchase?.rules || []).map((rule, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded space-y-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">Products</label>
                          <select
                            multiple
                            value={rule.products?.map(p => p._id ? p._id.toString() : p.toString()) || []}
                            onChange={(e) => {
                              const rules = [...(settings.automations?.productPurchase?.rules || [])];
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              rules[index].products = selected;
                              updateSetting('automations.productPurchase.rules', rules);
                            }}
                            className="input w-full h-24"
                          >
                            {products.map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name} (SKU: {product.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={rule.couponTemplate || ''}
                            onChange={(e) => {
                              const rules = [...(settings.automations?.productPurchase?.rules || [])];
                              rules[index].couponTemplate = e.target.value || null;
                              updateSetting('automations.productPurchase.rules', rules);
                            }}
                            className="input flex-1"
                          >
                            <option value="">Select coupon</option>
                            {coupons.map(coupon => (
                              <option key={coupon._id} value={coupon._id}>
                                {coupon.code}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rule.sendOnce !== false}
                              onChange={(e) => {
                                const rules = [...(settings.automations?.productPurchase?.rules || [])];
                                rules[index].sendOnce = e.target.checked;
                                updateSetting('automations.productPurchase.rules', rules);
                              }}
                              className="checkbox checkbox-primary"
                              title="Send only once"
                            />
                            <button
                              onClick={() => removeArrayItem('automations.productPurchase.rules', index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <IoTrash size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addArrayItem('automations.productPurchase.rules', { products: [], couponTemplate: null, sendOnce: true })}
                    >
                      <IoAdd size={18} className="mr-1" />
                      Add Rule
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Birthday */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send on Birthday</h3>
                <p className="text-sm text-gray-600">Automatically send a coupon on customers' birthdays</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.birthday?.enabled || false}
                onChange={(e) => updateSetting('automations.birthday.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.birthday?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Coupon Template</label>
                  <select
                    value={settings.automations?.birthday?.couponTemplate || ''}
                    onChange={(e) => updateSetting('automations.birthday.couponTemplate', e.target.value || null)}
                    className="input w-full"
                  >
                    <option value="">Select a coupon template</option>
                    {coupons.map(coupon => (
                      <option key={coupon._id} value={coupon._id}>
                        {coupon.code} - {coupon.description || `${coupon.type} ${coupon.value}${coupon.type === 'percentage' ? '%' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Send Days Before Birthday</label>
                  <Input
                    type="number"
                    value={settings.automations?.birthday?.sendDaysBefore || 0}
                    onChange={(e) => updateSetting('automations.birthday.sendDaysBefore', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = send on birthday, positive number = send X days before</p>
                </div>
              </div>
            )}
          </div>

          {/* Days Since Last Purchase */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Send After Days Since Last Purchase</h3>
                <p className="text-sm text-gray-600">Send coupons to customers who haven't purchased in X days</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automations?.daysSinceLastPurchase?.enabled || false}
                onChange={(e) => updateSetting('automations.daysSinceLastPurchase.enabled', e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </div>
            {settings.automations?.daysSinceLastPurchase?.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-primary">
                <div>
                  <label className="block text-sm font-medium mb-2">Days Since Last Purchase</label>
                  <Input
                    type="number"
                    value={settings.automations?.daysSinceLastPurchase?.days || 30}
                    onChange={(e) => updateSetting('automations.daysSinceLastPurchase.days', parseInt(e.target.value) || 30)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Coupon Template</label>
                  <select
                    value={settings.automations?.daysSinceLastPurchase?.couponTemplate || ''}
                    onChange={(e) => updateSetting('automations.daysSinceLastPurchase.couponTemplate', e.target.value || null)}
                    className="input w-full"
                  >
                    <option value="">Select a coupon template</option>
                    {coupons.map(coupon => (
                      <option key={coupon._id} value={coupon._id}>
                        {coupon.code} - {coupon.description || `${coupon.type} ${coupon.value}${coupon.type === 'percentage' ? '%' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.automations?.daysSinceLastPurchase?.sendOnce || false}
                    onChange={(e) => updateSetting('automations.daysSinceLastPurchase.sendOnce', e.target.checked)}
                    className="checkbox checkbox-primary"
                  />
                  <label className="text-sm font-medium">Send only once per customer</label>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Checkout Options */}
      <Card title="Checkout Options">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.checkout?.allowAcceptReject || false}
              onChange={(e) => updateSetting('checkout.allowAcceptReject', e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Allow users to accept or reject coupons on checkout page</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.checkout?.showCouponInCheckout !== false}
              onChange={(e) => updateSetting('checkout.showCouponInCheckout', e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Show coupon field in checkout</label>
          </div>
        </div>
      </Card>

      {/* Test Email Modal */}
      <Modal
        isOpen={testEmailModal}
        onClose={() => setTestEmailModal(false)}
        title="Send Test Coupon Email"
        onConfirm={() => {
          // This would need user selection, but for now just show the modal
          toast.info('Select a user and coupon to test');
        }}
        confirmText="Send Test"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            To send a test email, you need to select a user and coupon. This feature will be available in the customer detail page.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CouponEmailSettingsPage;
