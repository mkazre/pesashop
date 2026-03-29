import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsAPI, categoriesAPI } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { extractData } from '@/utils/apiResponse';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoCreate, IoSearch, IoSparkles, IoCheckbox, IoCheckboxOutline, IoArrowUp, IoArrowDown, IoFunnel } from 'react-icons/io5';

const ProductsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    isActive: '',
    isFeatured: '',
    category: '',
    stock: '',
  });
  const [aiGenerationType, setAiGenerationType] = useState('selected'); // 'selected', 'category', 'all'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [includeSpecifications, setIncludeSpecifications] = useState(false);
  const [onlyNewProducts, setOnlyNewProducts] = useState(false);
  const [sortKey, setSortKey] = useState('date-desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { data, isLoading } = useQuery(
    ['products', page, search, sortKey, filterStatus, filterCategory],
    () => productsAPI.getAll({
      page,
      limit: 20,
      search: search.length >= 3 ? search : undefined,
      sort: sortKey || undefined,
      status: filterStatus || undefined,
      category: filterCategory || undefined,
    }),
    { keepPreviousData: true }
  );

  const { data: categoriesData } = useQuery(
    ['categories'],
    () => categoriesAPI.getAll(),
  );
  const allCategories = useMemo(() => {
    const d = categoriesData?.data?.data || categoriesData?.data || [];
    return Array.isArray(d) ? d : [];
  }, [categoriesData]);

  const deleteMutation = useMutation(
    (id) => productsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product deleted successfully');
        setDeleteModal(null);
      },
      onError: () => {
        toast.error('Failed to delete product');
      },
    }
  );

  const bulkEditMutation = useMutation(
    (data) => productsAPI.bulkEdit(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Products updated successfully');
        setBulkEditModal(false);
        setSelectedProducts(new Set());
        setBulkEditData({ status: '', isActive: '', isFeatured: '', category: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update products');
      },
    }
  );

  const aiGenerateMutation = useMutation(
    (data) => productsAPI.bulkGenerateAI(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('products');
        const d = response.data.data;
        const specMsg = d?.specsCount ? ` (${d.specsCount} specs generated)` : '';
        toast.success(`AI descriptions generated for ${d?.count || 0} products${specMsg}`);
        setAiModal(false);
        setSelectedProducts(new Set());
        setAiGenerationType('selected');
        setSelectedCategory('');
        setIncludeSpecifications(false);
        setOnlyNewProducts(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate AI descriptions');
      },
    }
  );

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    const products = extractData(data);
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p._id)));
    }
  };

  const handleBulkEdit = () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const updates = {};
    if (bulkEditData.status) updates.status = bulkEditData.status;
    if (bulkEditData.isActive !== '') updates.isActive = bulkEditData.isActive === 'true';
    if (bulkEditData.isFeatured !== '') updates.isFeatured = bulkEditData.isFeatured === 'true';
    if (bulkEditData.category) updates.categories = [bulkEditData.category];
    if (bulkEditData.stock !== '' && bulkEditData.stock !== null) updates.stock = parseInt(bulkEditData.stock) || 0;

    if (Object.keys(updates).length === 0) {
      toast.error('Please select at least one field to update');
      return;
    }

    bulkEditMutation.mutate({
      productIds: Array.from(selectedProducts),
      updates
    });
  };

  const handleAIGenerate = () => {
    let requestData = {};

    if (aiGenerationType === 'selected') {
      if (selectedProducts.size === 0) {
        toast.error('Please select at least one product');
        return;
      }
      requestData.productIds = Array.from(selectedProducts);
    } else if (aiGenerationType === 'category') {
      if (!selectedCategory) {
        toast.error('Please select a category');
        return;
      }
      requestData.categoryId = selectedCategory;
    } else if (aiGenerationType === 'all') {
      // Generate for all products
      requestData.productIds = extractData(data).map(p => p._id);
    }

    if (includeSpecifications) {
      requestData.includeSpecifications = true;
    }

    if (onlyNewProducts) {
      requestData.onlyNewProducts = true;
    }

    aiGenerateMutation.mutate(requestData);
  };

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedProducts.size > 0 && selectedProducts.size === extractData(data).length}
          onChange={toggleSelectAll}
          className="cursor-pointer"
        />
      ),
      width: '50px',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedProducts.has(row._id)}
          onChange={() => toggleProductSelection(row._id)}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer"
        />
      ),
    },
    {
      key: 'images',
      title: 'Image',
      sortable: false,
      width: '80px',
      render: (images, row) => {
        const imageUrl = row.featuredImage || (images && images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null);
        let fullImageUrl = null;
        
        if (imageUrl) {
          if (imageUrl.startsWith('http')) {
            fullImageUrl = imageUrl;
          } else if (imageUrl.startsWith('/uploads/')) {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            fullImageUrl = `${apiUrl}${imageUrl}`;
          } else {
            fullImageUrl = imageUrl;
          }
        }
        
        return (
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
            {fullImageUrl ? (
              <img 
                src={fullImageUrl}
                alt="Product" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Thumbnail load error:', fullImageUrl);
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs">No image</span>';
                }}
              />
            ) : (
              <span className="text-gray-400 text-xs">No image</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'sku',
      title: 'SKU',
      width: '120px',
      sortable: false,
    },
    {
      key: 'name',
      title: 'Name',
      sortKey: 'name',
    },
    {
      key: 'categories',
      title: 'Category',
      width: '150px',
      render: (categories) => (
        <div className="text-sm">
          {categories && categories.length > 0 ? (
            <span className="text-gray-700">{categories[0].name}</span>
          ) : (
            <span className="text-gray-400">No category</span>
          )}
        </div>
      ),
    },
    {
      key: 'regularPrice',
      title: 'Price',
      width: '100px',
      sortKey: 'price',
      render: (price, row) => (
        <div>
          <p className="font-medium">R {price?.toFixed(2) || '0.00'}</p>
          {row.salePrice && (
            <p className="text-sm text-green-600">Sale: R {row.salePrice.toFixed(2)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      title: 'Stock',
      width: '80px',
      align: 'center',
      sortable: false,
      render: (stock, row) => (
        <span className={stock < (row.lowStockThreshold || 5) ? 'text-red-600 font-medium' : ''}>
          {stock || 0}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '120px',
      sortable: false,
      render: (status) => (
        <span className={`badge ${
          status === 'active' ? 'badge-success' :
          status === 'trash' ? 'badge-error' :
          'badge-warning'
        }`}>
          {status || 'active'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/edit/${row._id}`);
            }}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal(row);
            }}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  // Extract products from API response
  const products = useMemo(() => {
    const extracted = extractData(data);
    console.log('[ProductsPage] Data extraction:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      extractedCount: extracted.length,
      firstProduct: extracted[0]?.name || 'none'
    });
    return extracted;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          {selectedProducts.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setBulkEditModal(true)}
                className="flex items-center gap-2"
              >
                Bulk Edit ({selectedProducts.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiModal(true)}
                className="flex items-center gap-2"
              >
                <IoSparkles size={18} />
                Generate AI Descriptions ({selectedProducts.size})
              </Button>
            </>
          )}
          <Button
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-2"
          >
            <IoAdd size={20} />
            Add Product
          </Button>
        </div>
      </div>

      <Card>
        {/* Search and Filters */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products... (min 3 characters)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10 w-full"
            />
            {search.length > 0 && search.length < 3 && (
              <p className="text-xs text-gray-500 mt-1">Type at least 3 characters to search</p>
            )}
          </div>
          <Button variant="ghost" onClick={() => setAiModal(true)} className="flex items-center gap-2">
            <IoSparkles size={18} />
            AI Generate All
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <IoFunnel size={14} />
            <span>Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="trash">Trash</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All Categories</option>
            <option value="uncategorized">📂 Uncategorized (No Category)</option>
            {allCategories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="rating-desc">Top Rated</option>
          </select>
          {(filterStatus || filterCategory || sortKey !== 'date-desc') && (
            <button
              onClick={() => { setFilterStatus(''); setFilterCategory(''); setSortKey('date-desc'); setPage(1); }}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Products Table */}
        <Table
          columns={columns}
          data={products}
          loading={isLoading}
          onRowClick={(row) => navigate(`/products/edit/${row._id}`)}
        />

        {/* Pagination */}
        {((data?.data?.pagination?.totalPages || 0) > 1 || (data?.data?.total && data.data.total > 20)) && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data?.data?.pagination?.total || data?.data?.total || 0)} of {data?.data?.pagination?.total || data?.data?.total || 0} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {page} of {data?.data?.pagination?.totalPages || Math.ceil((data?.data?.total || 0) / 20)}
              </span>
              <Button
                variant="ghost"
                disabled={page >= (data?.data?.pagination?.totalPages || Math.ceil((data?.data?.total || 0) / 20))}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={bulkEditModal}
        onClose={() => {
          setBulkEditModal(false);
          setBulkEditData({ status: '', isActive: '', isFeatured: '', category: '', stock: '' });
        }}
        title={`Bulk Edit ${selectedProducts.size} Products`}
        onConfirm={handleBulkEdit}
        confirmText="Update Products"
        confirmLoading={bulkEditMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={bulkEditData.status}
              onChange={(e) => setBulkEditData({ ...bulkEditData, status: e.target.value })}
              className="input w-full"
            >
              <option value="">No change</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="trash">Trash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Active Status</label>
            <select
              value={bulkEditData.isActive}
              onChange={(e) => setBulkEditData({ ...bulkEditData, isActive: e.target.value })}
              className="input w-full"
            >
              <option value="">No change</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Featured</label>
            <select
              value={bulkEditData.isFeatured}
              onChange={(e) => setBulkEditData({ ...bulkEditData, isFeatured: e.target.value })}
              className="input w-full"
            >
              <option value="">No change</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={bulkEditData.category}
              onChange={(e) => setBulkEditData({ ...bulkEditData, category: e.target.value })}
              className="input w-full"
            >
              <option value="">No change</option>
              {allCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
            <input
              type="number"
              value={bulkEditData.stock}
              onChange={(e) => setBulkEditData({ ...bulkEditData, stock: e.target.value })}
              placeholder="Leave empty for no change"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Set to 0 to mark as out of stock</p>
          </div>
        </div>
      </Modal>

      {/* AI Generation Modal */}
      <Modal
        isOpen={aiModal}
        onClose={() => {
          setAiModal(false);
          setAiGenerationType('selected');
          setSelectedCategory('');
          setOnlyNewProducts(false);
        }}
        title="Generate AI Descriptions"
        onConfirm={handleAIGenerate}
        confirmText="Generate Descriptions"
        confirmLoading={aiGenerateMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Generate for:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aiType"
                  value="selected"
                  checked={aiGenerationType === 'selected'}
                  onChange={(e) => setAiGenerationType(e.target.value)}
                />
                <span>Selected Products ({selectedProducts.size} selected)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aiType"
                  value="category"
                  checked={aiGenerationType === 'category'}
                  onChange={(e) => setAiGenerationType(e.target.value)}
                />
                <span>All Products in Category</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aiType"
                  value="all"
                  checked={aiGenerationType === 'all'}
                  onChange={(e) => setAiGenerationType(e.target.value)}
                />
                <span>All Products on This Page</span>
              </label>
            </div>
          </div>

          {aiGenerationType === 'category' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input w-full"
              >
                <option value="">Select a category</option>
                {allCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-2 border-t pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSpecifications}
                onChange={(e) => setIncludeSpecifications(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Include product specifications</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">Generate technical specifications (dimensions, materials, etc.) alongside descriptions</p>
          </div>

          <div className="mt-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNewProducts}
                onChange={(e) => setOnlyNewProducts(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium">Only generate for new products</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">Skip products that already have AI-generated descriptions or specifications</p>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            <p className="font-medium mb-1">What will be generated:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Short Description (2-3 sentences)</li>
              <li>Long Description (3-4 paragraphs)</li>
              <li>SEO-friendly content</li>
              {includeSpecifications && <li>Product Specifications (8-15 key/value pairs)</li>}
            </ul>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Product"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>?</p>
        <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ProductsPage;
