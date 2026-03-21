import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { customersAPI, laybyesAPI, laybyPlansAPI, laybyApplicationsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoArrowBack, IoCreate, IoTrash, IoPerson, IoStar, IoCart, IoGift, IoCard, IoChatbubble, IoCalendar, IoMail, IoCall, IoLocation, IoAdd, IoWallet, IoClose, IoDownload, IoDocument } from 'react-icons/io5';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [editModal, setEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [addressModal, setAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressType, setAddressType] = useState('billing'); // 'billing' or 'shipping'
  const [laybyeModal, setLaybyeModal] = useState(false);
  const [editingLaybye, setEditingLaybye] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', paymentMethod: '', transactionId: '', note: '' });

  const { data, isLoading, error } = useQuery(
    ['customer', id],
    () => customersAPI.getOne(id),
    { 
      enabled: !!id,
      retry: 1,
      onError: (err) => {
        console.error('CustomerDetailPage - API Error:', err);
      }
    }
  );

  const updateMutation = useMutation(
    (data) => customersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer', id]);
        queryClient.invalidateQueries('customers');
        toast.success('Customer updated successfully');
        setEditModal(false);
        setEditingCustomer(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update customer');
      },
    }
  );

  // Laybyes queries and mutations
  const { data: laybyPlansData } = useQuery(
    'laybyPlans',
    () => laybyPlansAPI.getAll(),
    { enabled: activeTab === 'laybyes' }
  );

  const { data: customerApplicationsData } = useQuery(
    ['customerApplications', id],
    () => laybyApplicationsAPI.getByCustomer(id),
    { enabled: activeTab === 'laybyes' && !!id }
  );

  const createLaybyeMutation = useMutation(
    (data) => laybyesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer', id]);
        toast.success('Laybye created successfully');
        setLaybyeModal(false);
        setEditingLaybye(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create laybye');
      },
    }
  );

  const recordPaymentMutation = useMutation(
    ({ laybyeId, data }) => laybyesAPI.recordPayment(laybyeId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer', id]);
        toast.success('Payment recorded successfully');
        setPaymentModal(null);
        setPaymentData({ amount: '', paymentMethod: '', transactionId: '', note: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record payment');
      },
    }
  );

  const cancelLaybyeMutation = useMutation(
    ({ laybyeId, data }) => laybyesAPI.cancel(laybyeId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer', id]);
        toast.success('Laybye cancelled successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel laybye');
      },
    }
  );

  // Handle response structure - match OrderDetailPage pattern
  // Backend returns: { success: true, data: { customer, relatedData, statistics } }
  // Try both possible structures
  const responseData = data?.data?.data || data?.data || {};
  const customer = responseData?.customer;
  const relatedData = responseData?.relatedData || {};
  const statistics = responseData?.statistics || {};
  
  // Debug logging
  if (data && !customer && !isLoading) {
    console.log('CustomerDetailPage Debug:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      'data.data': data?.data,
      'data.data.data': data?.data?.data,
      'data.data.customer': data?.data?.customer,
      responseData,
      customer
    });
  }

  const tabs = [
    { id: 'details', label: 'Personal Details', icon: IoPerson },
    { id: 'orders', label: 'Orders', icon: IoCart, count: relatedData.orders?.length || 0 },
    { id: 'points', label: 'PESA Coins', icon: IoStar, count: relatedData.loyaltyPoints?.length || 0 },
    { id: 'laybyes', label: 'Laybyes', icon: IoCalendar, count: relatedData.laybyes?.length || 0 },
    { id: 'coupons', label: 'Coupons', icon: IoGift, count: relatedData.coupons?.length || 0 },
    { id: 'giftcards', label: 'Gift Cards', icon: IoCard, count: relatedData.giftCards?.length || 0 },
    { id: 'reviews', label: 'Reviews', icon: IoChatbubble, count: relatedData.reviews?.length || 0 },
  ];

  const handleEdit = () => {
    if (!customer) return;
    setEditingCustomer({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      customerGroup: customer.customerGroup,
      isActive: customer.isActive,
      isEmailVerified: customer.isEmailVerified,
      loyaltyPoints: customer.loyaltyPoints,
      addresses: customer.addresses || []
    });
    setEditModal(true);
  };

  const handleAddAddress = (type) => {
    setAddressType(type);
    setEditingAddress({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      company: '',
      street: '',
      street2: '',
      city: '',
      state: '',
      country: 'South Africa',
      postalCode: '',
      phone: customer.phone || '',
      email: customer.email || '',
      isDefault: false
    });
    setAddressModal(true);
  };

  const handleSave = () => {
    if (!editingCustomer) return;
    updateMutation.mutate(editingCustomer);
  };

  const handleSaveAddress = () => {
    if (!editingAddress) return;
    
    const updatedAddresses = [...(customer.addresses || [])];
    
    if (editingAddress.index !== undefined) {
      // Update existing address
      updatedAddresses[editingAddress.index] = {
        type: addressType,
        firstName: editingAddress.firstName,
        lastName: editingAddress.lastName,
        company: editingAddress.company || '',
        street: editingAddress.street,
        street2: editingAddress.street2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        country: editingAddress.country,
        postalCode: editingAddress.postalCode,
        phone: editingAddress.phone || '',
        email: editingAddress.email || '',
        isDefault: editingAddress.isDefault || false
      };
    } else {
      // Add new address
      updatedAddresses.push({
        type: addressType,
        firstName: editingAddress.firstName,
        lastName: editingAddress.lastName,
        company: editingAddress.company || '',
        street: editingAddress.street,
        street2: editingAddress.street2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        country: editingAddress.country,
        postalCode: editingAddress.postalCode,
        phone: editingAddress.phone || '',
        email: editingAddress.email || '',
        isDefault: editingAddress.isDefault || false
      });
    }
    
    updateMutation.mutate({ addresses: updatedAddresses });
    setAddressModal(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = (index) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    const updatedAddresses = customer.addresses.filter((_, i) => i !== index);
    updateMutation.mutate({ addresses: updatedAddresses });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || (!customer && !isLoading)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          <IoArrowBack size={20} />
          Back to Customers
        </Button>
        <Card>
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">Customer not found</p>
            <p className="text-xs text-gray-400 mb-4">Customer ID: {id}</p>
            {error && (
              <div className="mt-2">
                <p className="text-sm text-red-500 font-medium">Error:</p>
                <p className="text-sm text-red-500">
                  {error.response?.data?.message || error.message || 'Failed to load customer'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Status: {error.response?.status || 'N/A'} | 
                  Check console for details
                </p>
              </div>
            )}
            {data?.data?.message && (
              <p className="text-sm text-red-500 mt-2">{data.data.message}</p>
            )}
            {!error && data && (
              <p className="text-xs text-gray-400 mt-2">
                Response received but customer data not found. Check console for structure.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return null; // Still loading
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            <IoArrowBack size={20} />
            Back to Customers
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.firstName} {customer.lastName}</h1>
            <p className="text-sm text-gray-500 mt-1">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-error'}`}>
            {customer.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="badge badge-info capitalize">{customer.customerGroup}</span>
          <Button onClick={handleEdit}>
            <IoCreate size={18} />
            Edit Customer
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-primary">R {statistics.totalSpent?.toFixed(2) || '0.00'}</p>
            </div>
            <IoCart className="text-primary text-3xl" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-primary">{statistics.totalOrders || 0}</p>
            </div>
            <IoCart className="text-primary text-3xl" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">PESA Coins</p>
              <p className="text-2xl font-bold text-secondary">{statistics.totalLoyaltyPoints || customer.loyaltyPoints || 0}</p>
            </div>
            <IoStar className="text-secondary text-3xl" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-primary">R {statistics.averageOrderValue?.toFixed(2) || '0.00'}</p>
            </div>
            <IoCart className="text-primary text-3xl" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="badge badge-sm badge-primary">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">First Name</label>
                    <p className="font-medium">{customer.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Last Name</label>
                    <p className="font-medium">{customer.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <IoMail size={16} />
                      Email
                    </label>
                    <p className="font-medium">{customer.email}</p>
                    {customer.isEmailVerified && (
                      <span className="badge badge-sm badge-success mt-1">Verified</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <IoCall size={16} />
                      Phone
                    </label>
                    <p className="font-medium">{customer.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Customer Group</label>
                    <p className="font-medium capitalize">{customer.customerGroup}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Account Status</label>
                    <p className="font-medium">
                      <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-error'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Member Since</label>
                    <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Last Login</label>
                    <p className="font-medium">{customer.lastLogin ? new Date(customer.lastLogin).toLocaleDateString('en-ZA') : 'Never'}</p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <IoLocation size={20} />
                    Addresses
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddAddress('billing')}
                    >
                      Add Billing
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddAddress('shipping')}
                    >
                      Add Shipping
                    </Button>
                  </div>
                </div>
                {customer.addresses && customer.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map((address, index) => (
                      <div key={index} className="p-4 border-2 border-gray-200 rounded-lg relative">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium capitalize">{address.type} Address</p>
                          <div className="flex items-center gap-2">
                            {address.isDefault && (
                              <span className="badge badge-sm badge-primary">Default</span>
                            )}
                            <button
                              onClick={() => {
                                setAddressType(address.type);
                                setEditingAddress({ 
                                  ...address, 
                                  index,
                                  firstName: address.firstName || '',
                                  lastName: address.lastName || '',
                                  company: address.company || '',
                                  street: address.street || '',
                                  street2: address.street2 || '',
                                  city: address.city || '',
                                  state: address.state || '',
                                  country: address.country || '',
                                  postalCode: address.postalCode || '',
                                  phone: address.phone || '',
                                  email: address.email || '',
                                  isDefault: address.isDefault || false
                                });
                                setAddressModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Address"
                            >
                              <IoCreate size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{address.firstName} {address.lastName}</p>
                          {address.company && <p className="font-medium">{address.company}</p>}
                          <p>{address.street}</p>
                          {address.street2 && <p>{address.street2}</p>}
                          <p>{address.city}, {address.state} {address.postalCode}</p>
                          <p>{address.country}</p>
                          {address.phone && <p>Phone: {address.phone}</p>}
                          {address.email && <p>Email: {address.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                    <IoLocation size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No addresses added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {relatedData.orders && relatedData.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-sm">Order #</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                        <th className="text-center py-3 px-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedData.orders.map((order) => (
                        <tr key={order._id} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">#{order.orderNumber}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('en-ZA')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="badge badge-sm">{order.status}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">R {order.total?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/orders/${order._id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <IoCart size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No orders found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div>
              {relatedData.loyaltyPoints && relatedData.loyaltyPoints.length > 0 ? (
                <div className="space-y-3">
                  {relatedData.loyaltyPoints.map((point) => (
                    <div key={point._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{point.description || 'PESA Coin Transaction'}</p>
                          <p className="text-sm text-gray-600">{new Date(point.createdAt).toLocaleString('en-ZA')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${point.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                            {point.type === 'earned' ? '+' : '-'}{point.points}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{point.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <IoStar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No PESA Coins history</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'laybyes' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Laybyes</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingLaybye({
                      customerId: customer._id,
                      laybyPlanId: '',
                      totalAmount: 0,
                      depositAmount: 0,
                      numberOfPayments: 4,
                      frequency: 'monthly',
                      notes: ''
                    });
                    setLaybyeModal(true);
                  }}
                >
                  <IoAdd size={18} />
                  Add Laybye
                </Button>
              </div>
              {relatedData.laybyes && relatedData.laybyes.length > 0 ? (
                <div className="space-y-3">
                  {relatedData.laybyes.map((laybye) => (
                    <div key={laybye._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">Laybye #{laybye._id?.slice(-8) || 'N/A'}</p>
                            <span className={`badge badge-sm ${
                              laybye.status === 'active' ? 'badge-success' :
                              laybye.status === 'completed' ? 'badge-info' :
                              laybye.status === 'cancelled' ? 'badge-error' : 'badge-warning'
                            }`}>
                              {laybye.status}
                            </span>
                            {laybye.isExpired && (
                              <span className="badge badge-sm badge-error">Expired</span>
                            )}
                          </div>
                          {laybye.laybyPlan?.name && (
                            <p className="text-sm text-gray-600 mb-1">Plan: {laybye.laybyPlan.name}</p>
                          )}
                          {laybye.order?.orderNumber && (
                            <p className="text-sm text-gray-600 mb-1">Order: #{laybye.order.orderNumber}</p>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-600">Total Amount:</p>
                              <p className="font-medium">R {laybye.totalAmount?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Paid:</p>
                              <p className="font-medium text-green-600">R {laybye.paidAmount?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Remaining:</p>
                              <p className="font-medium text-red-600">R {laybye.remainingAmount?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Next Payment:</p>
                              <p className="font-medium">
                                {laybye.nextPaymentDate ? new Date(laybye.nextPaymentDate).toLocaleDateString('en-ZA') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          {laybye.expiryDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              Expires: {new Date(laybye.expiryDate).toLocaleDateString('en-ZA')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {laybye.status === 'active' && (
                            <>
                              <button
                                onClick={() => {
                                  setPaymentModal(laybye);
                                  setPaymentData({
                                    amount: laybye.installmentPlan?.installmentAmount?.toFixed(2) || '',
                                    paymentMethod: '',
                                    transactionId: '',
                                    note: ''
                                  });
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Record Payment"
                              >
                                <IoWallet size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLaybye(laybye);
                                  setLaybyeModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Laybye"
                              >
                                <IoCreate size={18} />
                              </button>
                            </>
                          )}
                          {laybye.status === 'active' && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this laybye?')) {
                                  const reason = prompt('Cancellation reason:');
                                  if (reason) {
                                    cancelLaybyeMutation.mutate({
                                      laybyeId: laybye._id,
                                      data: { reason, keepDeposit: false }
                                    });
                                  }
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Cancel Laybye"
                            >
                              <IoClose size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <IoCalendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No laybyes found</p>
                </div>
              )}

              {/* Layby Applications with ID/Passport Download */}
              {(() => {
                const apps = customerApplicationsData?.data?.data || [];
                if (apps.length === 0) return null;
                return (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Layby Applications & ID Documents</h3>
                    <div className="space-y-3">
                      {apps.map((app) => (
                        <div key={app._id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">{app.productName}</p>
                                <span className={`badge badge-sm ${
                                  app.status === 'pending' ? 'badge-warning' :
                                  app.status === 'approved' ? 'badge-success' :
                                  app.status === 'rejected' ? 'badge-error' : ''
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">R {(app.productPrice || 0).toFixed(2)}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Applied: {new Date(app.createdAt).toLocaleDateString('en-ZA')}
                              </p>
                            </div>
                            {app.idDocument && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await laybyApplicationsAPI.downloadDocument(app._id);
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', app.idDocument.originalName || 'id-document');
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);
                                  } catch (err) {
                                    toast.error('Failed to download document');
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                                title="Download ID/Passport"
                              >
                                <IoDocument size={18} className="text-primary" />
                                <span className="hidden sm:inline">{app.idDocument.originalName?.slice(0, 20)}</span>
                                <IoDownload size={16} className="text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'coupons' && (
            <div>
              {relatedData.coupons && relatedData.coupons.length > 0 ? (
                <div className="space-y-3">
                  {relatedData.coupons.map((coupon) => (
                    <div key={coupon._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Code: {coupon.code}</p>
                          <p className="text-sm text-gray-600">{coupon.description || 'No description'}</p>
                        </div>
                        <div className="text-right">
                          <span className="badge badge-sm">{coupon.type}</span>
                          <p className="text-sm text-gray-600 mt-1">
                            Used: {coupon.usedBy?.find(u => u.user.toString() === customer._id)?.count || 0} times
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <IoGift size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No coupons used</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'giftcards' && (
            <div>
              {relatedData.giftCards && relatedData.giftCards.length > 0 ? (
                <div className="space-y-3">
                  {relatedData.giftCards.map((card) => (
                    <div key={card._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Code: {card.code}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(card.createdAt).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R {card.currentBalance?.toFixed(2)}</p>
                          <span className="badge badge-sm">{card.isRedeemed ? 'Redeemed' : 'Active'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <IoCard size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No gift cards found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {relatedData.reviews && relatedData.reviews.length > 0 ? (
                <div className="space-y-3">
                  {relatedData.reviews.map((review) => (
                    <div key={review._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{review.product?.name || 'Product'}</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <IoStar
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          {review.title && <p className="font-medium mb-1">{review.title}</p>}
                          <p className="text-sm text-gray-600">{review.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.createdAt).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                        <span className="badge badge-sm">{review.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <IoChatbubble size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No reviews found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => {
          setEditModal(false);
          setEditingCustomer(null);
        }}
        title="Edit Customer"
        onConfirm={handleSave}
        confirmText="Save Changes"
        confirmLoading={updateMutation.isLoading}
        size="lg"
      >
        {editingCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input
                  value={editingCustomer.firstName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input
                  value={editingCustomer.lastName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={editingCustomer.email}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input
                value={editingCustomer.phone}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Customer Group</label>
              <select
                value={editingCustomer.customerGroup}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, customerGroup: e.target.value })}
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
                    checked={editingCustomer.isActive}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingCustomer.isEmailVerified}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, isEmailVerified: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Email Verified</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PESA Coins</label>
              <Input
                type="number"
                value={editingCustomer.loyaltyPoints}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, loyaltyPoints: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Address Modal */}
      <Modal
        isOpen={addressModal}
        onClose={() => {
          setAddressModal(false);
          setEditingAddress(null);
        }}
        title={editingAddress?.index !== undefined ? `Edit ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address` : `Add ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`}
        onConfirm={handleSaveAddress}
        confirmText={editingAddress?.index !== undefined ? 'Update Address' : 'Add Address'}
        confirmLoading={updateMutation.isLoading}
        size="lg"
      >
        {editingAddress && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input
                  value={editingAddress.firstName || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input
                  value={editingAddress.lastName || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <Input
                value={editingAddress.company || ''}
                onChange={(e) => setEditingAddress({ ...editingAddress, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Street Address *</label>
              <Input
                value={editingAddress.street || ''}
                onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Street Address 2</label>
              <Input
                value={editingAddress.street2 || ''}
                onChange={(e) => setEditingAddress({ ...editingAddress, street2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <Input
                  value={editingAddress.city || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State/Province *</label>
                <Input
                  value={editingAddress.state || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code *</label>
                <Input
                  value={editingAddress.postalCode || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, postalCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
                <Input
                  value={editingAddress.country || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  value={editingAddress.phone || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={editingAddress.email || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingAddress.isDefault || false}
                  onChange={(e) => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm font-medium">Set as default {addressType} address</span>
              </label>
            </div>
            {editingAddress.index !== undefined && (
              <div className="pt-2 border-t">
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(editingAddress.index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Delete this address
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Laybye Modal */}
      <Modal
        isOpen={laybyeModal}
        onClose={() => {
          setLaybyeModal(false);
          setEditingLaybye(null);
        }}
        title={editingLaybye?._id ? 'Edit Laybye' : 'Create Laybye'}
        onConfirm={() => {
          if (editingLaybye?._id) {
            // Update existing laybye
            laybyesAPI.update(editingLaybye._id, {
              notes: editingLaybye.notes,
              adminNotes: editingLaybye.adminNotes,
              nextPaymentDate: editingLaybye.nextPaymentDate,
              expiryDate: editingLaybye.expiryDate
            }).then(() => {
              queryClient.invalidateQueries(['customer', id]);
              toast.success('Laybye updated successfully');
              setLaybyeModal(false);
              setEditingLaybye(null);
            }).catch((error) => {
              toast.error(error.response?.data?.message || 'Failed to update laybye');
            });
          } else {
            // Create new laybye
            createLaybyeMutation.mutate({
              customerId: editingLaybye.customerId,
              laybyPlanId: editingLaybye.laybyPlanId,
              totalAmount: editingLaybye.totalAmount,
              depositAmount: editingLaybye.depositAmount,
              numberOfPayments: editingLaybye.numberOfPayments,
              frequency: editingLaybye.frequency,
              notes: editingLaybye.notes
            });
          }
        }}
        confirmText={editingLaybye?._id ? 'Update Laybye' : 'Create Laybye'}
        confirmLoading={createLaybyeMutation.isLoading}
        size="lg"
      >
        {editingLaybye && (
          <div className="space-y-4">
            {!editingLaybye._id && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Layby Plan *</label>
                  <select
                    value={editingLaybye.laybyPlanId}
                    onChange={(e) => setEditingLaybye({ ...editingLaybye, laybyPlanId: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Select a plan</option>
                    {(laybyPlansData?.data?.data || laybyPlansData?.data || []).map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} ({plan.depositPercentage}% deposit, {plan.numberOfPayments} × {plan.frequency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Amount (R) *</label>
                  <Input
                    type="number"
                    value={editingLaybye.totalAmount}
                    onChange={(e) => setEditingLaybye({ ...editingLaybye, totalAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deposit Amount (R)</label>
                  <Input
                    type="number"
                    value={editingLaybye.depositAmount}
                    onChange={(e) => setEditingLaybye({ ...editingLaybye, depositAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use plan default</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Payments *</label>
                    <Input
                      type="number"
                      value={editingLaybye.numberOfPayments}
                      onChange={(e) => setEditingLaybye({ ...editingLaybye, numberOfPayments: parseInt(e.target.value) || 1 })}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequency *</label>
                    <select
                      value={editingLaybye.frequency}
                      onChange={(e) => setEditingLaybye({ ...editingLaybye, frequency: e.target.value })}
                      className="input w-full"
                      required
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={editingLaybye.notes || ''}
                onChange={(e) => setEditingLaybye({ ...editingLaybye, notes: e.target.value })}
                rows={3}
                className="input w-full resize-none"
              />
            </div>
            {editingLaybye._id && (
              <div>
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                <textarea
                  value={editingLaybye.adminNotes || ''}
                  onChange={(e) => setEditingLaybye({ ...editingLaybye, adminNotes: e.target.value })}
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={!!paymentModal}
        onClose={() => {
          setPaymentModal(null);
          setPaymentData({ amount: '', paymentMethod: '', transactionId: '', note: '' });
        }}
        title="Record Payment"
        onConfirm={() => {
          recordPaymentMutation.mutate({
            laybyeId: paymentModal._id,
            data: {
              amount: parseFloat(paymentData.amount),
              paymentMethod: paymentData.paymentMethod || 'manual',
              transactionId: paymentData.transactionId,
              note: paymentData.note
            }
          });
        }}
        confirmText="Record Payment"
        confirmLoading={recordPaymentMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (R) *</label>
            <Input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
            {paymentModal && paymentModal.installmentPlan && (
              <p className="text-xs text-gray-500 mt-1">
                Suggested: R {paymentModal.installmentPlan.installmentAmount?.toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <Input
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              placeholder="e.g., Cash, Bank Transfer, Credit Card"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Transaction ID</label>
            <Input
              value={paymentData.transactionId}
              onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note</label>
            <textarea
              value={paymentData.note}
              onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
              rows={3}
              className="input w-full resize-none"
              placeholder="Optional payment note"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;
