import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { codeSnippetsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import toast from '@/utils/toast';
import { 
  IoCodeSlash, 
  IoAdd, 
  IoCreate, 
  IoTrash, 
  IoCheckmark, 
  IoClose, 
  IoWarning,
  IoShield,
  IoEye,
  IoEyeOff,
  IoAlertCircle,
  IoCopy,
  IoRefresh,
  IoDownload,
  IoCloudUpload,
  IoDuplicate,
  IoTime,
  IoCode
} from 'react-icons/io5';
import { useForm } from 'react-hook-form';

const CodeSnippetsPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [selectedSnippets, setSelectedSnippets] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [filters, setFilters] = useState({
    environment: '',
    location: '',
    type: '',
    isActive: ''
  });
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [versionModal, setVersionModal] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data, isLoading } = useQuery(
    ['code-snippets', filters],
    () => codeSnippetsAPI.getAll(filters)
  );

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      code: '',
      type: 'javascript',
      environment: 'frontend',
      location: 'header',
      pageTarget: 'all_pages',
      pagePaths: [],
      isActive: true,
      priority: 0,
      wrapInTryCatch: true,
      allowUnsafeCode: false,
      async: false,
      defer: false,
      deviceTarget: 'all',
      tags: [],
      notes: '',
      minify: false,
      externalStylesheet: false,
      shortcode: '',
      conditions: {
        loggedIn: 'any',
        userRoles: [],
        dateFrom: '',
        dateTo: '',
        urlContains: [],
        urlNotContains: []
      }
    }
  });

  const codeType = watch('type');
  const codeContent = watch('code');

  const createMutation = useMutation(
    (data) => codeSnippetsAPI.create(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('code-snippets');
        toast.success(response.data.message || 'Code snippet created successfully');
        setShowForm(false);
        setEditingSnippet(null);
        reset();
        setValidationResult(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create code snippet');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => codeSnippetsAPI.update(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('code-snippets');
        toast.success(response.data.message || 'Code snippet updated successfully');
        setShowForm(false);
        setEditingSnippet(null);
        reset();
        setValidationResult(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update code snippet');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => codeSnippetsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('code-snippets');
        toast.success('Code snippet deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete code snippet');
      }
    }
  );

  const toggleMutation = useMutation(
    (id) => codeSnippetsAPI.toggle(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('code-snippets');
        toast.success('Snippet status toggled');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to toggle snippet');
      }
    }
  );

  const validateMutation = useMutation(
    ({ code, type }) => codeSnippetsAPI.validate(code, type),
    {
      onSuccess: (response) => {
        setValidationResult(response.data.validation);
        if (response.data.validation.valid) {
          toast.success('Code validation passed');
        } else {
          toast.error(`Code has ${response.data.validation.errors.length} error(s) and ${response.data.validation.warnings.length} warning(s)`);
        }
      },
      onError: (error) => {
        toast.error('Validation failed');
        setValidationResult({ valid: false, errors: [], warnings: [] });
      }
    }
  );

  const bulkMutation = useMutation(
    ({ action, ids }) => codeSnippetsAPI.bulk(action, ids),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('code-snippets');
        toast.success(response.data.message);
        setSelectedSnippets([]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Bulk operation failed');
      }
    }
  );

  const duplicateMutation = useMutation(
    (id) => codeSnippetsAPI.duplicate(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('code-snippets');
        toast.success(response.data.message || 'Snippet duplicated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to duplicate');
      }
    }
  );

  const importMutation = useMutation(
    ({ snippets, overwrite }) => codeSnippetsAPI.import(snippets, overwrite),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('code-snippets');
        toast.success(response.data.message);
        setImportModal(false);
        setImportData('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Import failed');
      }
    }
  );

  const handleValidate = () => {
    const code = codeContent;
    const type = codeType;
    if (!code || !type) {
      toast.error('Please enter code and select type');
      return;
    }
    setIsValidating(true);
    validateMutation.mutate({ code, type }, {
      onSettled: () => setIsValidating(false)
    });
  };

  const handleEdit = (snippet) => {
    setEditingSnippet(snippet);
    setValue('name', snippet.name);
    setValue('description', snippet.description || '');
    setValue('code', snippet.code);
    setValue('type', snippet.type);
    setValue('environment', snippet.environment);
    setValue('location', snippet.location);
    setValue('pageTarget', snippet.pageTarget);
    setValue('pagePaths', snippet.pagePaths || []);
    setValue('isActive', snippet.isActive);
    setValue('priority', snippet.priority);
    setValue('wrapInTryCatch', snippet.wrapInTryCatch !== false);
    setValue('allowUnsafeCode', snippet.allowUnsafeCode || false);
    setValue('async', snippet.async || false);
    setValue('defer', snippet.defer || false);
    setValue('deviceTarget', snippet.deviceTarget || 'all');
    setValue('tags', snippet.tags || []);
    setValue('notes', snippet.notes || '');
    setValue('minify', snippet.minify || false);
    setValue('externalStylesheet', snippet.externalStylesheet || false);
    setValue('shortcode', snippet.shortcode || '');
    setValue('conditions.loggedIn', snippet.conditions?.loggedIn || 'any');
    setValue('conditions.userRoles', snippet.conditions?.userRoles || []);
    setValue('conditions.dateFrom', snippet.conditions?.dateFrom ? new Date(snippet.conditions.dateFrom).toISOString().slice(0, 16) : '');
    setValue('conditions.dateTo', snippet.conditions?.dateTo ? new Date(snippet.conditions.dateTo).toISOString().slice(0, 16) : '');
    setValue('conditions.urlContains', snippet.conditions?.urlContains || []);
    setValue('conditions.urlNotContains', snippet.conditions?.urlNotContains || []);
    setValidationResult({
      valid: snippet.syntaxValid,
      errors: snippet.syntaxErrors?.filter(e => e.severity === 'error') || [],
      warnings: snippet.syntaxErrors?.filter(e => e.severity === 'warning') || []
    });
    setShowForm(true);
  };

  const onSubmit = (data) => {
    const snippetData = {
      ...data,
      priority: parseInt(data.priority) || 0,
      pagePaths: Array.isArray(data.pagePaths) ? data.pagePaths.filter(p => p.trim()) : []
    };

    if (editingSnippet) {
      updateMutation.mutate({ id: editingSnippet._id, data: snippetData });
    } else {
      createMutation.mutate(snippetData);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedSnippets.length === 0) {
      toast.error('Please select at least one snippet');
      return;
    }
    bulkMutation.mutate({ action, ids: selectedSnippets });
  };

  const handleExport = async () => {
    try {
      const ids = selectedSnippets.length > 0 ? selectedSnippets : undefined;
      const response = await codeSnippetsAPI.export(ids);
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-snippets-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${response.data.data.count} snippet(s)`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData);
      const snippets = parsed.snippets || parsed;
      if (!Array.isArray(snippets)) {
        toast.error('Invalid format: expected an array of snippets or {snippets: [...]}');
        return;
      }
      importMutation.mutate({ snippets, overwrite: importOverwrite });
    } catch {
      toast.error('Invalid JSON');
    }
  };

  const handleViewVersions = async (snippet) => {
    try {
      const response = await codeSnippetsAPI.getVersions(snippet._id);
      setVersions(response.data.data.versions || []);
      setVersionModal(snippet);
      setSelectedVersion(null);
    } catch {
      toast.error('Failed to load versions');
    }
  };

  const snippets = data?.data?.data || [];

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedSnippets.length === snippets.length && snippets.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedSnippets(snippets.map(s => s._id));
            } else {
              setSelectedSnippets([]);
            }
          }}
          className="checkbox checkbox-primary checkbox-sm"
        />
      ),
      width: '50px',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedSnippets.includes(row._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedSnippets([...selectedSnippets, row._id]);
            } else {
              setSelectedSnippets(selectedSnippets.filter(id => id !== row._id));
            }
          }}
          className="checkbox checkbox-primary checkbox-sm"
        />
      ),
    },
    {
      key: 'name',
      title: 'Name',
      width: '200px',
      render: (name, row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold">{name}</p>
            {row.emergencyDisable && (
              <IoShield className="text-red-500" size={16} title="Emergency Disabled" />
            )}
            {row.syntaxValid === false && (
              <IoAlertCircle className="text-yellow-500" size={16} title="Syntax Errors" />
            )}
          </div>
          {row.description && (
            <p className="text-sm text-gray-500 truncate">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      width: '100px',
      render: (type) => (
        <span className={`badge ${
          type === 'javascript' ? 'badge-primary' :
          type === 'css' ? 'badge-secondary' :
          'badge-info'
        }`}>
          {type.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'environment',
      title: 'Environment',
      width: '120px',
      render: (env) => (
        <span className="badge badge-outline">{env}</span>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      width: '150px',
      render: (location) => (
        <span className="text-sm">{location.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'pageTarget',
      title: 'Page Target',
      width: '150px',
      render: (target, row) => (
        <div>
          <span className="text-sm">{target.replace(/_/g, ' ')}</span>
          {row.pagePaths && row.pagePaths.length > 0 && (
            <p className="text-xs text-gray-500">{row.pagePaths.length} path(s)</p>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '100px',
      render: (active, row) => (
        <div className="flex items-center gap-2">
          {active ? (
            <span className="badge badge-success flex items-center gap-1">
              <IoCheckmark size={14} />
              Active
            </span>
          ) : (
            <span className="badge badge-error flex items-center gap-1">
              <IoClose size={14} />
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      width: '80px',
      render: (priority) => <span className="text-sm">{priority}</span>,
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMutation.mutate(row._id)}
            className="p-2 hover:bg-gray-100 rounded"
            title={row.isActive ? 'Disable' : 'Enable'}
          >
            {row.isActive ? <IoEyeOff size={18} /> : <IoEye size={18} />}
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Edit"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={() => duplicateMutation.mutate(row._id)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Duplicate"
          >
            <IoDuplicate size={18} className="text-blue-600" />
          </button>
          <button
            onClick={() => handleViewVersions(row)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Version History"
          >
            <IoTime size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Delete"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Code Snippets</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <IoDownload size={18} className="mr-1" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setImportModal(true)}>
            <IoCloudUpload size={18} className="mr-1" />
            Import
          </Button>
          <Button onClick={() => { setShowForm(true); setEditingSnippet(null); reset(); setValidationResult(null); }}>
            <IoAdd size={20} className="mr-2" />
            Add Snippet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-4 gap-4">
          <Select
            label="Environment"
            value={filters.environment}
            onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
            options={[
              { value: '', label: 'All Environments' },
              { value: 'frontend', label: 'Frontend' },
              { value: 'admin', label: 'Admin' },
              { value: 'backend', label: 'Backend' },
              { value: 'all', label: 'All' }
            ]}
            fullWidth
          />
          <Select
            label="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            options={[
              { value: '', label: 'All Locations' },
              { value: 'header', label: 'Header' },
              { value: 'footer', label: 'Footer' },
              { value: 'body_start', label: 'Body Start' },
              { value: 'body_end', label: 'Body End' }
            ]}
            fullWidth
          />
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: '', label: 'All Types' },
              { value: 'javascript', label: 'JavaScript' },
              { value: 'css', label: 'CSS' },
              { value: 'html', label: 'HTML' }
            ]}
            fullWidth
          />
          <Select
            label="Status"
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
            fullWidth
          />
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedSnippets.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-blue-900">
              {selectedSnippets.length} snippet(s) selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                Enable
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                Disable
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Snippets Table */}
      <Card>
        <Table columns={columns} data={snippets} loading={isLoading} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingSnippet(null); reset(); setValidationResult(null); }}
        title={editingSnippet ? 'Edit Code Snippet' : 'Add Code Snippet'}
        size="xl"
        showFooter={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              {...register('name', { required: true })}
              error={errors.name && 'Required'}
              fullWidth
            />
            <Select
              label="Type *"
              {...register('type', { required: true })}
              options={[
                { value: 'javascript', label: 'JavaScript' },
                { value: 'css', label: 'CSS' },
                { value: 'html', label: 'HTML' }
              ]}
              fullWidth
            />
          </div>

          <Input
            label="Description"
            {...register('description')}
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Environment *"
              {...register('environment', { required: true })}
              options={[
                { value: 'frontend', label: 'Frontend' },
                { value: 'admin', label: 'Admin Panel' },
                { value: 'backend', label: 'Backend' },
                { value: 'all', label: 'All' }
              ]}
              fullWidth
            />
            <Select
              label="Location *"
              {...register('location', { required: true })}
              options={[
                { value: 'header', label: 'Header' },
                { value: 'footer', label: 'Footer' },
                { value: 'body_start', label: 'Body Start' },
                { value: 'body_end', label: 'Body End' },
                { value: 'after_opening_head', label: 'After Opening Head' },
                { value: 'before_closing_head', label: 'Before Closing Head' },
                { value: 'after_opening_body', label: 'After Opening Body' },
                { value: 'before_closing_body', label: 'Before Closing Body' }
              ]}
              fullWidth
            />
          </div>

          <Select
            label="Page Target *"
            {...register('pageTarget', { required: true })}
            options={[
              { value: 'all_pages', label: 'All Pages' },
              { value: 'homepage', label: 'Homepage' },
              { value: 'shop', label: 'Shop' },
              { value: 'product', label: 'Product Pages' },
              { value: 'cart', label: 'Cart' },
              { value: 'checkout', label: 'Checkout' },
              { value: 'account', label: 'Account Pages' },
              { value: 'login', label: 'Login' },
              { value: 'register', label: 'Register' },
              { value: 'specific_pages', label: 'Specific Pages' },
              { value: 'custom', label: 'Custom Paths' }
            ]}
            fullWidth
          />

          {(watch('pageTarget') === 'specific_pages' || watch('pageTarget') === 'custom') && (
            <div>
              <label className="block text-sm font-medium mb-1">Page Paths (one per line)</label>
              <textarea
                {...register('pagePaths')}
                rows={3}
                className="input w-full resize-none"
                placeholder="/products, /cart, /checkout"
                onChange={(e) => {
                  const paths = e.target.value.split('\n').map(p => p.trim()).filter(p => p);
                  setValue('pagePaths', paths);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Enter one path per line. Use * for wildcard (e.g., /products/*)</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <div className="relative">
              <textarea
                {...register('code', { required: true })}
                rows={15}
                className="input w-full resize-none font-mono text-sm"
                placeholder={codeType === 'javascript' ? '// Your JavaScript code here' : codeType === 'css' ? '/* Your CSS code here */' : '<!-- Your HTML code here -->'}
                style={{ fontFamily: 'monospace' }}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  loading={isValidating}
                >
                  <IoRefresh size={16} className="mr-1" />
                  Validate
                </Button>
              </div>
            </div>
            {errors.code && <p className="text-red-500 text-sm mt-1">Code is required</p>}
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className={`p-4 rounded ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.valid ? (
                  <IoCheckmark className="text-green-600" size={20} />
                ) : (
                  <IoWarning className="text-red-600" size={20} />
                )}
                <span className={`font-bold ${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                </span>
              </div>
              {validationResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-red-800 mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx}>
                        Line {error.line}, Col {error.column}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {validationResult.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-yellow-800 mb-1">Warnings:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx}>
                        Line {warning.line}, Col {warning.column}: {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Priority"
              type="number"
              {...register('priority')}
              helperText="Higher priority loads first"
              fullWidth
            />
            <Select
              label="Device Target"
              {...register('deviceTarget')}
              options={[
                { value: 'all', label: 'All Devices' },
                { value: 'desktop', label: 'Desktop' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'tablet', label: 'Tablet' }
              ]}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="checkbox checkbox-primary"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('wrapInTryCatch')}
                className="checkbox checkbox-primary"
              />
              <span className="text-sm font-medium">Wrap in try-catch (JavaScript only)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('allowUnsafeCode')}
                className="checkbox checkbox-primary"
              />
              <span className="text-sm font-medium">Allow unsafe code (not recommended)</span>
            </label>
            {codeType === 'javascript' && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('async')}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Async</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('defer')}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Defer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('minify')}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Minify JavaScript output</span>
                </label>
              </>
            )}
            {codeType === 'css' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('externalStylesheet')}
                  className="checkbox checkbox-primary"
                />
                <span className="text-sm font-medium">Load as external stylesheet</span>
              </label>
            )}
          </div>

          {/* Shortcode */}
          <Input
            label="Shortcode Name (optional — for embedding inline)"
            {...register('shortcode')}
            helperText="Use this name to embed the snippet output inline via the SnippetEmbed component"
            fullWidth
          />

          {/* Conditions */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Conditions (when to run)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Login Status"
                {...register('conditions.loggedIn')}
                options={[
                  { value: 'any', label: 'Any (always)' },
                  { value: 'logged_in', label: 'Logged-in users only' },
                  { value: 'logged_out', label: 'Logged-out users only' }
                ]}
                fullWidth
              />
              <Input
                label="User Roles (comma-separated)"
                {...register('conditions.userRoles')}
                placeholder="admin, customer"
                helperText="Leave empty for all roles"
                fullWidth
                onChange={(e) => {
                  const roles = e.target.value.split(',').map(r => r.trim()).filter(Boolean);
                  setValue('conditions.userRoles', roles);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Active From"
                type="datetime-local"
                {...register('conditions.dateFrom')}
                fullWidth
              />
              <Input
                label="Active Until"
                type="datetime-local"
                {...register('conditions.dateTo')}
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL Contains (one per line)</label>
                <textarea
                  rows={2}
                  className="input w-full resize-none text-sm"
                  placeholder="/sale\n/promo"
                  onChange={(e) => {
                    const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean);
                    setValue('conditions.urlContains', vals);
                  }}
                  defaultValue={(watch('conditions.urlContains') || []).join('\n')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Not Contains (one per line)</label>
                <textarea
                  rows={2}
                  className="input w-full resize-none text-sm"
                  placeholder="/admin\n/api"
                  onChange={(e) => {
                    const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean);
                    setValue('conditions.urlNotContains', vals);
                  }}
                  defaultValue={(watch('conditions.urlNotContains') || []).join('\n')}
                />
              </div>
            </div>
          </div>

          <Input
            label="Notes"
            {...register('notes')}
            fullWidth
          />

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setShowForm(false); setEditingSnippet(null); reset(); setValidationResult(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingSnippet ? 'Update Snippet' : 'Create Snippet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirm Delete"
        size="sm"
        showFooter={false}
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete "{deleteModal?.name}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteModal._id)} loading={deleteMutation.isLoading}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={importModal}
        onClose={() => { setImportModal(false); setImportData(''); }}
        title="Import Code Snippets"
        size="lg"
        showFooter={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Paste exported JSON data below. Imported snippets will start as <strong>inactive</strong> for safety.
          </p>
          <textarea
            rows={12}
            className="input w-full resize-none font-mono text-sm"
            placeholder='Paste JSON here...'
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={importOverwrite}
              onChange={(e) => setImportOverwrite(e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <span className="text-sm font-medium">Overwrite existing snippets with same name</span>
          </label>
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => { setImportModal(false); setImportData(''); }}>Cancel</Button>
            <Button onClick={handleImport} loading={importMutation.isLoading} disabled={!importData.trim()}>
              <IoCloudUpload size={18} className="mr-1" />
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={!!versionModal}
        onClose={() => { setVersionModal(null); setVersions([]); setSelectedVersion(null); }}
        title={`Version History: ${versionModal?.name || ''}`}
        size="xl"
        showFooter={false}
      >
        <div className="space-y-4">
          {versions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No version history available</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 border-r pr-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-sm mb-2">Versions ({versions.length})</h4>
                <div className="space-y-2">
                  {versions.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVersion(v)}
                      className={`w-full text-left p-2 rounded text-sm border ${
                        selectedVersion === v ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium">v{versions.length - idx}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(v.modifiedAt).toLocaleString('en-ZA')}
                      </p>
                      {v.reason && <p className="text-xs text-gray-400 mt-0.5">{v.reason}</p>}
                      {v.modifiedBy && (
                        <p className="text-xs text-gray-400">
                          by {v.modifiedBy.firstName || v.modifiedBy.email || 'Unknown'}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                {selectedVersion ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">Code at this version</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Restore this version? The current code will be saved as a new version.')) {
                            handleEdit(versionModal);
                            setValue('code', selectedVersion.code);
                            setVersionModal(null);
                            setVersions([]);
                            setSelectedVersion(null);
                          }
                        }}
                      >
                        Restore This Version
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-80 font-mono">
                      {selectedVersion.code}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Select a version to view its code</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CodeSnippetsPage;
