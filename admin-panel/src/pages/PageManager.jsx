import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { pageTemplatesAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Home,
  Globe,
  FileText,
  ShoppingCart,
  Folder,
  Package,
  CreditCard,
  User,
  Download,
  Upload,
  History,
  Smartphone,
} from 'lucide-react';
import VersionHistory from './VersionHistory';
import { exportPageAsJSON, importPageFromJSON } from '@/components/builder/utils/ExportUtils';
import { exportAsFlutter } from '@/components/builder/utils/FlutterExporter';

const TEMPLATE_TYPES = [
  { value: 'page', label: 'Custom Page', icon: FileText },
  { value: 'shop', label: 'Shop', icon: ShoppingCart },
  { value: 'category', label: 'Category', icon: Folder },
  { value: 'single-product', label: 'Single Product', icon: Package },
  { value: 'cart', label: 'Cart', icon: ShoppingCart },
  { value: 'checkout', label: 'Checkout', icon: CreditCard },
  { value: 'account', label: 'Account', icon: User },
  { value: 'custom', label: 'Custom Template', icon: FileText },
];

const PageManager = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSEOModal, setShowSEOModal] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Check for version query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const versionParam = params.get('version');
    if (versionParam) {
      setShowVersionHistory(versionParam);
      // Clean up URL after opening modal
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/page-manager');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const { data: pagesResponse, isLoading } = useQuery(
    ['page-templates', filterType],
    () => pageTemplatesAPI.getAll({ type: filterType !== 'all' ? filterType : undefined })
  );

  const pages = pagesResponse?.data?.data || [];

  const deleteMutation = useMutation(
    (id) => pageTemplatesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('page-templates');
        toast.success('Page deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete page');
      },
    }
  );

  const duplicateMutation = useMutation(
    (id) => pageTemplatesAPI.duplicate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('page-templates');
        toast.success('Page duplicated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to duplicate page');
      },
    }
  );

  const toggleHomepageMutation = useMutation(
    ({ id, isHomepage }) => pageTemplatesAPI.update(id, { isHomepage: !isHomepage }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('page-templates');
        toast.success('Homepage updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update homepage');
      },
    }
  );

  const togglePublishMutation = useMutation(
    ({ id, isPublished }) => pageTemplatesAPI.update(id, { isPublished: !isPublished }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('page-templates');
        toast.success('Publish status updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update publish status');
      },
    }
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id) => {
    duplicateMutation.mutate(id);
  };

  const handleExport = async (page) => {
    try {
      const response = await pageTemplatesAPI.getOne(page._id);
      const fullPageData = response.data.data;
      exportPageAsJSON(fullPageData);
      toast.success('Page exported successfully');
    } catch (error) {
      toast.error('Failed to export page');
    }
  };

  const handleExportFlutter = async (page) => {
    try {
      const response = await pageTemplatesAPI.getOne(page._id);
      const fullPageData = response.data.data;
      exportAsFlutter(fullPageData);
      toast.success('Flutter code exported successfully');
    } catch (error) {
      toast.error('Failed to export Flutter code: ' + error.message);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const importData = importPageFromJSON(jsonData);

        // Create new page from imported data
        const response = await pageTemplatesAPI.create({
          ...importData,
          isPublished: false,
        });

        toast.success('Page imported successfully');
        queryClient.invalidateQueries('page-templates');
        
        // Navigate to edit the imported page
        setTimeout(() => {
          navigate(`/page-builder?page=${response.data.data._id}`);
        }, 500);
      } catch (error) {
        toast.error('Failed to import page: ' + error.message);
      }
    };
    input.click();
  };

  const handleEdit = (id) => {
    navigate(`/page-builder?page=${id}`);
  };

  const getTypeIcon = (type) => {
    const typeConfig = TEMPLATE_TYPES.find((t) => t.value === type);
    return typeConfig ? typeConfig.icon : FileText;
  };

  const getTypeLabel = (type) => {
    const typeConfig = TEMPLATE_TYPES.find((t) => t.value === type);
    return typeConfig ? typeConfig.label : type;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Manager</h1>
          <p className="text-gray-600 mt-1">Manage your pages and templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImport}
          >
            <Upload size={20} className="mr-2" />
            Import Page
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Create New Page
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { value: 'all', label: 'All Types' },
            ...TEMPLATE_TYPES.map((t) => ({ value: t.value, label: t.label })),
          ]}
          className="w-48"
        />
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No pages found. Create your first page!
                </td>
              </tr>
            ) : (
              pages.map((page) => {
                const TypeIcon = getTypeIcon(page.templateType);
                return (
                  <tr key={page._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {page.isHomepage && (
                          <Home size={16} className="text-yellow-500 mr-2" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{page.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{getTypeLabel(page.templateType)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePublishMutation.mutate({ id: page._id, isPublished: page.isPublished })}
                          className={`px-2 py-1 text-xs rounded ${
                            page.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {page.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(page._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(page._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => toggleHomepageMutation.mutate({ id: page._id, isHomepage: page.isHomepage })}
                          className={`${page.isHomepage ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-900`}
                          title={page.isHomepage ? 'Remove from homepage' : 'Set as homepage'}
                        >
                          <Home size={16} />
                        </button>
                        <button
                          onClick={() => setShowSEOModal(page)}
                          className="text-purple-600 hover:text-purple-900"
                          title="SEO Settings"
                        >
                          <Globe size={16} />
                        </button>
                        <button
                          onClick={() => setShowVersionHistory(page._id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Version History"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => handleExport(page)}
                          className="text-green-600 hover:text-green-900"
                          title="Export as JSON"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleExportFlutter(page)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Export as Flutter"
                        >
                          <Smartphone size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(page._id, page.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('page-templates');
          }}
        />
      )}

      {/* SEO Modal */}
      {showSEOModal && (
        <SEOModal
          page={showSEOModal}
          onClose={() => setShowSEOModal(null)}
          onSuccess={() => {
            setShowSEOModal(null);
            queryClient.invalidateQueries('page-templates');
          }}
        />
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <VersionHistory
          pageId={showVersionHistory}
          onClose={() => setShowVersionHistory(null)}
          onRestore={() => {
            setShowVersionHistory(null);
            queryClient.invalidateQueries('page-templates');
          }}
        />
      )}
    </div>
  );
};

// Create Page Modal
const CreatePageModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    templateType: 'page',
    name: '',
    slug: '',
    isHomepage: false,
    isPublished: false,
  });

  const createMutation = useMutation(
    (data) => pageTemplatesAPI.create(data),
    {
      onSuccess: (response) => {
        toast.success('Page created successfully');
        onSuccess();
        // Navigate to page builder
        window.location.href = `/page-builder?page=${response.data.data._id}`;
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create page');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      components: {},
      dynamicBindings: {},
    });
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <Modal isOpen onClose={onClose} title="Create New Page">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Type
          </label>
          <Select
            value={formData.templateType}
            onChange={(e) => {
              const newType = e.target.value;
              setFormData({
                ...formData,
                templateType: newType,
                slug: newType === 'page' ? generateSlug(formData.name) : '',
              });
            }}
            options={TEMPLATE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Name
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: formData.templateType === 'page' ? generateSlug(name) : formData.slug,
              });
            }}
            placeholder="Enter page name"
            required
          />
        </div>

        {formData.templateType === 'page' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL)
            </label>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="page-slug"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /{formData.slug || 'page-slug'}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isHomepage}
              onChange={(e) => setFormData({ ...formData, isHomepage: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Set as Homepage</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Publish</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isLoading}>
            Create & Edit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// SEO Modal
const SEOModal = ({ page, onClose, onSuccess }) => {
  const [seo, setSeo] = useState(page.seo || {});

  const updateMutation = useMutation(
    (data) => pageTemplatesAPI.update(page._id, { seo: data }),
    {
      onSuccess: () => {
        toast.success('SEO settings updated');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update SEO');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(seo);
  };

  return (
    <Modal isOpen onClose={onClose} title="SEO Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Title
          </label>
          <Input
            type="text"
            value={seo.title || ''}
            onChange={(e) => setSeo({ ...seo, title: e.target.value })}
            placeholder="Page title for SEO"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            value={seo.description || ''}
            onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            placeholder="Meta description for SEO"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
          </label>
          <Input
            type="text"
            value={seo.keywords || ''}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={updateMutation.isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PageManager;
