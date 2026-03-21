import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import SignatureCanvas from 'react-signature-canvas';
import { 
  FileSignature,
  User,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Package
} from 'lucide-react';
import toast from '@/utils/toast';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const PODCapturePage = () => {
  const { waybillNumber } = useParams();
  const navigate = useNavigate();
  const signatureRef = useRef(null);
  
  const [formData, setFormData] = useState({
    recipient: {
      name: '',
      idNumber: '',
      relationship: 'SELF',
      phone: ''
    },
    location: {
      type: 'CUSTOMER_ADDRESS',
      address: ''
    },
    notes: ''
  });

  // Fetch waybill data
  const { data, isLoading, error } = useQuery(
    ['waybill-pod', waybillNumber],
    () => api.get(`/shipping/mobile/scan/${waybillNumber}`)
  );

  const waybill = data?.data?.waybill;

  // POD capture mutation
  const capturePODMutation = useMutation(
    (data) => api.post('/shipping/pod', {
      ...data,
      platform: 'mobile',
      isMobile: true
    }),
    {
      onSuccess: () => {
        toast.success('Proof of delivery captured successfully');
        setTimeout(() => {
          navigate('/shipping');
        }, 2000);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to capture POD');
      }
    }
  );

  // Handle form change
  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Clear signature
  const clearSignature = () => {
    signatureRef.current.clear();
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate signature
    if (signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    // Validate recipient name
    if (!formData.recipient.name.trim()) {
      toast.error('Please enter recipient name');
      return;
    }

    // Get signature data
    const signatureData = signatureRef.current.toDataURL();

    // Submit POD
    capturePODMutation.mutate({
      waybillNumber,
      recipient: formData.recipient,
      signatureData,
      location: formData.location,
      notes: formData.notes
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-center text-red-600">Error loading waybill</div>;
  if (!waybill) return <div className="p-4 text-center">Waybill not found</div>;

  // Check if waybill is in valid status for POD
  const validStatuses = ['WITH_DELIVERY_DRIVER', 'RECEIVED_AT_HUB'];
  if (!validStatuses.includes(waybill.status)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Invalid Status</h2>
          <p className="text-gray-600 mb-4">
            This waybill is not ready for delivery confirmation.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current status: <Badge color="gray">{waybill.status.replace(/_/g, ' ')}</Badge>
          </p>
          <Button onClick={() => navigate('/shipping')}>
            Back to Shipping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/shipping')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Proof of Delivery</h1>
          </div>
          <FileSignature className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Waybill Info */}
      <div className="p-4 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600">Waybill #</span>
            <span className="font-semibold text-blue-900">{waybill.waybillNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600">Order #</span>
            <span className="font-medium text-blue-900">{waybill.orderNumber}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Recipient Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.recipient.name}
                  onChange={(e) => handleChange('recipient.name', e.target.value)}
                  placeholder="Enter recipient's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.recipient.idNumber}
                    onChange={(e) => handleChange('recipient.idNumber', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship to Customer
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.recipient.relationship}
                  onChange={(e) => handleChange('recipient.relationship', e.target.value)}
                >
                  <option value="SELF">Self</option>
                  <option value="FAMILY">Family Member</option>
                  <option value="FRIEND">Friend</option>
                  <option value="COLLEAGUE">Colleague</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.recipient.phone}
                    onChange={(e) => handleChange('recipient.phone', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Location
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.location.type}
                  onChange={(e) => handleChange('location.type', e.target.value)}
                >
                  <option value="CUSTOMER_ADDRESS">Customer Address</option>
                  <option value="HUB">Collection Hub</option>
                  <option value="OTHER">Other Location</option>
                </select>
              </div>

              {formData.location.type === 'OTHER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Details
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.location.address}
                    onChange={(e) => handleChange('location.address', e.target.value)}
                    placeholder="Enter location details"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-4">Additional Notes</h2>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about the delivery..."
            />
          </div>

          {/* Signature */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileSignature className="w-4 h-4" />
                Recipient Signature *
              </h2>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Clear
              </button>
            </div>
            
            <div className="border-2 border-gray-300 rounded-lg bg-gray-50">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-48',
                  style: { width: '100%', height: '192px' }
                }}
                backgroundColor="rgb(249 250 251)"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please sign above to confirm receipt
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={capturePODMutation.isLoading}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {capturePODMutation.isLoading ? 'Processing...' : 'Confirm Delivery'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PODCapturePage;
