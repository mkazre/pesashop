import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { customersAPI } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoSearch, IoEye, IoTrash, IoPerson, IoStar } from 'react-icons/io5';

const CustomersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerGroup: 'retail',
    password: '',
    isActive: true,
    isEmailVerified: false
  });

  const { data, isLoading } = useQuery(
    ['customers', page, search],
    () => customersAPI.getAll({ page, limit: 20, search }),
    { keepPreviousData: true }
  );

  const deleteMutation = useMutation(
    (id) => customersAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Customer deleted successfully');
        setDeleteModal(null);
      },
      onError: () => {
        toast.error('Failed to delete customer');
      },
    }
  );

  const createMutation = useMutation(
    (data) => customersAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Customer created successfully');
        setCreateModal(false);
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          customerGroup: 'retail',
          password: '',
          isActive: true,
          isEmailVerified: false
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create customer');
      },
    }
  );

  const handleCreate = () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(newCustomer);
  };

  const columns = [
    {
      key: '_id',
      title: 'Customer',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary bg-opacity-10 flex items-center justify-center">
            <IoPerson className="text-primary" size={20} />
          </div>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      width: '150px',
      render: (phone) => phone || '-',
    },
    {
      key: 'customerGroup',
      title: 'Group',
      width: '120px',
      render: (group) => (
        <span className="badge badge-info capitalize">{group}</span>
      ),
    },
    {
      key: 'orderCount',
      title: 'Orders',
      width: '100px',
      align: 'center',
      render: (count) => count || 0,
    },
    {
      key: 'totalSpent',
      title: 'Total Spent',
      width: '120px',
      render: (amount) => `R ${(amount || 0).toFixed(2)}`,
    },
    {
      key: 'loyaltyPoints',
      title: 'Points',
      width: '100px',
      align: 'center',
      render: (points) => (
        <span className="flex items-center justify-center gap-1">
          <IoStar className="text-secondary" size={16} />
          {points || 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Joined',
      width: '120px',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/${row._id}`);
            }}
            className="p-2 hover:bg-gray-100 transition-colors"
            title="View Details"
          >
            <IoEye size={18} className="text-primary" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal(row);
            }}
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
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => setCreateModal(true)}>
          <IoPerson size={18} />
          Create Customer
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-primary">{data?.data?.pagination?.total || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">New This Month</p>
          <p className="text-2xl font-bold text-primary">0</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Active Customers</p>
          <p className="text-2xl font-bold text-primary">{data?.data?.pagination?.total || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">VIP Customers</p>
          <p className="text-2xl font-bold text-primary">0</p>
        </Card>
      </div>

      <Card>
        {/* Search and Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select className="input">
            <option value="">All Groups</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="vip">VIP</option>
          </select>
        </div>

        {/* Customers Table */}
        <Table
          columns={columns}
          data={(() => {
            if (!data) return [];
            const serverResponse = data.data || data;
            if (serverResponse?.data && Array.isArray(serverResponse.data)) {
              return serverResponse.data;
            }
            if (Array.isArray(serverResponse)) {
              return serverResponse;
            }
            if (Array.isArray(data.data)) {
              return data.data;
            }
            return [];
          })()}
          loading={isLoading}
          onRowClick={(row) => navigate(`/customers/${row._id}`)}
        />

        {/* Pagination */}
        {data?.data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Page {page} of {data.data.pagination.pages} ({data.data.pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                disabled={page === data.data.pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Customer Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => {
          setCreateModal(false);
          setNewCustomer({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            customerGroup: 'retail',
            password: '',
            isActive: true,
            isEmailVerified: false
          });
        }}
        title="Create New Customer"
        onConfirm={handleCreate}
        confirmText="Create Customer"
        confirmLoading={createMutation.isLoading}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name *</label>
              <Input
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name *</label>
              <Input
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <Input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <Input
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={newCustomer.password}
              onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
              placeholder="Leave empty for default password"
            />
            <p className="text-xs text-gray-500 mt-1">If left empty, default password will be: TempPassword123!</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Customer Group</label>
            <select
              value={newCustomer.customerGroup}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerGroup: e.target.value })}
              className="input w-full"
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="vip">VIP</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCustomer.isActive}
                  onChange={(e) => setNewCustomer({ ...newCustomer, isActive: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCustomer.isEmailVerified}
                  onChange={(e) => setNewCustomer({ ...newCustomer, isEmailVerified: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm font-medium">Email Verified</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Customer"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.firstName} {deleteModal?.lastName}</strong>?</p>
        <p className="text-sm text-gray-600 mt-2">This will also delete all associated orders and data.</p>
      </Modal>
    </div>
  );
};

export default CustomersPage;
