import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reviewsAPI, emailTemplatesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import IconPicker from '@/components/common/IconPicker';
import SmartIcon from '@/components/common/SmartIcon';
import { IoSave, IoArrowBack, IoAdd, IoTrash, IoPencil, IoCheckmark, IoClose } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

// ─── Review Categories Sub-Component ────────────────────────────────
const ReviewCategoriesManager = () => {
  const queryClient = useQueryClient();
  const [newCat, setNewCat] = useState({ name: '', icon: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data, isLoading } = useQuery('review-categories-admin', () => reviewsAPI.getCategories());
  const categories = data?.data?.data || [];

  const createMutation = useMutation((d) => reviewsAPI.createCategory(d), {
    onSuccess: () => {
      queryClient.invalidateQueries('review-categories-admin');
      setNewCat({ name: '', icon: '', description: '' });
      toast.success('Category created');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error creating category')
  });

  const updateMutation = useMutation(({ id, data }) => reviewsAPI.updateCategory(id, data), {
    onSuccess: () => { queryClient.invalidateQueries('review-categories-admin'); setEditingId(null); toast.success('Category updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error updating category')
  });

  const deleteMutation = useMutation((id) => reviewsAPI.deleteCategory(id), {
    onSuccess: () => { queryClient.invalidateQueries('review-categories-admin'); toast.success('Category deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error deleting category')
  });

  const toggleActiveMutation = useMutation(({ id, isActive }) => reviewsAPI.updateCategory(id, { isActive }), {
    onSuccess: () => queryClient.invalidateQueries('review-categories-admin'),
  });

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-1">Review Rating Categories</h3>
        <p className="text-sm text-gray-500 mb-5">
          Define criteria customers can rate separately when writing a review (e.g. Value for Money, Delivery Speed).
          These appear as optional star-rating rows below the main review form.
        </p>

        {/* Existing categories */}
        {isLoading ? (
          <div className="text-center py-4 text-gray-400">Loading categories...</div>
        ) : (
          <div className="space-y-2 mb-6">
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 italic">No review categories defined yet. Add your first one below.</p>
            )}
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                {editingId === cat._id ? (
                  <>
                    <IconPicker value={editData.icon} onChange={(v) => setEditData({ ...editData, icon: v })} />
                    <input
                      className="input input-bordered input-sm flex-1"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Name"
                    />
                    <input
                      className="input input-bordered input-sm flex-1"
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      placeholder="Description (tooltip)"
                    />
                    <button
                      className="btn btn-success btn-sm btn-square"
                      onClick={() => updateMutation.mutate({ id: cat._id, data: editData })}
                    ><IoCheckmark /></button>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => setEditingId(null)}
                    ><IoClose /></button>
                  </>
                ) : (
                  <>
                    <span className="w-8 flex justify-center"><SmartIcon value={cat.icon} fallback="⭐" size={20} /></span>
                    <span className="flex-1 font-medium text-sm">{cat.name}</span>
                    <span className="flex-1 text-xs text-gray-500">{cat.description || '—'}</span>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={cat.isActive}
                        onChange={(e) => toggleActiveMutation.mutate({ id: cat._id, isActive: e.target.checked })}
                        className="checkbox checkbox-xs checkbox-primary"
                      />
                      Active
                    </label>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => { setEditingId(cat._id); setEditData({ name: cat.name, icon: cat.icon, description: cat.description }); }}
                    ><IoPencil size={14} /></button>
                    <button
                      className="btn btn-ghost btn-sm btn-square text-red-500"
                      onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat._id); }}
                    ><IoTrash size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new category */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add New Category</p>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icon</label>
              <IconPicker value={newCat.icon} onChange={(v) => setNewCat({ ...newCat, icon: v })} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Category Name *</label>
              <input
                className="input input-bordered input-sm w-full"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="e.g. Value for Money"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Description (tooltip)</label>
              <input
                className="input input-bordered input-sm w-full"
                value={newCat.description}
                onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                placeholder="Shown as tooltip to reviewers"
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              disabled={!newCat.name.trim() || createMutation.isLoading}
              onClick={() => createMutation.mutate(newCat)}
            >
              <IoAdd size={16} className="mr-1" /> Add
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────
const ReviewSettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const defaultSettings = {
    autoApproveThreshold: 4,
    autoApproveEnabled: true,
    requireLogin: true,
    loyaltyPointsEnabled: true,
    loyaltyPointsAmount: 10,
    emailReminderEnabled: true,
    emailReminderDays: 7,
    emailTemplate: null,
    showFirstName: true,
    showGuestName: true
  };
  
  const [settings, setSettings] = useState(defaultSettings);

  const { data, isLoading, error } = useQuery(
    'review-settings',
    () => reviewsAPI.getSettings(),
    {
      onSuccess: (response) => {
        const settingsData = response.data?.data || response.data;
        setSettings(settingsData || defaultSettings);
      },
      onError: () => {
        setSettings(defaultSettings);
      },
      retry: false
    }
  );

  const { data: emailTemplatesData } = useQuery(
    'email-templates-for-reviews',
    () => emailTemplatesAPI.getAll(),
    {
      retry: false,
      refetchOnWindowFocus: false,
      onError: () => {}
    }
  );

  const updateMutation = useMutation(
    (data) => reviewsAPI.updateSettings(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('review-settings');
        toast.success('Review settings updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update review settings');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading review settings...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            ⚠️ Unable to connect to backend. Please ensure the backend server is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/reviews')}>
          <IoArrowBack size={20} />
        </Button>
        <h1 className="text-3xl font-bold">Review Settings</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Auto-Approval Settings */}
          <Card title="Auto-Approval Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Enable Auto-Approval</label>
                  <p className="text-xs text-gray-500">Automatically approve reviews based on rating threshold</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveEnabled}
                  onChange={(e) => setSettings({ ...settings, autoApproveEnabled: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
              
              {settings.autoApproveEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-1">Auto-Approval Threshold</label>
                  <p className="text-xs text-gray-500 mb-2">Reviews with this rating or higher will be auto-approved</p>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={settings.autoApproveThreshold}
                    onChange={(e) => setSettings({ ...settings, autoApproveThreshold: parseInt(e.target.value) })}
                    fullWidth
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Login Requirement */}
          <Card title="Review Requirements">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Require Login</label>
                  <p className="text-xs text-gray-500">Customers must be logged in to submit reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireLogin}
                  onChange={(e) => setSettings({ ...settings, requireLogin: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
            </div>
          </Card>

          {/* PESA Coins */}
          <Card title="PESA Coins">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Enable PESA Coins</label>
                  <p className="text-xs text-gray-500">Award PESA Coins for approved reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loyaltyPointsEnabled}
                  onChange={(e) => setSettings({ ...settings, loyaltyPointsEnabled: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
              
              {settings.loyaltyPointsEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-1">Points Amount</label>
                  <p className="text-xs text-gray-500 mb-2">Number of PESA Coins awarded per approved review</p>
                  <Input
                    type="number"
                    min="0"
                    value={settings.loyaltyPointsAmount}
                    onChange={(e) => setSettings({ ...settings, loyaltyPointsAmount: parseInt(e.target.value) })}
                    fullWidth
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Email Reminders */}
          <Card title="Email Reminders">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Enable Email Reminders</label>
                  <p className="text-xs text-gray-500">Send email reminders to customers to review their purchases</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailReminderEnabled}
                  onChange={(e) => setSettings({ ...settings, emailReminderEnabled: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
              
              {settings.emailReminderEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Days After Purchase</label>
                    <p className="text-xs text-gray-500 mb-2">Number of days after purchase to send review reminder</p>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.emailReminderDays}
                      onChange={(e) => setSettings({ ...settings, emailReminderDays: parseInt(e.target.value) })}
                      fullWidth
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Template</label>
                    <p className="text-xs text-gray-500 mb-2">Select the email template to use for review reminders</p>
                    <select
                      value={settings.emailTemplate?._id || settings.emailTemplate || ''}
                      onChange={(e) => setSettings({ ...settings, emailTemplate: e.target.value || null })}
                      className="input w-full"
                    >
                      <option value="">Select Email Template</option>
                      {emailTemplatesData?.data?.data?.map((template) => (
                        <option key={template._id} value={template._id}>
                          {template.name} ({template.type})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {'{customerName}'}, {'{productName}'}, {'{productSlug}'}, {'{orderNumber}'}, {'{reviewLink}'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Purchase Verification */}
          <Card title="Purchase Verification">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Require Purchase</label>
                  <p className="text-xs text-gray-500">Customer must have purchased the product to leave a review</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requirePurchase ?? true}
                  onChange={(e) => setSettings({ ...settings, requirePurchase: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
              
              {settings.requirePurchase !== false && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Require Delivered</label>
                    <p className="text-xs text-gray-500">Order must be delivered before customer can review</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireDelivered ?? true}
                    onChange={(e) => setSettings({ ...settings, requireDelivered: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Image Upload Settings */}
          <Card title="Image Upload Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Allow Image Uploads</label>
                  <p className="text-xs text-gray-500">Allow customers to upload images with their reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowImages ?? true}
                  onChange={(e) => setSettings({ ...settings, allowImages: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
              
              {settings.allowImages !== false && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Images Per Review</label>
                    <p className="text-xs text-gray-500 mb-2">Maximum number of images a customer can upload per review</p>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxImages ?? 5}
                      onChange={(e) => setSettings({ ...settings, maxImages: parseInt(e.target.value) })}
                      fullWidth
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
                    <p className="text-xs text-gray-500 mb-2">Maximum file size per image in megabytes</p>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.maxFileSizeMB ?? 5}
                      onChange={(e) => setSettings({ ...settings, maxFileSizeMB: parseInt(e.target.value) })}
                      fullWidth
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Content & Moderation */}
          <Card title="Content & Moderation">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Review Length</label>
                <p className="text-xs text-gray-500 mb-2">Minimum number of characters required for a review (0 = no minimum)</p>
                <Input
                  type="number"
                  min="0"
                  max="500"
                  value={settings.minimumContentLength ?? 10}
                  onChange={(e) => setSettings({ ...settings, minimumContentLength: parseInt(e.target.value) })}
                  fullWidth
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Show Category Ratings</label>
                  <p className="text-xs text-gray-500">Allow customers to rate specific categories (quality, value, etc.)</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showCategoryRatings ?? true}
                  onChange={(e) => setSettings({ ...settings, showCategoryRatings: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
            </div>
          </Card>

          {/* Display Settings */}
          <Card title="Display Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Show First Name</label>
                  <p className="text-xs text-gray-500">Display customer's first name on reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showFirstName}
                  onChange={(e) => setSettings({ ...settings, showFirstName: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Show Guest Name</label>
                  <p className="text-xs text-gray-500">Display guest name on guest reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showGuestName}
                  onChange={(e) => setSettings({ ...settings, showGuestName: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
              </div>
            </div>
          </Card>

          {/* Review Rating Categories */}
          <ReviewCategoriesManager />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" loading={updateMutation.isLoading}>
              <IoSave size={20} className="mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReviewSettingsPage;
