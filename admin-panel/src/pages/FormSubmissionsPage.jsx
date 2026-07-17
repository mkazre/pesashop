import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formsAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { ArrowLeft, Trash2, Eye } from 'lucide-react';

export default function FormSubmissionsPage({ formId, onBack }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const { data: formResponse } = useQuery(['form', formId], () => formsAPI.getOne(formId));
  const form = formResponse?.data?.data;

  const { data: subsResponse, isLoading } = useQuery(
    ['form-submissions', formId, page],
    () => formsAPI.getSubmissions(formId, { page, limit: 20 })
  );
  const submissions = subsResponse?.data?.data || [];
  const totalPages = subsResponse?.data?.pages || 1;

  const deleteMutation = useMutation((submissionId) => formsAPI.deleteSubmission(formId, submissionId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['form-submissions', formId]);
      toast.success('Submission deleted');
    },
    onError: () => toast.error('Failed to delete submission'),
  });

  const markReadMutation = useMutation(
    (submissionId) => formsAPI.updateSubmission(formId, submissionId, { status: 'read' }),
    { onSuccess: () => queryClient.invalidateQueries(['form-submissions', formId]) }
  );

  const fieldLabel = (fieldId) => form?.fields?.find((f) => f._id === fieldId)?.label || fieldId;

  const handleView = (submission) => {
    setViewing(submission);
    if (submission.status === 'new') markReadMutation.mutate(submission._id);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{form?.title || 'Form'} — Submissions</h1>
          <p className="text-gray-600 mt-1">{subsResponse?.data?.total ?? 0} total submission(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No submissions yet.</td></tr>
            ) : (
              submissions.map((s) => (
                <tr key={s._id} className={`hover:bg-gray-50 ${s.status === 'new' ? 'font-medium' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      s.status === 'new' ? 'bg-blue-100 text-blue-800' : s.status === 'archived' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                    {Object.values(s.data || {}).filter(Boolean).slice(0, 3).join(' · ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(s)} className="text-blue-600 hover:text-blue-900" title="View">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Delete this submission?')) deleteMutation.mutate(s._id); }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {viewing && (
        <Modal isOpen onClose={() => setViewing(null)} title="Submission Details" showFooter={false}>
          <div className="space-y-3">
            {Object.entries(viewing.data || {}).map(([fieldId, value]) => (
              <div key={fieldId}>
                <div className="text-xs font-medium text-gray-500">{fieldLabel(fieldId)}</div>
                <div className="text-sm text-gray-900">{String(value)}</div>
              </div>
            ))}
            {(viewing.attachments || []).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Attachments</div>
                {viewing.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline">{a.name || a.url}</a>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400 pt-2 border-t">{new Date(viewing.createdAt).toLocaleString()}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
