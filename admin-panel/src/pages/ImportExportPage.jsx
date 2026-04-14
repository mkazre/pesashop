import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from 'react-query';
import api, { importAPI, importBatchesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoCloudUpload, IoCloudDownload, IoCheckmarkCircle, IoCloseCircle, IoWarning, IoRefresh, IoTrash, IoTime, IoEye, IoArchive } from 'react-icons/io5';

const ImportExportPage = () => {
  const [importType, setImportType] = useState('products');
  const [importMode, setImportMode] = useState('add');
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
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobPolling, setJobPolling] = useState(false);
  const pollIntervalRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Import history state
  const [showHistory, setShowHistory] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [batchActionLoading, setBatchActionLoading] = useState(null);
  const [reconstructing, setReconstructing] = useState(false);
  const [gapMinutes, setGapMinutes] = useState(60);
  const [reconstructPreview, setReconstructPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [showReconstructPanel, setShowReconstructPanel] = useState(false);

  const { data: batchesData, isLoading: batchesLoading, refetch: refetchBatches } = useQuery(
    ['import-batches', historyRefreshKey],
    () => importBatchesAPI.getAll({ limit: 200 }),
    { enabled: showHistory, staleTime: 30000 }
  );
  const batches = batchesData?.data?.data || [];

  const { data: batchDetailData, isLoading: batchDetailLoading } = useQuery(
    ['import-batch', selectedBatch],
    () => importBatchesAPI.getOne(selectedBatch),
    { enabled: !!selectedBatch, staleTime: 60000 }
  );
  const batchDetail = batchDetailData?.data;

  // Job polling — polls every 2 seconds while a job is active
  const startJobPolling = useCallback((jobId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setActiveJobId(jobId);
    setJobPolling(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await importAPI.getJobStatus(jobId);
        const job = response.data?.data || response.data;
        if (!job) return;

        setImportProgress({
          phase: job.phase,
          current: job.progress?.current || 0,
          total: job.progress?.total || 0,
          type: job.type,
          status: job.status,
          results: job.results,
          imageStats: job.imageStats,
          error: job.error
        });

        if (job.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setJobPolling(false);
          setActiveJobId(null);

          // Show final results
          const r = job.results || {};
          setImportResults({
            created: Array(r.created || 0).fill({}),
            updated: Array(r.updated || 0).fill({}),
            merged: Array(r.merged || 0).fill({}),
            skipped: Array(r.skipped || 0).fill({}),
            errors: Array(r.errors || 0).fill({}),
            imageStats: job.imageStats,
            _jobResults: r,
            _resultDetails: job.resultDetails
          });
          toast.success(`Import completed: ${r.created} created, ${r.updated} updated, ${r.merged} merged, ${r.skipped} skipped, ${r.errors} errors`);
          setHistoryRefreshKey(k => k + 1); // refresh batch history
          setFile(null);
          setValidationResults(null);
          setDuplicateResolutions({});
          setShowDuplicateResolution(false);
          setTimeout(() => setImportProgress(null), 5000);
        } else if (job.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setJobPolling(false);
          setActiveJobId(null);
          toast.error(`Import failed: ${job.error || 'Unknown error'}. Products imported before the failure are saved.`);
          setTimeout(() => setImportProgress(null), 5000);
        }
      } catch (err) {
        // If job not found (404) — it completed/expired and was cleaned up
        if (err.response?.status === 404) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setJobPolling(false);
          setActiveJobId(null);
          setImportProgress(null);
          toast.info('Import job finished (status expired from server). Check your product count to verify.');
          return;
        }
        // Network error during poll — keep trying
        console.warn('[Import] Poll error:', err.message);
      }
    }, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Legacy SSE progress listener (for strip-html and non-job operations)
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
      onSuccess: (data) => {
        // Job-based: data.data.jobId is returned
        const jobId = data.data?.jobId;
        if (jobId) {
          toast.success('File uploaded — import started in background');
          setImportProgress({ phase: 'starting', current: 0, total: 0, type: importType, status: 'running' });
          startJobPolling(jobId);
        } else {
          // Legacy sync response (shouldn't happen with useJob=true, but safe fallback)
          setImportResults(data.data);
          toast.success(data.message || 'Import completed');
          setFile(null);
          setValidationResults(null);
          setDuplicateResolutions({});
          setShowDuplicateResolution(false);
        }
      },
      onError: (error) => {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          toast.error('Upload timed out. The file may be too large. Try again or check your connection.');
        } else if (!error.response) {
          toast.error('Network error during upload. Please check your connection and try again.');
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

  const [dedupResults, setDedupResults] = useState(null);

  const dedupPreviewMutation = useMutation(
    () => importAPI.deduplicateProducts(true),
    {
      onSuccess: (response) => {
        setDedupResults(response.data);
        if (response.data?.data?.toDelete > 0) {
          toast.success(`Found ${response.data.data.toDelete} duplicates across ${response.data.data.duplicateGroups} groups`);
        } else {
          toast.success('No duplicate products found!');
        }
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to scan for duplicates'),
    }
  );

  const dedupDeleteMutation = useMutation(
    () => importAPI.deduplicateProducts(false),
    {
      onSuccess: (response) => {
        setDedupResults(response.data);
        toast.success(response.data?.message || 'Duplicates removed');
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to remove duplicates'),
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
    // In 'add' mode, require duplicate resolution if duplicates exist
    if (importMode === 'add' && validationResults?.duplicates > 0 && Object.keys(duplicateResolutions).length < validationResults.duplicates) {
      toast.error('Please resolve all duplicates before importing');
      return;
    }
    if (importMode === 'replace') {
      if (!confirm(`⚠️ REPLACE ALL will DELETE all existing ${importType} and import the CSV as a fresh set. This cannot be undone. Continue?`)) return;
    }
    importMutation.mutate({
      type: importType,
      file,
      options: {
        processImages,
        imageProcessingType: processImages ? imageProcessingType : undefined,
        duplicateResolution: importMode === 'add' ? duplicateResolutions : undefined,
        updateExisting: importMode === 'update',
        replaceAll: importMode === 'replace',
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

  const handleBatchAction = async (action, batchId, label) => {
    if (!window.confirm(`${label}? This cannot be undone.`)) return;
    setBatchActionLoading(batchId + action);
    try {
      const res = await (action === 'rollback' ? importBatchesAPI.rollback(batchId)
        : action === 'draft' ? importBatchesAPI.setDraft(batchId)
        : importBatchesAPI.delete(batchId));
      toast.success(res.data?.message || 'Done');
      if (selectedBatch === batchId && action === 'rollback') setSelectedBatch(null);
      setHistoryRefreshKey(k => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBatchActionLoading(null);
    }
  };

  const handlePreviewReconstruct = async () => {
    setPreviewing(true);
    setReconstructPreview(null);
    try {
      const res = await importBatchesAPI.reconstructPreview(gapMinutes);
      setReconstructPreview(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleReconstruct = async () => {
    if (!reconstructPreview) return;
    const confirmed = window.confirm(
      `This will create ${reconstructPreview.sessions.length} reconstructed batch${reconstructPreview.sessions.length !== 1 ? 'es' : ''} covering ${reconstructPreview.totalUntracked.toLocaleString()} products.\n\nYou can then roll back or draft individual batches. Continue?`
    );
    if (!confirmed) return;
    setReconstructing(true);
    try {
      const res = await importBatchesAPI.reconstruct(gapMinutes);
      toast.success(res.data?.message || 'Reconstruction complete');
      setReconstructPreview(null);
      setShowReconstructPanel(false);
      setHistoryRefreshKey(k => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reconstruction failed');
    } finally {
      setReconstructing(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const fmtDuration = (mins) => mins < 60 ? `${mins}m` : `${Math.round(mins / 60 * 10) / 10}h`;
  const statusColor = (s) => s === 'completed' ? 'text-green-600 bg-green-50' : s === 'failed' ? 'text-red-600 bg-red-50' : s === 'rolled_back' ? 'text-gray-500 bg-gray-100' : 'text-yellow-600 bg-yellow-50';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Import / Export</h1>
        <a
          href="/import-batches"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          📋 Import History & Rollback
        </a>
      </div>

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
              <label className="block text-sm font-medium mb-2">Import Mode</label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
                className="input w-full"
              >
                <option value="add">Add New Only (skip duplicates)</option>
                <option value="update">Update Existing + Add New</option>
                <option value="replace">Replace All (delete existing, import fresh)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {importMode === 'add' && 'New items are created. Duplicates (by SKU) are flagged for you to resolve individually.'}
                {importMode === 'update' && 'Matching SKUs are updated with CSV data. New SKUs are created. No data is deleted.'}
                {importMode === 'replace' && '⚠️ ALL existing items of this type will be DELETED first, then the CSV is imported as a fresh set.'}
              </p>
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
                disabled={!file || !validationResults || jobPolling || (importMode === 'add' && validationResults.duplicates > 0 && Object.keys(duplicateResolutions).length < validationResults.duplicates)}
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
                    {importProgress.phase === 'validate' ? 'Validating' :
                     importProgress.phase === 'counting' ? 'Counting rows' :
                     importProgress.phase === 'starting' ? 'Starting import' :
                     importProgress.phase === 'images' ? 'Processing images' :
                     importProgress.phase === 'done' ? 'Completed' :
                     importProgress.phase === 'failed' ? 'Failed' :
                     'Importing'} {importProgress.type || importType}...
                  </span>
                  <span className="text-sm font-bold text-indigo-700">
                    {importProgress.phase === 'done' ? '100' : progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      importProgress.phase === 'failed' ? 'bg-red-500' :
                      importProgress.phase === 'done' ? 'bg-green-500' :
                      importProgress.phase === 'images' ? 'bg-purple-500' :
                      'bg-indigo-600'
                    }`}
                    style={{ width: `${importProgress.phase === 'done' ? 100 : progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-indigo-600">
                    {importProgress.current?.toLocaleString()} / {importProgress.total?.toLocaleString()} rows processed
                  </p>
                  {jobPolling && (
                    <span className="text-xs text-indigo-500 animate-pulse">● Live</span>
                  )}
                </div>
                {/* Running totals from job */}
                {importProgress.results && importProgress.status === 'running' && (
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-green-600">{importProgress.results.created || 0} created</span>
                    <span className="text-blue-600">{importProgress.results.updated || 0} updated</span>
                    <span className="text-yellow-600">{importProgress.results.skipped || 0} skipped</span>
                    <span className="text-red-600">{importProgress.results.errors || 0} errors</span>
                  </div>
                )}
                {/* Image processing stats */}
                {importProgress.imageStats && (importProgress.imageStats.total > 0 || importProgress.phase === 'images') && (
                  <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                    Images: {importProgress.imageStats.processed || 0} processed,{' '}
                    {importProgress.imageStats.failed || 0} failed,{' '}
                    {importProgress.imageStats.pending || 0} pending
                    {importProgress.imageStats.total > 0 && (
                      <> of {importProgress.imageStats.total} total</>
                    )}
                  </div>
                )}
                {importProgress.phase === 'failed' && importProgress.error && (
                  <p className="text-xs text-red-600 mt-2 font-medium">Error: {importProgress.error}</p>
                )}
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
                  {validationResults.duplicates > 0 && importMode === 'update' && (
                    <p className="text-blue-600 font-semibold">✓ {validationResults.duplicates} existing record(s) will be updated automatically</p>
                  )}
                  {validationResults.duplicates > 0 && importMode === 'replace' && (
                    <p className="text-red-600 font-semibold">⚠ All existing {importType} will be deleted before import</p>
                  )}
                  {validationResults.valid && validationResults.duplicates > 0 && importMode !== 'add' && (
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
                  <p className="text-green-600"><strong>Created:</strong> {importResults._jobResults?.created ?? importResults.created?.length ?? 0}</p>
                  <p className="text-blue-600"><strong>Updated:</strong> {importResults._jobResults?.updated ?? importResults.updated?.length ?? 0}</p>
                  <p className="text-purple-600"><strong>Merged:</strong> {importResults._jobResults?.merged ?? importResults.merged?.length ?? 0}</p>
                  <p className="text-yellow-600"><strong>Skipped:</strong> {importResults._jobResults?.skipped ?? importResults.skipped?.length ?? 0}</p>
                  <p className="text-red-600"><strong>Errors:</strong> {importResults._jobResults?.errors ?? importResults.errors?.length ?? 0}</p>
                </div>
                {importResults.imageStats && importResults.imageStats.total > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200 text-sm">
                    <p className="text-purple-600">
                      <strong>Images:</strong> {importResults.imageStats.processed || 0} processed, {importResults.imageStats.failed || 0} failed of {importResults.imageStats.total} total
                    </p>
                  </div>
                )}
                {/* Show first few errors if available */}
                {importResults._resultDetails?.errors?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-red-600 font-medium mb-1">First errors (up to 200 shown):</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResults._resultDetails.errors.slice(0, 10).map((err, i) => (
                        <p key={i} className="text-xs text-red-500">Row {err.row}: {err.error} {err.data?.sku ? `(SKU: ${err.data.sku})` : ''}</p>
                      ))}
                      {importResults._resultDetails.errors.length > 10 && (
                        <p className="text-xs text-red-400">...and {importResults._resultDetails.errors.length - 10} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deduplicate Products */}
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                <IoTrash className="text-red-600" size={18} />
                Remove Duplicate Products
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Scan for duplicate products (by SKU and name). The version with the most data (images, description, categories) is kept; duplicates are deleted.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dedupPreviewMutation.mutate()}
                  loading={dedupPreviewMutation.isLoading}
                >
                  <IoRefresh size={16} className="mr-2" />
                  Scan for Duplicates
                </Button>
                {dedupResults?.data?.toDelete > 0 && dedupResults?.dryRun && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (confirm(`This will permanently delete ${dedupResults.data.toDelete} duplicate products. Continue?`)) {
                        dedupDeleteMutation.mutate();
                      }
                    }}
                    loading={dedupDeleteMutation.isLoading}
                  >
                    <IoTrash size={16} className="mr-2" />
                    Delete {dedupResults.data.toDelete} Duplicates
                  </Button>
                )}
              </div>
              {dedupResults && (
                <div className="mt-3 text-xs space-y-1">
                  <p className={dedupResults.data?.toDelete > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {dedupResults.message}
                  </p>
                  {dedupResults.data?.details?.length > 0 && (
                    <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                      {dedupResults.data.details.slice(0, 20).map((d, i) => (
                        <p key={i} className="text-gray-600">
                          <strong>{d.group}:</strong> Kept "{d.kept.name}" (score {d.kept.score}, {d.kept.images} imgs) — removing {d.removed.length} duplicate{d.removed.length > 1 ? 's' : ''}
                        </p>
                      ))}
                      {dedupResults.data.details.length > 20 && (
                        <p className="text-gray-400">...and {dedupResults.data.details.length - 20} more groups</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

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

      {/* Duplicate Resolution — only show in 'add' mode */}
      {importMode === 'add' && showDuplicateResolution && validationResults?.duplicatesList && validationResults.duplicatesList.length > 0 && (
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

      {/* Import History */}
      <Card title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2"><IoTime size={18} /><span>Import History &amp; Rollback</span></div>
          <button onClick={() => setShowHistory(h => !h)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
            {showHistory ? 'Hide' : 'Show'}
          </button>
        </div>
      }>
        {showHistory && (
          <div className="space-y-5">

            {/* ── Reconstruct past imports ── */}
            <div className="border border-dashed border-amber-300 rounded-xl bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm text-amber-900">Reconstruct Past Imports from Timestamps</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Products imported before batch tracking was enabled aren't listed below. Click Preview to scan all untracked products
                    and group them into batches based on how close their creation times are.
                    Once reconstructed, you can roll back or draft individual batches just like new imports.
                  </p>
                </div>
                <button
                  onClick={() => { setShowReconstructPanel(p => !p); setReconstructPreview(null); }}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                >
                  {showReconstructPanel ? 'Cancel' : 'Reconstruct…'}
                </button>
              </div>

              {showReconstructPanel && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <label className="block text-xs font-semibold text-amber-800 mb-1">
                        Session Gap Threshold
                      </label>
                      <select
                        value={gapMinutes}
                        onChange={e => { setGapMinutes(Number(e.target.value)); setReconstructPreview(null); }}
                        className="text-sm border border-amber-300 rounded-lg px-3 py-1.5 bg-white"
                      >
                        <option value={15}>15 minutes — tightest grouping</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour (recommended)</option>
                        <option value={120}>2 hours</option>
                        <option value={360}>6 hours — loosest grouping</option>
                      </select>
                      <p className="text-xs text-amber-600 mt-1">
                        Products created within this gap of each other are treated as one import session.
                      </p>
                    </div>
                    <button
                      onClick={handlePreviewReconstruct}
                      disabled={previewing}
                      className="self-end px-4 py-1.5 text-sm rounded-lg border border-amber-400 bg-white text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                    >
                      {previewing ? 'Scanning…' : 'Preview Sessions'}
                    </button>
                  </div>

                  {reconstructPreview && (
                    <div className="space-y-3">
                      {reconstructPreview.totalUntracked === 0 ? (
                        <p className="text-sm text-green-700 font-medium">All products are already tracked — nothing to reconstruct.</p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-amber-900">
                            Found {reconstructPreview.sessions.length} import session{reconstructPreview.sessions.length !== 1 ? 's' : ''} covering{' '}
                            <strong>{reconstructPreview.totalUntracked.toLocaleString()}</strong> untracked products.
                            Review the sessions below, then click Confirm to create the batch records.
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b text-left text-gray-500 uppercase tracking-wide bg-gray-50">
                                  <th className="py-2 px-3">#</th>
                                  <th className="py-2 px-3">Import Started</th>
                                  <th className="py-2 px-3">Import Ended</th>
                                  <th className="py-2 px-3">Duration</th>
                                  <th className="py-2 px-3 text-right">Products</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {reconstructPreview.sessions.map(s => (
                                  <tr key={s.index} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 font-mono text-gray-400">{s.index}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">{fmtDate(s.startedAt)}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">{fmtDate(s.completedAt)}</td>
                                    <td className="py-2 px-3 text-gray-500">{fmtDuration(s.durationMinutes)}</td>
                                    <td className="py-2 px-3 text-right font-semibold text-green-700">{s.productCount.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t bg-gray-50 font-semibold">
                                  <td colSpan={4} className="py-2 px-3 text-xs text-gray-600">Total</td>
                                  <td className="py-2 px-3 text-right text-green-700">{reconstructPreview.totalUntracked.toLocaleString()}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleReconstruct}
                              disabled={reconstructing}
                              className="px-5 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
                            >
                              {reconstructing ? 'Creating batches…' : `Confirm — Create ${reconstructPreview.sessions.length} Batch${reconstructPreview.sessions.length !== 1 ? 'es' : ''}`}
                            </button>
                            <p className="text-xs text-gray-500">Batch records are created in the database. No products are deleted.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Batch list ── */}
            {batchesLoading ? (
              <div className="py-6 text-center text-gray-400 text-sm">Loading batches…</div>
            ) : batches.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-500 text-sm">No tracked batches yet. Use "Reconstruct Past Imports" above to group your existing products.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''} — most recent first</p>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                        <th className="py-2.5 px-3">Date &amp; Time</th>
                        <th className="py-2.5 px-3">File / Label</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Products</th>
                        <th className="py-2.5 px-3 text-right">Updated</th>
                        <th className="py-2.5 px-3 text-right">Errors</th>
                        <th className="py-2.5 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {batches.map(batch => (
                        <React.Fragment key={batch._id}>
                          <tr className={`hover:bg-gray-50 ${selectedBatch === batch._id ? 'bg-blue-50' : ''}`}>
                            <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(batch.startedAt)}</td>
                            <td className="py-2.5 px-3 max-w-[220px]">
                              <span className="block truncate font-medium text-sm" title={batch.originalFilename}>{batch.originalFilename}</span>
                              {batch.categories?.length > 0 && (
                                <span className="text-xs text-gray-400">{batch.categories.slice(0, 3).join(', ')}{batch.categories.length > 3 ? ` +${batch.categories.length - 3}` : ''}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(batch.status)}`}>{batch.status}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs text-green-700 font-semibold">{(batch.results?.created || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs text-blue-700">{(batch.results?.updated || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs text-red-700">{(batch.results?.errors || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedBatch(selectedBatch === batch._id ? null : batch._id)}
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Preview products"
                                ><IoEye size={14} /></button>
                                {batch.createdProductIds?.length > 0 && batch.status !== 'rolled_back' && (
                                  <>
                                    <button
                                      onClick={() => handleBatchAction('draft', batch._id, `Set ${(batch.results?.created || batch.createdProductIds.length).toLocaleString()} products to Draft (hidden but kept)`)}
                                      disabled={!!batchActionLoading}
                                      className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600 disabled:opacity-40" title="Set all to Draft — hides from storefront but keeps the products"
                                    ><IoArchive size={14} /></button>
                                    <button
                                      onClick={() => handleBatchAction('rollback', batch._id, `PERMANENTLY DELETE all ${batch.createdProductIds.length.toLocaleString()} products from this batch`)}
                                      disabled={!!batchActionLoading}
                                      className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-40" title="Roll back — permanently deletes all products in this batch"
                                    ><IoTrash size={14} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded product preview */}
                          {selectedBatch === batch._id && (
                            <tr>
                              <td colSpan={7} className="bg-blue-50 px-4 py-4 border-b">
                                {batchDetailLoading ? (
                                  <p className="text-sm text-gray-400">Loading products…</p>
                                ) : batchDetail ? (
                                  <div>
                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                      <div>
                                        <span className="font-semibold text-sm">{batchDetail.data?.originalFilename}</span>
                                        <span className="ml-2 text-gray-400 text-xs">{(batchDetail.data?.createdProductIds?.length || 0).toLocaleString()} products in this batch</span>
                                      </div>
                                      {batchDetail.data?.categories?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {batchDetail.data.categories.map(c => (
                                            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-white border text-gray-600">{c}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {batchDetail.sampleProducts?.length > 0 ? (
                                      <>
                                        <div className="overflow-x-auto rounded-lg border bg-white">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="text-left text-gray-400 border-b bg-gray-50 uppercase tracking-wide text-[10px]">
                                                <th className="py-2 px-3">Image</th>
                                                <th className="py-2 px-3">Name</th>
                                                <th className="py-2 px-3">SKU</th>
                                                <th className="py-2 px-3">Status</th>
                                                <th className="py-2 px-3">Categories</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                              {batchDetail.sampleProducts.map(p => (
                                                <tr key={p._id} className="hover:bg-gray-50">
                                                  <td className="py-2 px-3">
                                                    {p.images?.[0]
                                                      ? <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded border" />
                                                      : <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center text-gray-300 text-[10px]">no img</div>}
                                                  </td>
                                                  <td className="py-2 px-3 max-w-[200px] truncate font-medium" title={p.name}>{p.name}</td>
                                                  <td className="py-2 px-3 font-mono text-gray-500">{p.sku}</td>
                                                  <td className="py-2 px-3">
                                                    <span className={`px-1.5 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{p.status}</span>
                                                  </td>
                                                  <td className="py-2 px-3 text-gray-500">{(p.categories || []).map(c => c.name).join(', ')}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5">Showing first 20 of {(batchDetail.data?.createdProductIds?.length || 0).toLocaleString()} products</p>
                                      </>
                                    ) : (
                                      <p className="text-xs text-gray-400">No products found — they may have already been rolled back.</p>
                                    )}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

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
            <h4 className="font-semibold mb-2">Large File Support (up to 100,000+ products)</h4>
            <p className="text-sm text-gray-600">
              The importer uses streaming CSV parsing and background job processing — your file 
              is never loaded fully into memory. Rows are imported in batches of 200 with real-time 
              progress polling. Images are processed in a parallel queue (5 at a time) without 
              blocking the main import. You can safely close the browser and return — the import 
              continues on the server.
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
