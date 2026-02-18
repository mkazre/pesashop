import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { giftCardsAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoAdd, IoGift, IoTrash, IoBan, IoCreate } from 'react-icons/io5';

const GiftCardsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data, isLoading } = useQuery(['gift-cards', page], 
    () => giftCardsAPI.getAll({ page, limit: 20 }),
    { keepPreviousData: true }
  );

  const [editingCard, setEditingCard] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [revokeModal, setRevokeModal] = useState(null);

  const createMutation = useMutation(
    (data) => giftCardsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('gift-cards');
        toast.success('Gift card created successfully');
        setShowForm(false);
        reset();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create gift card';
        toast.error(errorMessage);
        console.error('Gift card creation error:', error);
      },
    }
  );

  const updateMutation = useMutation(
    (data) => giftCardsAPI.update(editingCard._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('gift-cards');
        toast.success('Gift card updated successfully');
        setShowForm(false);
        setEditingCard(null);
        reset();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update gift card';
        toast.error(errorMessage);
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => giftCardsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('gift-cards');
        toast.success('Gift card deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete gift card';
        toast.error(errorMessage);
      },
    }
  );

  const revokeMutation = useMutation(
    (id) => giftCardsAPI.update(id, { isActive: false }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('gift-cards');
        toast.success('Gift card revoked successfully');
        setRevokeModal(null);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to revoke gift card';
        toast.error(errorMessage);
      },
    }
  );

  const onSubmit = (data) => {
    const submitData = {
      ...data,
      initialBalance: parseFloat(data.initialBalance),
      currentBalance: parseFloat(data.initialBalance),
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
    };
    
    if (editingCard) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    reset({
      ...card,
      expiryDate: card.expiryDate ? card.expiryDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const columns = [
    {
      key: 'code',
      title: 'Code',
      width: '200px',
      render: (code) => <span className="font-mono font-bold">{code}</span>,
    },
    {
      key: 'recipientEmail',
      title: 'Recipient',
      render: (email, row) => (
        <div>
          <p className="font-medium">{row.recipientName || email}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      ),
    },
    {
      key: 'initialBalance',
      title: 'Initial',
      width: '100px',
      render: (amount) => `R ${amount.toFixed(2)}`,
    },
    {
      key: 'currentBalance',
      title: 'Balance',
      width: '100px',
      render: (amount) => <span className="font-medium">R {amount.toFixed(2)}</span>,
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '100px',
      render: (active, row) => (
        <span className={`badge ${
          row.isRedeemed ? 'badge-success' :
          active ? 'badge-info' :
          'badge-error'
        }`}>
          {row.isRedeemed ? 'Redeemed' : active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      title: 'Expires',
      width: '120px',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      key: 'createdAt',
      title: 'Created',
      width: '120px',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <IoCreate size={18} />
          </button>
          {row.isActive && !row.isRedeemed && (
            <button
              onClick={() => setRevokeModal(row)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded"
              title="Revoke"
            >
              <IoBan size={18} />
            </button>
          )}
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <IoTrash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gift Cards</h1>
        <Button onClick={() => setShowForm(true)}>
          <IoAdd size={20} className="mr-2" />
          Create Gift Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cards</p>
              <p className="text-2xl font-bold text-primary">{data?.data?.total || 0}</p>
            </div>
            <IoGift size={32} className="text-primary opacity-20" />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Active Cards</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.data?.data?.filter(g => g.isActive && !g.isRedeemed).length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-primary">
            R {(data?.data?.data?.reduce((sum, g) => sum + g.currentBalance, 0) || 0).toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Redeemed</p>
          <p className="text-2xl font-bold text-gray-600">
            {data?.data?.data?.filter(g => g.isRedeemed).length || 0}
          </p>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={data?.data?.data || []} loading={isLoading} />
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
        onClose={() => { setShowForm(false); reset(); setEditingCard(null); }}
        title={editingCard ? 'Edit Gift Card' : 'Create Gift Card'}
        size="md"
        showFooter={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Initial Balance (ZAR)" type="number" step="0.01"
            {...register('initialBalance', { required: true })}
            error={errors.initialBalance && 'Required'} fullWidth />
          <Input label="Recipient Email" type="email"
            {...register('recipientEmail', { required: true })}
            error={errors.recipientEmail && 'Required'} fullWidth />
          <Input label="Recipient Name" {...register('recipientName')} fullWidth />
          <Input label="Sender Name" {...register('senderName')} fullWidth />
          <Input label="Expiry Date" type="date"
            {...register('expiryDate')} fullWidth />
          <div>
            <label className="block text-sm font-medium mb-1">Sender Message</label>
            <textarea {...register('senderMessage')} rows={3} className="input w-full resize-none" />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingCard(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={editingCard ? updateMutation.isLoading : createMutation.isLoading}>
              {editingCard ? 'Update Gift Card' : 'Create Gift Card'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!revokeModal}
        onClose={() => setRevokeModal(null)}
        title="Revoke Gift Card"
        size="sm"
      >
        <p className="mb-4">Are you sure you want to revoke this gift card?</p>
        <p className="text-sm text-gray-600 mb-4">
          Code: <span className="font-mono font-bold">{revokeModal?.code}</span>
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setRevokeModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => revokeMutation.mutate(revokeModal._id)} loading={revokeMutation.isLoading}>
            Revoke Gift Card
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Gift Card"
        size="sm"
      >
        <p className="mb-4">Are you sure you want to delete this gift card? This action cannot be undone.</p>
        <p className="text-sm text-gray-600 mb-4">
          Code: <span className="font-mono font-bold">{deleteModal?.code}</span>
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteModal._id)} loading={deleteMutation.isLoading}>
            Delete Gift Card
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default GiftCardsPage;
