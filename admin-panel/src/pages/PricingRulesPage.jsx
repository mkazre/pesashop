import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { b2bkingAPI, productsAPI, categoriesAPI, customersAPI } from '@/services/api';
import { extractData } from '@/utils/apiResponse';
import { useForm, useFieldArray } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoCreate, IoFlash, IoClose, IoWarning, IoRefresh } from 'react-icons/io5';

const PricingRulesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteAction, setDeleteAction] = useState('recalculate');
  const [affectedCount, setAffectedCount] = useState(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [ruleTypeFilter, setRuleTypeFilter] = useState('');

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      ruleType: 'customer_group',
      customerGroups: [],
      customers: [],
      products: [],
      categories: [],
      minQuantity: '',
      maxQuantity: '',
      minOrderValue: '',
      maxOrderValue: '',
      quantityTiers: [],
      action: 'discount_percentage',
      value: 0,
      validFrom: '',
      validUntil: '',
      daysOfWeek: [],
      timeOfDay: { start: '', end: '' },
      priority: 0,
      isActive: true,
      canStack: false,
      maxDiscount: '',
      maxDiscountAmount: '',
      sourceField: 'backendPrice',
      targetField: 'regularPrice',
    }
  });

  const { fields: quantityTierFields, append: appendTier, remove: removeTier } = useFieldArray({
    control,
    name: 'quantityTiers'
  });

  const ruleType = watch('ruleType');
  const action = watch('action');

  const { data, isLoading, refetch } = useQuery(
    ['pricing-rules', page, perPage, search, isActiveFilter, ruleTypeFilter],
    () => b2bkingAPI.getPricingRules({
      page: perPage === 0 ? 1 : page,
      limit: perPage === 0 ? 10000 : perPage,
      search: search.length >= 2 ? search : undefined,
      isActive: isActiveFilter || undefined,
      ruleType: ruleTypeFilter || undefined
    }),
    { 
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always refetch to get latest data
    }
  );

  const { data: customerGroupsData } = useQuery(
    'customer-groups',
    () => b2bkingAPI.getCustomerGroups({ limit: 1000 }),
    { enabled: showForm }
  );

  const { data: productsData } = useQuery(
    'products-for-rules',
    () => productsAPI.getAll({ limit: 1000 }),
    { enabled: showForm }
  );

  const { data: categoriesData } = useQuery(
    'categories-for-rules',
    () => categoriesAPI.getAll({ limit: 1000 }),
    { enabled: showForm }
  );

  const { data: customersData } = useQuery(
    'customers-for-rules',
    () => customersAPI.getAll({ limit: 1000 }),
    { enabled: showForm }
  );

  const cleanFormData = (data) => {
    const cleanData = { ...data };
    if (cleanData.customerGroups && !Array.isArray(cleanData.customerGroups)) {
      cleanData.customerGroups = cleanData.customerGroups ? [cleanData.customerGroups] : [];
    }
    if (cleanData.customers && !Array.isArray(cleanData.customers)) {
      cleanData.customers = cleanData.customers ? [cleanData.customers] : [];
    }
    if (cleanData.products && !Array.isArray(cleanData.products)) {
      cleanData.products = cleanData.products ? [cleanData.products] : [];
    }
    if (cleanData.categories && !Array.isArray(cleanData.categories)) {
      cleanData.categories = cleanData.categories ? [cleanData.categories] : [];
    }
    if (Array.isArray(cleanData.daysOfWeek)) {
      cleanData.daysOfWeek = cleanData.daysOfWeek.map(d => typeof d === 'string' ? parseInt(d) : d).filter(d => !isNaN(d));
    }
    return cleanData;
  };

  const saveMutation = useMutation(
    ({ data, updateProducts = false }) => {
      const cleanData = cleanFormData(data);
      return editingRule
        ? b2bkingAPI.updatePricingRule(editingRule._id, cleanData, updateProducts ? { updateProducts: 'true' } : {})
        : b2bkingAPI.createPricingRule(cleanData);
    },
    {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries(['pricing-rules']);
        await refetch();
        const updatedCount = response.data?.updatedProducts;
        const msg = editingRule
          ? `Pricing rule updated${updatedCount ? ` — ${updatedCount} product(s) re-priced` : ''}`
          : 'Pricing rule created successfully';
        toast.success(msg);
        setShowForm(false);
        setEditingRule(null);
        setShowUpdateConfirm(false);
        setPendingSaveData(null);
        reset();
      },
      onError: (error) => {
        console.error('Error saving pricing rule:', error);
        toast.error(error.response?.data?.message || error.message || 'Failed to save pricing rule');
      },
    }
  );

  // When the user submits the edit form, show update confirmation instead of saving directly
  const handleFormSubmit = (data) => {
    if (editingRule) {
      // Editing — ask whether to update affected products
      setPendingSaveData(data);
      // Fetch affected count
      b2bkingAPI.getAffectedProducts(editingRule._id)
        .then(res => setAffectedCount(res.data?.data?.count || 0))
        .catch(() => setAffectedCount(0));
      setShowUpdateConfirm(true);
    } else {
      // Creating — just save (auto-applies on create in the backend)
      saveMutation.mutate({ data });
    }
  };

  const deleteMutation = useMutation(
    ({ id, priceAction }) => b2bkingAPI.deletePricingRule(id, { priceAction }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('pricing-rules');
        const affected = response.data?.affectedProducts;
        const actionLabel = deleteAction === 'clear' ? 'prices cleared' : deleteAction === 'clearBoth' ? 'all prices cleared' : deleteAction === 'recalculate' ? 'prices recalculated' : '';
        toast.success(`Pricing rule deleted${affected ? ` — ${affected} product(s) ${actionLabel}` : ''}`);
        setDeleteModal(null);
        setDeleteAction('recalculate');
        setAffectedCount(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete pricing rule');
      },
    }
  );

  // When opening delete modal, fetch affected product count
  const handleDeleteClick = (rule) => {
    setDeleteModal(rule);
    setDeleteAction('recalculate');
    setAffectedCount(null);
    b2bkingAPI.getAffectedProducts(rule._id)
      .then(res => setAffectedCount(res.data?.data?.count || 0))
      .catch(() => setAffectedCount(0));
  };

  const recalculateMutation = useMutation(
    (data) => b2bkingAPI.recalculatePrices(data),
    {
      onSuccess: (response) => {
        toast.success(response.data?.message || 'Prices recalculated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to recalculate prices');
      },
    }
  );

  const handleEdit = (rule) => {
    setEditingRule(rule);
    reset({
      name: rule.name,
      description: rule.description || '',
      ruleType: rule.ruleType || 'customer_group',
      customerGroups: rule.customerGroups?.map(g => g._id || g) || [],
      customers: rule.customers?.map(c => c._id || c) || [],
      products: rule.products?.map(p => p._id || p) || [],
      categories: rule.categories?.map(c => c._id || c) || [],
      minQuantity: rule.minQuantity || '',
      maxQuantity: rule.maxQuantity || '',
      minOrderValue: rule.minOrderValue || '',
      maxOrderValue: rule.maxOrderValue || '',
      quantityTiers: rule.quantityTiers || [],
      action: rule.action || 'discount_percentage',
      value: rule.value || 0,
      validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().slice(0, 16) : '',
      validUntil: rule.validUntil ? new Date(rule.validUntil).toISOString().slice(0, 16) : '',
      daysOfWeek: rule.daysOfWeek || [],
      timeOfDay: rule.timeOfDay || { start: '', end: '' },
      priority: rule.priority || 0,
      isActive: rule.isActive !== false,
      canStack: rule.canStack || false,
      maxDiscount: rule.maxDiscount || '',
      maxDiscountAmount: rule.maxDiscountAmount || '',
      sourceField: rule.sourceField || 'backendPrice',
      targetField: rule.targetField || 'regularPrice',
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingRule(null);
    reset();
    setShowForm(true);
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-sm text-gray-500">{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Rule Type',
      accessor: 'ruleType',
      cell: (row) => (
        <span className="text-gray-600 capitalize">
          {row.ruleType?.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 capitalize">
            {row.action?.replace('_', ' ')}
          </div>
          <div className="text-gray-600">
            {row.action?.includes('percentage') ? `${row.value}%` : `R ${row.value}`}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {(row.sourceField || 'backendPrice').replace('Price', '')} → {(row.targetField || 'regularPrice').replace('Price', '')}
          </div>
        </div>
      )
    },
    {
      header: 'Conditions',
      accessor: 'conditions',
      cell: (row) => (
        <div className="text-sm text-gray-600">
          {row.customerGroups?.length > 0 && (
            <div>{row.customerGroups.length} Groups</div>
          )}
          {row.products?.length > 0 && (
            <div>{row.products.length} Products</div>
          )}
          {row.categories?.length > 0 && (
            <div>{row.categories.length} Categories</div>
          )}
          {row.minQuantity && (
            <div>Qty: {row.minQuantity}{row.maxQuantity ? `-${row.maxQuantity}` : '+'}</div>
          )}
          {row.quantityTiers?.length > 0 && (
            <div>{row.quantityTiers.length} Tiers</div>
          )}
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      cell: (row) => (
        <span className="text-gray-600">{row.priority || 0}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            <IoCreate size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteClick(row)}
          >
            <IoTrash size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IoFlash size={28} />
            Pricing Rules
          </h1>
          <p className="text-gray-600 mt-1">Create complex pricing rules with conditions and actions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('This will recalculate prices for ALL products based on active pricing rules. Continue?')) {
                recalculateMutation.mutate({});
              }
            }}
            loading={recalculateMutation.isLoading}
          >
            <IoFlash size={20} className="mr-2" />
            Apply All Rules
          </Button>
          <Button onClick={handleNew}>
            <IoAdd size={20} className="mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search pricing rules..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={ruleTypeFilter}
              onChange={(e) => {
                setRuleTypeFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Types' },
                { value: 'customer_group', label: 'Customer Group' },
                { value: 'customer_specific', label: 'Customer Specific' },
                { value: 'product_specific', label: 'Product Specific' },
                { value: 'category_based', label: 'Category Based' },
                { value: 'quantity_based', label: 'Quantity Based' },
                { value: 'volume_based', label: 'Volume Based' },
                { value: 'date_based', label: 'Date Based' },
                { value: 'combo', label: 'Combo' }
              ]}
              className="w-48"
            />
            <Select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Active Only' },
                { value: 'false', label: 'Inactive Only' }
              ]}
              className="w-40"
            />
            <Select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              options={[
                { value: 20, label: '20 / page' },
                { value: 50, label: '50 / page' },
                { value: 100, label: '100 / page' },
                { value: 0, label: 'Show All' },
              ]}
              className="w-36"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={useMemo(() => {
            const rules = extractData(data);
            return rules;
          }, [data])}
          isLoading={isLoading}
          pagination={perPage === 0 ? undefined : {
            page,
            totalPages: data?.data?.pagination?.pages || 1,
            onPageChange: setPage
          }}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingRule(null);
          reset();
        }}
        title={editingRule ? 'Edit Pricing Rule' : 'New Pricing Rule'}
        size="large"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto">
          <Input
            label="Name *"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Description"
            type="textarea"
            rows={3}
            {...register('description')}
          />

          <Select
            label="Rule Type *"
            {...register('ruleType', { required: true })}
            options={[
              { value: 'customer_group', label: 'Customer Group' },
              { value: 'customer_specific', label: 'Customer Specific' },
              { value: 'product_specific', label: 'Product Specific' },
              { value: 'category_based', label: 'Category Based' },
              { value: 'quantity_based', label: 'Quantity Based' },
              { value: 'volume_based', label: 'Volume Based' },
              { value: 'date_based', label: 'Date Based' },
              { value: 'combo', label: 'Combo (Multiple Conditions)' }
            ]}
          />

          {/* Conditions based on rule type */}
          {(ruleType === 'customer_group' || ruleType === 'combo') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Groups
              </label>
              <Select
                multiple
                value={watch('customerGroups') || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setValue('customerGroups', selected);
                }}
                options={extractData(customerGroupsData).map(g => ({
                  value: g._id,
                  label: g.name
                }))}
              />
            </div>
          )}

          {(ruleType === 'customer_specific' || ruleType === 'combo') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customers
              </label>
              <Select
                multiple
                value={watch('customers') || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setValue('customers', selected);
                }}
                options={extractData(customersData).map(c => ({
                  value: c._id,
                  label: `${c.firstName} ${c.lastName} (${c.email})`
                }))}
              />
            </div>
          )}

          {(ruleType === 'product_specific' || ruleType === 'combo') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Products
              </label>
              <Select
                multiple
                value={watch('products') || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setValue('products', selected);
                }}
                options={extractData(productsData).map(p => ({
                  value: p._id,
                  label: `${p.name} (${p.sku || 'No SKU'})`
                }))}
              />
            </div>
          )}

          {(ruleType === 'category_based' || ruleType === 'combo') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <Select
                multiple
                value={watch('categories') || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setValue('categories', selected);
                }}
                options={extractData(categoriesData).map(c => ({
                  value: c._id,
                  label: c.name
                }))}
              />
            </div>
          )}

          {(ruleType === 'quantity_based' || ruleType === 'combo') && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Quantity"
                type="number"
                min="1"
                {...register('minQuantity', { valueAsNumber: true })}
              />
              <Input
                label="Max Quantity"
                type="number"
                min="1"
                {...register('maxQuantity', { valueAsNumber: true })}
              />
            </div>
          )}

          {(ruleType === 'volume_based' || ruleType === 'combo') && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Order Value"
                type="number"
                min="0"
                step="0.01"
                {...register('minOrderValue', { valueAsNumber: true })}
              />
              <Input
                label="Max Order Value"
                type="number"
                min="0"
                step="0.01"
                {...register('maxOrderValue', { valueAsNumber: true })}
              />
            </div>
          )}

          {/* Quantity Tiers */}
          {(ruleType === 'quantity_based' || ruleType === 'combo') && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Quantity Tiers (Optional)
                </label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => appendTier({
                    minQuantity: 1,
                    maxQuantity: null,
                    price: '',
                    discount: '',
                    priceAdjustment: ''
                  })}
                >
                  <IoAdd size={16} className="mr-1" />
                  Add Tier
                </Button>
              </div>

              {quantityTierFields.map((field, index) => (
                <div key={field.id} className="border rounded p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Tier {index + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => removeTier(index)}
                    >
                      <IoTrash size={14} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Min Qty"
                      type="number"
                      min="1"
                      {...register(`quantityTiers.${index}.minQuantity`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Max Qty"
                      type="number"
                      min="1"
                      {...register(`quantityTiers.${index}.maxQuantity`, { valueAsNumber: true })}
                      placeholder="Leave empty for no max"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Input
                      label="Price"
                      type="number"
                      step="0.01"
                      {...register(`quantityTiers.${index}.price`, { valueAsNumber: true })}
                      placeholder="Fixed price"
                    />
                    <Input
                      label="Discount %"
                      type="number"
                      min="0"
                      max="100"
                      {...register(`quantityTiers.${index}.discount`, { valueAsNumber: true })}
                      placeholder="% discount"
                    />
                    <Input
                      label="Adjustment"
                      type="number"
                      step="0.01"
                      {...register(`quantityTiers.${index}.priceAdjustment`, { valueAsNumber: true })}
                      placeholder="Fixed adjustment"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price Source & Target */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Field Configuration</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select
                label="Read Price From (Source)"
                {...register('sourceField')}
                options={[
                  { value: 'backendPrice', label: 'Backend Price (Cost)' },
                  { value: 'regularPrice', label: 'Regular Price' },
                  { value: 'salePrice', label: 'Sale Price' }
                ]}
              />
              <Select
                label="Write Result To (Target)"
                {...register('targetField')}
                options={[
                  { value: 'regularPrice', label: 'Regular Price' },
                  { value: 'salePrice', label: 'Sale Price' },
                  { value: 'backendPrice', label: 'Backend Price (Cost)' }
                ]}
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-xs text-blue-700">
                <strong>How it works:</strong> The system reads the current value from the <em>Source</em> field, applies the action below, and writes the result to the <em>Target</em> field. For example: Read Backend Price → Markup 50% → Write to Regular Price.
              </p>
            </div>
          </div>

          {/* Action */}
          <div>
            <Select
              label="Action *"
              {...register('action', { required: true })}
              options={[
                { value: 'discount_percentage', label: 'Discount Percentage' },
                { value: 'discount_fixed', label: 'Discount Fixed Amount' },
                { value: 'set_price', label: 'Set Price' },
                { value: 'markup_percentage', label: 'Markup Percentage' },
                { value: 'markup_fixed', label: 'Markup Fixed Amount' }
              ]}
            />

            <Input
              label={action?.includes('percentage') ? 'Value (%)' : 'Value (Amount)'}
              type="number"
              step={action?.includes('percentage') ? '1' : '0.01'}
              min="0"
              {...register('value', { required: 'Value is required', valueAsNumber: true })}
              error={errors.value?.message}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From (Date & Time)"
              type="datetime-local"
              {...register('validFrom')}
              helperText="Leave blank for no start restriction"
            />
            <Input
              label="Valid Until (Date & Time)"
              type="datetime-local"
              {...register('validUntil')}
              helperText="The countdown timer uses this end date for pricing rule sales"
            />
          </div>

          {/* Time Constraints */}
          {(ruleType === 'date_based' || ruleType === 'combo') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={idx}
                        {...register('daysOfWeek')}
                        className="rounded"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Time Start (HH:mm)"
                  type="time"
                  {...register('timeOfDay.start')}
                />
                <Input
                  label="Time End (HH:mm)"
                  type="time"
                  {...register('timeOfDay.end')}
                />
              </div>
            </>
          )}

          <Input
            label="Priority"
            type="number"
            {...register('priority', { valueAsNumber: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Discount %"
              type="number"
              min="0"
              max="100"
              {...register('maxDiscount', { valueAsNumber: true })}
              placeholder="Optional cap"
            />
            <Input
              label="Max Discount Amount"
              type="number"
              step="0.01"
              min="0"
              {...register('maxDiscountAmount', { valueAsNumber: true })}
              placeholder="Optional cap"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded"
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('canStack')}
                className="rounded"
              />
              <span>Can Stack with Other Rules</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingRule(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isLoading}>
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal — enhanced with price action options */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => { setDeleteModal(null); setDeleteAction('recalculate'); setAffectedCount(null); }}
        title="Delete Pricing Rule"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <IoWarning className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-red-800 font-medium">
                You are about to delete <strong>{deleteModal?.name}</strong>.
              </p>
              {affectedCount !== null && (
                <p className="text-sm text-red-700 mt-1">
                  This rule affects <strong>{affectedCount}</strong> product(s).
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What should happen to affected product prices?
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="deleteAction"
                  value="recalculate"
                  checked={deleteAction === 'recalculate'}
                  onChange={(e) => setDeleteAction(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Recalculate prices</span>
                  <p className="text-xs text-gray-500 mt-0.5">Remove this rule's effect and recalculate using remaining active rules. Recommended if other rules still apply.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="deleteAction"
                  value="clear"
                  checked={deleteAction === 'clear'}
                  onChange={(e) => setDeleteAction(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Clear {deleteModal?.targetField === 'salePrice' ? 'sale' : deleteModal?.targetField === 'backendPrice' ? 'backend' : 'regular'} price
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">Set the target field ({deleteModal?.targetField || 'regularPrice'}) to empty on all affected products.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="deleteAction"
                  value="clearBoth"
                  checked={deleteAction === 'clearBoth'}
                  onChange={(e) => setDeleteAction(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Clear both regular &amp; sale price</span>
                  <p className="text-xs text-gray-500 mt-0.5">Reset both regularPrice and salePrice to empty on all affected products. Use when starting fresh.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="deleteAction"
                  value="none"
                  checked={deleteAction === 'none'}
                  onChange={(e) => setDeleteAction(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Don't touch prices</span>
                  <p className="text-xs text-gray-500 mt-0.5">Only delete the rule. Product prices remain as they are (keeps the last calculated values).</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { setDeleteModal(null); setDeleteAction('recalculate'); setAffectedCount(null); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate({ id: deleteModal._id, priceAction: deleteAction })}
              loading={deleteMutation.isLoading}
            >
              <IoTrash size={16} className="mr-1" />
              Delete Rule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Confirmation Modal — shown when editing a rule */}
      <Modal
        isOpen={showUpdateConfirm}
        onClose={() => { setShowUpdateConfirm(false); setPendingSaveData(null); }}
        title="Update Product Prices?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <IoRefresh className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-blue-800">
                You've updated the pricing rule <strong>{editingRule?.name}</strong>.
              </p>
              {affectedCount !== null && (
                <p className="text-sm text-blue-700 mt-1">
                  <strong>{affectedCount}</strong> product(s) are currently controlled by this rule.
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Would you like to re-apply the updated rule to all affected products now? This will recalculate their prices based on the new values.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                // Save WITHOUT updating products
                saveMutation.mutate({ data: pendingSaveData, updateProducts: false });
              }}
              loading={saveMutation.isLoading}
            >
              Save Only
            </Button>
            <Button
              onClick={() => {
                // Save AND update all affected products
                saveMutation.mutate({ data: pendingSaveData, updateProducts: true });
              }}
              loading={saveMutation.isLoading}
            >
              <IoRefresh size={16} className="mr-1" />
              Save &amp; Update Products
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PricingRulesPage;
