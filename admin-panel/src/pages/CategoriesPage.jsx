import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { categoriesAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { extractData } from '@/utils/apiResponse';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Table from '@/components/common/Table';
import toast from 'react-hot-toast';
import { IoAdd, IoTrash, IoCreate, IoChevronDown, IoChevronForward } from 'react-icons/io5';

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

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
    </div>
  );
};

export default CategoriesPage;
