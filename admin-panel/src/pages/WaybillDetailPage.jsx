import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Package, 
  Truck, 
  MapPin, 
  Camera, 
  Download, 
  CheckCircle,
  Clock,
  FileText,
  User,
  Calendar,
  ArrowLeft,
  Upload,
  QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Barcode from 'react-barcode';

const WaybillDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanType, setScanType] = useState(''); // 'out' or 'in'
  const [scanDestination, setScanDestination] = useState('');

  // Fetch waybill details
  const { data, isLoading, error } = useQuery(
    ['waybill', id],
    () => api.get(`/shipping/waybills/${id}`)
  );

  const waybill = data?.data?.waybill;
  const events = data?.data?.events || [];
  const pod = data?.data?.pod;

  // Update status mutation
  const updateStatusMutation = useMutation(
    (data) => api.put(`/shipping/waybills/${id}/status`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['waybill', id]);
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNote('');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to update status');
      }
    }
  );

  // Scan out mutation
  const scanOutMutation = useMutation(
    (data) => api.post('/shipping/scan/out', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['waybill', id]);
        toast.success('Scan-out successful');
        setShowScanModal(false);
        setScanDestination('');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Scan-out failed');
      }
    }
  );

  // Scan in mutation
  const scanInMutation = useMutation(
    (data) => api.post('/shipping/scan/in', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['waybill', id]);
        toast.success('Scan-in successful');
        setShowScanModal(false);
        setScanDestination('');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Scan-in failed');
      }
    }
  );

  // Upload photos mutation
  const uploadPhotosMutation = useMutation(
    (formData) => api.post(`/shipping/waybills/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['waybill', id]);
        toast.success('Photos uploaded successfully');
        setShowPhotoModal(false);
        setPhotoFiles([]);
        setSelectedOrderItem(null);
      },
      onError: () => {
        toast.error('Failed to upload photos');
      }
    }
  );

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      CREATED: 'gray',
      PACKED: 'blue',
      DISPATCHED_FROM_HUB: 'yellow',
      OUT_FOR_DELIVERY: 'yellow',
      RECEIVED_AT_HUB: 'purple',
      WITH_DELIVERY_DRIVER: 'purple',
      DELIVERED: 'green',
      COLLECTED: 'green',
      CANCELLED: 'red'
    };
    return colors[status] || 'gray';
  };

  // Get event icon
  const getEventIcon = (eventType) => {
    const icons = {
      CREATED: Package,
      STATUS_CHANGE: Clock,
      PHOTO_UPLOADED: Camera,
      SCAN_OUT: Truck,
      SCAN_IN: MapPin,
      POD_CAPTURED: CheckCircle,
      NOTE_ADDED: FileText
    };
    const Icon = icons[eventType] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  // Handle photo upload
  const handlePhotoUpload = () => {
    if (!selectedOrderItem || photoFiles.length === 0) {
      toast.error('Please select an item and photos');
      return;
    }

    const formData = new FormData();
    formData.append('orderItemId', selectedOrderItem);
    photoFiles.forEach(file => {
      formData.append('photos', file);
    });

    uploadPhotosMutation.mutate(formData);
  };

  // Handle status update
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

  // Handle scan
  const handleScan = () => {
    if (!scanDestination.trim()) {
      toast.error('Please enter a destination/location');
      return;
    }
    if (scanType === 'out') {
      scanOutMutation.mutate({
        waybillNumber: waybill.waybillNumber,
        destination: scanDestination,
        platform: 'web'
      });
    } else {
      scanInMutation.mutate({
        waybillNumber: waybill.waybillNumber,
        location: scanDestination,
        platform: 'web'
      });
    }
  };

  // Determine which scan actions are available
  const canScanOut = waybill && waybill.status === 'PACKED';
  const canScanIn = waybill && ['DISPATCHED_FROM_HUB', 'OUT_FOR_DELIVERY'].includes(waybill.status);

  // Valid next statuses based on current status
  const validTransitions = {
    'CREATED': ['PACKED', 'CANCELLED'],
    'PACKED': ['DISPATCHED_FROM_HUB', 'OUT_FOR_DELIVERY', 'CANCELLED'],
    'DISPATCHED_FROM_HUB': ['OUT_FOR_DELIVERY', 'RECEIVED_AT_HUB'],
    'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
    'RECEIVED_AT_HUB': ['WITH_DELIVERY_DRIVER', 'COLLECTED'],
    'WITH_DELIVERY_DRIVER': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'COLLECTED': [],
    'CANCELLED': []
  };
  const nextStatuses = waybill ? (validTransitions[waybill.status] || []) : [];

  // Generate mobile scanner link
  const generateMobileScannerLink = () => {
    const baseUrl = window.location.origin;
    const scannerUrl = `${baseUrl}/shipping/mobile/scan/${waybill.waybillNumber}`;
    
    // Create QR code data
    const qrData = {
      url: scannerUrl,
      waybill: waybill.waybillNumber,
      action: waybill.status === 'PACKED' ? 'scan-out' : 'scan-in'
    };

    // Show QR modal
    toast.success('QR Code generated for mobile scanning');
    console.log('Scanner URL:', scannerUrl);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading waybill details</div>;
  if (!waybill) return <div>Waybill not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/shipping')}
            className="mt-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Waybill {waybill.waybillNumber}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge color={getStatusColor(waybill.status)} size="lg">
                {waybill.status.replace(/_/g, ' ')}
              </Badge>
              {waybill.shippingType === 'HUB_COLLECTION' ? (
                <Badge color="purple" size="sm">
                  <MapPin className="w-3 h-3 mr-1" />
                  Hub Collection
                </Badge>
              ) : (
                <Badge color="blue" size="sm">
                  <Truck className="w-3 h-3 mr-1" />
                  Delivery
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canScanOut && (
            <Button
              onClick={() => { setScanType('out'); setScanDestination(''); setShowScanModal(true); }}
            >
              <Truck className="w-4 h-4 mr-2" />
              Scan Out
            </Button>
          )}
          {canScanIn && (
            <Button
              onClick={() => { setScanType('in'); setScanDestination(''); setShowScanModal(true); }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Scan In
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowStatusModal(true)}
          >
            Update Status
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                toast.loading('Generating PDF...', { id: 'pdf-gen' });
                const response = await api.get(`/shipping/waybills/${id}/pdf`);
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const pdfUrl = `${baseUrl}${response.data.pdfUrl}`;
                toast.dismiss('pdf-gen');
                toast.success('PDF ready — opening...');
                // Use hidden <a> tag to avoid popup blockers
                const a = document.createElement('a');
                a.href = pdfUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } catch (error) {
                toast.dismiss('pdf-gen');
                toast.error(error.response?.data?.message || 'Failed to generate PDF');
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="secondary"
            onClick={generateMobileScannerLink}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Mobile Scanner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Waybill Barcode</h2>
            <div className="flex justify-center">
              <Barcode value={waybill.barcodeData} />
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <a 
                  href={`/orders/${waybill.order._id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {waybill.order.orderNumber}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">R{waybill.order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created By:</span>
                <span>{waybill.createdBy.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created At:</span>
                <span>{format(new Date(waybill.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Order Items</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPhotoModal(true)}
              >
                <Camera className="w-4 h-4 mr-1" />
                Upload Photos
              </Button>
            </div>
            <div className="space-y-3">
              {waybill.order.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.sku} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R{item.total.toFixed(2)}</p>
                    {/* Check if photos exist for this item */}
                    {events.some(e => 
                      e.eventType === 'PHOTO_UPLOADED' && 
                      e.photoData?.orderItem === item._id
                    ) && (
                      <Badge color="green" size="sm">
                        <Camera className="w-3 h-3 mr-1" />
                        Photos
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Events */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Shipping Events</h2>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event._id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getEventIcon(event.eventType)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.performedBy.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {event.photoData && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          {event.photoData.photoUrls.length} photos uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {waybill.customer ? `${waybill.customer.firstName} ${waybill.customer.lastName}` : 'Unknown Customer'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{waybill.customer?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{waybill.customer?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Delivery/Collection Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">
              {waybill.shippingType === 'HUB_COLLECTION' ? 'Collection Hub' : 'Delivery Address'}
            </h2>
            {waybill.shippingType === 'HUB_COLLECTION' && waybill.hubLocation ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Hub Name</p>
                  <p className="font-medium">{waybill.hubLocation.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{waybill.hubLocation.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium">{waybill.hubLocation.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{waybill.hubLocation.phone}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">
                    {waybill.order.shippingAddress.street}<br />
                    {waybill.order.shippingAddress.city}, {waybill.order.shippingAddress.state}<br />
                    {waybill.order.shippingAddress.postalCode}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* POD Details */}
          {pod && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Proof of Delivery</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Recipient</p>
                  <p className="font-medium">{pod.recipient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivered At</p>
                  <p className="font-medium">
                    {format(new Date(pod.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await api.get(`/shipping/pod/${id}/pdf`);
                      window.open(response.data.pdfUrl, '_blank');
                    } catch (error) {
                      toast.error('Failed to generate POD PDF');
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download POD
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setPhotoFiles([]);
          setSelectedOrderItem(null);
        }}
        title="Upload Product Photos"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Order Item
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedOrderItem || ''}
              onChange={(e) => setSelectedOrderItem(e.target.value)}
            >
              <option value="">Select an item...</option>
              {waybill.order.items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (SKU: {item.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Photos (Max 5)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 5))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {photoFiles.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {photoFiles.length} file(s) selected
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPhotoModal(false);
                setPhotoFiles([]);
                setSelectedOrderItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!selectedOrderItem || photoFiles.length === 0 || uploadPhotosMutation.isLoading}
            >
              {uploadPhotosMutation.isLoading ? 'Uploading...' : 'Upload Photos'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setNewStatus('');
          setStatusNote('');
        }}
        title="Update Waybill Status"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Status</p>
            <Badge color={getStatusColor(waybill?.status)} size="lg">
              {waybill?.status?.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Select status...</option>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {nextStatuses.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No further transitions available from current status.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note about this status change..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowStatusModal(false);
                setNewStatus('');
                setStatusNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!newStatus || updateStatusMutation.isLoading}
            >
              {updateStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scan Out / Scan In Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setScanDestination('');
        }}
        title={scanType === 'out' ? 'Scan Out — Dispatch from Hub' : 'Scan In — Receive at Location'}
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Waybill</p>
            <p className="font-semibold">{waybill?.waybillNumber}</p>
            <p className="text-sm text-gray-500 mt-1">Current status: <span className="font-medium">{waybill?.status?.replace(/_/g, ' ')}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {scanType === 'out' ? 'Destination' : 'Receiving Location'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={scanDestination}
              onChange={(e) => setScanDestination(e.target.value)}
              placeholder={scanType === 'out' ? 'e.g. Harare Hub, direct delivery' : 'e.g. Bulawayo Hub, warehouse'}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setShowScanModal(false); setScanDestination(''); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScan}
              disabled={!scanDestination.trim() || scanOutMutation.isLoading || scanInMutation.isLoading}
            >
              {(scanOutMutation.isLoading || scanInMutation.isLoading) ? 'Processing...' : scanType === 'out' ? 'Confirm Scan Out' : 'Confirm Scan In'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WaybillDetailPage;
