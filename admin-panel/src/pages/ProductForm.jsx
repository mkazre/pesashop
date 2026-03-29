import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsAPI, categoriesAPI, imagesAPI, currenciesAPI } from '@/services/api';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoArrowBack, IoAdd, IoTrash, IoCloudUpload, IoSparkles, IoCash } from 'react-icons/io5';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiPreviewModal, setAiPreviewModal] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      shortDescription: '',
      regularPrice: '',
      salePrice: '',
      backendPrice: '',
      stock: '',
      categories: [],
      tags: '',
      weight: '',
      images: [],
      featuredImage: '',
      status: 'active',
      productType: 'simple',
      attributes: {},
      variations: [],
    },
  });

  const [attributes, setAttributes] = useState([]);
  const [variations, setVariations] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [generatingSpecs, setGeneratingSpecs] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Watch price fields for real-time conversion
  const regularPrice = watch('regularPrice');
  const salePrice = watch('salePrice');
  const backendPrice = watch('backendPrice');

  // Fetch active currencies for price conversion
  const { data: currenciesData } = useQuery(
    'currencies-for-pricing',
    () => currenciesAPI.getAll(),
    {
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  const baseCurrency = currenciesData?.data?.data?.find(c => c.isBaseCurrency) || { code: 'ZAR', symbol: 'R' };
  const activeCurrencies = currenciesData?.data?.data?.filter(c => 
    c.isActive && !c.isBaseCurrency
  ) || [];

  // Load product if editing
  useQuery(
    ['product', id],
    () => productsAPI.getOne(id),
    {
      enabled: isEdit,
      onSuccess: (response) => {
        const product = response.data.data || response.data;
        Object.keys(product).forEach(key => {
          if (key === 'tags') {
            setValue(key, product[key]?.join(', ') || '');
          } else if (key === 'categories') {
            setValue(key, product[key]?.map(c => c._id || c) || []);
          } else if (key === 'images') {
            // Keep images as URLs (strings)
            setValue(key, product[key] || []);
            // Set first image as featured (only if it's a string)
            if (product[key] && product[key].length > 0 && typeof product[key][0] === 'string') {
              setValue('featuredImage', product[key][0]);
            }
          } else if (key === 'featuredImage') {
            // Only set if it's a string, not an object
            if (typeof product[key] === 'string') {
              setValue(key, product[key]);
            }
          } else if (key === 'attributes') {
            // Convert Map to array format for UI
            if (product[key] && typeof product[key] === 'object') {
              const attrArray = [];
              if (product[key] instanceof Map) {
                product[key].forEach((values, name) => {
                  attrArray.push({
                    name,
                    values: Array.isArray(values) ? values : [values]
                  });
                });
              } else {
                Object.entries(product[key]).forEach(([name, values]) => {
                  attrArray.push({
                    name,
                    values: Array.isArray(values) ? values : [values]
                  });
                });
              }
              setAttributes(attrArray);
              setValue(key, product[key]);
            }
          } else if (key === 'variations') {
            setVariations(product[key] || []);
            setValue(key, product[key] || []);
          } else if (key === 'specifications') {
            setSpecifications(product[key] || []);
          } else if (key === 'productType') {
            setValue(key, product[key] || 'simple');
          } else {
            setValue(key, product[key]);
          }
        });
      },
    }
  );

  // Load categories
  const { data: categoriesData } = useQuery('categories', 
    () => categoriesAPI.getAll()
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data) => isEdit ? productsAPI.update(id, data) : productsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries(['product', id]);
        toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
        // Small delay to ensure data is saved before navigation
        setTimeout(() => {
        navigate('/products');
        }, 500);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} product: ${errorMessage}`);
        console.error('Product save error:', error);
      },
    }
  );

  const onSubmit = async (formData) => {
    try {
    // Convert tags string to array
      formData.tags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    
    // Convert prices to numbers
      formData.regularPrice = parseFloat(formData.regularPrice);
      if (formData.salePrice && formData.salePrice.toString().trim() !== '') {
        const salePrice = parseFloat(formData.salePrice);
        if (salePrice >= formData.regularPrice) {
          toast.error('Sale price must be less than regular price');
          return;
        }
        formData.salePrice = salePrice;
      } else {
        formData.salePrice = undefined;
      }
      if (formData.backendPrice && formData.backendPrice.toString().trim() !== '') {
        formData.backendPrice = parseFloat(formData.backendPrice);
      } else {
        formData.backendPrice = undefined;
      }
      formData.stock = parseInt(formData.stock) || 0;
      formData.weight = formData.weight ? parseFloat(formData.weight) : undefined;

      // Images are already uploaded and URLs are in formData.images
      // Ensure images is an array of strings (URLs)
      if (!formData.images || !Array.isArray(formData.images)) {
        formData.images = [];
      }
      // Filter to only strings (remove any File objects that might remain)
      formData.images = formData.images.filter(img => typeof img === 'string');
      
      // Set featured image from first image if not set
      if (!formData.featuredImage && formData.images.length > 0) {
        formData.featuredImage = formData.images[0];
      }
      
      // Ensure featuredImage is in images array
      if (formData.featuredImage && formData.images && !formData.images.includes(formData.featuredImage)) {
        formData.images.unshift(formData.featuredImage);
      }

      // Clean up - remove empty values
      Object.keys(formData).forEach(key => {
        if (formData[key] === undefined || formData[key] === null || formData[key] === '') {
          if (!['name', 'description', 'regularPrice', 'stock', 'images', 'featuredImage'].includes(key)) {
            delete formData[key];
          }
        }
      });

      // Include specifications
      formData.specifications = specifications;

      // Send as JSON (images are already URLs, not files)
      saveMutation.mutate(formData);
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    }
  };

  const handleGenerateAI = async () => {
    const productName = watch('name');
    if (!productName) {
      toast.error('Please enter a product name first');
      return;
    }

    setGeneratingAI(true);
    try {
      // For new products, send product name in body
      const response = id 
        ? await productsAPI.generateDescription(id)
        : await productsAPI.generateDescription('temp', { productName });
      
      const content = response.data.data;
      setAiGeneratedContent(content);
      setAiPreviewModal(true);
      toast.success('AI descriptions generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate AI description');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleApplyAI = () => {
    if (aiGeneratedContent) {
      setValue('description', aiGeneratedContent.longDescription);
      setValue('shortDescription', aiGeneratedContent.shortDescription);
      setAiPreviewModal(false);
      setAiGeneratedContent(null);
      toast.success('AI descriptions applied to form');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Upload image immediately and get URL back
      const response = await productsAPI.uploadImage(file);
      const imageUrl = response.data.url;
      
      // Add URL to images array
      const images = watch('images') || [];
      const newImages = [...images, imageUrl];
      setValue('images', newImages);
      
      // Set as featured image if it's the first one
      if (images.length === 0) {
        setValue('featuredImage', imageUrl);
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Image upload error:', error);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    const images = watch('images');
    setValue('images', images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/products')}>
          <IoArrowBack size={20} />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU"
              required
              {...register('sku', { required: 'SKU is required' })}
              error={errors.sku?.message}
              fullWidth
            />
            <Input
              label="Product Name"
              required
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message}
              fullWidth
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={generatingAI || !watch('name')}
                className="flex items-center gap-2"
              >
                <IoSparkles size={16} />
                {generatingAI ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="input w-full resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
              Short Description
            </label>
            </div>
            <textarea
              {...register('shortDescription')}
              rows={2}
              className="input w-full resize-none"
            />
          </div>
        </Card>

        {/* Pricing */}
        <Card title="Pricing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Backend Price (Cost) (ZAR)"
              type="number"
              step="0.01"
              {...register('backendPrice')}
              helperText="Cost price for stock purchases (admin only)"
              fullWidth
            />
            <Input
              label="Regular Price (ZAR)"
              type="number"
              step="0.01"
              required
              {...register('regularPrice', { required: 'Price is required' })}
              error={errors.regularPrice?.message}
              fullWidth
            />
            <Input
              label="Sale Price (ZAR)"
              type="number"
              step="0.01"
              {...register('salePrice')}
              helperText="Leave empty if no sale price"
              fullWidth
            />
          </div>
        </Card>

        {/* Price Breakdown - Multi-Currency View */}
        {(regularPrice || salePrice || backendPrice) && activeCurrencies.length > 0 && (
          <Card title="Price Breakdown (All Currencies)" className="bg-blue-50 border-blue-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-100">
                    <th className="text-left py-3 px-4 font-semibold">Price Type</th>
                    <th className="text-right py-3 px-4 font-semibold">
                      {baseCurrency.code} ({baseCurrency.symbol})
                    </th>
                    {activeCurrencies.map((currency) => (
                      <th key={currency._id || currency.code} className="text-right py-3 px-4 font-semibold">
                        {currency.code} ({currency.symbol})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {backendPrice && (
                    <tr className="border-b border-gray-200 bg-red-50">
                      <td className="py-3 px-4 font-medium text-red-900">Backend Price (Cost)</td>
                      <td className="py-3 px-4 text-right font-mono text-red-900">
                        {baseCurrency.symbol}{parseFloat(backendPrice || 0).toFixed(2)}
                      </td>
                      {activeCurrencies.map((currency) => {
                        const convertedPrice = parseFloat(backendPrice || 0) / currency.exchangeRate;
                        return (
                          <td key={currency._id || currency.code} className="py-3 px-4 text-right font-mono text-red-700">
                            {currency.symbolPosition === 'before' 
                              ? `${currency.symbol}${convertedPrice.toFixed(currency.decimalDigits || 2)}`
                              : `${convertedPrice.toFixed(currency.decimalDigits || 2)}${currency.symbol}`}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                  {regularPrice && (
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-medium">Regular Price</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {baseCurrency.symbol}{parseFloat(regularPrice || 0).toFixed(2)}
                      </td>
                      {activeCurrencies.map((currency) => {
                        const convertedPrice = parseFloat(regularPrice || 0) / currency.exchangeRate;
                        return (
                          <td key={currency._id || currency.code} className="py-3 px-4 text-right font-mono">
                            {currency.symbolPosition === 'before' 
                              ? `${currency.symbol}${convertedPrice.toFixed(currency.decimalDigits || 2)}`
                              : `${convertedPrice.toFixed(currency.decimalDigits || 2)}${currency.symbol}`}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                  {salePrice && (
                    <tr className="border-b border-gray-200 bg-green-50">
                      <td className="py-3 px-4 font-medium text-green-900">Sale Price</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-green-900">
                        {baseCurrency.symbol}{parseFloat(salePrice || 0).toFixed(2)}
                      </td>
                      {activeCurrencies.map((currency) => {
                        const convertedPrice = parseFloat(salePrice || 0) / currency.exchangeRate;
                        return (
                          <td key={currency._id || currency.code} className="py-3 px-4 text-right font-mono text-green-700">
                            {currency.symbolPosition === 'before' 
                              ? `${currency.symbol}${convertedPrice.toFixed(currency.decimalDigits || 2)}`
                              : `${convertedPrice.toFixed(currency.decimalDigits || 2)}${currency.symbol}`}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Prices are converted using current exchange rates. Backend price is for cost tracking only and is not visible to customers. 
                Frontend currency conversion uses regular and sale prices only.
              </p>
            </div>
          </Card>
        )}

        {/* Inventory */}
        <Card title="Inventory">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              required
              {...register('stock', { required: 'Stock quantity is required' })}
              error={errors.stock?.message}
              fullWidth
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              {...register('lowStockThreshold')}
              helperText="Alert when stock falls below this number"
              fullWidth
            />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('outOfStock')}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Mark as Out of Stock</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">When checked, this product will be shown as out of stock to customers regardless of stock quantity</p>
          </div>
        </Card>

        {/* Categories & Tags */}
        <Card title="Categories & Tags">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categoriesData?.data?.data?.map((category) => (
                  <label key={category._id} className="flex items-center gap-2 p-2 border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      value={category._id}
                      {...register('categories')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Tags"
              {...register('tags')}
              helperText="Comma-separated tags (e.g., electronics, smartphone, featured)"
              fullWidth
            />
          </div>
        </Card>

        {/* Images */}
        <Card title="Product Images">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {watch('images')?.map((imageUrl, index) => {
                // Images are now always URL strings (uploaded immediately)
                let fullImageUrl = imageUrl;
                if (typeof imageUrl === 'string') {
                  if (imageUrl.startsWith('http')) {
                    fullImageUrl = imageUrl;
                  } else if (imageUrl.startsWith('/uploads/')) {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    fullImageUrl = `${apiUrl}${imageUrl}`;
                  }
                }
                
                return (
                <div key={index} className="relative aspect-square bg-gray-100 border-2 border-gray-200">
                    {fullImageUrl ? (
                  <img 
                        src={fullImageUrl} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image load error:', fullImageUrl);
                          e.target.style.display = 'none';
                        }}
                  />
                    ) : (
                      <span className="text-gray-400 text-xs">No image</span>
                    )}
                    {index === 0 && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <IoTrash size={16} />
                  </button>
                </div>
                );
              })}

              {/* Upload Button */}
              <label className="aspect-square border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  <>
                    <IoCloudUpload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload Image</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-sm text-gray-500">
              First image will be set as primary. Images will be processed to 1:1 ratio.
            </p>
          </div>
        </Card>

        {/* Specifications */}
        <Card title="Specifications">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Add key-value specification pairs for this product.</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const productName = watch('name');
                    if (!productName) { toast.error('Enter a product name first'); return; }
                    setGeneratingSpecs(true);
                    try {
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                      const token = localStorage.getItem('token');
                      const response = await fetch(`${apiUrl}/api/products-ai/generate-specifications/${id || 'temp'}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ productName, description: watch('description') || '' }),
                      });
                      const data = await response.json();
                      if (data.success && data.data?.specifications) {
                        setSpecifications(data.data.specifications);
                        toast.success(`Generated ${data.data.specifications.length} specifications`);
                      } else {
                        toast.error(data.message || 'Failed to generate specs');
                      }
                    } catch (err) {
                      toast.error(err.message || 'Failed to generate specifications');
                    } finally {
                      setGeneratingSpecs(false);
                    }
                  }}
                  disabled={generatingSpecs || !watch('name')}
                  className="flex items-center gap-2"
                >
                  <IoSparkles size={14} />
                  {generatingSpecs ? 'Generating...' : 'AI Generate'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSpecifications([...specifications, { key: '', value: '' }])}
                >
                  <IoAdd size={14} /> Add Row
                </Button>
              </div>
            </div>

            {specifications.length > 0 && (
              <div className="border-2 border-gray-200">
                <div className="grid grid-cols-12 gap-0 bg-gray-100 border-b-2 border-gray-200 px-3 py-2">
                  <div className="col-span-5 text-xs font-bold text-gray-700 uppercase">Key</div>
                  <div className="col-span-6 text-xs font-bold text-gray-700 uppercase">Value</div>
                  <div className="col-span-1"></div>
                </div>
                {specifications.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-0 border-b border-gray-100 px-3 py-1.5 items-center hover:bg-gray-50">
                    <div className="col-span-5 pr-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => {
                          const updated = [...specifications];
                          updated[idx] = { ...updated[idx], key: e.target.value };
                          setSpecifications(updated);
                        }}
                        placeholder="e.g. Material"
                        className="w-full px-2 py-1.5 border border-gray-300 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="col-span-6 pr-2">
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...specifications];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setSpecifications(updated);
                        }}
                        placeholder="e.g. Stainless Steel"
                        className="w-full px-2 py-1.5 border border-gray-300 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => setSpecifications(specifications.filter((_, i) => i !== idx))}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <IoTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {specifications.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200">
                No specifications yet. Click "Add Row" or "AI Generate" to add product specs.
              </div>
            )}
          </div>
        </Card>

        {/* Shipping */}
        <Card title="Shipping">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.01"
            {...register('weight')}
            fullWidth
          />
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/products')}>
            Cancel
          </Button>
          <Button type="submit" loading={saveMutation.isLoading}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>

      {/* AI Preview Modal */}
      <Modal
        isOpen={aiPreviewModal}
        onClose={() => {
          setAiPreviewModal(false);
          setAiGeneratedContent(null);
        }}
        title="AI Generated Descriptions"
        onConfirm={handleApplyAI}
        confirmText="Apply to Form"
        cancelText="Cancel"
      >
        {aiGeneratedContent && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Short Description:</label>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiGeneratedContent.shortDescription}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Long Description:</label>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiGeneratedContent.longDescription}</p>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              <p>Review the generated descriptions above. Click "Apply to Form" to use them, or "Cancel" to generate new ones.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductForm;