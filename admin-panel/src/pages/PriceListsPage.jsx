import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { b2bkingAPI, productsAPI, categoriesAPI, customersAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoCreate, IoList, IoClose, IoCheckmark } from 'react-icons/io5';

const PriceListsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [currentList, setCurrentList] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isActiveFilter, setIsActiveFilter] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      customerGroups: [],
      customers: [],
      appliesToAllProducts: false,
      products: [],
      categories: [],
      pricingMethod: 'fixed',
      defaultDiscount: 0,
      defaultMarkup: 0,
      validFrom: '',
      validUntil: '',
      priority: 0,
      isActive: true,
    }
  });

  const pricingMethod = watch('pricingMethod');
  const appliesToAllProducts = watch('appliesToAllProducts');

  const { data, isLoading } = useQuery(
    ['price-lists', page, search, isActiveFilter],
    () => b2bkingAPI.getPriceLists({
      page,
      limit: 20,
      search: search.length >= 2 ? search : undefined,
      isActive: isActiveFilter || undefined
    }),
    { keepPreviousData: true }
  );

  const { data: customerGroupsData } = useQuery(
    'customer-groups',
    () => b2bkingAPI.getCustomerGroups({ limit: 1000 }),
    { enabled: showForm }
  );

  const { data: productsData } = useQuery(
    'products-for-price-list',
    () => productsAPI.getAll({ limit: 1000 }),
    { enabled: showForm && !appliesToAllProducts }
  );

  const { data: categoriesData } = useQuery(
    'categories-for-price-list',
    () => categoriesAPI.getAll({ limit: 1000 }),
    { enabled: showForm && !appliesToAllProducts }
  );

  const { data: customersData } = useQuery(
    'customers-for-price-list',
    () => customersAPI.getAll({ limit: 1000 }),
    { enabled: showForm }
  );

  const saveMutation = useMutation(
    (data) => editingList
      ? b2bkingAPI.updatePriceList(editingList._id, data)
      : b2bkingAPI.createPriceList(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('price-lists');
        toast.success(`Price list ${editingList ? 'updated' : 'created'} successfully`);
        setShowForm(false);
        setEditingList(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save price list');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => b2bkingAPI.deletePriceList(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('price-lists');
        toast.success('Price list deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete price list');
      },
    }
  );

  const handleEdit = (list) => {
    setEditingList(list);
    reset({
      name: list.name,
      description: list.description || '',
      customerGroups: list.customerGroups?.map(g => g._id || g) || [],
      customers: list.customers?.map(c => c._id || c) || [],
      appliesToAllProducts: list.appliesToAllProducts || false,
      products: list.products?.map(p => p._id || p) || [],
      categories: list.categories?.map(c => c._id || c) || [],
      pricingMethod: list.pricingMethod || 'fixed',
      defaultDiscount: list.defaultDiscount || 0,
      defaultMarkup: list.defaultMarkup || 0,
      validFrom: list.validFrom ? new Date(list.validFrom).toISOString().split('T')[0] : '',
      validUntil: list.validUntil ? new Date(list.validUntil).toISOString().split('T')[0] : '',
      priority: list.priority || 0,
      isActive: list.isActive !== false,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingList(null);
    reset();
    setShowForm(true);
  };

  const handleManageItems = (list) => {
    setCurrentList(list);
    setShowItemsModal(true);
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
      header: 'Pricing Method',
      accessor: 'pricingMethod',
      cell: (row) => (
        <span className="text-gray-600 capitalize">
          {row.pricingMethod?.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Assignments',
      accessor: 'assignments',
      cell: (row) => (
        <div className="text-sm text-gray-600">
          {row.appliesToAllProducts ? (
            <span className="text-blue-600">All Products</span>
          ) : (
            <>
              {row.products?.length > 0 && <div>{row.products.length} Products</div>}
              {row.categories?.length > 0 && <div>{row.categories.length} Categories</div>}
            </>
          )}
          {row.customerGroups?.length > 0 && (
            <div>{row.customerGroups.length} Groups</div>
          )}
          {row.customers?.length > 0 && (
            <div>{row.customers.length} Customers</div>
          )}
        </div>
      )
    },
    {
      header: 'Items',
      accessor: 'items',
      cell: (row) => (
        <span className="text-gray-600">{row.items?.length || 0} items</span>
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
            onClick={() => handleManageItems(row)}
          >
            Items
          </Button>
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
            onClick={() => setDeleteModal(row)}
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
            <IoList size={28} />
            Price Lists
          </h1>
          <p className="text-gray-600 mt-1">Manage product pricing for customer groups and individual customers</p>
        </div>
        <Button onClick={handleNew}>
          <IoAdd size={20} className="mr-2" />
          New Price List
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search price lists..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
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
          </div>
        </div>

        <Table
          columns={columns}
          data={data?.data?.data || []}
          isLoading={isLoading}
          pagination={{
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
          setEditingList(null);
          reset();
        }}
        title={editingList ? 'Edit Price List' : 'New Price List'}
        size="large"
      >
        <form onSubmit={handleSubmit(saveMutation.mutate)} className="space-y-4">
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
            label="Pricing Method *"
            {...register('pricingMethod', { required: true })}
            options={[
              { value: 'fixed', label: 'Fixed Price' },
              { value: 'percentage_discount', label: 'Percentage Discount' },
              { value: 'percentage_markup', label: 'Percentage Markup' },
              { value: 'override', label: 'Override Base Price' }
            ]}
          />

          {pricingMethod === 'percentage_discount' && (
            <Input
              label="Default Discount (%)"
              type="number"
              min="0"
              max="100"
              {...register('defaultDiscount', { valueAsNumber: true })}
            />
          )}

          {pricingMethod === 'percentage_markup' && (
            <Input
              label="Default Markup (%)"
              type="number"
              {...register('defaultMarkup', { valueAsNumber: true })}
            />
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('appliesToAllProducts')}
                className="rounded"
              />
              <span>Applies to All Products</span>
            </label>
          </div>

          {!appliesToAllProducts && (
            <>
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
                  options={productsData?.data?.data?.map(p => ({
                    value: p._id,
                    label: `${p.name} (${p.sku || 'No SKU'})`
                  })) || []}
                />
              </div>

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
                  options={categoriesData?.data?.data?.map(c => ({
                    value: c._id,
                    label: c.name
                  })) || []}
                />
              </div>
            </>
          )}

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
              options={customerGroupsData?.data?.data?.map(g => ({
                value: g._id,
                label: g.name
              })) || []}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Individual Customers (Optional)
            </label>
            <Select
              multiple
              value={watch('customers') || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setValue('customers', selected);
              }}
              options={customersData?.data?.data?.map(c => ({
                value: c._id,
                label: `${c.firstName} ${c.lastName} (${c.email})`
              })) || []}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              {...register('validFrom')}
            />

            <Input
              label="Valid Until"
              type="date"
              {...register('validUntil')}
            />
          </div>

          <Input
            label="Priority"
            type="number"
            {...register('priority', { valueAsNumber: true })}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingList(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isLoading}>
              {editingList ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Items Management Modal */}
      {showItemsModal && currentList && (
        <PriceListItemsModal
          priceList={currentList}
          onClose={() => {
            setShowItemsModal(false);
            setCurrentList(null);
            queryClient.invalidateQueries('price-lists');
          }}
        />
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Price List"
      >
        <p className="mb-4">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteModal._id)}
            loading={deleteMutation.isLoading}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// Price List Items Management Component
const PriceListItemsModal = ({ priceList, onClose }) => {
  const queryClient = useQueryClient();
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItemModal, setDeleteItemModal] = useState(null);

  const { data: productsData } = useQuery(
    'products-for-items',
    () => productsAPI.getAll({ limit: 1000 })
  );

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      product: '',
      variation: '',
      price: '',
      salePrice: '',
      minQuantity: 1,
      maxQuantity: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
    }
  });

  const selectedProduct = watch('product');
  const product = productsData?.data?.data?.find(p => p._id === selectedProduct);

  const saveItemMutation = useMutation(
    (data) => editingItem
      ? b2bkingAPI.updatePriceListItem(priceList._id, editingItem._id, data)
      : b2bkingAPI.addPriceListItem(priceList._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('price-lists');
        toast.success(`Price list item ${editingItem ? 'updated' : 'added'} successfully`);
        setShowItemForm(false);
        setEditingItem(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save item');
      },
    }
  );

  const deleteItemMutation = useMutation(
    (itemId) => b2bkingAPI.deletePriceListItem(priceList._id, itemId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('price-lists');
        toast.success('Item deleted successfully');
        setDeleteItemModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete item');
      },
    }
  );

  const handleEditItem = (item) => {
    setEditingItem(item);
    reset({
      product: item.product?._id || item.product || '',
      variation: item.variation || '',
      price: item.price || '',
      salePrice: item.salePrice || '',
      minQuantity: item.minQuantity || 1,
      maxQuantity: item.maxQuantity || '',
      validFrom: item.validFrom ? new Date(item.validFrom).toISOString().split('T')[0] : '',
      validUntil: item.validUntil ? new Date(item.validUntil).toISOString().split('T')[0] : '',
      isActive: item.isActive !== false,
    });
    setShowItemForm(true);
  };

  const items = priceList.items || [];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage Items: ${priceList.name}`}
      size="large"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Add and manage pricing items for this price list</p>
          <Button onClick={() => {
            setEditingItem(null);
            reset();
            setShowItemForm(true);
          }}>
            <IoAdd size={16} className="mr-2" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items added yet</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item._id || index}>
                    <td className="px-4 py-3 text-sm">
                      {item.product?.name || 'Unknown Product'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>R {item.price?.toFixed(2)}</div>
                      {item.salePrice && (
                        <div className="text-green-600">Sale: R {item.salePrice.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.minQuantity}
                      {item.maxQuantity ? ` - ${item.maxQuantity}` : '+'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditItem(item)}
                        >
                          <IoCreate size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteItemModal(item)}
                        >
                          <IoTrash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showItemForm && (
          <Modal
            isOpen={showItemForm}
            onClose={() => {
              setShowItemForm(false);
              setEditingItem(null);
              reset();
            }}
            title={editingItem ? 'Edit Item' : 'Add Item'}
          >
            <form onSubmit={handleSubmit(saveItemMutation.mutate)} className="space-y-4">
              <Select
                label="Product *"
                {...register('product', { required: 'Product is required' })}
                error={errors.product?.message}
                options={[
                  { value: '', label: 'Select a product' },
                  ...(productsData?.data?.data?.map(p => ({
                    value: p._id,
                    label: `${p.name} (${p.sku || 'No SKU'})`
                  })) || [])
                ]}
              />

              {product && product.productType === 'variable' && product.variations?.length > 0 && (
                <Select
                  label="Variation (Optional)"
                  {...register('variation')}
                  options={[
                    { value: '', label: 'All Variations' },
                    ...product.variations.map((v, idx) => ({
                      value: v._id || idx,
                      label: `${Object.values(v.attributes || {}).join(', ')} - R${v.regularPrice}`
                    }))
                  ]}
                />
              )}

              <Input
                label="Price *"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { required: 'Price is required', valueAsNumber: true })}
                error={errors.price?.message}
              />

              <Input
                label="Sale Price (Optional)"
                type="number"
                step="0.01"
                min="0"
                {...register('salePrice', { valueAsNumber: true })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Quantity *"
                  type="number"
                  min="1"
                  {...register('minQuantity', { required: true, valueAsNumber: true })}
                />

                <Input
                  label="Max Quantity (Optional)"
                  type="number"
                  min="1"
                  {...register('maxQuantity', { valueAsNumber: true })}
                  placeholder="Leave empty for no max"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Valid From"
                  type="date"
                  {...register('validFrom')}
                />

                <Input
                  label="Valid Until"
                  type="date"
                  {...register('validUntil')}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="rounded"
                />
                <span>Active</span>
              </label>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saveItemMutation.isLoading}>
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {deleteItemModal && (
          <Modal
            isOpen={!!deleteItemModal}
            onClose={() => setDeleteItemModal(null)}
            title="Delete Item"
          >
            <p className="mb-4">Are you sure you want to delete this item?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteItemModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteItemMutation.mutate(deleteItemModal._id)}
                loading={deleteItemMutation.isLoading}
              >
                Delete
              </Button>
            </div>
          </Modal>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PriceListsPage;
