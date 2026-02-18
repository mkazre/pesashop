import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { loyaltyAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoSave, IoAdd, IoTrash } from 'react-icons/io5';

const LoyaltySettingsPage = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);

  const { data, isLoading } = useQuery(
    'loyalty-settings',
    () => loyaltyAPI.getSettings(),
    {
      onSuccess: (response) => {
        const settingsData = response.data?.data || response.data;
        setSettings(settingsData || {});
      }
    }
  );

  const updateMutation = useMutation(
    (data) => loyaltyAPI.updateSettings(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-settings');
        toast.success('Settings saved successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
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

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loyalty Points Settings</h1>
        <Button onClick={handleSave} loading={updateMutation.isLoading}>
          <IoSave size={18} className="mr-2" />
          Save Settings
        </Button>
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
            <label className="text-sm font-medium">Enable PESA Coins System</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.assignmentMode === 'automatic'}
              onChange={(e) => updateSetting('assignmentMode', e.target.checked ? 'automatic' : 'manual')}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Automatic Points Assignment</label>
          </div>
        </div>
      </Card>

      {/* Points Assignment */}
      <Card title="Points Assignment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Points Per Currency Unit</label>
            <Input
              type="number"
              value={settings.pointsPerCurrency || 1}
              onChange={(e) => updateSetting('pointsPerCurrency', parseFloat(e.target.value) || 1)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">Example: 1 point per R1 spent</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price Base for Points Calculation</label>
            <select
              value={settings.priceBase || 'regular'}
              onChange={(e) => updateSetting('priceBase', e.target.value)}
              className="input w-full"
            >
              <option value="backend">Backend Price (Cost Price)</option>
              <option value="regular">Regular Price</option>
              <option value="sale">Sale/Promo Price</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Which price to use for calculating points</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Order Amount (R)</label>
            <Input
              type="number"
              value={settings.minimumOrderAmount || 0}
              onChange={(e) => updateSetting('minimumOrderAmount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum order amount to earn points (0 = no minimum)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Assign Points on Order Status</label>
            <div className="space-y-2 mt-2">
              {['pending', 'processing', 'on-hold', 'completed'].map(status => (
                <div key={status} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(settings.assignOnOrderStatus || []).includes(status)}
                    onChange={(e) => {
                      const current = settings.assignOnOrderStatus || [];
                      if (e.target.checked) {
                        updateSetting('assignOnOrderStatus', [...current, status]);
                      } else {
                        updateSetting('assignOnOrderStatus', current.filter(s => s !== status));
                      }
                    }}
                    className="checkbox checkbox-primary"
                  />
                  <label className="text-sm capitalize">{status}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Redemption Settings */}
      <Card title="Redemption Settings">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.redemptionMode === 'automatic'}
              onChange={(e) => updateSetting('redemptionMode', e.target.checked ? 'automatic' : 'manual')}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Automatic Redemption</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Redemption Type</label>
            <select
              value={settings.redemptionType || 'fixed'}
              onChange={(e) => updateSetting('redemptionType', e.target.value)}
              className="input w-full"
            >
              <option value="fixed">Fixed (points per currency unit)</option>
              <option value="percentage">Percentage (of order total)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Redemption Rate</label>
            <Input
              type="number"
              value={settings.redemptionRate || 0.1}
              onChange={(e) => updateSetting('redemptionRate', parseFloat(e.target.value) || 0.1)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              {settings.redemptionType === 'fixed' 
                ? 'Currency value per point (e.g., 0.1 = R0.10 per point)'
                : 'Percentage of order total (e.g., 0.1 = 10%)'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Redemption Points</label>
              <Input
                type="number"
                value={settings.minRedemptionPoints || 100}
                onChange={(e) => updateSetting('minRedemptionPoints', parseInt(e.target.value) || 100)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Maximum Redemption Points</label>
              <Input
                type="number"
                value={settings.maxRedemptionPoints || ''}
                onChange={(e) => updateSetting('maxRedemptionPoints', e.target.value ? parseInt(e.target.value) : null)}
                min="0"
                placeholder="No limit"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Maximum Redemption Percentage (%)</label>
            <Input
              type="number"
              value={settings.maxRedemptionPercentage || 50}
              onChange={(e) => updateSetting('maxRedemptionPercentage', parseFloat(e.target.value) || 50)}
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Cart Amount for Redemption (R)</label>
            <Input
              type="number"
              value={settings.minCartAmountForRedemption || 0}
              onChange={(e) => updateSetting('minCartAmountForRedemption', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.allowFreeShippingOnRedemption || false}
              onChange={(e) => updateSetting('allowFreeShippingOnRedemption', e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Offer free shipping when points are redeemed</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoRedeemInCart || false}
              onChange={(e) => updateSetting('autoRedeemInCart', e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Enable automatic redemption in cart/checkout</label>
          </div>
        </div>
      </Card>

      {/* Extra Points */}
      <Card title="Extra Points">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Signup Bonus</label>
              <Input
                type="number"
                value={settings.signupBonus || 0}
                onChange={(e) => updateSetting('signupBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Daily Login Bonus</label>
              <Input
                type="number"
                value={settings.dailyLoginBonus || 0}
                onChange={(e) => updateSetting('dailyLoginBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Profile Completion Bonus</label>
              <Input
                type="number"
                value={settings.profileCompleteBonus || 0}
                onChange={(e) => updateSetting('profileCompleteBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Referral Registration Bonus</label>
              <Input
                type="number"
                value={settings.referralRegistrationBonus || 0}
                onChange={(e) => updateSetting('referralRegistrationBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Referral Purchase Bonus</label>
              <Input
                type="number"
                value={settings.referralPurchaseBonus || 0}
                onChange={(e) => updateSetting('referralPurchaseBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Top Customer Bonus</label>
              <Input
                type="number"
                value={settings.topCustomerBonus || 0}
                onChange={(e) => updateSetting('topCustomerBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Top Customer Period</label>
              <select
                value={settings.topCustomerPeriod || 'monthly'}
                onChange={(e) => updateSetting('topCustomerPeriod', e.target.value)}
                className="input w-full"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Birthday Bonus</label>
              <Input
                type="number"
                value={settings.birthdayBonus || 0}
                onChange={(e) => updateSetting('birthdayBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review Bonus</label>
              <Input
                type="number"
                value={settings.reviewBonus || 0}
                onChange={(e) => updateSetting('reviewBonus', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>

          {/* Order Count Bonuses */}
          <div>
            <label className="block text-sm font-medium mb-2">Order Count Bonuses</label>
            <div className="space-y-2">
              {(settings.orderCountBonuses || []).map((bonus, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={bonus.orderCount || ''}
                    onChange={(e) => {
                      const bonuses = [...(settings.orderCountBonuses || [])];
                      bonuses[index].orderCount = parseInt(e.target.value) || 0;
                      updateSetting('orderCountBonuses', bonuses);
                    }}
                    placeholder="Order count"
                    className="flex-1"
                    min="0"
                  />
                  <span className="text-sm">orders =</span>
                  <Input
                    type="number"
                    value={bonus.bonusPoints || ''}
                    onChange={(e) => {
                      const bonuses = [...(settings.orderCountBonuses || [])];
                      bonuses[index].bonusPoints = parseInt(e.target.value) || 0;
                      updateSetting('orderCountBonuses', bonuses);
                    }}
                    placeholder="Points"
                    className="w-32"
                    min="0"
                  />
                  <button
                    onClick={() => removeArrayItem('orderCountBonuses', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addArrayItem('orderCountBonuses', { orderCount: 0, bonusPoints: 0 })}
              >
                <IoAdd size={18} className="mr-1" />
                Add Bonus
              </Button>
            </div>
          </div>

          {/* Cart Total Bonuses */}
          <div>
            <label className="block text-sm font-medium mb-2">Cart Total Bonuses</label>
            <div className="space-y-2">
              {(settings.cartTotalBonuses || []).map((bonus, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={bonus.cartTotal || ''}
                    onChange={(e) => {
                      const bonuses = [...(settings.cartTotalBonuses || [])];
                      bonuses[index].cartTotal = parseFloat(e.target.value) || 0;
                      updateSetting('cartTotalBonuses', bonuses);
                    }}
                    placeholder="Cart total (R)"
                    className="flex-1"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm">=</span>
                  <Input
                    type="number"
                    value={bonus.bonusPoints || ''}
                    onChange={(e) => {
                      const bonuses = [...(settings.cartTotalBonuses || [])];
                      bonuses[index].bonusPoints = parseInt(e.target.value) || 0;
                      updateSetting('cartTotalBonuses', bonuses);
                    }}
                    placeholder="Points"
                    className="w-32"
                    min="0"
                  />
                  <button
                    onClick={() => removeArrayItem('cartTotalBonuses', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addArrayItem('cartTotalBonuses', { cartTotal: 0, bonusPoints: 0 })}
              >
                <IoAdd size={18} className="mr-1" />
                Add Bonus
              </Button>
            </div>
          </div>

          {/* Total Spent Bonuses */}
          <div>
            <label className="block text-sm font-medium mb-2">Total Spent Bonuses</label>
            <div className="space-y-2">
              {(settings.totalSpentBonuses || []).map((bonus, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={bonus.totalSpent || ''}
                    onChange={(e) => {
                      const bonuses = [...(settings.totalSpentBonuses || [])];
                      bonuses[index].totalSpent = parseFloat(e.target.value) || 0;
                      updateSetting('totalSpentBonuses', bonuses);
                    }}
                    placeholder="Total spent (R)"
                    className="flex-1"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm">=</span>
                  <Input
                    type="number"
                    value={bonus.bonusPoints || ''}
                    onChange={(e) => {
                      const bonuses = [...(settings.totalSpentBonuses || [])];
                      bonuses[index].bonusPoints = parseInt(e.target.value) || 0;
                      updateSetting('totalSpentBonuses', bonuses);
                    }}
                    placeholder="Points"
                    className="w-32"
                    min="0"
                  />
                  <button
                    onClick={() => removeArrayItem('totalSpentBonuses', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addArrayItem('totalSpentBonuses', { totalSpent: 0, bonusPoints: 0 })}
              >
                <IoAdd size={18} className="mr-1" />
                Add Bonus
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Points Expiry */}
      <Card title="Points Expiry">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.expiryEnabled || false}
              onChange={(e) => updateSetting('expiryEnabled', e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Enable Points Expiry</label>
          </div>
          {settings.expiryEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">Points Expiry Days</label>
              <Input
                type="number"
                value={settings.pointsExpiryDays || ''}
                onChange={(e) => updateSetting('pointsExpiryDays', e.target.value ? parseInt(e.target.value) : null)}
                min="0"
                placeholder="Days until points expire"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Customer Group Multipliers */}
      <Card title="Customer Group Multipliers">
        <div className="space-y-2">
          {(settings.groupMultipliers || []).map((multiplier, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={multiplier.group || ''}
                onChange={(e) => {
                  const multipliers = [...(settings.groupMultipliers || [])];
                  multipliers[index].group = e.target.value;
                  updateSetting('groupMultipliers', multipliers);
                }}
                placeholder="Group name"
                className="flex-1"
              />
              <span className="text-sm">×</span>
              <Input
                type="number"
                value={multiplier.multiplier || 1}
                onChange={(e) => {
                  const multipliers = [...(settings.groupMultipliers || [])];
                  multipliers[index].multiplier = parseFloat(e.target.value) || 1;
                  updateSetting('groupMultipliers', multipliers);
                }}
                min="0"
                step="0.1"
                className="w-24"
              />
              <button
                onClick={() => removeArrayItem('groupMultipliers', index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <IoTrash size={18} />
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addArrayItem('groupMultipliers', { group: '', multiplier: 1 })}
          >
            <IoAdd size={18} className="mr-1" />
            Add Multiplier
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoyaltySettingsPage;
