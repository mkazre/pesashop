import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ordersAPI, laybyesAPI } from '@/services/api';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoArrowBack, IoCreate, IoTrash, IoCheckmark, IoClose, IoAdd } from 'react-icons/io5';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [adminNoteModal, setAdminNoteModal] = useState(false);
  const [editingAdminNote, setEditingAdminNote] = useState('');
  const [noteModal, setNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState({ content: '', isCustomerNotified: false });
  const [editingNoteId, setEditingNoteId] = useState(null);

  const { data, isLoading } = useQuery(
    ['order', id],
    () => ordersAPI.getOne(id),
    { enabled: !!id }
  );

  const updateStatusMutation = useMutation(
    (data) => ordersAPI.updateStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries('orders');
        toast.success('Order status updated successfully');
        setStatusModal(false);
        setNewStatus('');
        setStatusNote('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      },
    }
  );

  const updateAdminNoteMutation = useMutation(
    (adminNote) => ordersAPI.updateAdminNote(id, adminNote),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries('orders');
        toast.success('Admin note updated successfully');
        setAdminNoteModal(false);
        setEditingAdminNote('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update admin note');
      },
    }
  );

  const order = data?.data?.data || data?.data;

  const handleEditAdminNote = () => {
    if (!order) return;
    setEditingAdminNote(order.adminNote || '');
    setAdminNoteModal(true);
  };

  const handleSaveAdminNote = () => {
    if (!order) return;
    updateAdminNoteMutation.mutate(editingAdminNote);
  };

  const handleDeleteAdminNote = () => {
    if (!order) return;
    if (window.confirm('Are you sure you want to delete this admin note?')) {
      updateAdminNoteMutation.mutate('');
    }
  };

  // Notes CRUD mutations
  const addNoteMutation = useMutation(
    (data) => ordersAPI.addNote(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        toast.success('Note added successfully');
        setNoteModal(false);
        setEditingNote({ content: '', isCustomerNotified: false });
        setEditingNoteId(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add note');
      },
    }
  );

  const updateNoteMutation = useMutation(
    ({ noteId, data }) => ordersAPI.updateNote(id, noteId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        toast.success('Note updated successfully');
        setNoteModal(false);
        setEditingNote({ content: '', isCustomerNotified: false });
        setEditingNoteId(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update note');
      },
    }
  );

  const deleteNoteMutation = useMutation(
    (noteId) => ordersAPI.deleteNote(id, noteId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        toast.success('Note deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete note');
      },
    }
  );

  const handleAddNote = () => {
    setEditingNote({ content: '', isCustomerNotified: false });
    setEditingNoteId(null);
    setNoteModal(true);
  };

  const handleEditNote = (note) => {
    setEditingNote({ content: note.content, isCustomerNotified: note.isCustomerNotified || false });
    setEditingNoteId(note._id);
    setNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!editingNote.content.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }
    if (editingNoteId) {
      updateNoteMutation.mutate({ noteId: editingNoteId, data: editingNote });
    } else {
      addNoteMutation.mutate(editingNote);
    }
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'refunded': 'bg-gray-100 text-gray-800 border-gray-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200',
      'refunded': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' }
  ];

  const handleStatusUpdate = () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    updateStatusMutation.mutate({
      status: newStatus,
      note: statusNote
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          <IoArrowBack size={20} />
          Back to Orders
        </Button>
        <Card>
          <div className="p-8 text-center text-gray-500">
            Order not found
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            <IoArrowBack size={20} />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleString('en-ZA', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
          </span>
          <Button
            variant="secondary"
            onClick={() => {
              setNewStatus(order.status);
              setStatusModal(true);
            }}
          >
            <IoCreate size={18} />
            Update Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card title="Order Items">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-sm">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">SKU</th>
                    <th className="text-center py-3 px-4 font-medium text-sm">Quantity</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Price</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.name}</div>
                        {item.variation && Object.keys(item.variation).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.variation).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.sku || '-'}</td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        {item.salePrice ? (
                          <div>
                            <div className="text-gray-400 line-through text-sm">R {item.price.toFixed(2)}</div>
                            <div>R {item.salePrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div>R {item.price.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">R {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="py-3 px-4 text-right font-medium">Subtotal:</td>
                    <td className="py-3 px-4 text-right font-medium">R {order.subtotal?.toFixed(2) || '0.00'}</td>
                  </tr>
                  {order.tax > 0 && (
                    <tr>
                      <td colSpan="4" className="py-3 px-4 text-right">Tax ({order.taxRate}%):</td>
                      <td className="py-3 px-4 text-right">R {order.tax?.toFixed(2) || '0.00'}</td>
                    </tr>
                  )}
                  {order.shipping > 0 && (
                    <tr>
                      <td colSpan="4" className="py-3 px-4 text-right">Shipping ({order.shippingMethod || 'Standard'}):</td>
                      <td className="py-3 px-4 text-right">R {order.shipping?.toFixed(2) || '0.00'}</td>
                    </tr>
                  )}
                  {order.giftCardsApplied && order.giftCardsApplied.length > 0 && (
                    <>
                      {order.giftCardsApplied.map((gc, idx) => (
                        <tr key={idx}>
                          <td colSpan="4" className="py-3 px-4 text-right text-blue-600">
                            Gift Card ({gc.code || 'N/A'}):
                          </td>
                          <td className="py-3 px-4 text-right text-blue-600">-R {gc.amount?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  {order.couponsApplied && order.couponsApplied.length > 0 && (
                    <>
                      {order.couponsApplied.map((cp, idx) => (
                        <tr key={idx}>
                          <td colSpan="4" className="py-3 px-4 text-right text-purple-600">
                            Coupon ({cp.code || 'N/A'}):
                          </td>
                          <td className="py-3 px-4 text-right text-purple-600">-R {cp.discount?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  {order.loyaltyPointsUsed > 0 && (
                    <tr>
                      <td colSpan="4" className="py-3 px-4 text-right text-orange-600">
                        PESA Coins ({order.loyaltyPointsUsed} coins):
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        -R {order.loyaltyPointsUsed?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  )}
                  {order.discount > 0 && (
                    <tr>
                      <td colSpan="4" className="py-3 px-4 text-right text-green-600">Other Discount:</td>
                      <td className="py-3 px-4 text-right text-green-600">-R {order.discount?.toFixed(2) || '0.00'}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan="4" className="py-3 px-4 text-right font-bold text-lg">Total:</td>
                    <td className="py-3 px-4 text-right font-bold text-lg">R {order.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card title="Status History">
              <div className="space-y-3">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(history.status)}`}>
                          {history.status.charAt(0).toUpperCase() + history.status.slice(1).replace('-', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(history.timestamp).toLocaleString('en-ZA')}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card title="Order Notes">
            <div className="space-y-4">
              {order.customerNote && (
                <div>
                  <h4 className="font-medium mb-2">Customer Note:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{order.customerNote}</p>
                </div>
              )}
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-base">Admin Note:</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEditAdminNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md transition-all shadow-md hover:shadow-lg"
                      title={order.adminNote ? 'Edit Admin Note' : 'Add Admin Note'}
                    >
                      <IoCreate size={18} />
                      {order.adminNote ? 'Edit' : 'Add Note'}
                    </button>
                    {order.adminNote && (
                      <button
                        type="button"
                        onClick={handleDeleteAdminNote}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md transition-all shadow-md hover:shadow-lg"
                        title="Delete Admin Note"
                      >
                        <IoTrash size={18} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {order.adminNote ? (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-[60px]">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.adminNote}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 border-dashed min-h-[60px] flex items-center">
                    <p className="text-sm text-gray-400 italic">
                      No admin note added yet. Click "Add Note" to add one.
                    </p>
                  </div>
                )}
              </div>
              {/* Additional Notes Section */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-base">Additional Notes:</h4>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-md transition-all shadow-md hover:shadow-lg"
                    title="Add New Note"
                  >
                    <IoAdd size={18} />
                    Add Note
                  </button>
                </div>
                {order.notes && order.notes.length > 0 ? (
                  <div className="space-y-3">
                    {order.notes.map((note) => (
                      <div key={note._id || note.createdAt} className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500 font-medium">
                                {new Date(note.createdAt).toLocaleString('en-ZA')}
                              </span>
                              {note.isCustomerNotified && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                                  Customer Notified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditNote(note)}
                              className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                              title="Edit Note"
                            >
                              <IoCreate size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note._id)}
                              className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
                              title="Delete Note"
                            >
                              <IoTrash size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 border-dashed min-h-[60px] flex items-center">
                    <p className="text-sm text-gray-400 italic">
                      No additional notes. Click "Add Note" to add one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Order Details */}
          <Card title="Order Details">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Order Number</label>
                <p className="text-sm font-medium mt-1">#{order.orderNumber}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Date Created</label>
                <p className="text-sm mt-1">
                  {new Date(order.createdAt).toLocaleString('en-ZA')}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Payment Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Payment Method</label>
                <div className="mt-1 space-y-1">
                  {order.paymentMethod && (
                    <p className="text-sm font-medium">
                      {order.paymentMethodTitle || 
                       (order.paymentMethod === 'card' ? 'Credit/Debit Card' :
                        order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                        order.paymentMethod === 'paypal' ? 'PayPal' :
                        order.paymentMethod === 'gift_card' ? 'Gift Card' :
                        order.paymentMethod === 'eft' ? 'EFT' :
                        order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                        order.paymentMethod === 'cash' ? 'Cash' :
                        order.paymentMethod)}
                    </p>
                  )}
                </div>
              </div>
              {order.transactionId && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Transaction ID</label>
                  <p className="text-sm mt-1 font-mono">{order.transactionId}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tracking Number</label>
                  <p className="text-sm mt-1">
                    {order.trackingUrl ? (
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {order.trackingNumber}
                      </a>
                    ) : (
                      order.trackingNumber
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Breakdown */}
          <Card title="Payment Breakdown">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">R {order.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({order.taxRate || 15}%):</span>
                      <span className="font-medium">R {order.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {order.shipping > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">R {order.shipping?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  
                  {/* Discounts */}
                  {order.giftCardsApplied && order.giftCardsApplied.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">Gift Cards Applied:</div>
                      {order.giftCardsApplied.map((gc, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-blue-600">
                          <span>{gc.code || 'Gift Card'}:</span>
                          <span className="font-medium">-R {gc.amount?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {order.couponsApplied && order.couponsApplied.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">Coupons Applied:</div>
                      {order.couponsApplied.map((cp, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-purple-600">
                          <span>{cp.code || 'Coupon'}:</span>
                          <span className="font-medium">-R {cp.discount?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {order.loyaltyPointsUsed > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>PESA Coins ({order.loyaltyPointsUsed} coins):</span>
                        <span className="font-medium">-R {order.loyaltyPointsUsed?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  )}
                  
                  {order.discount > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Other Discount:</span>
                        <span className="font-medium">-R {order.discount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t-2 border-gray-300">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>R {order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-900 mb-2">Payment Methods Used:</div>
                <div className="space-y-1">
                  {order.giftCardsApplied && order.giftCardsApplied.length > 0 && (
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Gift Card:</span> R{order.giftCardsApplied.reduce((sum, gc) => sum + (gc.amount || 0), 0).toFixed(2)}
                    </div>
                  )}
                  {order.couponsApplied && order.couponsApplied.length > 0 && (
                    <div className="text-sm text-purple-800">
                      <span className="font-medium">Coupon:</span> R{order.couponsApplied.reduce((sum, cp) => sum + (cp.discount || 0), 0).toFixed(2)}
                    </div>
                  )}
                  {order.loyaltyPointsUsed > 0 && (
                    <div className="text-sm text-orange-800">
                      <span className="font-medium">PESA Coins:</span> {order.loyaltyPointsUsed} coins
                    </div>
                  )}
                  {order.paymentMethod && order.paymentMethod !== 'gift_card' && (
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">
                        {order.paymentMethod === 'card' ? 'Credit/Debit Card' :
                         order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                         order.paymentMethod === 'paypal' ? 'PayPal' :
                         order.paymentMethod === 'eft' ? 'EFT' :
                         order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                         order.paymentMethod === 'cash' ? 'Cash' :
                         order.paymentMethod}:
                      </span> R{Math.max(0, order.total - (order.giftCardsApplied?.reduce((sum, gc) => sum + (gc.amount || 0), 0) || 0) - (order.couponsApplied?.reduce((sum, cp) => sum + (cp.discount || 0), 0) || 0) - (order.loyaltyPointsUsed || 0)).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Split Payments */}
          {order.payments && order.payments.length > 0 && (
            <Card title="Split Payments">
              <div className="space-y-2">
                {order.payments.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {payment.method === 'eft' ? '🏦' : payment.method === 'ecocash' ? '📱' : payment.method === 'cash' ? '💵' : '💳'}
                      </span>
                      <div>
                        <p className="text-sm font-medium capitalize">{payment.method}</p>
                        {payment.transactionId && <p className="text-xs text-gray-500">Txn: {payment.transactionId}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                        payment.status === 'refunded' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>{payment.status}</span>
                      <p className="font-bold">R {(payment.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {order.dueNow != null && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-sm">
                    <span className="text-gray-600">Amount Due at Checkout</span>
                    <span className="font-bold">R {(order.dueNow || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Laybye Information (supports multiple laybyes) */}
          {(order.hasLaybye || order.isLaybye) && (
            <Card title={`Laybye Payment Plan${(order.laybyes?.length || 0) > 1 ? 's' : ''}`}>
              {(order.laybyes && order.laybyes.length > 0) ? (
                <div className="space-y-4">
                  {order.laybyes.map((lb, idx) => (
                    <div key={lb._id || idx} className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {order.laybyes.length > 1 ? `Laybye #${idx + 1}` : 'Laybye Status'}
                          </p>
                          <p className="text-lg font-bold text-blue-600 capitalize">{lb.status || 'Active'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700">Total Amount</p>
                          <p className="text-lg font-bold text-blue-600">R {lb.totalAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-blue-600">Paid</p>
                          <p className="font-bold text-green-600">R {lb.paidAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Remaining</p>
                          <p className="font-bold text-red-600">R {lb.remainingAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Next Payment</p>
                          <p className="font-medium">{lb.nextPaymentDate ? new Date(lb.nextPaymentDate).toLocaleDateString('en-ZA') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Payments</p>
                          <p className="font-medium">{lb.payments?.length || 0} / {lb.installmentPlan?.numberOfPayments || 0}</p>
                        </div>
                      </div>
                      {/* Laybye items */}
                      {order.items?.filter(i => i.isLaybye && i.laybyePlan?.toString() === (lb.laybyPlan?._id || lb.laybyPlan)?.toString()).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs font-medium text-blue-700 mb-2">Products on this Laybye:</p>
                          {order.items.filter(i => i.isLaybye && i.laybyePlan?.toString() === (lb.laybyPlan?._id || lb.laybyPlan)?.toString()).map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center justify-between text-sm">
                              <span className="text-blue-800">{item.product?.name || item.name} × {item.quantity}</span>
                              <span className="font-medium text-blue-900">R {(item.total || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-end mt-3">
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/laybyes/${lb._id || lb}`)}>
                          View Laybye Details →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : order.laybye ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Laybye Status</p>
                        <p className="text-lg font-bold text-blue-600 capitalize">{order.laybye.status || 'Active'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700">Total Amount</p>
                        <p className="text-lg font-bold text-blue-600">R {order.laybye.totalAmount?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-blue-600">Paid</p>
                        <p className="font-bold text-green-600">R {order.laybye.paidAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Remaining</p>
                        <p className="font-bold text-red-600">R {order.laybye.remainingAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Next Payment</p>
                        <p className="font-medium">{order.laybye.nextPaymentDate ? new Date(order.laybye.nextPaymentDate).toLocaleDateString('en-ZA') : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Payments</p>
                        <p className="font-medium">{order.laybye.payments?.length || 0} / {order.laybye.installmentPlan?.numberOfPayments || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/laybyes/${order.laybye._id || order.laybye}`)}>
                      View Full Laybye Details →
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No laybye information available for this order.</p>
                  <p className="text-sm mt-2">The order is marked as laybye but no laybye record was found.</p>
                </div>
              )}
            </Card>
          )}

          {/* Customer */}
          <Card title="Customer">
            <div className="space-y-4">
              {order.customer ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                    <p className="text-sm font-medium mt-1">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                    <p className="text-sm mt-1">{order.customer.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                    <p className="text-sm mt-1">{order.customer.phone || order.billingAddress?.phone || '-'}</p>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Guest order
                </div>
              )}
            </div>
          </Card>

          {/* Billing Address */}
          {order.billingAddress && (
            <Card title="Billing Address">
              <div className="text-sm">
                <p className="font-medium">
                  {order.billingAddress.firstName} {order.billingAddress.lastName}
                </p>
                {order.billingAddress.company && (
                  <p>{order.billingAddress.company}</p>
                )}
                <p>{order.billingAddress.street}</p>
                {order.billingAddress.street2 && (
                  <p>{order.billingAddress.street2}</p>
                )}
                <p>
                  {order.billingAddress.city}
                  {order.billingAddress.state && `, ${order.billingAddress.state}`}
                  {order.billingAddress.postalCode && ` ${order.billingAddress.postalCode}`}
                </p>
                <p>{order.billingAddress.country}</p>
                {order.billingAddress.phone && (
                  <p className="mt-2">Phone: {order.billingAddress.phone}</p>
                )}
                {order.billingAddress.email && (
                  <p>Email: {order.billingAddress.email}</p>
                )}
              </div>
            </Card>
          )}

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card title="Shipping Address">
              <div className="text-sm">
                <p className="font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.street2 && (
                  <p>{order.shippingAddress.street2}</p>
                )}
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                  {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                )}
              </div>
            </Card>
          )}

          {/* Pickup Address (if pickup fulfilment) */}
          {order.deliveryMethod === 'pickup' && order.pickupAddress && (order.pickupAddress.label || order.pickupAddress.address) && (
            <Card title="Pickup Location">
              <div className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🏪</span>
                  <div>
                    {order.pickupAddress.label && <p className="font-medium text-gray-900">{order.pickupAddress.label}</p>}
                    {order.pickupAddress.address && <p className="text-gray-600">📍 {order.pickupAddress.address}</p>}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Totals Summary */}
          <Card title="Totals">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R {order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({order.taxRate}%):</span>
                  <span>R {order.tax?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>R {order.shipping?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-R {order.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>R {order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => {
          setStatusModal(false);
          setNewStatus('');
          setStatusNote('');
        }}
        title="Update Order Status"
        onConfirm={handleStatusUpdate}
        confirmText="Update Status"
        confirmLoading={updateStatusMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input w-full"
            >
              <option value="">Select status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note (optional)</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              className="input w-full resize-none"
              placeholder="Add a note about this status change..."
            />
          </div>
        </div>
      </Modal>

      {/* Edit Admin Note Modal */}
      <Modal
        isOpen={adminNoteModal}
        onClose={() => {
          setAdminNoteModal(false);
          setEditingAdminNote('');
        }}
        title={order?.adminNote ? 'Edit Admin Note' : 'Add Admin Note'}
        onConfirm={handleSaveAdminNote}
        confirmText="Save Note"
        confirmLoading={updateAdminNoteMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Admin Note</label>
            <textarea
              value={editingAdminNote}
              onChange={(e) => setEditingAdminNote(e.target.value)}
              rows={6}
              className="input w-full resize-none"
              placeholder="Enter admin note (e.g., Waiting for stock replenishment, Customer requested delay, etc.)"
            />
            <p className="text-xs text-gray-500 mt-1">
              This note is only visible to administrators and shop managers.
            </p>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Note Modal */}
      <Modal
        isOpen={noteModal}
        onClose={() => {
          setNoteModal(false);
          setEditingNote({ content: '', isCustomerNotified: false });
          setEditingNoteId(null);
        }}
        title={editingNoteId ? 'Edit Note' : 'Add New Note'}
        onConfirm={handleSaveNote}
        confirmText={editingNoteId ? 'Update Note' : 'Add Note'}
        confirmLoading={addNoteMutation.isLoading || updateNoteMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Note Content <span className="text-red-500">*</span></label>
            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              rows={6}
              className="input w-full resize-none"
              placeholder="Enter note content..."
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingNote.isCustomerNotified}
                onChange={(e) => setEditingNote({ ...editingNote, isCustomerNotified: e.target.checked })}
                className="checkbox checkbox-primary"
              />
              <span className="text-sm font-medium">Notify Customer</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              If checked, the customer will be notified about this note.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
