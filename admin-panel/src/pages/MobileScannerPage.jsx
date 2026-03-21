import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Camera,
  ArrowLeft
} from 'lucide-react';
import toast from '@/utils/toast';
import api from '../services/api';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const MobileScannerPage = () => {
  const { action, waybillNumber } = useParams();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [waybillData, setWaybillData] = useState(null);
  const [destination, setDestination] = useState('');
  const [location, setLocation] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [scanner, setScanner] = useState(null);

  // Initialize scanner
  useEffect(() => {
    if (isScanning && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [isScanning, scanner]);

  // Handle scan success
  const onScanSuccess = async (decodedText) => {
    setIsScanning(false);
    setScanResult(decodedText);
    
    // Fetch waybill data
    try {
      const response = await api.get(`/shipping/mobile/scan/${decodedText}`);
      setWaybillData(response.data.waybill);
    } catch (error) {
      toast.error('Invalid waybill or not found');
      setTimeout(() => {
        setScanResult(null);
        setIsScanning(true);
      }, 2000);
    }
  };

  // Handle scan failure
  const onScanFailure = (error) => {
    // Silent fail - scanning continues
  };

  // Scan out mutation
  const scanOutMutation = useMutation(
    (data) => api.post('/shipping/scan/out', {
      ...data,
      platform: 'mobile',
      isMobile: true
    }),
    {
      onSuccess: () => {
        toast.success('Scan-out completed successfully');
        setTimeout(() => {
          navigate('/shipping');
        }, 2000);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Scan-out failed');
      }
    }
  );

  // Scan in mutation
  const scanInMutation = useMutation(
    (data) => api.post('/shipping/scan/in', {
      ...data,
      platform: 'mobile',
      isMobile: true
    }),
    {
      onSuccess: () => {
        toast.success('Scan-in completed successfully');
        setTimeout(() => {
          navigate('/shipping');
        }, 2000);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Scan-in failed');
      }
    }
  );

  // Handle scan out
  const handleScanOut = () => {
    if (!destination) {
      toast.error('Please select a destination');
      return;
    }

    scanOutMutation.mutate({
      waybillNumber: scanResult,
      destination
    });
  };

  // Handle scan in
  const handleScanIn = () => {
    if (!location) {
      toast.error('Please enter a location');
      return;
    }

    scanInMutation.mutate({
      waybillNumber: scanResult,
      location
    });
  };

  // Reset scanner
  const resetScanner = () => {
    setScanResult(null);
    setWaybillData(null);
    setDestination('');
    setLocation('');
    setIsScanning(true);
  };

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
            <h1 className="text-lg font-semibold">
              {action === 'scan-out' ? 'Scan Out' : 'Scan In'}
            </h1>
          </div>
          {action === 'scan-out' ? (
            <Truck className="w-5 h-5 text-blue-600" />
          ) : (
            <MapPin className="w-5 h-5 text-purple-600" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isScanning && !scanResult ? (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center mb-4">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                Position the barcode within the frame to scan
              </p>
            </div>
            <div id="qr-reader" className="mx-auto"></div>
          </div>
        ) : null}

        {scanResult && waybillData && (
          <div className="space-y-4">
            {/* Waybill Info */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Waybill Details</h2>
                <Badge color={getStatusColor(waybillData.status)}>
                  {waybillData.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Waybill #:</span>
                  <span className="font-medium">{waybillData.waybillNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order #:</span>
                  <span className="font-medium">{waybillData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{waybillData.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">
                    {waybillData.shippingType === 'HUB_COLLECTION' ? 'Hub Collection' : 'Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Form */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              {action === 'scan-out' ? (
                <div>
                  <h3 className="font-semibold mb-3">Select Destination</h3>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="destination"
                        value="direct delivery"
                        checked={destination === 'direct delivery'}
                        onChange={(e) => setDestination(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">Direct Delivery</p>
                        <p className="text-sm text-gray-600">Going directly to customer</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="destination"
                        value="local hub"
                        checked={destination === 'local hub'}
                        onChange={(e) => setDestination(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">Local Hub</p>
                        <p className="text-sm text-gray-600">Transfer to collection hub</p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold mb-3">Enter Location</h3>
                  <input
                    type="text"
                    placeholder="e.g., Cape Town Hub, Driver John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={resetScanner}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={action === 'scan-out' ? handleScanOut : handleScanIn}
                disabled={
                  (action === 'scan-out' && !destination) ||
                  (action === 'scan-in' && !location) ||
                  scanOutMutation.isLoading ||
                  scanInMutation.isLoading
                }
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {scanOutMutation.isLoading || scanInMutation.isLoading
                  ? 'Processing...'
                  : 'Confirm'}
              </Button>
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {isScanning && (
          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Manual Entry</h3>
            <p className="text-sm text-gray-600 mb-3">
              Can't scan? Enter the waybill number manually
            </p>
            <input
              type="text"
              placeholder="e.g., WB-20240319-0001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  onScanSuccess(e.target.value);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileScannerPage;
