import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const ShippingHubsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingHub, setEditingHub] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'LOCAL',
    address: {
      street: '',
      street2: '',
      city: '',
      state: '',
      country: 'South Africa',
      postalCode: ''
    },
    contact: {
      phone: '',
      email: '',
      manager: ''
    },
    operatingHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: '', close: '' }
    },
    coordinates: {
      lat: null,
      lng: null
    },
    servicesOffered: ['COLLECTION', 'DELIVERY'],
    isActive: true
  });

  const queryClient = useQueryClient();

  // Fetch hubs
  const { data, isLoading, error } = useQuery(
    'shipping-hubs',
    () => api.get('/shipping/hubs')
  );

  const hubs = data?.data?.hubs || [];

  // Create/Update hub mutation
  const saveMutation = useMutation(
    (data) => {
      if (editingHub) {
        return api.put(`/shipping/hubs/${editingHub._id}`, data);
      }
      return api.post('/shipping/hubs', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shipping-hubs');
        toast.success(editingHub ? 'Hub updated successfully' : 'Hub created successfully');
        handleCloseModal();
      },
      onError: () => {
        toast.error('Failed to save hub');
      }
    }
  );

  // Delete hub mutation
  const deleteMutation = useMutation(
    (id) => api.delete(`/shipping/hubs/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shipping-hubs');
        toast.success('Hub deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete hub');
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

  // Handle operating hours change
  const handleHoursChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [type]: value
        }
      }
    }));
  };

  // Handle services change
  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }));
  };

  // Handle edit
  const handleEdit = (hub) => {
    setEditingHub(hub);
    setFormData({
      name: hub.name,
      code: hub.code,
      type: hub.type,
      address: hub.address || {
        street: '',
        street2: '',
        city: '',
        state: '',
        country: 'South Africa',
        postalCode: ''
      },
      contact: hub.contact || {
        phone: '',
        email: '',
        manager: ''
      },
      operatingHours: hub.operatingHours || {
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { open: '08:00', close: '17:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { open: '', close: '' }
      },
      coordinates: hub.coordinates || { lat: null, lng: null },
      servicesOffered: hub.servicesOffered || ['COLLECTION', 'DELIVERY'],
      isActive: hub.isActive
    });
    setShowModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHub(null);
    setFormData({
      name: '',
      code: '',
      type: 'LOCAL',
      address: {
        street: '',
        street2: '',
        city: '',
        state: '',
        country: 'South Africa',
        postalCode: ''
      },
      contact: {
        phone: '',
        email: '',
        manager: ''
      },
      operatingHours: {
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { open: '08:00', close: '17:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { open: '', close: '' }
      },
      coordinates: {
        lat: null,
        lng: null
      },
      servicesOffered: ['COLLECTION', 'DELIVERY'],
      isActive: true
    });
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Get hub type badge
  const getHubTypeBadge = (type) => {
    const colors = {
      MAIN: 'blue',
      LOCAL: 'green',
      COLLECTION_POINT: 'purple'
    };
    return (
      <Badge color={colors[type] || 'gray'} size="sm">
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading hubs</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Hubs</h1>
          <p className="text-gray-600 mt-1">Manage collection and delivery hubs</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Hub
        </Button>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((hub) => (
          <div
            key={hub._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{hub.name}</h3>
                <p className="text-sm text-gray-600">Code: {hub.code}</p>
              </div>
              <div className="flex items-center gap-2">
                {getHubTypeBadge(hub.type)}
                <Badge color={hub.isActive ? 'green' : 'red'} size="sm">
                  {hub.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {/* Address */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  {hub.address?.street && (
                    <>
                      {hub.address.street}<br />
                      {hub.address.city}, {hub.address.state} {hub.address.postalCode}
                    </>
                  )}
                </div>
              </div>

              {/* Contact */}
              {hub.contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{hub.contact.phone}</span>
                </div>
              )}

              {hub.contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{hub.contact.email}</span>
                </div>
              )}

              {/* Services */}
              <div className="flex flex-wrap gap-1 mt-3">
                {hub.servicesOffered?.map((service) => (
                  <Badge key={service} color="gray" size="sm">
                    {service.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEdit(hub)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this hub?')) {
                    deleteMutation.mutate(hub._id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingHub ? 'Edit Hub' : 'Add New Hub'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hub Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hub Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hub Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="MAIN">Main Hub</option>
                <option value="LOCAL">Local Hub</option>
                <option value="COLLECTION_POINT">Collection Point</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium mb-3">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address.street}
                  onChange={(e) => handleChange('address.street', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address.city}
                  onChange={(e) => handleChange('address.city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address.state}
                  onChange={(e) => handleChange('address.state', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address.postalCode}
                  onChange={(e) => handleChange('address.postalCode', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address.country}
                  onChange={(e) => handleChange('address.country', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-medium mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.contact.phone}
                  onChange={(e) => handleChange('contact.phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.contact.email}
                  onChange={(e) => handleChange('contact.email', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.contact.manager}
                  onChange={(e) => handleChange('contact.manager', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-medium mb-3">Services Offered</h3>
            <div className="space-y-2">
              {['COLLECTION', 'DELIVERY', 'RETURNS', 'LAYBYE_PICKUP'].map((service) => (
                <label key={service} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 mr-2"
                    checked={formData.servicesOffered.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <span className="text-sm">{service.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-lg font-medium mb-3">Operating Hours</h3>
            <div className="space-y-2">
              {Object.keys(formData.operatingHours).map((day) => (
                <div key={day} className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm capitalize">{day}</span>
                  <input
                    type="time"
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                    value={formData.operatingHours[day].open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                  />
                  <input
                    type="time"
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                    value={formData.operatingHours[day].close}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isLoading}
            >
              {saveMutation.isLoading ? 'Saving...' : (editingHub ? 'Update Hub' : 'Create Hub')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShippingHubsPage;
