import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { loyaltyAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoCreate, IoTrash } from 'react-icons/io5';

const LoyaltyBannersPage = () => {
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['loyalty-banners', typeFilter],
    () => loyaltyAPI.getBanners({ type: typeFilter || undefined }),
    { keepPreviousData: true }
  );

  const createMutation = useMutation(
    (data) => loyaltyAPI.createBanner(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-banners');
        toast.success('Banner created successfully');
        setCreateModal(false);
        setEditingBanner(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create banner');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => loyaltyAPI.updateBanner(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-banners');
        toast.success('Banner updated successfully');
        setEditModal(false);
        setEditingBanner(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update banner');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => loyaltyAPI.deleteBanner(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-banners');
        toast.success('Banner deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete banner');
      },
    }
  );

  const handleCreate = () => {
    createMutation.mutate(editingBanner);
  };

  const handleUpdate = () => {
    updateMutation.mutate({ id: editingBanner._id, data: editingBanner });
  };

  const handleEdit = (banner) => {
    setEditingBanner({ ...banner });
    setEditModal(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Banner Name',
      render: (name, row) => (
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500 capitalize">{row.type}</p>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (type) => (
        <span className={`badge ${type === 'target' ? 'badge-info' : 'badge-success'}`}>
          {type === 'target' ? 'Target Banner' : 'Get Points Banner'}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (isActive) => (
        <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
            title="Edit Banner"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
            title="Delete Banner"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const banners = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loyalty Banners</h1>
        <div className="flex items-center gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="">All Banners</option>
            <option value="target">Target Banners</option>
            <option value="get_points">Get Points Banners</option>
          </select>
          <Button
            onClick={() => {
              setEditingBanner({
                name: '',
                type: 'target',
                targetType: 'points',
                targetValue: null,
                actionType: 'custom',
                actionPoints: 0,
                title: '',
                description: '',
                image: '',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                buttonText: '',
                buttonColor: '#0e604a',
                buttonTextColor: '#ffffff',
                displayOn: [],
                isActive: true,
                displayOrder: 0,
                userRoles: [],
                customerGroups: [],
                minPoints: null,
                maxPoints: null,
                actionUrl: '',
                actionText: ''
              });
              setCreateModal(true);
            }}
          >
            <IoAdd size={18} />
            Create Banner
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={banners}
          loading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModal || editModal}
        onClose={() => {
          setCreateModal(false);
          setEditModal(false);
          setEditingBanner(null);
        }}
        title={editModal ? 'Edit Banner' : 'Create Banner'}
        onConfirm={editModal ? handleUpdate : handleCreate}
        confirmText={editModal ? 'Update Banner' : 'Create Banner'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        size="xl"
      >
        {editingBanner && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Banner Name *</label>
                  <Input
                    value={editingBanner.name}
                    onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Banner Type *</label>
                  <select
                    value={editingBanner.type}
                    onChange={(e) => setEditingBanner({ ...editingBanner, type: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="target">Target Banner (Progress)</option>
                    <option value="get_points">Get Points Banner (Action Prompt)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Banner Settings */}
            {editingBanner.type === 'target' && (
              <div>
                <h3 className="font-semibold mb-4">Target Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Type</label>
                    <select
                      value={editingBanner.targetType || 'points'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, targetType: e.target.value })}
                      className="input w-full"
                    >
                      <option value="points">Points</option>
                      <option value="level">Level</option>
                      <option value="spending">Spending</option>
                      <option value="orders">Orders</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Value</label>
                    <Input
                      type="number"
                      value={editingBanner.targetValue || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, targetValue: e.target.value ? parseFloat(e.target.value) : null })}
                      min="0"
                      placeholder="Target value"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Get Points Banner Settings */}
            {editingBanner.type === 'get_points' && (
              <div>
                <h3 className="font-semibold mb-4">Action Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Action Type</label>
                    <select
                      value={editingBanner.actionType || 'custom'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, actionType: e.target.value })}
                      className="input w-full"
                    >
                      <option value="refer_friend">Refer a Friend</option>
                      <option value="leave_review">Leave a Review</option>
                      <option value="daily_login">Daily Login</option>
                      <option value="complete_profile">Complete Profile</option>
                      <option value="birthday">Birthday</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Points Awarded</label>
                    <Input
                      type="number"
                      value={editingBanner.actionPoints || 0}
                      onChange={(e) => setEditingBanner({ ...editingBanner, actionPoints: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Action URL</label>
                    <Input
                      value={editingBanner.actionUrl || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, actionUrl: e.target.value })}
                      placeholder="/products or full URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Action Button Text</label>
                    <Input
                      value={editingBanner.actionText || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, actionText: e.target.value })}
                      placeholder="Get Started"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Design */}
            <div>
              <h3 className="font-semibold mb-4">Design</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingBanner.description || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Banner Image URL</label>
                  <Input
                    value={editingBanner.image || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                    placeholder="https://example.com/banner.png"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingBanner.backgroundColor || '#ffffff'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, backgroundColor: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300"
                      />
                      <Input
                        value={editingBanner.backgroundColor || '#ffffff'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, backgroundColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingBanner.textColor || '#000000'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, textColor: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300"
                      />
                      <Input
                        value={editingBanner.textColor || '#000000'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, textColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Button Text</label>
                    <Input
                      value={editingBanner.buttonText || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                      placeholder="Learn More"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Button Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingBanner.buttonColor || '#0e604a'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, buttonColor: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300"
                      />
                      <Input
                        value={editingBanner.buttonColor || '#0e604a'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, buttonColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Button Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingBanner.buttonTextColor || '#ffffff'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonTextColor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={editingBanner.buttonTextColor || '#ffffff'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonTextColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div>
              <h3 className="font-semibold mb-4">Display Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display On</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['my_account', 'cart', 'checkout', 'product', 'home'].map(location => (
                      <div key={location} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(editingBanner.displayOn || []).includes(location)}
                          onChange={(e) => {
                            const current = editingBanner.displayOn || [];
                            if (e.target.checked) {
                              setEditingBanner({ ...editingBanner, displayOn: [...current, location] });
                            } else {
                              setEditingBanner({ ...editingBanner, displayOn: current.filter(l => l !== location) });
                            }
                          }}
                          className="checkbox checkbox-primary"
                        />
                        <label className="text-sm capitalize">{location.replace('_', ' ')}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <Input
                    type="number"
                    value={editingBanner.displayOrder || 0}
                    onChange={(e) => setEditingBanner({ ...editingBanner, displayOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingBanner.isActive !== false}
                    onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Banner"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>?</p>
      </Modal>
    </div>
  );
};

export default LoyaltyBannersPage;
