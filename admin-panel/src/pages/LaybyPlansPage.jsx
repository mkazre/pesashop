import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { laybyPlansAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { IoAdd, IoCreate, IoTrash, IoCheckmark, IoClose } from 'react-icons/io5';

const LaybyPlansPage = () => {
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  const { data, isLoading } = useQuery(
    'laybyPlans',
    () => laybyPlansAPI.getAll(),
    { keepPreviousData: true }
  );

  const createMutation = useMutation(
    (data) => laybyPlansAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyPlans');
        toast.success('Layby plan created successfully');
        setCreateModal(false);
        setEditingPlan(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create layby plan');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => laybyPlansAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyPlans');
        toast.success('Layby plan updated successfully');
        setEditModal(false);
        setEditingPlan(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update layby plan');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => laybyPlansAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyPlans');
        toast.success('Layby plan deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete layby plan');
      },
    }
  );

  const handleCreate = () => {
    createMutation.mutate(editingPlan);
  };

  const handleUpdate = () => {
    updateMutation.mutate({ id: editingPlan._id, data: editingPlan });
  };

  const handleEdit = (plan) => {
    setEditingPlan({ ...plan });
    setEditModal(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Plan Name',
      render: (name, row) => (
        <div>
          <p className="font-medium">{name}</p>
          {row.description && (
            <p className="text-sm text-gray-500">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'depositPercentage',
      title: 'Deposit',
      render: (_, row) => (
        <div>
          {row.depositAmount > 0 ? (
            <p>R {row.depositAmount.toFixed(2)}</p>
          ) : (
            <p>{row.depositPercentage}%</p>
          )}
        </div>
      ),
    },
    {
      key: 'numberOfPayments',
      title: 'Payments',
      render: (_, row) => (
        <div>
          <p>{row.numberOfPayments} × {row.frequency}</p>
        </div>
      ),
    },
    {
      key: 'minimumProductValue',
      title: 'Min Value',
      render: (min) => min > 0 ? `R ${min.toFixed(2)}` : 'No minimum',
    },
    {
      key: 'expiryDays',
      title: 'Expiry',
      render: (days) => days > 0 ? `${days} days` : 'No expiry',
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
      key: 'usageCount',
      title: 'Used',
      align: 'center',
      render: (count) => count || 0,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-gray-100 transition-colors"
            title="Edit Plan"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 hover:bg-gray-100 transition-colors"
            title="Delete Plan"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const plans = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Layby Plans</h1>
        <Button onClick={() => {
          setEditingPlan({
            name: '',
            description: '',
            depositPercentage: 20,
            depositAmount: 0,
            numberOfPayments: 4,
            frequency: 'monthly',
            minimumProductValue: 0,
            maximumProductValue: 0,
            expiryDays: 90,
            holdFunds: false,
            allowCancellation: true,
            keepDepositOnCancellation: false,
            cancellationFee: 0,
            cancellationFeePercentage: 0,
            allowLatePayments: true,
            latePaymentFee: 0,
            latePaymentFeePercentage: 0,
            maxMissedPayments: 3,
            emailReminders: {
              enabled: true,
              daysBefore: [7, 3, 1],
              overdueReminderInterval: 7
            },
            isActive: true,
            displayOrder: 0
          });
          setCreateModal(true);
        }}>
          <IoAdd size={18} />
          Create Plan
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={plans}
          loading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModal || editModal}
        onClose={() => {
          setCreateModal(false);
          setEditModal(false);
          setEditingPlan(null);
        }}
        title={editModal ? 'Edit Layby Plan' : 'Create Layby Plan'}
        onConfirm={editModal ? handleUpdate : handleCreate}
        confirmText={editModal ? 'Update Plan' : 'Create Plan'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        size="xl"
      >
        {editingPlan && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plan Name *</label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingPlan.description || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* Deposit Configuration */}
            <div>
              <h3 className="font-semibold mb-4">Deposit Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Deposit Percentage (%)</label>
                  <Input
                    type="number"
                    value={editingPlan.depositPercentage}
                    onChange={(e) => setEditingPlan({ ...editingPlan, depositPercentage: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Or Fixed Deposit Amount (R)</label>
                  <Input
                    type="number"
                    value={editingPlan.depositAmount || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, depositAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    placeholder="0 = use percentage"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 to use percentage instead</p>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div>
              <h3 className="font-semibold mb-4">Payment Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Payments *</label>
                  <Input
                    type="number"
                    value={editingPlan.numberOfPayments}
                    onChange={(e) => setEditingPlan({ ...editingPlan, numberOfPayments: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="52"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Frequency *</label>
                  <select
                    value={editingPlan.frequency}
                    onChange={(e) => setEditingPlan({ ...editingPlan, frequency: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div>
              <h3 className="font-semibold mb-4">Product Eligibility</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Product Value (R)</label>
                  <Input
                    type="number"
                    value={editingPlan.minimumProductValue || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, minimumProductValue: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = no minimum</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Product Value (R)</label>
                  <Input
                    type="number"
                    value={editingPlan.maximumProductValue || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maximumProductValue: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = no maximum</p>
                </div>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <h3 className="font-semibold mb-4">Expiry Settings</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Days</label>
                <Input
                  type="number"
                  value={editingPlan.expiryDays || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan, expiryDays: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">0 = no expiry</p>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.holdFunds || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, holdFunds: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Hold funds until completion</span>
                </label>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div>
              <h3 className="font-semibold mb-4">Cancellation Policy</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.allowCancellation !== false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, allowCancellation: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Allow cancellation</span>
                </div>
                {editingPlan.allowCancellation !== false && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPlan.keepDepositOnCancellation || false}
                        onChange={(e) => setEditingPlan({ ...editingPlan, keepDepositOnCancellation: e.target.checked })}
                        className="checkbox checkbox-primary"
                      />
                      <span className="text-sm font-medium">Keep deposit on cancellation</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Cancellation Fee (R)</label>
                        <Input
                          type="number"
                          value={editingPlan.cancellationFee || 0}
                          onChange={(e) => setEditingPlan({ ...editingPlan, cancellationFee: parseFloat(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Or Cancellation Fee (%)</label>
                        <Input
                          type="number"
                          value={editingPlan.cancellationFeePercentage || 0}
                          onChange={(e) => setEditingPlan({ ...editingPlan, cancellationFeePercentage: parseFloat(e.target.value) || 0 })}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Late Payment Policy */}
            <div>
              <h3 className="font-semibold mb-4">Late Payment Policy</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.allowLatePayments !== false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, allowLatePayments: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Allow late payments</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Late Payment Fee (R)</label>
                    <Input
                      type="number"
                      value={editingPlan.latePaymentFee || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, latePaymentFee: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Or Late Payment Fee (%)</label>
                    <Input
                      type="number"
                      value={editingPlan.latePaymentFeePercentage || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, latePaymentFeePercentage: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Missed Payments (Auto-cancel)</label>
                  <Input
                    type="number"
                    value={editingPlan.maxMissedPayments || 3}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxMissedPayments: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = no auto-cancel</p>
                </div>
              </div>
            </div>

            {/* Email Reminders */}
            <div>
              <h3 className="font-semibold mb-4">Email Reminders</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.emailReminders?.enabled !== false}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      emailReminders: {
                        ...editingPlan.emailReminders,
                        enabled: e.target.checked
                      }
                    })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Enable email reminders</span>
                </div>
                {editingPlan.emailReminders?.enabled !== false && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Remind Days Before Payment</label>
                    <Input
                      value={editingPlan.emailReminders?.daysBefore?.join(', ') || '7, 3, 1'}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        emailReminders: {
                          ...editingPlan.emailReminders,
                          daysBefore: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                        }
                      })}
                      placeholder="7, 3, 1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated list (e.g., 7, 3, 1)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Layby Plan"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>?</p>
        {deleteModal?.usageCount > 0 && (
          <p className="text-sm text-red-500 mt-2">
            This plan is being used by {deleteModal.usageCount} laybye(s) and cannot be deleted.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default LaybyPlansPage;
