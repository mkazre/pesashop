import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { imagesAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Checkbox from '@/components/common/Checkbox';
import Select from '@/components/common/Select';
import toast from 'react-hot-toast';
import { 
  IoImages, 
  IoCloudUpload, 
  IoCheckmark, 
  IoResize, 
  IoColorPalette,
  IoCut,
  IoShieldCheckmark,
  IoDownload,
  IoSettings,
  IoRefresh
} from 'react-icons/io5';

const ImageManagerPage = () => {
  const queryClient = useQueryClient();
  const [watermarkFile, setWatermarkFile] = useState(null);
  const [processedImages, setProcessedImages] = useState([]);
  const [processingOptions, setProcessingOptions] = useState({
    trimWhitespace: false,
    backgroundColor: '',
    targetWidth: '',
    targetHeight: '',
    targetRatio: '1:1',
    outputFormat: 'webp',
    imageQuality: 90
  });

  // Fetch current configuration
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = useQuery(
    'imageManagerConfig',
    imagesAPI.getConfig,
    {
      onSuccess: (data) => {
        if (data?.data) {
          const configData = data.data;
          setProcessingOptions(prev => ({
            ...prev,
            trimWhitespace: configData.trimWhitespace || false,
            backgroundColor: configData.backgroundColor || '',
            targetWidth: configData.targetWidth || '',
            targetHeight: configData.targetHeight || '',
            targetRatio: configData.targetRatio === 1 ? '1:1' : 
                        (configData.targetRatio === 'auto' ? 'auto' : 
                        (typeof configData.targetRatio === 'number' ? String(configData.targetRatio) : configData.targetRatio)),
            outputFormat: configData.outputFormat || 'webp',
            imageQuality: configData.imageQuality || 90
          }));
        }
      }
    }
  );

  const watermarkConfig = config?.data || {};
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const watermarkPreviewUrl = watermarkConfig.watermarkPath 
    ? `${apiUrl}${watermarkConfig.watermarkPath}`
    : null;

  const { register: watermarkRegister, handleSubmit: handleWatermarkSubmit, watch: watchWatermark, formState: { errors: watermarkErrors } } = useForm({
    defaultValues: {
      position: 'bottom-right',
      size: '0.2',
      opacity: '0.7',
    }
  });

  const { register: configRegister, handleSubmit: handleConfigSubmit, watch: watchConfig, reset: resetConfig } = useForm({
    defaultValues: {
      targetWidth: 2000,
      targetHeight: 2000,
      targetRatio: '1:1',
      trimWhitespace: false,
      backgroundColor: '',
      smartThumbnailControl: true,
      outputFormat: 'webp',
      imageQuality: 90
    }
  });

  // Update form when config loads
  useEffect(() => {
    if (config?.data) {
      const configData = config.data;
      
      // Convert targetRatio from number to string format
      let targetRatioStr = '1:1'; // default
      if (configData.targetRatio === 1 || configData.targetRatio === '1:1') {
        targetRatioStr = '1:1';
      } else if (configData.targetRatio === 'auto') {
        targetRatioStr = 'auto';
      } else if (typeof configData.targetRatio === 'number') {
        // Convert numeric ratio to string format
        if (Math.abs(configData.targetRatio - 4/3) < 0.01) {
          targetRatioStr = '4:3';
        } else if (Math.abs(configData.targetRatio - 3/4) < 0.01) {
          targetRatioStr = '3:4';
        } else if (Math.abs(configData.targetRatio - 16/9) < 0.01) {
          targetRatioStr = '16:9';
        } else if (Math.abs(configData.targetRatio - 9/16) < 0.01) {
          targetRatioStr = '9:16';
        } else {
          targetRatioStr = String(configData.targetRatio);
        }
      } else if (typeof configData.targetRatio === 'string') {
        targetRatioStr = configData.targetRatio;
      }
      
      resetConfig({
        targetWidth: configData.targetWidth || 2000,
        targetHeight: configData.targetHeight || 2000,
        targetRatio: targetRatioStr,
        trimWhitespace: configData.trimWhitespace || false,
        backgroundColor: configData.backgroundColor || '',
        smartThumbnailControl: configData.smartThumbnailControl !== undefined ? configData.smartThumbnailControl : true,
        outputFormat: configData.outputFormat || 'webp',
        imageQuality: configData.imageQuality || 90
      });
      
      console.log('[ImageManagerPage] Config loaded:', {
        targetRatio: configData.targetRatio,
        targetRatioStr,
        targetWidth: configData.targetWidth,
        targetHeight: configData.targetHeight
      });
    }
  }, [config, resetConfig]);

  const configureWatermarkMutation = useMutation(
    (data) => imagesAPI.configureWatermark(data.file, {
      position: data.position,
      size: parseFloat(data.size),
      opacity: parseFloat(data.opacity),
    }),
    {
      onSuccess: () => {
        toast.success('Watermark configuration saved');
        queryClient.invalidateQueries('imageManagerConfig');
        refetchConfig();
      },
      onError: (error) => toast.error(error?.response?.data?.message || 'Failed to save configuration'),
    }
  );

  const updateConfigMutation = useMutation(
    (data) => imagesAPI.updateConfig(data),
    {
      onSuccess: () => {
        toast.success('Image Manager configuration saved');
        queryClient.invalidateQueries('imageManagerConfig');
        refetchConfig();
      },
      onError: (error) => toast.error(error?.response?.data?.message || 'Failed to save configuration'),
    }
  );

  const processImageMutation = useMutation(
    ({ file, options }) => imagesAPI.process(file, options),
    {
      onSuccess: (data) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const imageUrl = data.data.url.startsWith('http') 
          ? data.data.url 
          : `${apiUrl}${data.data.url}`;
        
        setProcessedImages(prev => [...prev, {
          ...data.data,
          url: imageUrl
        }]);
        toast.success('Image processed successfully');
      },
      onError: (error) => toast.error(error?.response?.data?.message || 'Failed to process image'),
    }
  );

  const onWatermarkSubmit = (data) => {
    configureWatermarkMutation.mutate({ 
      file: watermarkFile, 
      ...data 
    });
  };

  const onConfigSubmit = (data) => {
    // Convert targetRatio string to number if needed
    let targetRatio = data.targetRatio;
    if (targetRatio === 'auto') {
      targetRatio = 'auto';
    } else if (targetRatio === '1:1') {
      targetRatio = 1;
    } else if (targetRatio === '4:3') {
      targetRatio = 4/3;
    } else if (targetRatio === '3:4') {
      targetRatio = 3/4;
    } else if (targetRatio === '16:9') {
      targetRatio = 16/9;
    } else if (targetRatio === '9:16') {
      targetRatio = 9/16;
    }
    
    const configToSave = {
      targetWidth: data.targetWidth || null,
      targetHeight: data.targetHeight || null,
      targetRatio,
      trimWhitespace: data.trimWhitespace || false,
      smartThumbnailControl: data.smartThumbnailControl !== undefined ? data.smartThumbnailControl : true,
      backgroundColor: data.backgroundColor || null,
      outputFormat: data.outputFormat || 'webp',
      imageQuality: data.imageQuality || 90
    };
    
    console.log('[ImageManagerPage] Saving config:', configToSave);
    
    updateConfigMutation.mutate(configToSave);
  };

  const handleImageProcess = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Use current config for processing
    const options = {
      trimWhitespace: processingOptions.trimWhitespace,
      backgroundColor: processingOptions.backgroundColor || null,
      targetWidth: processingOptions.targetWidth ? parseInt(processingOptions.targetWidth) : undefined,
      targetHeight: processingOptions.targetHeight ? parseInt(processingOptions.targetHeight) : undefined,
      targetRatio: processingOptions.targetRatio,
      outputFormat: processingOptions.outputFormat,
      imageQuality: processingOptions.imageQuality ? parseInt(processingOptions.imageQuality) : undefined
    };

    files.forEach(file => {
      processImageMutation.mutate({ file, options });
    });
  };

  const positions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'center', label: 'Center' },
  ];

  const aspectRatios = [
    { value: 'auto', label: 'Auto (Maintain Original)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Landscape)' },
    { value: '3:4', label: '3:4 (Portrait)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
  ];

  const outputFormats = [
    { value: 'webp', label: 'WebP (Recommended - 90% smaller, maintains quality)' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Image Manager</h1>
        <div className="flex items-center gap-4">
          <Link to="/images/regenerate">
            <Button variant="secondary">
              <IoRefresh size={20} className="mr-2" />
              Regenerate Product Images
            </Button>
          </Link>
          <div className="text-sm text-gray-600">
            Smart Image Resize PRO Features
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Image Resize PRO Configuration */}
        <Card title="Image Processing Settings" subtitle="Configure Smart Image Resize PRO features">
          <form onSubmit={handleConfigSubmit(onConfigSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Width (px)"
                type="number"
                {...configRegister('targetWidth', { valueAsNumber: true })}
                helperText="Leave empty for auto"
                fullWidth
              />
              <Input
                label="Target Height (px)"
                type="number"
                {...configRegister('targetHeight', { valueAsNumber: true })}
                helperText="Leave empty for auto"
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {aspectRatios.map(ratio => {
                  const isSelected = watchConfig('targetRatio') === ratio.value;
                  const getAspectStyle = (value) => {
                    switch(value) {
                      case '1:1': return { aspectRatio: '1/1' };
                      case '4:3': return { aspectRatio: '4/3' };
                      case '3:4': return { aspectRatio: '3/4' };
                      case '16:9': return { aspectRatio: '16/9' };
                      case '9:16': return { aspectRatio: '9/16' };
                      default: return { aspectRatio: 'auto' };
                    }
                  };
                  return (
                    <label
                      key={ratio.value}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={ratio.value}
                        {...configRegister('targetRatio')}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <div
                          className="w-full bg-gray-200 border-2 border-gray-400 mb-2"
                          style={getAspectStyle(ratio.value)}
                        />
                        <span className="text-xs font-medium">{ratio.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Checkbox
              label="Trim Image Whitespace"
              {...configRegister('trimWhitespace')}
              helperText="Automatically remove blank space around products"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Custom Background Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  {...configRegister('backgroundColor', {
                    setValueAs: (v) => v || null
                  })}
                  className="w-20 h-10"
                  defaultValue="#FFFFFF"
                />
                <Input
                  type="text"
                  placeholder="#FFFFFF"
                  {...configRegister('backgroundColor', {
                    setValueAs: (v) => {
                      if (!v || v.trim() === '') return null;
                      // Ensure it starts with #
                      return v.startsWith('#') ? v : `#${v}`;
                    }
                  })}
                  helperText="Hex color for padding space (leave empty for transparent)"
                  fullWidth
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Output Format</label>
              <Select
                {...configRegister('outputFormat')}
                options={outputFormats}
                fullWidth
              />
              <p className="text-xs text-gray-500 mt-1">
                WebP format reduces file size by up to 90% while maintaining quality
              </p>
            </div>

            <Input
              label="Image Quality (1-100)"
              type="number"
              min="1"
              max="100"
              {...configRegister('imageQuality', { valueAsNumber: true })}
              helperText="Higher = better quality but larger file size"
              fullWidth
            />

            <Checkbox
              label="Smart Thumbnail Control"
              {...configRegister('smartThumbnailControl')}
              helperText="Prevent unwanted size generation by themes/plugins"
            />

            <Button
              type="submit"
              loading={updateConfigMutation.isLoading}
              fullWidth
            >
              <IoSettings size={20} className="mr-2" />
              Save Processing Settings
            </Button>
          </form>
        </Card>

        {/* Watermark Configuration */}
        <Card title="Watermark Configuration" subtitle="Configure automatic watermarking">
          <form onSubmit={handleWatermarkSubmit(onWatermarkSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Watermark Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setWatermarkFile(e.target.files[0])}
                className="input w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload a PNG image with transparency for best results. Leave empty to update settings only.
              </p>
            </div>

            {/* Watermark Preview */}
            {watermarkPreviewUrl && (
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">Watermark Preview</h4>
                <div className="relative bg-white rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                  {watermarkPreviewUrl && (
                    <img
                      src={watermarkPreviewUrl}
                      alt="Watermark preview"
                      className="absolute"
                      style={{
                        width: `${(watermarkConfig.watermarkSize || 0.2) * 100}%`,
                        height: `${(watermarkConfig.watermarkSize || 0.2) * 100}%`,
                        opacity: watermarkConfig.watermarkOpacity || 0.7,
                        ...(watermarkConfig.watermarkPosition === 'top-left' && { top: '5%', left: '5%' }),
                        ...(watermarkConfig.watermarkPosition === 'top-right' && { top: '5%', right: '5%' }),
                        ...(watermarkConfig.watermarkPosition === 'bottom-left' && { bottom: '5%', left: '5%' }),
                        ...(watermarkConfig.watermarkPosition === 'bottom-right' && { bottom: '5%', right: '5%' }),
                        ...(watermarkConfig.watermarkPosition === 'center' && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
                      }}
                    />
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p>Position: <strong>{watermarkConfig.watermarkPosition || 'bottom-right'}</strong></p>
                  <p>Size: <strong>{(watermarkConfig.watermarkSize || 0.2) * 100}%</strong></p>
                  <p>Opacity: <strong>{(watermarkConfig.watermarkOpacity || 0.7) * 100}%</strong></p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <Select
                {...watermarkRegister('position')}
                options={positions}
                fullWidth
              />
            </div>

            <Input
              label="Size (0.1 - 1.0)"
              type="number"
              step="0.1"
              min="0.1"
              max="1.0"
              {...watermarkRegister('size', { required: true, valueAsNumber: true })}
              error={watermarkErrors.size && 'Required'}
              helperText="Size relative to image (0.2 = 20%)"
              fullWidth
            />

            <Input
              label="Opacity (0.1 - 1.0)"
              type="number"
              step="0.1"
              min="0.1"
              max="1.0"
              {...watermarkRegister('opacity', { required: true, valueAsNumber: true })}
              error={watermarkErrors.opacity && 'Required'}
              helperText="Transparency level (1.0 = opaque)"
              fullWidth
            />

            <Button
              type="submit"
              loading={configureWatermarkMutation.isLoading}
              fullWidth
            >
              <IoCheckmark size={20} className="mr-2" />
              Save Watermark Settings
            </Button>
          </form>
        </Card>
      </div>

      {/* Image Processing */}
      <Card title="Process Images" subtitle="Upload and process images with Smart Image Resize PRO">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageProcess}
              className="input w-full"
              disabled={processImageMutation.isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Select one or more images to process. Images will be resized, trimmed (if enabled), 
              watermarked (if configured), and converted to WebP format.
            </p>
          </div>

          {processImageMutation.isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4">Processing images...</span>
            </div>
          )}

          {processedImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Processed Images ({processedImages.length})</h4>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setProcessedImages([])}
                >
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {processedImages.map((img, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="relative aspect-square mb-2">
                      <img 
                        src={img.url} 
                        alt="Processed" 
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-medium truncate">{img.filename}</p>
                      <p className="text-gray-600">
                        {img.dimensions?.width} × {img.dimensions?.height}px
                      </p>
                      <p className="text-gray-500">
                        {(img.size / 1024).toFixed(1)} KB
                      </p>
                      <a
                        href={img.url}
                        download={img.filename}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <IoDownload size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Features */}
      <Card title="Smart Image Resize PRO Features">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-primary bg-opacity-10 mx-auto mb-4 flex items-center justify-center rounded-full">
              <IoResize size={32} className="text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Uniformly-Sized Images</h4>
            <p className="text-sm text-gray-600">
              Resize images to fit defined width/height while preserving aspect ratio. 
              Choose from preset ratios or use custom dimensions.
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-primary bg-opacity-10 mx-auto mb-4 flex items-center justify-center rounded-full">
              <IoCut size={32} className="text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Trim Image Whitespace</h4>
            <p className="text-sm text-gray-600">
              Automatically detect and remove blank space around products for cleaner, 
              more professional product images.
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-primary bg-opacity-10 mx-auto mb-4 flex items-center justify-center rounded-full">
              <IoImages size={32} className="text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Add Watermark</h4>
            <p className="text-sm text-gray-600">
              Protect your images, boost brand visibility, and prevent unauthorized use 
              with customizable watermarks.
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-primary bg-opacity-10 mx-auto mb-4 flex items-center justify-center rounded-full">
              <IoColorPalette size={32} className="text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Custom Background Color</h4>
            <p className="text-sm text-gray-600">
              Match your website design by setting a custom background color for padding 
              space around products.
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-primary bg-opacity-10 mx-auto mb-4 flex items-center justify-center rounded-full">
              <IoShieldCheckmark size={32} className="text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Smart Thumbnail Control</h4>
            <p className="text-sm text-gray-600">
              Prevent unwanted size generation by themes and plugins. Only generate 
              thumbnails when explicitly requested.
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-primary bg-opacity-10 mx-auto mb-4 flex items-center justify-center rounded-full">
              <IoCloudUpload size={32} className="text-primary" />
            </div>
            <h4 className="font-semibold mb-2">WebP Format</h4>
            <p className="text-sm text-gray-600">
              Boost speed and reduce file sizes by up to 90% while maintaining quality 
              and transparency. Fully compatible with your existing product module.
            </p>
          </div>
        </div>
      </Card>

      {/* How It Works */}
      <Card title="How It Works">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-bold rounded-full flex-shrink-0">1</div>
            <div>
              <p className="font-medium">Configure Settings</p>
              <p className="text-sm text-gray-600">
                Set up your image processing preferences: dimensions, aspect ratio, whitespace trimming, 
                background color, and watermark settings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-bold rounded-full flex-shrink-0">2</div>
            <div>
              <p className="font-medium">Upload Images</p>
              <p className="text-sm text-gray-600">
                Select product images to process. You can upload multiple images at once for batch processing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-bold rounded-full flex-shrink-0">3</div>
            <div>
              <p className="font-medium">Automatic Processing</p>
              <p className="text-sm text-gray-600">
                Images are automatically resized, trimmed (if enabled), watermarked (if configured), 
                and converted to WebP format for optimal performance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-bold rounded-full flex-shrink-0">4</div>
            <div>
              <p className="font-medium">Use Processed Images</p>
              <p className="text-sm text-gray-600">
                Processed images are ready to use in product listings and throughout your store. 
                All images maintain consistent sizing and branding.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImageManagerPage;
