import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import api, { importAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { IoCloudUpload, IoCloudDownload, IoCheckmarkCircle, IoCloseCircle, IoWarning, IoRefresh, IoTrash } from 'react-icons/io5';

const ImportExportPage = () => {
  const [importType, setImportType] = useState('products');
  const [exportType, setExportType] = useState('products');
  const [exportFormat, setExportFormat] = useState('woocommerce');
  const [file, setFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [duplicateResolutions, setDuplicateResolutions] = useState({});
  const [processImages, setProcessImages] = useState(true);
  const [imageProcessingType, setImageProcessingType] = useState('all');
  const [showDuplicateResolution, setShowDuplicateResolution] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [stripHtml, setStripHtml] = useState(true);
  const eventSourceRef = useRef(null);

  // SSE progress listener
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startProgressListener = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const es = new EventSource(`${baseUrl}/import/progress?token=${token}`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setImportProgress(data);
      } catch (e) {}
    };
    es.onerror = () => { es.close(); };
    eventSourceRef.current = es;
  };

  const stopProgressListener = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setTimeout(() => setImportProgress(null), 3000);
  };

  const validateMutation = useMutation(
    ({ type, file }) => importAPI.validate(type, file),
    {
      onSuccess: (data) => {
        setValidationResults(data.data);
        if (data.data.duplicates > 0) {
          setShowDuplicateResolution(true);
          toast.error(`Found ${data.data.duplicates} duplicate(s). Please resolve them before importing.`);
        } else {
          setShowDuplicateResolution(false);
          toast.success('Validation passed - no duplicates found');
        }
      },
      onError: (error) => {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          toast.error('Validation timed out. The file may be too large — try splitting it into smaller batches.');
        } else if (!error.response) {
          toast.error('Network error during validation. Please check your connection and try again.');
        } else {
          toast.error(error.response?.data?.message || 'Validation failed');
        }
      },
    }
  );

  const importMutation = useMutation(
    ({ type, file, options }) => importAPI.import(type, file, options),
    {
      onMutate: () => { startProgressListener(); },
      onSuccess: (data) => {
        stopProgressListener();
        setImportResults(data.data);
        toast.success(data.message || 'Import completed');
        setFile(null);
        setValidationResults(null);
        setDuplicateResolutions({});
        setShowDuplicateResolution(false);
      },
      onError: (error) => {
        stopProgressListener();
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          toast.error('Import timed out. Products imported so far are saved. Re-import the same file — duplicates will be skipped automatically.');
        } else if (!error.response) {
          toast.error('Network error during import. Products imported so far are saved. You can safely re-import.');
        } else {
          toast.error(error.response?.data?.message || 'Import failed');
        }
      },
    }
  );

  const stripHtmlMutation = useMutation(
    () => api.post('/import/strip-html', {}, { timeout: 1800000 }),
    {
      onMutate: () => { startProgressListener(); },
      onSuccess: (response) => {
        stopProgressListener();
        toast.success(response.data?.message || 'HTML stripped from products');
      },
      onError: (error) => {
        stopProgressListener();
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          toast.error('Strip HTML timed out. Try again — it will resume from where it left off.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to strip HTML');
        }
      },
    }
  );

  const exportMutation = useMutation(
    ({ type, format }) => importAPI.export(type, { format }),
    {
      onSuccess: (response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${exportType}-export-${exportFormat}-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Export completed');
      },
      onError: () => toast.error('Export failed'),
    }
  );

  const handleValidate = () => {
    if (!file) { toast.error('Please select a file'); return; }
    setDuplicateResolutions({});
    setShowDuplicateResolution(false);
    validateMutation.mutate({ type: importType, file });
  };

  const handleImport = () => {
    if (!file) { toast.error('Please select a file'); return; }
    if (validationResults?.duplicates > 0 && Object.keys(duplicateResolutions).length < validationResults.duplicates) {
      toast.error('Please resolve all duplicates before importing');
      return;
    }
    importMutation.mutate({
      type: importType,
      file,
      options: {
        processImages,
        imageProcessingType: processImages ? imageProcessingType : undefined,
        duplicateResolution: duplicateResolutions,
        stripHtml,
      },
    });
  };

  const handleDuplicateResolution = (rowNumber, resolution) => {
    setDuplicateResolutions(prev => ({ ...prev, [rowNumber]: resolution }));
  };

  const applyResolutionToAll = (resolution) => {
    if (!validationResults?.duplicatesList) return;
    const newResolutions = {};
    validationResults.duplicatesList.forEach(dup => { newResolutions[dup.row] = resolution; });
    setDuplicateResolutions(newResolutions);
    toast.success(`Applied "${resolution}" to all duplicates`);
  };

  const progressPercent = importProgress ? Math.round((importProgress.current / importProgress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Import / Export</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card title="Import Data" subtitle="Import from WooCommerce or native CSV">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Import Type</label>
              <select
                value={importType}
                onChange={(e) => {
                  setImportType(e.target.value);
                  setFile(null);
                  setValidationResults(null);
                  setImportResults(null);
                  setDuplicateResolutions({});
                  setShowDuplicateResolution(false);
                  setImportProgress(null);
                }}
                className="input w-full"
              >
                <option value="products">Products</option>
                <option value="categories">Categories</option>
                <option value="customers">Customers</option>
                <option value="orders">Orders</option>
                <option value="tags">Tags</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setValidationResults(null);
                  setImportResults(null);
                  setDuplicateResolutions({});
                  setShowDuplicateResolution(false);
                  setImportProgress(null);
                }}
                className="input w-full"
              />
              {file && (
                <p className="text-xs text-gray-500 mt-1">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {importType === 'products' && (
              <div className="space-y-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="stripHtml"
                    checked={stripHtml}
                    onChange={(e) => setStripHtml(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="stripHtml" className="text-sm font-medium">
                    Strip HTML Tags from Text Fields
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Removes HTML tags (span, br, p, etc.) from names, descriptions, and short descriptions.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="processImages"
                    checked={processImages}
                    onChange={(e) => setProcessImages(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="processImages" className="text-sm font-medium">
                    Process Images Automatically
                  </label>
                </div>
                {processImages && (
                  <div className="ml-6 space-y-2">
                    <p className="text-xs text-gray-600 mb-2">
                      Images will be downloaded, resized, trimmed (if enabled), watermarked (if configured), 
                      and converted to WebP format according to your Image Manager settings.
                    </p>
                    <div>
                      <label className="block text-sm font-medium mb-2">Process Which Images?</label>
                      <select
                        value={imageProcessingType}
                        onChange={(e) => setImageProcessingType(e.target.value)}
                        className="input w-full text-sm"
                      >
                        <option value="all">All Images (Featured + Gallery)</option>
                        <option value="featured">Featured Images Only</option>
                        <option value="gallery">Gallery Images Only</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleValidate}
                loading={validateMutation.isLoading}
                disabled={!file}
                fullWidth
              >
                <IoCloudUpload size={20} className="mr-2" />
                Validate
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                loading={importMutation.isLoading}
                disabled={!file || !validationResults || (validationResults.duplicates > 0 && Object.keys(duplicateResolutions).length < validationResults.duplicates)}
                fullWidth
              >
                <IoCheckmarkCircle size={20} className="mr-2" />
                Import
              </Button>
            </div>

            {/* Progress Bar */}
            {importProgress && (
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-700">
                    {importProgress.phase === 'validate' ? 'Validating' : 'Importing'} {importProgress.type || importType}...
                  </span>
                  <span className="text-sm font-bold text-indigo-700">{progressPercent}%</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-600 mt-1">
                  {importProgress.current} / {importProgress.total} rows processed
                </p>
              </div>
            )}

            {validationResults && !importProgress && (
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2">Validation Results</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total Rows:</strong> {validationResults.totalRows}</p>
                  <p className={validationResults.duplicates > 0 ? "text-yellow-600 font-semibold" : "text-gray-600"}>
                    <strong>Duplicates:</strong> {validationResults.duplicates}
                  </p>
                  <p className={validationResults.errors > 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
                    <strong>Errors:</strong> {validationResults.errors}
                  </p>
                  {validationResults.valid && validationResults.duplicates === 0 && (
                    <p className="text-green-600 font-semibold">✓ Ready to import</p>
                  )}
                </div>
              </div>
            )}

            {importResults && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <IoCheckmarkCircle className="text-green-600" size={20} />
                  Import Results
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600"><strong>Created:</strong> {importResults.created?.length || 0}</p>
                  <p className="text-blue-600"><strong>Updated:</strong> {importResults.updated?.length || 0}</p>
                  <p className="text-purple-600"><strong>Merged:</strong> {importResults.merged?.length || 0}</p>
                  <p className="text-yellow-600"><strong>Skipped:</strong> {importResults.skipped?.length || 0}</p>
                  <p className="text-red-600"><strong>Errors:</strong> {importResults.errors?.length || 0}</p>
                </div>
              </div>
            )}

            {/* Strip HTML from existing products */}
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                <IoTrash className="text-yellow-600" size={18} />
                Strip HTML from Existing Products
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Scan all products in the database and remove HTML tags from names, descriptions, and short descriptions.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('This will strip HTML tags from ALL product text fields. Continue?')) {
                    stripHtmlMutation.mutate();
                  }
                }}
                loading={stripHtmlMutation.isLoading}
              >
                <IoRefresh size={16} className="mr-2" />
                Strip HTML Now
              </Button>
            </div>
          </div>
        </Card>

        {/* Export Section */}
        <Card title="Export Data" subtitle="Download as CSV">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Export Type</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="input w-full"
              >
                <option value="products">Products</option>
                <option value="categories">Categories</option>
                <option value="customers">Customers</option>
                <option value="orders">Orders</option>
              </select>
            </div>

            {exportType === 'products' && (
              <div>
                <label className="block text-sm font-medium mb-2">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="input w-full"
                >
                  <option value="woocommerce">WooCommerce Compatible</option>
                  <option value="native">Native App Format</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {exportFormat === 'woocommerce'
                    ? 'Includes WooCommerce column names for easy re-import into WooCommerce or this app'
                    : 'Uses internal field names (regularPrice, backendPrice, etc.)'}
                </p>
              </div>
            )}

            <Button
              onClick={() => exportMutation.mutate({ type: exportType, format: exportFormat })}
              loading={exportMutation.isLoading}
              fullWidth
            >
              <IoCloudDownload size={20} className="mr-2" />
              Export to CSV
            </Button>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h4 className="font-semibold mb-2">Export Info</h4>
              <p className="text-sm text-gray-600">
                Exports all data of the selected type. Products can be exported in WooCommerce-compatible 
                or native format. All other types use a standard CSV format.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Duplicate Resolution */}
      {showDuplicateResolution && validationResults?.duplicatesList && validationResults.duplicatesList.length > 0 && (
        <Card title="Resolve Duplicates" subtitle={`Found ${validationResults.duplicates} duplicate(s). Choose how to handle each:`}>
          <div className="space-y-4">
            <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium self-center">Apply to all:</span>
              <Button size="sm" variant="outline" onClick={() => applyResolutionToAll('merge')}>
                <IoRefresh size={16} className="mr-1" /> Merge All
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyResolutionToAll('update')}>
                <IoRefresh size={16} className="mr-1" /> Update All
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyResolutionToAll('ignore')}>
                <IoTrash size={16} className="mr-1" /> Ignore All
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validationResults.duplicatesList.map((dup, index) => {
                const currentResolution = duplicateResolutions[dup.row] || null;
                return (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg ${
                      currentResolution === 'merge' ? 'border-purple-300 bg-purple-50' :
                      currentResolution === 'update' ? 'border-blue-300 bg-blue-50' :
                      currentResolution === 'ignore' ? 'border-gray-300 bg-gray-50' :
                      'border-yellow-300 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IoWarning className="text-yellow-600" size={20} />
                          <span className="font-semibold">Row {dup.row}</span>
                          {currentResolution && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              currentResolution === 'merge' ? 'bg-purple-200 text-purple-800' :
                              currentResolution === 'update' ? 'bg-blue-200 text-blue-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {currentResolution === 'merge' ? 'Will Merge' :
                               currentResolution === 'update' ? 'Will Update' : 'Will Ignore'}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">New Data (CSV):</p>
                            {dup.data && Object.entries(dup.data).map(([k, v]) => (
                              <p key={k}><strong>{k}:</strong> {v || 'N/A'}</p>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Existing Data:</p>
                            {dup.existing && Object.entries(dup.existing).map(([k, v]) => (
                              <p key={k}><strong>{k}:</strong> {v || 'N/A'}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant={currentResolution === 'merge' ? 'primary' : 'outline'} onClick={() => handleDuplicateResolution(dup.row, 'merge')}>
                        <IoRefresh size={16} className="mr-1" /> Merge
                      </Button>
                      <Button size="sm" variant={currentResolution === 'update' ? 'primary' : 'outline'} onClick={() => handleDuplicateResolution(dup.row, 'update')}>
                        <IoRefresh size={16} className="mr-1" /> Update
                      </Button>
                      <Button size="sm" variant={currentResolution === 'ignore' ? 'primary' : 'outline'} onClick={() => handleDuplicateResolution(dup.row, 'ignore')}>
                        <IoTrash size={16} className="mr-1" /> Ignore
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm"><strong>Resolution Options:</strong></p>
              <ul className="text-xs text-gray-600 mt-1 space-y-1 list-disc pl-5">
                <li><strong>Merge:</strong> Combine data from both (keep existing + add new fields)</li>
                <li><strong>Update:</strong> Replace existing data with new data from CSV</li>
                <li><strong>Ignore:</strong> Skip this row, keep existing data unchanged</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">
                Resolved: <strong>{Object.keys(duplicateResolutions).length}</strong> / {validationResults.duplicates}
              </span>
              {Object.keys(duplicateResolutions).length === validationResults.duplicates && (
                <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                  <IoCheckmarkCircle size={16} /> All duplicates resolved - ready to import
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Error List */}
      {validationResults?.errorsList && validationResults.errorsList.length > 0 && (
        <Card title="Validation Errors" subtitle="Please fix these errors before importing">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validationResults.errorsList.map((error, index) => (
              <div key={index} className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <IoCloseCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Row {error.row}</p>
                    {error.errors && (
                      <ul className="text-xs text-red-700 mt-1 list-disc pl-5">
                        {error.errors.map((err, i) => (<li key={i}>{err}</li>))}
                      </ul>
                    )}
                    {error.error && (<p className="text-xs text-red-700 mt-1">{error.error}</p>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card title="Import Instructions">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Supported Formats</h4>
            <ul className="text-sm text-gray-600 list-disc pl-5 mt-2 space-y-1">
              <li><strong>Products:</strong> WooCommerce CSV (post_title, sku, regular_price, images with pipe-separated galleries)</li>
              <li><strong>Categories:</strong> Name, Description, Parent</li>
              <li><strong>Customers:</strong> Email, First Name, Last Name, Phone</li>
              <li><strong>Orders:</strong> Order Number, billing/shipping fields, totals, status</li>
              <li><strong>Tags:</strong> Name column</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Large File Support</h4>
            <p className="text-sm text-gray-600">
              The importer supports files with 30,000+ rows. Progress is tracked in real-time 
              and rows are processed efficiently with batch database operations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Price Mapping</h4>
            <p className="text-sm text-gray-600">
              The CSV's <strong>regular_price</strong> is imported as <strong>Backend Price</strong> (cost/purchase price). 
              Use the Pricing Rules module after import to apply markup and set retail prices.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Image Galleries</h4>
            <p className="text-sm text-gray-600">
              Product images are parsed from the WooCommerce format (pipe-separated). 
              The first image becomes the featured image, and all images are added to the gallery.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportExportPage;
