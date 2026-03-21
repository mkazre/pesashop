import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { couponsAPI, categoriesAPI, productsAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoCreate, IoPricetag, IoSettings, IoMail } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const CouponsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      minimumAmount: '',
      usageLimit: '',
      usageLimitPerUser: '1',
      startDate: '',
      endDate: '',
      isActive: true,
    }
  });

  const { data, isLoading } = useQuery(['coupons', page], 
    () => couponsAPI.getAll({ page, limit: 20 }),
    { keepPreviousData: true }
  );

  const { data: categories } = useQuery('categories', () => categoriesAPI.getAll());

  const saveMutation = useMutation(
    (data) => editingCoupon 
      ? couponsAPI.update(editingCoupon._id, data) 
      : couponsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success(`Coupon ${editingCoupon ? 'updated' : 'created'} successfully`);
        setShowForm(false);
        setEditingCoupon(null);
        reset();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save coupon';
        toast.error(errorMessage);
        console.error('Coupon save error:', error);
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => couponsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success('Coupon deleted successfully');
        setDeleteModal(null);
      },
    }
  );

  const onSubmit = (data) => {
    const processedData = {
      ...data,
      value: parseFloat(data.value),
      minimumAmount: data.minimumAmount ? parseFloat(data.minimumAmount) : undefined,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined,
      usageLimitPerUser: parseInt(data.usageLimitPerUser),
    };
    saveMutation.mutate(processedData);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    reset({
      ...coupon,
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const columns = [
    {
      key: 'code',
      title: 'Code',
      width: '150px',
      render: (code) => <span className="font-mono font-bold">{code}</span>,
    },
    {
      key: 'description',
      title: 'Description',
    },
    {
      key: 'type',
      title: 'Type',
      width: '120px',
      render: (type, row) => (
        <span>
          {type === 'percentage' ? `${row.value}%` : 
           type === 'fixed' ? `R ${row.value}` : 
           'Free Shipping'}
        </span>
      ),
    },
    {
      key: 'usageCount',
      title: 'Used',
      width: '80px',
      align: 'center',
      render: (count, row) => `${count}${row.usageLimit ? `/${row.usageLimit}` : ''}`,
    },
    {
      key: 'startDate',
      title: 'Valid From',
      width: '120px',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Always',
    },
    {
      key: 'endDate',
      title: 'Valid Until',
      width: '120px',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'No expiry',
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '100px',
      render: (active) => (
        <span className={`badge ${active ? 'badge-success' : 'badge-error'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteModal(row); }}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/coupons/email-settings')}
          >
            <IoMail size={18} className="mr-2" />
            Email Settings
          </Button>
          <Button onClick={() => { setShowForm(true); setEditingCoupon(null); reset(); }}>
            <IoAdd size={20} className="mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Total Coupons</p>
          <p className="text-2xl font-bold text-primary">{data?.data?.total || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Active Coupons</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.data?.data?.filter(c => c.isActive).length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Total Usage</p>
          <p className="text-2xl font-bold text-primary">
            {data?.data?.data?.reduce((sum, c) => sum + c.usageCount, 0) || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-600">
            {data?.data?.data?.filter(c => c.endDate && new Date(c.endDate) < new Date()).length || 0}
          </p>
        </Card>
      </div>

      <Card>
        <Table
          columns={columns}
          data={data?.data?.data || []}
          loading={isLoading}
        />
        
        {data?.data?.pages > 1 && (
          <div className="flex justify-between mt-6">
            <p className="text-sm text-gray-600">Page {page} of {data.data.pages}</p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="ghost" disabled={page === data.data.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingCoupon(null); reset(); }}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        size="lg"
        showFooter={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Coupon Code" {...register('code', { required: true })} 
              error={errors.code && 'Required'} fullWidth />
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select {...register('type')} className="input w-full">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          <Input label="Description" {...register('description')} fullWidth />

          {watch('type') !== 'free_shipping' && (
            <Input label={watch('type') === 'percentage' ? 'Discount %' : 'Discount Amount (ZAR)'}
              type="number" step="0.01" {...register('value', { required: true })}
              error={errors.value && 'Required'} fullWidth />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum Amount (ZAR)" type="number" step="0.01" {...register('minimumAmount')} fullWidth />
            <Input label="Usage Limit" type="number" {...register('usageLimit')} 
              helperText="Leave empty for unlimited" fullWidth />
          </div>

          <Input label="Usage Limit Per User" type="number" {...register('usageLimitPerUser')} fullWidth />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate')} fullWidth />
            <Input label="End Date" type="date" {...register('endDate')} fullWidth />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </label>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingCoupon(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isLoading}>
              {editingCoupon ? 'Update' : 'Create'} Coupon
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Coupon"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete coupon <strong>{deleteModal?.code}</strong>?</p>
      </Modal>
    </div>
  );
};

export default CouponsPage;
