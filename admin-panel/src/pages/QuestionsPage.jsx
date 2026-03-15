import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { questionsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { IoTrash, IoChatbubble, IoEyeOff, IoEye, IoPin, IoCheckmarkCircle, IoSearch } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const imgUrl = (src) => src?.startsWith('http') ? src : `${API_URL}${src}`;

const QuestionsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [answerText, setAnswerText] = useState('');

  // Questions list
  const { data, isLoading } = useQuery(
    ['admin-questions', page, statusFilter, unansweredOnly, searchTerm],
    () => questionsAPI.getAll({
      page, limit: 20,
      ...(statusFilter && { status: statusFilter }),
      ...(unansweredOnly && { unanswered: 'true' }),
      ...(searchTerm && { search: searchTerm }),
    }),
    { keepPreviousData: true }
  );

  // Stats
  const { data: statsData } = useQuery('question-stats', () => questionsAPI.getStats(), { staleTime: 30000 });
  const stats = statsData?.data?.data || {};

  const questions = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  // Mutations
  const updateMutation = useMutation(
    ({ id, data }) => questionsAPI.update(id, data),
    { onSuccess: () => { queryClient.invalidateQueries('admin-questions'); queryClient.invalidateQueries('question-stats'); toast.success('Question updated'); } }
  );

  const deleteMutation = useMutation(
    (id) => questionsAPI.delete(id),
    { onSuccess: () => { queryClient.invalidateQueries('admin-questions'); queryClient.invalidateQueries('question-stats'); toast.success('Question deleted'); setSelectedQuestion(null); } }
  );

  const deleteAnswerMutation = useMutation(
    ({ questionId, answerId }) => questionsAPI.deleteAnswer(questionId, answerId),
    { onSuccess: () => { queryClient.invalidateQueries('admin-questions'); toast.success('Answer deleted'); } }
  );

  const bulkDeleteMutation = useMutation(
    (ids) => questionsAPI.bulkDelete(ids),
    { onSuccess: () => { queryClient.invalidateQueries('admin-questions'); queryClient.invalidateQueries('question-stats'); toast.success('Questions deleted'); setSelectedIds([]); } }
  );

  const answerMutation = useMutation(
    ({ questionId, content }) => questionsAPI.answer(questionId, content),
    { onSuccess: () => { queryClient.invalidateQueries('admin-questions'); toast.success('Answer posted'); setAnswerText(''); } }
  );

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) setSelectedIds([]);
    else setSelectedIds(questions.map(q => q._id));
  };

  const getName = (user) => user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Questions & Answers</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><p className="text-xs text-gray-500">Total Questions</p><p className="text-xl font-bold text-primary">{stats.total || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Unanswered</p><p className="text-xl font-bold text-red-500">{stats.unanswered || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Total Answers</p><p className="text-xl font-bold text-blue-600">{stats.totalAnswers || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">This Week</p><p className="text-xl font-bold text-purple-600">{stats.thisWeek || 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Hidden</p><p className="text-xl font-bold text-gray-500">{stats.byStatus?.hidden || 0}</p></Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="input pl-9 w-64"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input">
              <option value="">All Status</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={unansweredOnly} onChange={(e) => { setUnansweredOnly(e.target.checked); setPage(1); }} className="checkbox checkbox-primary checkbox-sm" />
              Unanswered only
            </label>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
              <Button size="sm" variant="danger" onClick={() => { if (confirm(`Delete ${selectedIds.length} questions?`)) bulkDeleteMutation.mutate(selectedIds); }}>
                <IoTrash size={14} className="mr-1" /> Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse border border-gray-100 rounded-lg p-4">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-3">
            {/* Select all header */}
            <div className="flex items-center gap-3 px-2 pb-2 border-b text-xs text-gray-500">
              <input type="checkbox" checked={selectedIds.length === questions.length} onChange={toggleSelectAll} className="w-4 h-4 rounded" />
              <span className="flex-1">Question</span>
              <span className="w-32">Product</span>
              <span className="w-20 text-center">Answers</span>
              <span className="w-20 text-center">Status</span>
              <span className="w-32 text-right">Actions</span>
            </div>

            {questions.map(q => (
              <div key={q._id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => setSelectedQuestion(q)}>
                <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={(e) => { e.stopPropagation(); toggleSelect(q._id); }} className="w-4 h-4 rounded mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{q.question}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    By {getName(q.user)} · {new Date(q.createdAt).toLocaleDateString()}
                    {q.isPinned && <span className="ml-2 text-amber-500">📌 Pinned</span>}
                    {q.isResolved && <span className="ml-2 text-green-500">✓ Resolved</span>}
                  </p>
                </div>
                <div className="w-32 text-xs text-gray-500 truncate">
                  {q.product?.name || '—'}
                </div>
                <div className="w-20 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${q.answerCount > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
                    <IoChatbubble size={10} /> {q.answerCount || 0}
                  </span>
                </div>
                <div className="w-20 text-center">
                  <span className={`badge ${q.status === 'visible' ? 'badge-success' : 'badge-warning'}`}>{q.status}</span>
                </div>
                <div className="w-32 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => updateMutation.mutate({ id: q._id, data: { isPinned: !q.isPinned } })} className="p-1.5 hover:bg-amber-50 rounded" title={q.isPinned ? 'Unpin' : 'Pin'}>
                    <IoPin size={14} className={q.isPinned ? 'text-amber-500' : 'text-gray-400'} />
                  </button>
                  <button onClick={() => updateMutation.mutate({ id: q._id, data: { status: q.status === 'visible' ? 'hidden' : 'visible' } })} className="p-1.5 hover:bg-gray-100 rounded" title={q.status === 'visible' ? 'Hide' : 'Show'}>
                    {q.status === 'visible' ? <IoEyeOff size={14} className="text-gray-400" /> : <IoEye size={14} className="text-green-600" />}
                  </button>
                  <button onClick={() => { if (confirm('Delete this question and all answers?')) deleteMutation.mutate(q._id); }} className="p-1.5 hover:bg-red-50 rounded" title="Delete">
                    <IoTrash size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">No questions found</div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between mt-6">
            <p className="text-sm text-gray-600">Page {page} of {pagination.pages} ({pagination.total} total)</p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="ghost" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Question Detail Modal */}
      <Modal isOpen={!!selectedQuestion} onClose={() => setSelectedQuestion(null)} title="Question Details" size="lg" showFooter={false}>
        {selectedQuestion && (
          <div className="space-y-4">
            {/* Product */}
            {selectedQuestion.product && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {(selectedQuestion.product.featuredImage || selectedQuestion.product.images?.[0]) && (
                  <img src={imgUrl(selectedQuestion.product.featuredImage || selectedQuestion.product.images[0])} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium">{selectedQuestion.product.name}</p>
                  <p className="text-xs text-gray-400">/{selectedQuestion.product.slug}</p>
                </div>
              </div>
            )}

            {/* Question */}
            <div className="border-l-4 border-emerald-500 pl-4">
              <p className="text-sm font-semibold text-gray-900">{selectedQuestion.question}</p>
              <p className="text-xs text-gray-400 mt-1">
                Asked by {getName(selectedQuestion.user)} · {new Date(selectedQuestion.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Answers */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Answers ({selectedQuestion.answers?.length || 0})</p>
              {selectedQuestion.answers?.length > 0 ? (
                <div className="space-y-3">
                  {selectedQuestion.answers.map(a => (
                    <div key={a._id} className={`p-3 rounded-lg border ${a.status === 'deleted' ? 'bg-red-50 border-red-200 opacity-60' : a.isAdminAnswer ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium">{getName(a.user)}</span>
                          {a.isAdminAnswer && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded font-medium">Admin</span>}
                          {a.isAccepted && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-green-200 text-green-800 rounded font-medium">Accepted</span>}
                          {a.status === 'deleted' && <span className="ml-2 text-[10px] text-red-600">Deleted</span>}
                        </div>
                        {a.status !== 'deleted' && (
                          <button
                            onClick={() => { if (confirm('Delete this answer?')) deleteAnswerMutation.mutate({ questionId: selectedQuestion._id, answerId: a._id }); }}
                            className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                          >
                            <IoTrash size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString()} · {a.helpfulCount || 0} helpful</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No answers yet</p>
              )}
            </div>

            {/* Admin answer form */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Post Official Answer</p>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer..."
                rows={3}
                className="input w-full"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => answerMutation.mutate({ questionId: selectedQuestion._id, content: answerText })}
                  disabled={!answerText.trim() || answerMutation.isLoading}
                >
                  <IoChatbubble size={14} className="mr-1" /> Post Answer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: selectedQuestion._id, data: { isResolved: !selectedQuestion.isResolved } })}>
                  <IoCheckmarkCircle size={14} className="mr-1" /> {selectedQuestion.isResolved ? 'Unresolve' : 'Mark Resolved'}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t pt-4">
              <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: selectedQuestion._id, data: { isPinned: !selectedQuestion.isPinned } })}>
                <IoPin size={14} className="mr-1" /> {selectedQuestion.isPinned ? 'Unpin' : 'Pin'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: selectedQuestion._id, data: { status: selectedQuestion.status === 'visible' ? 'hidden' : 'visible' } })}>
                {selectedQuestion.status === 'visible' ? <><IoEyeOff size={14} className="mr-1" /> Hide</> : <><IoEye size={14} className="mr-1" /> Show</>}
              </Button>
              <Button size="sm" variant="danger" onClick={() => { if (confirm('Permanently delete?')) deleteMutation.mutate(selectedQuestion._id); }}>
                <IoTrash size={14} className="mr-1" /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuestionsPage;
