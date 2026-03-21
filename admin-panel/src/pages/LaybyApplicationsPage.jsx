import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { laybyApplicationsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoCheckmark, IoClose, IoDownload, IoEye, IoTrash, IoDocument } from 'react-icons/io5';

const LaybyApplicationsPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  const { data, isLoading } = useQuery(
    ['laybyApplications', page, statusFilter],
    () => laybyApplicationsAPI.getAll({ page, limit: 20, status: statusFilter }),
    { keepPreviousData: true }
  );

  const approveMutation = useMutation(
    ({ id, data }) => laybyApplicationsAPI.approve(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyApplications');
        toast.success('Application approved');
        setViewModal(null);
        setApproveNotes('');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
    }
  );

  const rejectMutation = useMutation(
    ({ id, data }) => laybyApplicationsAPI.reject(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyApplications');
        toast.success('Application rejected');
        setRejectModal(null);
        setRejectReason('');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
    }
  );

  const deleteMutation = useMutation(
    (id) => laybyApplicationsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyApplications');
        toast.success('Application deleted');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
    }
  );

  const handleDownloadDoc = async (application) => {
    try {
      const response = await laybyApplicationsAPI.downloadDocument(application._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', application.idDocument?.originalName || 'id-document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download document');
    }
  };

  const applications = data?.data?.data || [];
  const totalPages = data?.data?.pages || 1;

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error',
      expired: 'badge-info',
    };
    return styles[status] || '';
  };

  const columns = [
    {
      key: 'firstName',
      title: 'Applicant',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'productName',
      title: 'Product',
      render: (name, row) => (
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500">R {(row.productPrice || 0).toFixed(2)}</p>
          {row.planName && <p className="text-xs text-primary mt-0.5">{row.planName}</p>}
        </div>
      ),
    },
    {
      key: 'idDocument',
      title: 'ID Document',
      width: '120px',
      render: (doc, row) => doc ? (
        <button
          onClick={() => handleDownloadDoc(row)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <IoDownload size={16} />
          {doc.originalName?.slice(0, 15)}...
        </button>
      ) : (
        <span className="text-gray-400 text-sm">N/A</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '100px',
      render: (status) => (
        <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Applied',
      width: '120px',
      render: (date) => new Date(date).toLocaleDateString('en-ZA'),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '180px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewModal(row)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="View Details"
          >
            <IoEye size={18} className="text-primary" />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => approveMutation.mutate({ id: row._id, data: { notes: '' } })}
                className="p-2 hover:bg-green-50 rounded transition-colors"
                title="Approve"
              >
                <IoCheckmark size={18} className="text-green-600" />
              </button>
              <button
                onClick={() => { setRejectModal(row); setRejectReason(''); }}
                className="p-2 hover:bg-red-50 rounded transition-colors"
                title="Reject"
              >
                <IoClose size={18} className="text-red-600" />
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (window.confirm('Delete this application permanently?')) {
                deleteMutation.mutate(row._id);
              }
            }}
            className="p-2 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <IoTrash size={16} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Layby Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage customer layby applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'approved', 'rejected'].map((status) => {
          const count = applications.filter(a => a.status === status).length;
          const colors = { pending: 'text-yellow-600', approved: 'text-green-600', rejected: 'text-red-600' };
          return (
            <Card key={status}>
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className={`text-2xl font-bold ${colors[status]}`}>{count}</p>
            </Card>
          );
        })}
        <Card>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-primary">{data?.data?.total || applications.length}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <Table columns={columns} data={applications} loading={isLoading} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Application Modal */}
      <Modal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Application Details"
        size="lg"
        showFooter={viewModal?.status === 'pending'}
        onConfirm={() => {
          approveMutation.mutate({ id: viewModal._id, data: { notes: approveNotes } });
        }}
        confirmText="Approve Application"
        confirmLoading={approveMutation.isLoading}
      >
        {viewModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{viewModal.firstName} {viewModal.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{viewModal.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{viewModal.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`badge ${getStatusBadge(viewModal.status)}`}>{viewModal.status}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Product</p>
              <p className="font-medium">{viewModal.productName}</p>
              <p className="text-sm text-gray-500">R {(viewModal.productPrice || 0).toFixed(2)}</p>
            </div>

            {viewModal.planName && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Selected Layby Plan</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">{viewModal.planName}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {viewModal.depositAmount > 0 && (
                      <div>
                        <p className="text-blue-600">Deposit</p>
                        <p className="font-bold">R {viewModal.depositAmount.toFixed(2)}</p>
                      </div>
                    )}
                    {viewModal.numberOfPayments > 0 && (
                      <div>
                        <p className="text-blue-600">{viewModal.numberOfPayments}× Installments</p>
                        <p className="font-bold">R {(viewModal.installmentAmount || 0).toFixed(2)}</p>
                      </div>
                    )}
                    {viewModal.frequency && (
                      <div>
                        <p className="text-blue-600">Frequency</p>
                        <p className="font-bold capitalize">{viewModal.frequency}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewModal.idDocument && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">ID / Passport Document</p>
                <button
                  onClick={() => handleDownloadDoc(viewModal)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <IoDocument size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{viewModal.idDocument.originalName}</p>
                    <p className="text-xs text-gray-500">{(viewModal.idDocument.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <IoDownload size={18} className="ml-auto text-gray-400" />
                </button>
              </div>
            )}

            {viewModal.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Customer Notes</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{viewModal.notes}</p>
              </div>
            )}

            {viewModal.reviewNotes && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Review Notes</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{viewModal.reviewNotes}</p>
              </div>
            )}

            {viewModal.rejectionReason && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Rejection Reason</p>
                <p className="text-sm bg-red-50 text-red-700 p-3 rounded">{viewModal.rejectionReason}</p>
              </div>
            )}

            {viewModal.status === 'pending' && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Approval Notes (optional)</label>
                  <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    rows={2}
                    className="input w-full resize-none"
                    placeholder="Add notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => {
                      setViewModal(null);
                      setRejectModal(viewModal);
                      setRejectReason('');
                    }}
                  >
                    <IoClose size={18} />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4 text-xs text-gray-400">
              <p>Application ID: {viewModal._id}</p>
              <p>Applied: {new Date(viewModal.createdAt).toLocaleString('en-ZA')}</p>
              {viewModal.reviewedAt && (
                <p>Reviewed: {new Date(viewModal.reviewedAt).toLocaleString('en-ZA')}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason(''); }}
        title="Reject Application"
        onConfirm={() => {
          if (!rejectReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
          }
          rejectMutation.mutate({ id: rejectModal._id, data: { reason: rejectReason } });
        }}
        confirmText="Reject Application"
        confirmLoading={rejectMutation.isLoading}
      >
        {rejectModal && (
          <div className="space-y-4">
            <p>Reject the application from <strong>{rejectModal.firstName} {rejectModal.lastName}</strong> for <strong>{rejectModal.productName}</strong>?</p>
            <div>
              <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="input w-full resize-none"
                placeholder="Reason for rejection..."
                required
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LaybyApplicationsPage;
