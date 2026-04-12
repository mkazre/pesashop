import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import toast from '@/utils/toast';
import { IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';

const STATUS_STYLES = {
  active: 'badge-success',
  pending_contact: 'badge-warning',
  cancelled: 'badge-error',
  expired: 'badge-ghost',
};

const OfferCustomersPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: offerData } = useQuery(['offer-detail', id], () => offersAPI.getOne(id));
  const offer = offerData?.data?.data;

  const { data, isLoading } = useQuery(
    ['offer-customers', id],
    () => offersAPI.getCustomers(id),
    { enabled: !!id }
  );
  const customers = data?.data?.data || [];

  const contactMutation = useMutation(
    (custOfferId) => offersAPI.markContacted(custOfferId, 'Contacted via admin panel'),
    {
      onSuccess: () => { queryClient.invalidateQueries(['offer-customers', id]); toast.success('Marked as contacted'); },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed')
    }
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/offers')} className="btn btn-ghost btn-sm btn-square">
          <IoArrowBack size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {offer ? `Customers — ${offer.title}` : 'Offer Customers'}
          </h1>
          <p className="text-sm text-gray-500">Customers who have taken or requested this offer</p>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><span className="loading loading-spinner loading-md text-primary" /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-gray-400">No customers have taken this offer yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((co) => (
                  <tr key={co._id} className="hover">
                    <td>
                      <div>
                        <p className="font-medium text-sm text-gray-800">
                          {co.customer?.firstName} {co.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{co.customer?.email}</p>
                        {co.customer?.phone && <p className="text-xs text-gray-400">{co.customer.phone}</p>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${STATUS_STYLES[co.status] || 'badge-ghost'}`}>
                        {co.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {co.purchaseDate
                        ? new Date(co.purchaseDate).toLocaleDateString('en-ZA')
                        : co.requestedAt
                        ? new Date(co.requestedAt).toLocaleDateString('en-ZA')
                        : '—'}
                    </td>
                    <td className="text-sm text-gray-700">
                      {co.amountPaid > 0 ? `R${co.amountPaid?.toFixed(2)}` : '—'}
                    </td>
                    <td>
                      {co.status === 'pending_contact' && (
                        <button
                          className="btn btn-success btn-xs gap-1"
                          onClick={() => contactMutation.mutate(co._id)}
                          disabled={contactMutation.isLoading}
                        >
                          <IoCheckmarkCircle size={12} /> Mark Contacted
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OfferCustomersPage;
