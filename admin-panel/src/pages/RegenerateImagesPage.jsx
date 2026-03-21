import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { imagesAPI, categoriesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Checkbox from '@/components/common/Checkbox';
import Select from '@/components/common/Select';
import toast from '@/utils/toast';
import { IoRefresh, IoCheckmarkCircle, IoCloseCircle, IoImage, IoChevronBack, IoChevronForward } from 'react-icons/io5';

const ITEMS_PER_PAGE = 20;

const RegenerateImagesPage = () => {
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('');
  const [filterResized, setFilterResized] = useState('all');
  const [imageType, setImageType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimer = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filterCategory, filterResized]);

  // Fetch categories
  const { data: categoriesResponse } = useQuery('categories', categoriesAPI.getAll);
  
  const categoriesData = useMemo(() => {
    try {
      if (!categoriesResponse) return [];
      const serverResponse = categoriesResponse.data;
      if (serverResponse?.data && Array.isArray(serverResponse.data)) return serverResponse.data;
      if (Array.isArray(serverResponse)) return serverResponse;
      return [];
    } catch { return []; }
  }, [categoriesResponse]);

  // Fetch product images with pagination
  const { data: productsResponse, isLoading } = useQuery(
    ['productImages', filterCategory, filterResized, debouncedSearch, currentPage],
    () => imagesAPI.getProductImages({
      categoryId: filterCategory || undefined,
      resized: filterResized !== 'all' ? filterResized : undefined,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: ITEMS_PER_PAGE
    }),
    {
      keepPreviousData: true,
      onSuccess: () => {
        setSelectedProducts(new Set());
        setSelectedImages(new Set());
      }
    }
  );

  const productsData = useMemo(() => {
    try {
      if (!productsResponse) return [];
      const serverResponse = productsResponse.data;
      if (serverResponse?.data && Array.isArray(serverResponse.data)) return serverResponse.data;
      if (Array.isArray(serverResponse)) return serverResponse;
      return [];
    } catch { return []; }
  }, [productsResponse]);

  const paginationInfo = useMemo(() => {
    const sr = productsResponse?.data;
    return {
      total: sr?.total || 0,
      page: sr?.page || 1,
      pages: sr?.pages || 1,
      limit: sr?.limit || ITEMS_PER_PAGE
    };
  }, [productsResponse]);

  const regenerateMutation = useMutation(
    (data) => imagesAPI.regenerateImages(data),
    {
      onSuccess: (data) => {
        const { processed, failed, skipped } = data.data;
        toast.success(
          `Regeneration complete: ${processed.length} processed, ${failed.length} failed, ${skipped.length} skipped`
        );
        queryClient.invalidateQueries('productImages');
        setSelectedProducts(new Set());
        setSelectedImages(new Set());
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to regenerate images');
      }
    }
  );

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      // Also deselect all images from this product
      const product = productsData?.find(p => p._id === productId);
      if (product) {
        const newSelectedImages = new Set(selectedImages);
        product.images.forEach(img => {
          newSelectedImages.delete(`${productId}-${img.url}`);
        });
        setSelectedImages(newSelectedImages);
      }
    } else {
      newSelected.add(productId);
      // Also select all images from this product
      const product = productsData?.find(p => p._id === productId);
      if (product && Array.isArray(product.images)) {
        const newSelectedImages = new Set(selectedImages);
        product.images.forEach(img => {
          newSelectedImages.add(`${productId}-${img.url}`);
        });
        setSelectedImages(newSelectedImages);
      }
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectImage = (productId, imageUrl) => {
    const key = `${productId}-${imageUrl}`;
    const newSelected = new Set(selectedImages);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === productsData?.length) {
      setSelectedProducts(new Set());
      setSelectedImages(new Set());
    } else {
      const allProductIds = new Set(productsData?.map(p => p._id));
      const allImageKeys = new Set();
      productsData?.forEach(product => {
        if (Array.isArray(product.images)) {
          product.images.forEach(img => {
            allImageKeys.add(`${product._id}-${img.url}`);
          });
        }
      });
      setSelectedProducts(allProductIds);
      setSelectedImages(allImageKeys);
    }
  };

  const handleRegenerate = () => {
    if (selectedImages.size === 0) {
      toast.error('Please select at least one image to regenerate');
      return;
    }

    const productIds = Array.from(selectedProducts);
    const imageUrls = Array.from(selectedImages).map(key => {
      const [, url] = key.split('-');
      return url;
    });

    regenerateMutation.mutate({
      productIds,
      imageUrls,
      imageType
    });
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Regenerate Product Images</h1>
        <Button
          onClick={handleRegenerate}
          loading={regenerateMutation.isLoading}
          disabled={selectedImages.size === 0}
        >
          <IoRefresh size={20} className="mr-2" />
          Regenerate Selected ({selectedImages.size})
        </Button>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...(Array.isArray(categoriesData) ? categoriesData.map(cat => ({
                  value: cat._id,
                  label: cat.name
                })) : [])
              ]}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resized Status</label>
            <Select
              value={filterResized}
              onChange={(e) => setFilterResized(e.target.value)}
              options={[
                { value: 'all', label: 'All Images' },
                { value: 'true', label: 'Resized Only' },
                { value: 'false', label: 'Not Resized' }
              ]}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image Type</label>
            <Select
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              options={[
                { value: 'all', label: 'All Images' },
                { value: 'featured', label: 'Featured Only' },
                { value: 'gallery', label: 'Gallery Only' }
              ]}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>
      </Card>

      {/* Product Images List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedProducts.size === productsData?.length && productsData?.length > 0}
              onChange={handleSelectAll}
              label={`Select All on Page (${productsData?.length || 0} products)`}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {selectedImages.size} image(s) selected
            </div>
            <div className="text-sm text-gray-500">
              Showing {((paginationInfo.page - 1) * paginationInfo.limit) + 1}–{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)} of {paginationInfo.total} products
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !Array.isArray(productsData) ? (
          <div className="text-center p-8 text-gray-500">
            <p>Error: Invalid data format</p>
          </div>
        ) : productsData.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No products found
          </div>
        ) : (
          <div className="space-y-6">
            {productsData.map(product => (
              <div key={product._id} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4 mb-4">
                  <Checkbox
                    checked={selectedProducts.has(product._id)}
                    onChange={() => handleSelectProduct(product._id)}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</p>
                    <div className="flex gap-2 mt-2">
                      {product.categories?.map(cat => (
                        <span key={cat._id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.isArray(product.images) && product.images.length > 0 ? product.images.map((img, idx) => {
                    const imageKey = `${product._id}-${img.url}`;
                    const isSelected = selectedImages.has(imageKey);
                    const imageUrl = img.url.startsWith('http') 
                      ? img.url 
                      : `${apiUrl}${img.url.startsWith('/') ? img.url : '/' + img.url}`;

                    return (
                      <div
                        key={idx}
                        className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          isSelected ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
                        }`}
                        onClick={() => handleSelectImage(product._id, img.url)}
                      >
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={imageUrl}
                            alt={`${product.name} - ${img.type}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary bg-opacity-20 flex items-center justify-center">
                              <IoCheckmarkCircle size={32} className="text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-1 rounded ${
                              img.type === 'featured' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {img.type}
                            </span>
                            {img.isProcessed ? (
                              <IoCheckmarkCircle size={16} className="text-green-600" title="Processed" />
                            ) : (
                              <IoCloseCircle size={16} className="text-red-600" title="Not Processed" />
                            )}
                          </div>
                          {img.aspectRatio && (
                            <p className="text-xs text-gray-600 mt-1">
                              Ratio: {img.aspectRatio}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                      No images found for this product
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {paginationInfo.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <IoChevronBack size={16} className="mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, paginationInfo.pages) }, (_, i) => {
                let pageNum;
                if (paginationInfo.pages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= paginationInfo.pages - 3) {
                  pageNum = paginationInfo.pages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= paginationInfo.pages}
              onClick={() => setCurrentPage(p => Math.min(paginationInfo.pages, p + 1))}
            >
              Next
              <IoChevronForward size={16} className="ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RegenerateImagesPage;
