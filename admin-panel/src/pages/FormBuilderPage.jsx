import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formsAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { Plus, Edit, Trash2, Copy, ClipboardList, Inbox } from 'lucide-react';
import FormEditor from '@/components/formbuilder/FormEditor';
import FormSubmissionsPage from './FormSubmissionsPage';

export default function FormBuilderPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFormId, setEditingFormId] = useState(null);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState(null);

  const { data: formsResponse, isLoading } = useQuery('forms', () => formsAPI.getAll());
  const forms = formsResponse?.data?.data || [];

  const deleteMutation = useMutation((id) => formsAPI.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('forms');
      toast.success('Form deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete form'),
  });

  const duplicateMutation = useMutation((id) => formsAPI.duplicate(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('forms');
      toast.success('Form duplicated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to duplicate form'),
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (viewingSubmissionsFor) {
    return <FormSubmissionsPage formId={viewingSubmissionsFor} onBack={() => setViewingSubmissionsFor(null)} />;
  }

  if (editingFormId) {
    return (
      <FormEditor
        formId={editingFormId}
        onBack={() => setEditingFormId(null)}
        onViewSubmissions={(id) => setViewingSubmissionsFor(id)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile App — Form Builder</h1>
          <p className="text-gray-600 mt-1">Create forms to embed in mobile app pages</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          New Form
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : forms.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No forms yet. Create your first one!</td></tr>
            ) : (
              forms.map((form) => (
                <tr key={form._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ClipboardList size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{form.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.fieldCount ?? (form.fields || []).length}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => setViewingSubmissionsFor(form._id)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Inbox size={13} /> {form.submissionCount ?? 0}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${form.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {form.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingFormId(form._id)} className="text-blue-600 hover:text-blue-900" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => duplicateMutation.mutate(form._id)} className="text-gray-600 hover:text-gray-900" title="Duplicate">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDelete(form._id, form.title)} className="text-red-600 hover:text-red-900" title="Delete">
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
        <CreateFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('forms');
            setEditingFormId(id);
          }}
        />
      )}
    </div>
  );
}

const CreateFormModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');

  const createMutation = useMutation((data) => formsAPI.create(data), {
    onSuccess: (res) => {
      toast.success('Form created');
      onCreated(res.data.data._id);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create form'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ title, fields: [] });
  };

  return (
    <Modal isOpen onClose={onClose} title="New Form" showFooter={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contact Us" required />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isLoading}>Create Form</Button>
        </div>
      </form>
    </Modal>
  );
};
