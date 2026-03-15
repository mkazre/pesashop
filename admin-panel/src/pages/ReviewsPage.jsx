import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoStar, IoCheckmark, IoClose, IoTrash, IoSettings, IoImage, IoShieldCheckmark, IoChatbubble } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const imgUrl = (src) => src?.startsWith('http') ? src : `${API_URL}${src}`;

const ReviewsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [adminReplyId, setAdminReplyId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Reviews list
  const { data, isLoading } = useQuery(['reviews', page, statusFilter], 
    () => reviewsAPI.getAll({ page, limit: 20, status: statusFilter }),
    { keepPreviousData: true }
  );

  // Summary stats
  const { data: summaryData } = useQuery('review-summary', () => reviewsAPI.getSummary(), {
    staleTime: 30 * 1000,
  });
  const summary = summaryData?.data?.data || {};

  // Mutations
  const approveMutation = useMutation((id) => reviewsAPI.approve(id), {
    onSuccess: () => { queryClient.invalidateQueries('reviews'); queryClient.invalidateQueries('review-summary'); toast.success('Review approved'); setSelectedReview(null); },
  });

  const rejectMutation = useMutation((id) => reviewsAPI.reject(id), {
    onSuccess: () => { queryClient.invalidateQueries('reviews'); queryClient.invalidateQueries('review-summary'); toast.success('Review rejected'); setSelectedReview(null); },
  });

  const deleteMutation = useMutation((id) => reviewsAPI.delete(id), {
    onSuccess: () => { queryClient.invalidateQueries('reviews'); queryClient.invalidateQueries('review-summary'); toast.success('Review deleted'); setSelectedReview(null); },
  });

  const bulkStatusMutation = useMutation(
    ({ ids, status }) => reviewsAPI.bulkStatus(ids, status),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries('reviews');
        queryClient.invalidateQueries('review-summary');
        toast.success(res.data.message);
        setSelectedIds([]);
      },
    }
  );

  const adminResponseMutation = useMutation(
    ({ id, content }) => reviewsAPI.adminResponse(id, content),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reviews');
        toast.success('Admin response added');
        setAdminReplyId(null);
        setAdminReplyText('');
      },
    }
  );

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <IoStar key={star} className={star <= rating ? 'text-secondary' : 'text-gray-300'} size={16} />
      ))}
    </div>
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const reviews = data?.data?.data || [];
    if (selectedIds.length === reviews.length) setSelectedIds([]);
    else setSelectedIds(reviews.map(r => r._id));
  };

  const columns = [
    {
      key: 'select',
      title: () => (
        <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === (data?.data?.data || []).length} onChange={toggleSelectAll} className="w-4 h-4 rounded" />
      ),
      width: '40px',
      render: (_, row) => (
        <input type="checkbox" checked={selectedIds.includes(row._id)} onChange={(e) => { e.stopPropagation(); toggleSelect(row._id); }} className="w-4 h-4 rounded" />
      ),
    },
    {
      key: 'product',
      title: 'Product',
      render: (product) => product?.name || '-',
    },
    {
      key: 'user',
      title: 'Customer',
      width: '150px',
      render: (user, row) => {
        if (user) return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        return row.guestName || 'Guest';
      },
    },
    {
      key: 'rating',
      title: 'Rating',
      width: '130px',
      render: (rating) => renderStars(rating),
    },
    {
      key: 'content',
      title: 'Review',
      render: (content, row) => (
        <div>
          <p className="truncate max-w-xs text-sm">{row.title || content}</p>
          {row.images?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-0.5">
              <IoImage size={12} /> {row.images.length} image{row.images.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isVerifiedPurchase',
      title: 'Verified',
      width: '80px',
      render: (verified) => verified ? (
        <IoShieldCheckmark className="text-green-600" size={18} />
      ) : (
        <span className="text-gray-300">—</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '100px',
      render: (status) => (
        <span className={`badge ${status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
          {status}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '140px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); approveMutation.mutate(row._id); }} className="p-1.5 hover:bg-green-50 rounded" title="Approve">
                <IoCheckmark size={16} className="text-green-600" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(row._id); }} className="p-1.5 hover:bg-red-50 rounded" title="Reject">
                <IoClose size={16} className="text-red-600" />
              </button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); setAdminReplyId(row._id); setAdminReplyText(''); }} className="p-1.5 hover:bg-blue-50 rounded" title="Reply">
            <IoChatbubble size={14} className="text-blue-600" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this review?')) deleteMutation.mutate(row._id); }} className="p-1.5 hover:bg-red-50 rounded" title="Delete">
            <IoTrash size={14} className="text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Reviews</h1>
        <Button variant="secondary" onClick={() => navigate('/reviews/settings')}>
          <IoSettings size={20} className="mr-2" />
          Review Settings
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-primary">{summary.total || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-yellow-600">{summary.byStatus?.pending || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Approved</p><p className="text-xl font-bold text-green-600">{summary.byStatus?.approved || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Rejected</p><p className="text-xl font-bold text-red-500">{summary.byStatus?.rejected || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Avg Rating</p><p className="text-xl font-bold text-primary">{(summary.averageRating || 0).toFixed(1)} ⭐</p></Card>
        <Card><p className="text-xs text-gray-500">With Images</p><p className="text-xl font-bold text-blue-600">{summary.withImages || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">This Week</p><p className="text-xl font-bold text-purple-600">{summary.recentWeek || 0}</p></Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input">
              <option value="">All Reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
              <Button size="sm" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'approved' })} disabled={bulkStatusMutation.isLoading}>
                <IoCheckmark size={16} className="mr-1" /> Approve All
              </Button>
              <Button size="sm" variant="danger" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'rejected' })} disabled={bulkStatusMutation.isLoading}>
                <IoClose size={16} className="mr-1" /> Reject All
              </Button>
            </div>
          )}
        </div>

        <Table
          columns={columns}
          data={data?.data?.data || []}
          loading={isLoading}
          onRowClick={(row) => setSelectedReview(row)}
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

      {/* Admin Reply Modal */}
      <Modal isOpen={!!adminReplyId} onClose={() => setAdminReplyId(null)} title="Admin Response" size="md" showFooter={false}>
        <div className="space-y-4">
          <textarea
            value={adminReplyText}
            onChange={(e) => setAdminReplyText(e.target.value)}
            placeholder="Write your response to this review..."
            rows={4}
            className="input w-full"
          />
          <div className="flex gap-2">
            <Button onClick={() => adminResponseMutation.mutate({ id: adminReplyId, content: adminReplyText })} disabled={!adminReplyText.trim() || adminResponseMutation.isLoading}>
              Submit Response
            </Button>
            <Button variant="ghost" onClick={() => setAdminReplyId(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Review Detail Modal */}
      <Modal isOpen={!!selectedReview} onClose={() => setSelectedReview(null)} title="Review Details" size="lg" showFooter={false}>
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-semibold">{selectedReview.product?.name}</p>
              </div>
              <span className={`badge ${selectedReview.status === 'approved' ? 'badge-success' : selectedReview.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                {selectedReview.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">
                {selectedReview.user 
                  ? `${selectedReview.user.firstName || ''} ${selectedReview.user.lastName || ''}`.trim() || selectedReview.user.email
                  : selectedReview.guestName || 'Guest'}
                {selectedReview.isVerifiedPurchase && <span className="ml-2 text-xs text-green-600">✓ Verified Purchase</span>}
              </p>
              {selectedReview.guestEmail && <p className="text-xs text-gray-400">{selectedReview.guestEmail}</p>}
            </div>
            <div>
              <p className="text-sm text-gray-500">Overall Rating</p>
              {renderStars(selectedReview.rating)}
            </div>
            {selectedReview.categoryRatings && Object.keys(selectedReview.categoryRatings).length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Category Ratings</p>
                <div className="space-y-1">
                  {Object.entries(selectedReview.categoryRatings).map(([key, val]) => val ? (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      {renderStars(val)}
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
            {selectedReview.title && (
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-medium">{selectedReview.title}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Review</p>
              <p className="text-sm leading-relaxed">{selectedReview.content}</p>
            </div>
            {selectedReview.comment && (
              <div>
                <p className="text-sm text-gray-500">Short Comment</p>
                <p className="text-sm italic">{selectedReview.comment}</p>
              </div>
            )}
            {/* Review Images */}
            {selectedReview.images?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Customer Photos ({selectedReview.images.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReview.images.map((img, i) => (
                    <a key={i} href={imgUrl(img.url || img)} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary transition-all">
                      <img src={imgUrl(img.url || img)} alt={img.alt || `Image ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {/* Admin response */}
            {selectedReview.adminResponse?.content && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Admin Response</p>
                <p className="text-sm">{selectedReview.adminResponse.content}</p>
              </div>
            )}
            {selectedReview.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => approveMutation.mutate(selectedReview._id)}>
                  <IoCheckmark size={18} className="mr-1" /> Approve
                </Button>
                <Button variant="danger" onClick={() => rejectMutation.mutate(selectedReview._id)}>
                  <IoClose size={18} className="mr-1" /> Reject
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-400 pt-2">
              Submitted: {new Date(selectedReview.createdAt).toLocaleString()} · Helpful: {selectedReview.helpfulCount || 0} · Reports: {selectedReview.reportedCount || 0}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;
