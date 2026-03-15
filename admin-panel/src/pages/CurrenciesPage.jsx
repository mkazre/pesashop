import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { currenciesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoCash, IoRefresh, IoAdd, IoCreate, IoTrash, IoCheckmark, IoEye, IoEyeOff, IoCheckbox, IoSquareOutline } from 'react-icons/io5';
import { useForm } from 'react-hook-form';

const CurrenciesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [baseCurrencyModal, setBaseCurrencyModal] = useState(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const { data, isLoading } = useQuery('currencies', () => currenciesAPI.getAll());
  const { data: baseCurrencyData } = useQuery('base-currency', () => currenciesAPI.getBase());
  const { data: updaterStatus } = useQuery('currency-updater-status', () => currenciesAPI.getUpdaterStatus());

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      symbol: '',
      exchangeRate: 1,
      decimalDigits: 2,
      symbolPosition: 'before',
      decimalSeparator: '.',
      thousandSeparator: ',',
      isActive: true,
      showInFrontend: true,
      sortOrder: 0
    }
  });

  const createMutation = useMutation(
    (data) => currenciesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        queryClient.invalidateQueries('base-currency');
        toast.success('Currency created successfully');
        setShowForm(false);
        setEditingCurrency(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create currency');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => currenciesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        queryClient.invalidateQueries('base-currency');
        toast.success('Currency updated successfully');
        setShowForm(false);
        setEditingCurrency(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update currency');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => currenciesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        queryClient.invalidateQueries('base-currency');
        toast.success('Currency deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete currency');
      }
    }
  );

  const setBaseMutation = useMutation(
    (id) => currenciesAPI.setBase(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        queryClient.invalidateQueries('base-currency');
        toast.success('Base currency updated successfully');
        setBaseCurrencyModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to set base currency');
      }
    }
  );

  const updateRatesMutation = useMutation(
    () => currenciesAPI.updateRates(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        toast.success('Exchange rates updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update rates');
      }
    }
  );

  const bulkUpdateMutation = useMutation(
    ({ ids, updates }) => currenciesAPI.bulkUpdate(ids, updates),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('currencies');
        queryClient.invalidateQueries('base-currency');
        toast.success(response.data.message || 'Currencies updated successfully');
        setSelectedCurrencies([]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update currencies');
      }
    }
  );

  const bulkDeleteMutation = useMutation(
    (ids) => currenciesAPI.bulkDelete(ids),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('currencies');
        queryClient.invalidateQueries('base-currency');
        toast.success(response.data.message || 'Currencies deleted successfully');
        setSelectedCurrencies([]);
        setBulkDeleteModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete currencies');
      }
    }
  );

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setValue('code', currency.code);
    setValue('name', currency.name);
    setValue('symbol', currency.symbol);
    setValue('exchangeRate', currency.exchangeRate);
    setValue('decimalDigits', currency.decimalDigits);
    setValue('symbolPosition', currency.symbolPosition);
    setValue('decimalSeparator', currency.decimalSeparator);
    setValue('thousandSeparator', currency.thousandSeparator);
    setValue('isActive', currency.isActive);
    setValue('showInFrontend', currency.showInFrontend);
    setValue('sortOrder', currency.sortOrder || 0);
    setShowForm(true);
  };

  const onSubmit = (data) => {
    const currencyData = {
      ...data,
      exchangeRate: parseFloat(data.exchangeRate),
      decimalDigits: parseInt(data.decimalDigits),
      sortOrder: parseInt(data.sortOrder) || 0
    };

    if (editingCurrency) {
      updateMutation.mutate({ id: editingCurrency._id, data: currencyData });
    } else {
      createMutation.mutate(currencyData);
    }
  };

  const baseCurrency = baseCurrencyData?.data?.data;
  // Extract currencies from API response
  const currencies = useMemo(() => {
    if (!data) return [];
    const serverResponse = data.data || data;
    if (serverResponse?.data && Array.isArray(serverResponse.data)) {
      return serverResponse.data;
    }
    if (Array.isArray(serverResponse)) {
      return serverResponse;
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }, [data]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all non-base currencies
      const selectableIds = currencies
        .filter(c => !c.isBaseCurrency)
        .map(c => c._id);
      setSelectedCurrencies(selectableIds);
    } else {
      setSelectedCurrencies([]);
    }
  };

  const handleSelectCurrency = (currencyId) => {
    setSelectedCurrencies(prev => {
      if (prev.includes(currencyId)) {
        return prev.filter(id => id !== currencyId);
      } else {
        return [...prev, currencyId];
      }
    });
  };

  const isAllSelected = currencies.length > 0 && 
    currencies.filter(c => !c.isBaseCurrency).every(c => selectedCurrencies.includes(c._id));
  const isIndeterminate = selectedCurrencies.length > 0 && !isAllSelected;

  // Bulk action handlers
  const handleBulkEnable = () => {
    if (selectedCurrencies.length === 0) {
      toast.error('Please select at least one currency');
      return;
    }
    bulkUpdateMutation.mutate({ ids: selectedCurrencies, updates: { isActive: true } });
  };

  const handleBulkDisable = () => {
    if (selectedCurrencies.length === 0) {
      toast.error('Please select at least one currency');
      return;
    }
    bulkUpdateMutation.mutate({ ids: selectedCurrencies, updates: { isActive: false } });
  };

  const handleBulkShowFrontend = () => {
    if (selectedCurrencies.length === 0) {
      toast.error('Please select at least one currency');
      return;
    }
    bulkUpdateMutation.mutate({ ids: selectedCurrencies, updates: { showInFrontend: true } });
  };

  const handleBulkHideFrontend = () => {
    if (selectedCurrencies.length === 0) {
      toast.error('Please select at least one currency');
      return;
    }
    bulkUpdateMutation.mutate({ ids: selectedCurrencies, updates: { showInFrontend: false } });
  };

  const handleBulkDelete = () => {
    if (selectedCurrencies.length === 0) {
      toast.error('Please select at least one currency');
      return;
    }
    setBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedCurrencies);
  };

  const columns = [
    {
      key: 'select',
      title: (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isIndeterminate;
            }}
            onChange={handleSelectAll}
            className="checkbox checkbox-primary checkbox-sm"
            title="Select All"
          />
        </div>
      ),
      width: '50px',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedCurrencies.includes(row._id)}
          onChange={() => handleSelectCurrency(row._id)}
          disabled={row.isBaseCurrency}
          className="checkbox checkbox-primary checkbox-sm"
          title={row.isBaseCurrency ? 'Cannot select base currency' : 'Select currency'}
        />
      ),
    },
    {
      key: 'code',
      title: 'Currency',
      width: '150px',
      render: (code, row) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{row.symbol}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold">{code}</p>
              {row.isBaseCurrency && (
                <span className="badge badge-primary badge-sm">Base</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'exchangeRate',
      title: 'Exchange Rate',
      width: '150px',
      render: (rate, row) => (
        <div>
          <span className="font-mono">{rate.toFixed(4)}</span>
          {row.isBaseCurrency && (
            <span className="text-xs text-gray-500 ml-2">(Base)</span>
          )}
        </div>
      ),
    },
    {
      key: 'showInFrontend',
      title: 'Frontend',
      width: '120px',
      render: (show, row) => (
        <div className="flex items-center gap-2">
          {show ? (
            <span className="badge badge-success badge-sm flex items-center gap-1">
              <IoEye size={14} />
              Visible
            </span>
          ) : (
            <span className="badge badge-warning badge-sm flex items-center gap-1">
              <IoEyeOff size={14} />
              Hidden
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'sortOrder',
      title: 'Order',
      width: '80px',
      render: (val) => (
        <span className="font-mono text-sm">{val || 0}</span>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '100px',
      render: (active) => (
        <span className={`badge ${active ? 'badge-success' : 'badge-error'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      title: 'Last Updated',
      width: '180px',
      render: (date) => date ? new Date(date).toLocaleString() : 'Never',
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '200px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.isBaseCurrency && (
            <button
              onClick={() => setBaseCurrencyModal(row)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Set as Base Currency"
            >
              <IoCheckmark size={18} className="text-blue-600" />
            </button>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Edit"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          {!row.isBaseCurrency && (
            <button
              onClick={() => setDeleteModal(row)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Delete"
            >
              <IoTrash size={18} className="text-red-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Currency Management</h1>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => updateRatesMutation.mutate()} 
            loading={updateRatesMutation.isLoading}
          >
            <IoRefresh size={20} className="mr-2" />
            Update Rates
          </Button>
          <Button onClick={() => { setShowForm(true); setEditingCurrency(null); reset(); }}>
            <IoAdd size={20} className="mr-2" />
            Add Currency
          </Button>
        </div>
      </div>

      {/* Base Currency Card */}
      {baseCurrency && (
        <Card className="bg-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Base Currency</p>
              <p className="text-2xl font-bold">
                {baseCurrency.code} - {baseCurrency.name}
              </p>
              <p className="text-sm opacity-75 mt-2">
                All prices are stored in {baseCurrency.code}. Exchange rates are updated daily at 2:00 AM.
              </p>
              {updaterStatus?.data?.data?.lastUpdate && (
                <p className="text-xs opacity-60 mt-1">
                  Last update: {new Date(updaterStatus.data.data.lastUpdate).toLocaleString()}
                </p>
              )}
            </div>
            <IoCash size={64} className="opacity-20" />
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Total Currencies</p>
          <p className="text-2xl font-bold text-primary">{data?.data?.data?.length || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Active Currencies</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.data?.data?.filter(c => c.isActive).length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Frontend Visible</p>
          <p className="text-2xl font-bold text-blue-600">
            {data?.data?.data?.filter(c => c.showInFrontend && c.isActive).length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Updater Status</p>
          <p className="text-sm font-medium">
            {updaterStatus?.data?.data?.isRunning ? (
              <span className="text-green-600">Running</span>
            ) : (
              <span className="text-gray-400">Stopped</span>
            )}
          </p>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCurrencies.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="font-medium text-blue-900">
                {selectedCurrencies.length} currency(ies) selected
              </span>
              <button
                onClick={() => setSelectedCurrencies([])}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEnable}
                loading={bulkUpdateMutation.isLoading}
              >
                Enable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDisable}
                loading={bulkUpdateMutation.isLoading}
              >
                Disable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkShowFrontend}
                loading={bulkUpdateMutation.isLoading}
              >
                <IoEye size={16} className="mr-1" />
                Show in Frontend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkHideFrontend}
                loading={bulkUpdateMutation.isLoading}
              >
                <IoEyeOff size={16} className="mr-1" />
                Hide from Frontend
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                loading={bulkDeleteMutation.isLoading}
              >
                <IoTrash size={16} className="mr-1" />
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Currencies Table */}
      <Card title="Currencies">
        <Table columns={columns} data={currencies} loading={isLoading} />
      </Card>

      {/* Add/Edit Currency Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingCurrency(null); reset(); }}
        title={editingCurrency ? 'Edit Currency' : 'Add Currency'}
        size="lg"
        showFooter={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Currency Code (3 letters)"
              {...register('code', { 
                required: true,
                pattern: {
                  value: /^[A-Z]{3}$/,
                  message: 'Must be 3 uppercase letters'
                }
              })}
              error={errors.code?.message}
              disabled={!!editingCurrency}
              fullWidth
            />
            <Input
              label="Currency Name"
              {...register('name', { required: true })}
              error={errors.name && 'Required'}
              fullWidth
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Symbol"
              {...register('symbol', { required: true })}
              error={errors.symbol && 'Required'}
              fullWidth
            />
            <Input
              label="Exchange Rate"
              type="number"
              step="0.0001"
              {...register('exchangeRate', { required: true, min: 0 })}
              error={errors.exchangeRate && 'Required'}
              disabled={editingCurrency?.isBaseCurrency}
              fullWidth
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Decimal Digits"
              type="number"
              min="0"
              max="4"
              {...register('decimalDigits', { required: true, min: 0, max: 4 })}
              error={errors.decimalDigits && 'Required'}
              fullWidth
            />
            <div>
              <label className="block text-sm font-medium mb-1">Symbol Position</label>
              <select {...register('symbolPosition')} className="input w-full">
                <option value="before">Before (e.g., $100)</option>
                <option value="after">After (e.g., 100€)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Decimal Separator"
              {...register('decimalSeparator', { required: true, maxLength: 1 })}
              error={errors.decimalSeparator && 'Required'}
              fullWidth
            />
            <Input
              label="Thousand Separator"
              {...register('thousandSeparator', { required: true, maxLength: 1 })}
              error={errors.thousandSeparator && 'Required'}
              fullWidth
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order (lower = first / default)"
              type="number"
              min="0"
              {...register('sortOrder')}
              fullWidth
            />
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showInFrontend')}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm font-medium">Show in Frontend</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setShowForm(false); setEditingCurrency(null); reset(); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingCurrency ? 'Update Currency' : 'Create Currency'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirm Delete"
        size="sm"
        showFooter={false}
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete currency "{deleteModal?.code}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteModal._id)} loading={deleteMutation.isLoading}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Set Base Currency Modal */}
      <Modal
        isOpen={!!baseCurrencyModal}
        onClose={() => setBaseCurrencyModal(null)}
        title="Set Base Currency"
        size="sm"
        showFooter={false}
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to set "{baseCurrencyModal?.code} - {baseCurrencyModal?.name}" as the base currency?
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            This will update all exchange rates relative to the new base currency. The exchange rate for this currency will be set to 1.
          </span>
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setBaseCurrencyModal(null)}>Cancel</Button>
          <Button onClick={() => setBaseMutation.mutate(baseCurrencyModal._id)} loading={setBaseMutation.isLoading}>
            Set as Base
          </Button>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        title="Confirm Bulk Delete"
        size="sm"
        showFooter={false}
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete {selectedCurrencies.length} currency(ies)? This action cannot be undone.
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            Base currencies cannot be deleted and will be automatically excluded.
          </span>
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setBulkDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmBulkDelete} loading={bulkDeleteMutation.isLoading}>
            Delete {selectedCurrencies.length} Currency(ies)
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CurrenciesPage;
