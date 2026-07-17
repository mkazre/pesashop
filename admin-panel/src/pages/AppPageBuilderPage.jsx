import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appPagesAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { Plus, Edit, Trash2, Copy, FileText, Eye, EyeOff } from 'lucide-react';
import AppPageEditor from '@/components/apppagebuilder/AppPageEditor';

export default function AppPageBuilderPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPageId, setEditingPageId] = useState(null);

  const { data: pagesResponse, isLoading } = useQuery('app-pages', () => appPagesAPI.getAll());
  const pages = pagesResponse?.data?.data || [];

  const deleteMutation = useMutation((id) => appPagesAPI.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('app-pages');
      toast.success('Page deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete page'),
  });

  const duplicateMutation = useMutation((id) => appPagesAPI.duplicate(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('app-pages');
      toast.success('Page duplicated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to duplicate page'),
  });

  const toggleStatusMutation = useMutation(
    ({ id, status }) => appPagesAPI.update(id, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('app-pages');
        toast.success('Status updated');
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to update status'),
    }
  );

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (editingPageId) {
    return <AppPageEditor pageId={editingPageId} onBack={() => setEditingPageId(null)} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile App — Page Builder</h1>
          <p className="text-gray-600 mt-1">Create and manage custom pages for the mobile app</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          New Page
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : pages.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No pages yet. Create your first one!</td></tr>
            ) : (
              pages.map((page) => (
                <tr key={page._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{page.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">/{page.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: page._id, status: page.status === 'published' ? 'draft' : 'published' })}
                      className={`px-2 py-1 text-xs font-medium rounded inline-flex items-center gap-1 ${
                        page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title="Click to toggle"
                    >
                      {page.status === 'published' ? <Eye size={12} /> : <EyeOff size={12} />}
                      {page.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingPageId(page._id)} className="text-blue-600 hover:text-blue-900" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => duplicateMutation.mutate(page._id)} className="text-gray-600 hover:text-gray-900" title="Duplicate">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDelete(page._id, page.title)} className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('app-pages');
            setEditingPageId(id);
          }}
        />
      )}
    </div>
  );
}

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CreatePageModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const createMutation = useMutation((data) => appPagesAPI.create(data), {
    onSuccess: (res) => {
      toast.success('Page created');
      onCreated(res.data.data._id);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create page'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ title, slug: slug || slugify(title), status: 'draft', blocks: [] });
  };

  return (
    <Modal isOpen onClose={onClose} title="New Page" showFooter={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="About Us"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
          <Input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
            placeholder="about-us"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isLoading}>Create Page</Button>
        </div>
      </form>
    </Modal>
  );
};
