import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { b2bkingAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoCreate, IoPeople, IoSearch } from 'react-icons/io5';

const CustomerGroupsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isActiveFilter, setIsActiveFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      defaultDiscount: 0,
      minimumOrderAmount: 0,
      minimumOrderQuantity: 0,
      paymentTerms: 'immediate',
      customPaymentTerms: '',
      creditLimit: 0,
      taxExempt: false,
      showPrices: true,
      showRetailPrices: false,
      isActive: true,
      priority: 0,
    }
  });

  const { data, isLoading } = useQuery(
    ['customer-groups', page, search, isActiveFilter],
    () => b2bkingAPI.getCustomerGroups({
      page,
      limit: 20,
      search: search.length >= 2 ? search : undefined,
      isActive: isActiveFilter || undefined
    }),
    { keepPreviousData: true }
  );

  const saveMutation = useMutation(
    (data) => editingGroup
      ? b2bkingAPI.updateCustomerGroup(editingGroup._id, data)
      : b2bkingAPI.createCustomerGroup(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customer-groups');
        toast.success(`Customer group ${editingGroup ? 'updated' : 'created'} successfully`);
        setShowForm(false);
        setEditingGroup(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save customer group');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => b2bkingAPI.deleteCustomerGroup(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customer-groups');
        toast.success('Customer group deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete customer group');
      },
    }
  );

  const handleEdit = (group) => {
    setEditingGroup(group);
    reset({
      name: group.name,
      description: group.description || '',
      defaultDiscount: group.defaultDiscount || 0,
      minimumOrderAmount: group.minimumOrderAmount || 0,
      minimumOrderQuantity: group.minimumOrderQuantity || 0,
      paymentTerms: group.paymentTerms || 'immediate',
      customPaymentTerms: group.customPaymentTerms || '',
      creditLimit: group.creditLimit || 0,
      taxExempt: group.taxExempt || false,
      showPrices: group.showPrices !== false,
      showRetailPrices: group.showRetailPrices || false,
      isActive: group.isActive !== false,
      priority: group.priority || 0,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingGroup(null);
    reset();
    setShowForm(true);
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-sm text-gray-500">{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Default Discount',
      accessor: 'defaultDiscount',
      cell: (row) => (
        <span className="text-green-600 font-medium">
          {row.defaultDiscount > 0 ? `${row.defaultDiscount}%` : '-'}
        </span>
      )
    },
    {
      header: 'Customers',
      accessor: 'customerCount',
      cell: (row) => (
        <span className="text-gray-600">{row.customerCount || 0}</span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      cell: (row) => (
        <span className="text-gray-600">{row.priority || 0}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            <IoCreate size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteModal(row)}
          >
            <IoTrash size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IoPeople size={28} />
            Customer Groups
          </h1>
          <p className="text-gray-600 mt-1">Manage customer groups and B2B pricing tiers</p>
        </div>
        <Button onClick={handleNew}>
          <IoAdd size={20} className="mr-2" />
          New Group
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search customer groups..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Active Only' },
                { value: 'false', label: 'Inactive Only' }
              ]}
              className="w-40"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={data?.data?.data || []}
          isLoading={isLoading}
          pagination={{
            page,
            totalPages: data?.data?.pagination?.pages || 1,
            onPageChange: setPage
          }}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingGroup(null);
          reset();
        }}
        title={editingGroup ? 'Edit Customer Group' : 'New Customer Group'}
        size="large"
      >
        <form onSubmit={handleSubmit(saveMutation.mutate)} className="space-y-4">
          <Input
            label="Name *"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Description"
            type="textarea"
            rows={3}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Discount (%)"
              type="number"
              min="0"
              max="100"
              {...register('defaultDiscount', { valueAsNumber: true })}
            />

            <Input
              label="Priority"
              type="number"
              {...register('priority', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Order Amount"
              type="number"
              min="0"
              {...register('minimumOrderAmount', { valueAsNumber: true })}
            />

            <Input
              label="Minimum Order Quantity"
              type="number"
              min="0"
              {...register('minimumOrderQuantity', { valueAsNumber: true })}
            />
          </div>

          <Select
            label="Payment Terms"
            {...register('paymentTerms')}
            options={[
              { value: 'immediate', label: 'Immediate' },
              { value: 'net_7', label: 'Net 7' },
              { value: 'net_15', label: 'Net 15' },
              { value: 'net_30', label: 'Net 30' },
              { value: 'net_60', label: 'Net 60' },
              { value: 'custom', label: 'Custom' }
            ]}
          />

          <Input
            label="Credit Limit"
            type="number"
            min="0"
            {...register('creditLimit', { valueAsNumber: true })}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('taxExempt')}
                className="rounded"
              />
              <span>Tax Exempt</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('showPrices')}
                className="rounded"
              />
              <span>Show Prices</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('showRetailPrices')}
                className="rounded"
              />
              <span>Show Retail Prices</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingGroup(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isLoading}>
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Customer Group"
      >
        <p className="mb-4">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>?
          {deleteModal?.customerCount > 0 && (
            <span className="block mt-2 text-red-600">
              This group has {deleteModal.customerCount} customer(s) assigned. You must reassign them first.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteModal._id)}
            loading={deleteMutation.isLoading}
            disabled={deleteModal?.customerCount > 0}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerGroupsPage;
