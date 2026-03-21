import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Package, Truck, MapPin } from 'lucide-react';
import toast from '@/utils/toast';
import api from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const CreateWaybillModal = ({ isOpen, onClose, orderId }) => {
  const [shippingType, setShippingType] = useState('');
  const [selectedHub, setSelectedHub] = useState('');
  const queryClient = useQueryClient();

  // Fetch shipping hubs
  const { data: hubsData, isLoading: hubsLoading } = useQuery(
    'shipping-hubs-active',
    () => api.get('/shipping/hubs', { params: { isActive: true } }),
    { enabled: isOpen }
  );

  const hubs = hubsData?.data?.hubs || [];

  // Create waybill mutation
  const createWaybillMutation = useMutation(
    (data) => api.post('/shipping/waybills', data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['order', orderId]);
        queryClient.invalidateQueries('waybills');
        toast.success('Waybill created successfully');
        
        // Open waybill PDF
        if (response.data.waybill?._id) {
          api.get(`/shipping/waybills/${response.data.waybill._id}/pdf`)
            .then(res => {
              if (res.data.pdfUrl) {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const pdfUrl = `${baseUrl}${res.data.pdfUrl}`;
                const a = document.createElement('a');
                a.href = pdfUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            })
            .catch((err) => {
              console.error('Failed to generate waybill PDF:', err);
            });
        }
        
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create waybill');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!shippingType) {
      toast.error('Please select a shipping type');
      return;
    }

    if (shippingType === 'HUB_COLLECTION' && !selectedHub) {
      toast.error('Please select a collection hub');
      return;
    }

    createWaybillMutation.mutate({
      orderId,
      shippingType,
      hubLocationId: shippingType === 'HUB_COLLECTION' ? selectedHub : null
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Waybill"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Select Shipping Type
          </h3>
          <div className="space-y-3">
            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shippingType"
                value="DELIVERY"
                checked={shippingType === 'DELIVERY'}
                onChange={(e) => setShippingType(e.target.value)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Direct Delivery</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Ship directly to customer's address
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shippingType"
                value="HUB_COLLECTION"
                checked={shippingType === 'HUB_COLLECTION'}
                onChange={(e) => setShippingType(e.target.value)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Hub Collection</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Customer will collect from a local hub
                </p>
              </div>
            </label>
          </div>
        </div>

        {shippingType === 'HUB_COLLECTION' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Collection Hub
            </label>
            {hubsLoading ? (
              <LoadingSpinner />
            ) : (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                required
              >
                <option value="">Choose a hub...</option>
                {hubs.map((hub) => (
                  <option key={hub._id} value={hub._id}>
                    {hub.name} - {hub.address?.city || 'N/A'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">What happens next?</p>
              <ul className="mt-2 space-y-1 text-blue-800">
                <li>• A unique waybill number will be generated</li>
                <li>• A printable PDF with barcode will be created</li>
                <li>• The order will be ready for packing and dispatch</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createWaybillMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!shippingType || createWaybillMutation.isLoading}
          >
            {createWaybillMutation.isLoading ? 'Creating...' : 'Create Waybill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWaybillModal;
