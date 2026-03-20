import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Truck,
  MapPin,
  QrCode,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const ShippingPage = () => {
  const [filters, setFilters] = useState({
    status: '',
    shippingType: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [selectedWaybills, setSelectedWaybills] = useState([]);
  const queryClient = useQueryClient();

  // Fetch waybills
  const { data, isLoading, error } = useQuery(
    ['waybills', filters],
    () => api.get('/shipping/waybills', { params: filters }),
    { keepPreviousData: true }
  );

  // Fetch shipping hubs
  const { data: hubsData } = useQuery(
    'shipping-hubs',
    () => api.get('/shipping/hubs', { params: { isActive: true } })
  );

  const waybills = data?.data?.waybills || [];
  const total = data?.data?.total || 0;
  const hubs = hubsData?.data?.hubs || [];

  // Get status badge color
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

  // Get shipping type badge
  const getShippingTypeBadge = (type) => {
    return type === 'HUB_COLLECTION' ? (
      <Badge color="purple" size="sm">
        <MapPin className="w-3 h-3 mr-1" />
        Hub Collection
      </Badge>
    ) : (
      <Badge color="blue" size="sm">
        <Truck className="w-3 h-3 mr-1" />
        Delivery
      </Badge>
    );
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedWaybills.length === 0) {
      toast.error('Please select waybills');
      return;
    }

    try {
      if (action === 'print') {
        // Generate PDFs for selected waybills
        for (const waybillId of selectedWaybills) {
          const response = await api.get(`/shipping/waybills/${waybillId}/pdf`);
          window.open(response.data.pdfUrl, '_blank');
        }
        toast.success(`Generated ${selectedWaybills.length} waybill PDFs`);
      }
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading waybills</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping & Logistics</h1>
          <p className="text-gray-600 mt-1">Manage waybills and track shipments</p>
        </div>
        <div className="flex gap-3">
          <Link to="/shipping/hubs">
            <Button variant="secondary">
              <MapPin className="w-4 h-4 mr-2" />
              Manage Hubs
            </Button>
          </Link>
          <Link to="/shipping/mobile">
            <Button variant="secondary">
              <QrCode className="w-4 h-4 mr-2" />
              Mobile Scanner
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Waybill or order number..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="CREATED">Created</option>
              <option value="PACKED">Packed</option>
              <option value="DISPATCHED_FROM_HUB">Dispatched</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="RECEIVED_AT_HUB">At Hub</option>
              <option value="WITH_DELIVERY_DRIVER">With Driver</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COLLECTED">Collected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.shippingType}
              onChange={(e) => handleFilterChange('shippingType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="DELIVERY">Delivery</option>
              <option value="HUB_COLLECTION">Hub Collection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedWaybills.length > 0 && (
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBulkAction('print')}
            >
              <Download className="w-4 h-4 mr-1" />
              Print Selected ({selectedWaybills.length})
            </Button>
          </div>
        )}
      </div>

      {/* Waybills Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWaybills(waybills.map(w => w._id));
                      } else {
                        setSelectedWaybills([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waybill #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waybills.map((waybill) => (
                <tr key={waybill._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedWaybills.includes(waybill._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWaybills([...selectedWaybills, waybill._id]);
                        } else {
                          setSelectedWaybills(selectedWaybills.filter(id => id !== waybill._id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {waybill.waybillNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {waybill.order ? (
                      <Link 
                        to={`/orders/${waybill.order._id}`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {waybill.order.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {waybill.customer ? `${waybill.customer.firstName} ${waybill.customer.lastName}` : 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {waybill.customer?.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getShippingTypeBadge(waybill.shippingType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getStatusColor(waybill.status)}>
                      {waybill.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(waybill.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        to={`/shipping/waybills/${waybill._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            const response = await api.get(`/shipping/waybills/${waybill._id}/pdf`);
                            window.open(response.data.pdfUrl, '_blank');
                          } catch (error) {
                            toast.error('Failed to generate PDF');
                          }
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Showing {waybills.length} of {total} waybills
              </p>
              {/* Add pagination controls here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingPage;
