import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { loyaltyAPI, customersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import toast from 'react-hot-toast';
import { IoAdd, IoPeople, IoPerson } from 'react-icons/io5';

const LoyaltyPointsManagementPage = () => {
  const queryClient = useQueryClient();
  const [manualModal, setManualModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [manualData, setManualData] = useState({ userId: '', points: '', reason: '', type: 'adjusted' });
  const [bulkData, setBulkData] = useState({ points: '', reason: '', type: 'adjusted', conditions: {} });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customersData } = useQuery(
    ['customers-for-points', searchQuery],
    () => customersAPI.getAll({ search: searchQuery, limit: 50 }),
    { enabled: manualModal }
  );

  const manualMutation = useMutation(
    (data) => loyaltyAPI.manualAssign(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        queryClient.invalidateQueries('loyalty-ranking');
        toast.success('Points assigned successfully');
        setManualModal(false);
        setManualData({ userId: '', points: '', reason: '', type: 'adjusted' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign points');
      },
    }
  );

  const bulkMutation = useMutation(
    (data) => loyaltyAPI.bulkAssign(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('customers');
        queryClient.invalidateQueries('loyalty-ranking');
        toast.success(response.data?.message || 'Bulk points assignment completed');
        setBulkModal(false);
        setBulkData({ points: '', reason: '', type: 'adjusted', conditions: {} });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign points');
      },
    }
  );

  const handleManualAssign = () => {
    if (!manualData.userId || !manualData.points || !manualData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    manualMutation.mutate({
      userId: manualData.userId,
      points: parseInt(manualData.points),
      reason: manualData.reason,
      type: manualData.type
    });
  };

  const handleBulkAssign = () => {
    if (!bulkData.points || !bulkData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    bulkMutation.mutate({
      points: parseInt(bulkData.points),
      reason: bulkData.reason,
      type: bulkData.type,
      conditions: bulkData.conditions
    });
  };

  const customers = customersData?.data?.data || customersData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Points Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setManualModal(true)}
          >
            <IoPerson size={18} className="mr-2" />
            Manual Assignment
          </Button>
          <Button
            onClick={() => setBulkModal(true)}
          >
            <IoPeople size={18} className="mr-2" />
            Bulk Assignment
          </Button>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      <Modal
        isOpen={manualModal}
        onClose={() => {
          setManualModal(false);
          setManualData({ userId: '', points: '', reason: '', type: 'adjusted' });
        }}
        title="Manual Points Assignment"
        onConfirm={handleManualAssign}
        confirmText="Assign Points"
        confirmLoading={manualMutation.isLoading}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Customer *</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              className="mb-2"
            />
            <select
              value={manualData.userId}
              onChange={(e) => setManualData({ ...manualData, userId: e.target.value })}
              className="input w-full"
              required
              size="5"
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.firstName} {customer.lastName} ({customer.email}) - {customer.loyaltyPoints || 0} points
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Points *</label>
            <Input
              type="number"
              value={manualData.points}
              onChange={(e) => setManualData({ ...manualData, points: e.target.value })}
              placeholder="Enter points (negative to remove)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Use negative numbers to remove points</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={manualData.type}
              onChange={(e) => setManualData({ ...manualData, type: e.target.value })}
              className="input w-full"
            >
              <option value="adjusted">Manual Adjustment</option>
              <option value="earned">Earned</option>
              <option value="redeemed">Redeemed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason *</label>
            <textarea
              value={manualData.reason}
              onChange={(e) => setManualData({ ...manualData, reason: e.target.value })}
              rows={3}
              className="input w-full resize-none"
              placeholder="Reason for points assignment"
              required
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal
        isOpen={bulkModal}
        onClose={() => {
          setBulkModal(false);
          setBulkData({ points: '', reason: '', type: 'adjusted', conditions: {} });
        }}
        title="Bulk Points Assignment"
        onConfirm={handleBulkAssign}
        confirmText="Assign Points"
        confirmLoading={bulkMutation.isLoading}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Points *</label>
            <Input
              type="number"
              value={bulkData.points}
              onChange={(e) => setBulkData({ ...bulkData, points: e.target.value })}
              placeholder="Enter points (negative to remove)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Use negative numbers to remove points</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={bulkData.type}
              onChange={(e) => setBulkData({ ...bulkData, type: e.target.value })}
              className="input w-full"
            >
              <option value="adjusted">Manual Adjustment</option>
              <option value="earned">Earned</option>
              <option value="redeemed">Redeemed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason *</label>
            <textarea
              value={bulkData.reason}
              onChange={(e) => setBulkData({ ...bulkData, reason: e.target.value })}
              rows={3}
              className="input w-full resize-none"
              placeholder="Reason for bulk points assignment"
              required
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium mb-2">Conditions (Optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">User Roles (comma-separated)</label>
                <Input
                  value={(bulkData.conditions?.roles || []).join(', ')}
                  onChange={(e) => setBulkData({
                    ...bulkData,
                    conditions: {
                      ...bulkData.conditions,
                      roles: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                    }
                  })}
                  placeholder="customer, retail, wholesale"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Customer Groups (comma-separated)</label>
                <Input
                  value={(bulkData.conditions?.groups || []).join(', ')}
                  onChange={(e) => setBulkData({
                    ...bulkData,
                    conditions: {
                      ...bulkData.conditions,
                      groups: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                    }
                  })}
                  placeholder="retail, wholesale, vip"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Min Points</label>
                  <Input
                    type="number"
                    value={bulkData.conditions?.minPoints || ''}
                    onChange={(e) => setBulkData({
                      ...bulkData,
                      conditions: {
                        ...bulkData.conditions,
                        minPoints: e.target.value ? parseInt(e.target.value) : null
                      }
                    })}
                    min="0"
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Max Points</label>
                  <Input
                    type="number"
                    value={bulkData.conditions?.maxPoints || ''}
                    onChange={(e) => setBulkData({
                      ...bulkData,
                      conditions: {
                        ...bulkData.conditions,
                        maxPoints: e.target.value ? parseInt(e.target.value) : null
                      }
                    })}
                    min="0"
                    placeholder="No maximum"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave conditions empty to assign to all customers
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoyaltyPointsManagementPage;
