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

const LoyaltyLevelsPage = () => {
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);

  const { data, isLoading } = useQuery(
    'loyalty-levels',
    () => loyaltyAPI.getLevels(),
    { keepPreviousData: true }
  );

  const createMutation = useMutation(
    (data) => loyaltyAPI.createLevel(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-levels');
        toast.success('Level created successfully');
        setCreateModal(false);
        setEditingLevel(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create level');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => loyaltyAPI.updateLevel(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-levels');
        toast.success('Level updated successfully');
        setEditModal(false);
        setEditingLevel(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update level');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => loyaltyAPI.deleteLevel(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-levels');
        toast.success('Level deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete level');
      },
    }
  );

  const handleCreate = () => {
    createMutation.mutate(editingLevel);
  };

  const handleUpdate = () => {
    updateMutation.mutate({ id: editingLevel._id, data: editingLevel });
  };

  const handleEdit = (level) => {
    setEditingLevel({ ...level });
    setEditModal(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Level Name',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          {row.color && (
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: row.color }}
            />
          )}
          <div>
            <p className="font-medium">{name}</p>
            {row.description && (
              <p className="text-sm text-gray-500">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'minPoints',
      title: 'Points Range',
      render: (min, row) => (
        <div>
          <p className="font-medium">{min.toLocaleString()}+</p>
          {row.maxPoints && (
            <p className="text-xs text-gray-500">up to {row.maxPoints.toLocaleString()}</p>
          )}
        </div>
      ),
    },
    {
      key: 'usersCount',
      title: 'Users',
      align: 'center',
      render: (count) => count || 0,
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
            title="Edit Level"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
            title="Delete Level"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const levels = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loyalty Levels</h1>
        <Button
          onClick={() => {
            setEditingLevel({
              name: '',
              description: '',
              minPoints: 0,
              maxPoints: null,
              color: '#0e604a',
              badgeImage: '',
              badgeIcon: '',
              extraPointsOnAchievement: 0,
              redemptionMultiplier: 1,
              pointsEarningMultiplier: 1,
              displayOrder: 0,
              isActive: true
            });
            setCreateModal(true);
          }}
        >
          <IoAdd size={18} />
          Create Level
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={levels}
          loading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModal || editModal}
        onClose={() => {
          setCreateModal(false);
          setEditModal(false);
          setEditingLevel(null);
        }}
        title={editModal ? 'Edit Loyalty Level' : 'Create Loyalty Level'}
        onConfirm={editModal ? handleUpdate : handleCreate}
        confirmText={editModal ? 'Update Level' : 'Create Level'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        size="lg"
      >
        {editingLevel && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Level Name *</label>
              <Input
                value={editingLevel.name}
                onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={editingLevel.description || ''}
                onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                rows={2}
                className="input w-full resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Points *</label>
                <Input
                  type="number"
                  value={editingLevel.minPoints || 0}
                  onChange={(e) => setEditingLevel({ ...editingLevel, minPoints: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Points</label>
                <Input
                  type="number"
                  value={editingLevel.maxPoints || ''}
                  onChange={(e) => setEditingLevel({ ...editingLevel, maxPoints: e.target.value ? parseInt(e.target.value) : null })}
                  min="0"
                  placeholder="Leave empty for last level"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for the highest level</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Level Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingLevel.color || '#0e604a'}
                    onChange={(e) => setEditingLevel({ ...editingLevel, color: e.target.value })}
                    className="w-16 h-10 rounded border border-gray-300"
                  />
                  <Input
                    value={editingLevel.color || '#0e604a'}
                    onChange={(e) => setEditingLevel({ ...editingLevel, color: e.target.value })}
                    placeholder="#0e604a"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Display Order</label>
                <Input
                  type="number"
                  value={editingLevel.displayOrder || 0}
                  onChange={(e) => setEditingLevel({ ...editingLevel, displayOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Badge Icon/Emoji</label>
              <Input
                value={editingLevel.badgeIcon || ''}
                onChange={(e) => setEditingLevel({ ...editingLevel, badgeIcon: e.target.value })}
                placeholder="🏆 or icon name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Badge Image URL</label>
              <Input
                value={editingLevel.badgeImage || ''}
                onChange={(e) => setEditingLevel({ ...editingLevel, badgeImage: e.target.value })}
                placeholder="https://example.com/badge.png"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Achievement Bonus Points</label>
                <Input
                  type="number"
                  value={editingLevel.extraPointsOnAchievement || 0}
                  onChange={(e) => setEditingLevel({ ...editingLevel, extraPointsOnAchievement: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Earning Multiplier</label>
                <Input
                  type="number"
                  value={editingLevel.pointsEarningMultiplier || 1}
                  onChange={(e) => setEditingLevel({ ...editingLevel, pointsEarningMultiplier: parseFloat(e.target.value) || 1 })}
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">× points earned</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Redemption Multiplier</label>
                <Input
                  type="number"
                  value={editingLevel.redemptionMultiplier || 1}
                  onChange={(e) => setEditingLevel({ ...editingLevel, redemptionMultiplier: parseFloat(e.target.value) || 1 })}
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">× redemption value</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingLevel.isActive !== false}
                onChange={(e) => setEditingLevel({ ...editingLevel, isActive: e.target.checked })}
                className="checkbox checkbox-primary"
              />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Loyalty Level"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>?</p>
        {deleteModal?.usersCount > 0 && (
          <p className="text-sm text-red-500 mt-2">
            Warning: {deleteModal.usersCount} user(s) are currently at this level.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default LoyaltyLevelsPage;
