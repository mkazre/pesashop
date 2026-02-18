import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoStar, IoCheckmark, IoClose, IoTrash, IoSettings } from 'react-icons/io5';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);

  const { data, isLoading } = useQuery(['reviews', page, statusFilter], 
    () => reviewsAPI.getAll({ page, limit: 20, status: statusFilter }),
    { keepPreviousData: true }
  );

  const approveMutation = useMutation(
    (id) => reviewsAPI.approve(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reviews');
        toast.success('Review approved');
        setSelectedReview(null);
      },
    }
  );

  const rejectMutation = useMutation(
    (id) => reviewsAPI.reject(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reviews');
        toast.success('Review rejected');
        setSelectedReview(null);
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => reviewsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reviews');
        toast.success('Review deleted');
        setSelectedReview(null);
      },
    }
  );

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <IoStar
            key={star}
            className={star <= rating ? 'text-secondary' : 'text-gray-300'}
            size={16}
          />
        ))}
      </div>
    );
  };

  const columns = [
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
        if (user) {
          return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        }
        return row.guestName || 'Guest';
      },
    },
    {
      key: 'rating',
      title: 'Rating',
      width: '150px',
      render: (rating) => renderStars(rating),
    },
    {
      key: 'content',
      title: 'Review',
      render: (content) => (
        <p className="truncate max-w-xs">{content}</p>
      ),
    },
    {
      key: 'isVerifiedPurchase',
      title: 'Verified',
      width: '100px',
      render: (verified) => verified ? (
        <span className="badge badge-success">Yes</span>
      ) : (
        <span className="badge badge-info">No</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '120px',
      render: (status) => (
        <span className={`badge ${
          status === 'approved' ? 'badge-success' :
          status === 'rejected' ? 'badge-error' :
          'badge-warning'
        }`}>
          {status}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); approveMutation.mutate(row._id); }}
                className="p-2 hover:bg-gray-100"
                title="Approve"
              >
                <IoCheckmark size={18} className="text-green-600" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(row._id); }}
                className="p-2 hover:bg-gray-100"
                title="Reject"
              >
                <IoClose size={18} className="text-red-600" />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(row._id); }}
            className="p-2 hover:bg-gray-100"
            title="Delete"
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
        <h1 className="text-3xl font-bold">Product Reviews</h1>
        <Button variant="secondary" onClick={() => navigate('/reviews/settings')}>
          <IoSettings size={20} className="mr-2" />
          Review Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Total Reviews</p>
          <p className="text-2xl font-bold text-primary">{data?.data?.total || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data?.data?.data?.filter(r => r.status === 'pending').length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.data?.data?.filter(r => r.status === 'approved').length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Average Rating</p>
          <p className="text-2xl font-bold text-primary">4.5 ⭐</p>
        </Card>
      </div>

      <Card>
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
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

      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Review Details"
        size="lg"
        showFooter={false}
      >
        {selectedReview && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-medium">{selectedReview.product?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">
                {selectedReview.user 
                  ? `${selectedReview.user.firstName || ''} ${selectedReview.user.lastName || ''}`.trim() || selectedReview.user.email
                  : selectedReview.guestName || 'Guest'}
              </p>
              {selectedReview.guestEmail && (
                <p className="text-xs text-gray-500">{selectedReview.guestEmail}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Rating</p>
              {renderStars(selectedReview.rating)}
            </div>
            {selectedReview.categoryRatings && Object.keys(selectedReview.categoryRatings).length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Category Ratings</p>
                <div className="space-y-1">
                  {selectedReview.categoryRatings.productQuality && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Product Quality:</span>
                      {renderStars(selectedReview.categoryRatings.productQuality)}
                    </div>
                  )}
                  {selectedReview.categoryRatings.valueForMoney && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Value for Money:</span>
                      {renderStars(selectedReview.categoryRatings.valueForMoney)}
                    </div>
                  )}
                  {selectedReview.categoryRatings.accuracyOfDescription && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accuracy of Description:</span>
                      {renderStars(selectedReview.categoryRatings.accuracyOfDescription)}
                    </div>
                  )}
                  {selectedReview.categoryRatings.shippingPackaging && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Shipping & Packaging:</span>
                      {renderStars(selectedReview.categoryRatings.shippingPackaging)}
                    </div>
                  )}
                  {selectedReview.categoryRatings.customerService && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Customer Service:</span>
                      {renderStars(selectedReview.categoryRatings.customerService)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedReview.title && (
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-medium">{selectedReview.title}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Review</p>
              <p>{selectedReview.content}</p>
            </div>
            {selectedReview.comment && (
              <div>
                <p className="text-sm text-gray-600">Comment</p>
                <p className="text-sm italic">{selectedReview.comment}</p>
              </div>
            )}
            {selectedReview.status === 'pending' && (
              <div className="flex gap-4 pt-4">
                <Button onClick={() => approveMutation.mutate(selectedReview._id)}>
                  <IoCheckmark size={20} className="mr-2" />
                  Approve
                </Button>
                <Button variant="danger" onClick={() => rejectMutation.mutate(selectedReview._id)}>
                  <IoClose size={20} className="mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;
