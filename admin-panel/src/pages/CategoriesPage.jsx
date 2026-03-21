import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { categoriesAPI, imagesAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { extractData } from '@/utils/apiResponse';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoCreate, IoChevronDown, IoChevronForward, IoCubeOutline, IoSwapHorizontal, IoRemoveCircleOutline, IoCheckbox, IoSquareOutline, IoClose } from 'react-icons/io5';

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [iconImageUrl, setIconImageUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [productsModal, setProductsModal] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [reassignTarget, setReassignTarget] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getImageSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const handleImageUpload = async (file, setter) => {
    try {
      const res = await imagesAPI.upload(file);
      const url = res.data?.url || res.data?.data?.url || '';
      setter(url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      parent: '',
      displayOrder: 0,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
    }
  });

  const { data, isLoading } = useQuery(
    ['categories'],
    () => categoriesAPI.getAll({ includeInactive: 'true', tree: 'true' }),
    { keepPreviousData: true }
  );

  const saveMutation = useMutation(
    (data) => editingCategory
      ? categoriesAPI.update(editingCategory._id, data)
      : categoriesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
        setShowForm(false);
        setEditingCategory(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save category');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => categoriesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Category deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      },
    }
  );

  // Products for a category
  const { data: categoryProductsData, isLoading: productsLoading } = useQuery(
    ['category-products', productsModal?._id],
    () => categoriesAPI.getProducts(productsModal._id),
    { enabled: !!productsModal?._id }
  );
  const categoryProducts = useMemo(() => {
    const d = categoryProductsData?.data?.data;
    return Array.isArray(d) ? d : [];
  }, [categoryProductsData]);

  const removeProductsMutation = useMutation(
    ({ categoryId, productIds }) => categoriesAPI.removeProducts(categoryId, productIds),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(['category-products', productsModal?._id]);
        queryClient.invalidateQueries('categories');
        toast.success(res.data?.message || 'Products removed');
        setSelectedProducts(new Set());
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove products'),
    }
  );

  const reassignProductsMutation = useMutation(
    ({ categoryId, productIds, targetCategoryId }) => categoriesAPI.reassignProducts(categoryId, productIds, targetCategoryId),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(['category-products', productsModal?._id]);
        queryClient.invalidateQueries('categories');
        toast.success(res.data?.message || 'Products reassigned');
        setSelectedProducts(new Set());
        setReassignTarget('');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to reassign products'),
    }
  );

  const toggleProductSelect = (id) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedProducts.size === categoryProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(categoryProducts.map(p => p._id)));
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    reset({
      name: category.name || '',
      description: category.description || '',
      parent: category.parent?._id || category.parent || '',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive !== undefined ? category.isActive : true,
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
      metaKeywords: category.metaKeywords?.join(', ') || '',
    });
    setIconImageUrl(category.iconImage?.url || '');
    setBannerImageUrl(category.bannerImage?.url || '');
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingCategory(null);
    reset({
      name: '',
      description: '',
      parent: '',
      displayOrder: 0,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
    });
    setIconImageUrl('');
    setBannerImageUrl('');
    setShowForm(true);
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categories, level = 0) => {
    if (!categories || categories.length === 0) return null;

    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category._id);
      
      return (
        <React.Fragment key={category._id}>
          <tr className="hover:bg-gray-50">
            <td style={{ paddingLeft: `${level * 24 + 12}px` }} className="py-3">
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(category._id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? <IoChevronDown size={16} /> : <IoChevronForward size={16} />}
                  </button>
                ) : (
                  <span className="w-6" />
                )}
                <span className="font-medium">{category.name}</span>
              </div>
            </td>
            <td className="py-3">
              <span className={`badge ${category.isActive ? 'badge-success' : 'badge-error'}`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3">{category.productCount || 0}</td>
            <td className="py-3">{category.displayOrder || 0}</td>
            <td className="py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <IoCreate size={18} className="text-primary" />
                </button>
                <button
                  onClick={() => { setProductsModal(category); setSelectedProducts(new Set()); setReassignTarget(''); }}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  title="Manage Products"
                >
                  <IoCubeOutline size={18} className="text-blue-600" />
                </button>
                <button
                  onClick={() => setDeleteModal(category)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <IoTrash size={18} className="text-red-600" />
                </button>
              </div>
            </td>
          </tr>
          {hasChildren && isExpanded && (
            <>{renderCategoryTree(category.children, level + 1)}</>
          )}
        </React.Fragment>
      );
    });
  };

  // Extract categories from API response
  const categories = useMemo(() => extractData(data), [data]);
  const flatCategories = [];

  const flattenCategories = (cats, parentId = null) => {
    cats.forEach(cat => {
      flatCategories.push({ ...cat, parentId });
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, cat._id);
      }
    });
  };

  if (categories.length > 0) {
    flattenCategories(categories);
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (name, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '100px',
      render: (isActive) => (
        <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'productCount',
      title: 'Products',
      width: '100px',
      align: 'center',
    },
    {
      key: 'displayOrder',
      title: 'Order',
      width: '80px',
      align: 'center',
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const onSubmit = (data) => {
    const categoryData = {
      ...data,
      parent: data.parent || null,
      displayOrder: parseInt(data.displayOrder) || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map(k => k.trim()) : [],
      iconImage: { url: iconImageUrl, alt: data.name },
      bannerImage: { url: bannerImageUrl, alt: data.name },
    };

    saveMutation.mutate(categoryData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <IoAdd size={20} />
          Add Category
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-8 text-center">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories found. Create your first category!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Products</th>
                  <th className="text-center py-3 px-4 font-medium">Order</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderCategoryTree(categories)}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Category Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
          reset();
        }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        onConfirm={handleSubmit(onSubmit)}
        confirmText={editingCategory ? 'Update' : 'Create'}
        confirmLoading={saveMutation.isLoading}
        size="large"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Category Name"
            required
            {...register('name', { required: 'Category name is required' })}
            error={errors.name?.message}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Parent Category</label>
            <select {...register('parent')} className="input w-full">
              <option value="">None (Top Level)</option>
              {flatCategories
                .filter(cat => !editingCategory || cat._id !== editingCategory._id)
                .map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Order"
              type="number"
              {...register('displayOrder')}
              fullWidth
            />
            <div>
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4"
                  defaultChecked
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          {/* Category Images */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Category Images</h3>
            <div className="space-y-4">
              {/* Icon Image (1:1 favicon) */}
              <div>
                <label className="block text-sm font-medium mb-1">Category Icon (1:1 square)</label>
                <p className="text-xs text-gray-500 mb-2">Small square image used in category carousels, grids, and navigation. Recommended: 128×128px.</p>
                <div className="flex items-center gap-3">
                  {iconImageUrl && (
                    <img src={getImageSrc(iconImageUrl)} alt="" className="w-16 h-16 object-cover border border-gray-200 rounded" />
                  )}
                  <label className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-300 hover:bg-green-50 cursor-pointer transition-colors">
                    {iconImageUrl ? 'Change' : 'Upload Icon'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], setIconImageUrl); }} />
                  </label>
                  {iconImageUrl && <button type="button" onClick={() => setIconImageUrl('')} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                </div>
              </div>
              {/* Banner Image (landscape) */}
              <div>
                <label className="block text-sm font-medium mb-1">Category Banner (landscape)</label>
                <p className="text-xs text-gray-500 mb-2">Wide banner shown at top of category archive page. Recommended: 1400×300px.</p>
                <div className="flex items-center gap-3">
                  {bannerImageUrl && (
                    <img src={getImageSrc(bannerImageUrl)} alt="" className="w-32 h-16 object-cover border border-gray-200 rounded" />
                  )}
                  <label className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-300 hover:bg-green-50 cursor-pointer transition-colors">
                    {bannerImageUrl ? 'Change' : 'Upload Banner'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], setBannerImageUrl); }} />
                  </label>
                  {bannerImageUrl && <button type="button" onClick={() => setBannerImageUrl('')} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">SEO Settings</h3>
            <div className="space-y-3">
              <Input
                label="Meta Title"
                {...register('metaTitle')}
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <textarea
                  {...register('metaDescription')}
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
              <Input
                label="Meta Keywords"
                {...register('metaKeywords')}
                helperText="Comma-separated keywords"
                fullWidth
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Category"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>?</p>
        <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
        {deleteModal?.productCount > 0 && (
          <p className="text-sm text-red-600 mt-2">
            Warning: This category has {deleteModal.productCount} product(s).
          </p>
        )}
      </Modal>

      {/* ── Products Management Modal ── */}
      {productsModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50" onClick={() => setProductsModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold">Products in "{productsModal.name}"</h2>
                <p className="text-sm text-gray-500">{categoryProducts.length} product(s) linked</p>
              </div>
              <button onClick={() => setProductsModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><IoClose size={22} /></button>
            </div>

            {/* Action Bar */}
            {selectedProducts.size > 0 && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-blue-700">{selectedProducts.size} selected</span>
                <button
                  onClick={() => {
                    if (window.confirm(`Remove ${selectedProducts.size} product(s) from "${productsModal.name}"?`)) {
                      removeProductsMutation.mutate({ categoryId: productsModal._id, productIds: [...selectedProducts] });
                    }
                  }}
                  disabled={removeProductsMutation.isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <IoRemoveCircleOutline size={16} />
                  Remove from category
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={reassignTarget}
                    onChange={e => setReassignTarget(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                  >
                    <option value="">Move to...</option>
                    {flatCategories
                      .filter(c => c._id !== productsModal._id)
                      .map(c => <option key={c._id} value={c._id}>{c.name}</option>)
                    }
                  </select>
                  {reassignTarget && (
                    <button
                      onClick={() => {
                        const targetName = flatCategories.find(c => c._id === reassignTarget)?.name;
                        if (window.confirm(`Move ${selectedProducts.size} product(s) from "${productsModal.name}" to "${targetName}"?`)) {
                          reassignProductsMutation.mutate({ categoryId: productsModal._id, productIds: [...selectedProducts], targetCategoryId: reassignTarget });
                        }
                      }}
                      disabled={reassignProductsMutation.isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      <IoSwapHorizontal size={16} />
                      Reassign
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="flex-1 overflow-y-auto">
              {productsLoading ? (
                <div className="p-8 text-center text-gray-500">Loading products...</div>
              ) : categoryProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No products linked to this category.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 w-10">
                        <button onClick={toggleSelectAll} className="p-0.5">
                          {selectedProducts.size === categoryProducts.length ? <IoCheckbox size={20} className="text-primary" /> : <IoSquareOutline size={20} className="text-gray-400" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">SKU</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Categories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryProducts.map(product => (
                      <tr key={product._id} className={`border-t border-gray-100 hover:bg-gray-50 ${selectedProducts.has(product._id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="py-3 px-4">
                          <button onClick={() => toggleProductSelect(product._id)} className="p-0.5">
                            {selectedProducts.has(product._id) ? <IoCheckbox size={20} className="text-primary" /> : <IoSquareOutline size={20} className="text-gray-400" />}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.featuredImage ? (
                              <img src={getImageSrc(product.featuredImage)} alt="" className="w-10 h-10 object-cover rounded border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
                            )}
                            <span className="font-medium text-sm">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{product.sku || '—'}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          {product.salePrice ? (
                            <><span className="text-red-600">${product.salePrice.toFixed(2)}</span> <span className="text-gray-400 line-through text-xs">${product.regularPrice?.toFixed(2)}</span></>
                          ) : (
                            <span>${product.regularPrice?.toFixed(2) || '—'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(product.categories || []).map(c => (
                              <span key={c._id} className={`text-xs px-2 py-0.5 rounded-full ${c._id === productsModal._id ? 'bg-primary/10 text-primary font-medium' : 'bg-gray-100 text-gray-600'}`}>
                                {c.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
