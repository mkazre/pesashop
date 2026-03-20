import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock,
  Download,
  Camera,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Badge from '../common/Badge';

const OrderTracking = ({ order }) => {
  const [showTrackingDetails, setShowTrackingDetails] = useState(false);

  // Fetch tracking details if waybill exists
  const { data: trackingData, isLoading } = useQuery(
    ['order-tracking', order.waybill, order.customer.email],
    () => api.get(`/shipping/track/${order.waybill.waybillNumber}`, {
      params: { email: order.customer.email }
    }),
    {
      enabled: !!order.waybill && showTrackingDetails,
      retry: false
    }
  );

  const tracking = trackingData?.data?.tracking;

  // Get status progress
  const getStatusProgress = (status) => {
    const stages = {
      'DELIVERY': [
        { key: 'CREATED', label: 'Order Placed', icon: Package },
        { key: 'PACKED', label: 'Packed', icon: Package },
        { key: 'DISPATCHED_FROM_HUB', label: 'Dispatched', icon: Truck },
        { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
        { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
      ],
      'HUB_COLLECTION': [
        { key: 'CREATED', label: 'Order Placed', icon: Package },
        { key: 'PACKED', label: 'Packed', icon: Package },
        { key: 'DISPATCHED_FROM_HUB', label: 'Dispatched', icon: Truck },
        { key: 'RECEIVED_AT_HUB', label: 'At Collection Hub', icon: MapPin },
        { key: 'COLLECTED', label: 'Collected', icon: CheckCircle }
      ]
    };

    const type = tracking?.shippingType || 'DELIVERY';
    const currentStages = stages[type] || stages['DELIVERY'];
    const currentIndex = currentStages.findIndex(s => s.key === status);

    return currentStages.map((stage, index) => ({
      ...stage,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
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

  if (!order.waybill) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No tracking information available yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Tracking will be available once your order is processed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Waybill Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Tracking Information</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Waybill Number:</span>{' '}
                <span className="font-medium">{order.waybill.waybillNumber}</span>
              </p>
              <p>
                <span className="text-gray-600">Status:</span>{' '}
                <Badge color={getStatusColor(order.waybill.status)} size="sm">
                  {order.waybill.status.replace(/_/g, ' ')}
                </Badge>
              </p>
              <p>
                <span className="text-gray-600">Shipping Type:</span>{' '}
                <span className="font-medium">
                  {order.waybill.shippingType === 'HUB_COLLECTION' 
                    ? 'Hub Collection' 
                    : 'Direct Delivery'}
                </span>
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTrackingDetails(!showTrackingDetails)}
          >
            {showTrackingDetails ? 'Hide Details' : 'View Details'}
          </Button>
        </div>

        {/* Hub Location */}
        {order.waybill.shippingType === 'HUB_COLLECTION' && order.waybill.hubLocation && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-purple-900">Collection Hub</p>
                <p className="text-sm text-purple-700 mt-1">
                  {order.waybill.hubLocation.name}<br />
                  {order.waybill.hubLocation.address}<br />
                  {order.waybill.hubLocation.city}
                </p>
                {order.waybill.hubLocation.phone && (
                  <p className="text-sm text-purple-700 mt-2">
                    Phone: {order.waybill.hubLocation.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Tracking */}
      {showTrackingDetails && (
        <>
          {isLoading ? (
            <LoadingSpinner />
          ) : tracking ? (
            <>
              {/* Progress Tracker */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold mb-4">Shipment Progress</h4>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200"></div>
                  
                  {/* Progress Stages */}
                  <div className="space-y-6">
                    {getStatusProgress(tracking.status).map((stage, index) => {
                      const Icon = stage.icon;
                      return (
                        <div key={stage.key} className="flex items-start gap-4">
                          <div className={`
                            relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                            ${stage.completed 
                              ? stage.current 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                            }
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${
                              stage.completed ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {stage.label}
                            </p>
                            {/* Find matching event */}
                            {tracking.events
                              .filter(e => e.status === stage.key)
                              .map((event, i) => (
                                <div key={i} className="mt-1">
                                  <p className="text-sm text-gray-600">
                                    {event.description}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                                  </p>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold mb-4">Tracking History</h4>
                <div className="space-y-3">
                  {tracking.events.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-gray-900">{event.description}</p>
                        <p className="text-gray-500">
                          {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* POD Download */}
              {tracking.pod && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          Proof of Delivery Available
                        </p>
                        <p className="text-sm text-green-700">
                          Delivered on {format(new Date(tracking.pod.deliveredAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    {tracking.pod.podUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(tracking.pod.podUrl, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download POD
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 rounded-lg p-6 text-center">
              <p className="text-red-600">Unable to load tracking details</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderTracking;
