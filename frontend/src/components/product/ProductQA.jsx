import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { questionsAPI } from '@/services/api';
import { useAuthStore } from '@/store';

const ANSWERS_PER_LOAD = 3;

function TimeAgo({ date }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h ago</span>;
  const days = Math.floor(hrs / 24);
  if (days < 30) return <span>{days}d ago</span>;
  return <span>{new Date(date).toLocaleDateString()}</span>;
}

function AnswerItem({ answer, questionId }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const voteMutation = useMutation(
    (vote) => questionsAPI.voteAnswer(questionId, answer._id, vote),
    { onSuccess: () => queryClient.invalidateQueries(['product-questions']) }
  );

  const isAdmin = answer.user?.role === 'admin' || answer.user?.role === 'shop_manager' || answer.isAdminAnswer;
  const name = answer.user ? `${answer.user.firstName || ''} ${answer.user.lastName || ''}`.trim() : 'User';

  return (
    <div className="pl-6 border-l-2 border-gray-100 py-2">
      <div className="flex items-start gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {isAdmin ? '✓' : name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-800">{name}</span>
            {isAdmin && (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                Official Answer
              </span>
            )}
            <span className="text-xs text-gray-400"><TimeAgo date={answer.createdAt} /></span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{answer.content}</p>
          {isAuthenticated && (
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => voteMutation.mutate('helpful')}
                className="text-xs text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.5L12 3l2 7z" /></svg>
                {answer.helpfulCount > 0 && <span>{answer.helpfulCount}</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionItem({ question, productId }) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const answers = (question.answers || []).filter(a => a.status === 'visible');
  const visibleCount = showAllAnswers ? answers.length : ANSWERS_PER_LOAD;
  const visibleAnswers = answers.slice(0, visibleCount);
  const hasMore = answers.length > visibleCount;

  const answerMutation = useMutation(
    (content) => questionsAPI.answer(question._id, content),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-questions', productId]);
        setAnswerText('');
        setShowAnswerForm(false);
      }
    }
  );

  const askerName = question.user ? `${question.user.firstName || ''} ${question.user.lastName || ''}`.trim() : 'Customer';

  return (
    <div className="border-b border-gray-100 last:border-0 py-4">
      {/* Question */}
      <div className="flex items-start gap-2">
        <span className="text-emerald-600 font-bold text-sm mt-0.5 flex-shrink-0">Q:</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{question.question}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">Asked by {askerName}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400"><TimeAgo date={question.createdAt} /></span>
            {question.isPinned && <span className="text-[10px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded">📌 Pinned</span>}
          </div>
        </div>
      </div>

      {/* Answers */}
      {visibleAnswers.length > 0 && (
        <div className="mt-3 ml-4 space-y-2">
          {visibleAnswers.map(answer => (
            <AnswerItem key={answer._id} answer={answer} questionId={question._id} />
          ))}
          {hasMore && (
            <button
              onClick={() => setShowAllAnswers(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium ml-6 mt-1"
            >
              View {answers.length - visibleCount} more answer{answers.length - visibleCount > 1 ? 's' : ''}
            </button>
          )}
          {showAllAnswers && answers.length > ANSWERS_PER_LOAD && (
            <button
              onClick={() => setShowAllAnswers(false)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-6 mt-1"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Answer button / form */}
      {isAuthenticated && (
        <div className="mt-3 ml-4">
          {!showAnswerForm ? (
            <button
              onClick={() => setShowAnswerForm(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              💬 Answer this question
            </button>
          ) : (
            <div className="flex gap-2 items-start">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => answerMutation.mutate(answerText)}
                  disabled={!answerText.trim() || answerMutation.isLoading}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {answerMutation.isLoading ? '...' : 'Reply'}
                </button>
                <button
                  onClick={() => { setShowAnswerForm(false); setAnswerText(''); }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductQA({ productId }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [showAskForm, setShowAskForm] = useState(false);

  const { data, isLoading } = useQuery(
    ['product-questions', productId, page],
    () => questionsAPI.getForProduct(productId, { page, limit: 10 }),
    { enabled: !!productId, staleTime: 30 * 1000, keepPreviousData: true }
  );

  const questions = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const askMutation = useMutation(
    (question) => questionsAPI.ask({ productId, question }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-questions', productId]);
        setQuestionText('');
        setShowAskForm(false);
      }
    }
  );

  return (
    <div>
      {/* Ask a Question */}
      {isAuthenticated ? (
        <div className="mb-4">
          {!showAskForm ? (
            <button
              onClick={() => setShowAskForm(true)}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              ❓ Ask a Question
            </button>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="What would you like to know about this product?"
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => askMutation.mutate(questionText)}
                  disabled={questionText.length < 5 || askMutation.isLoading}
                  className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {askMutation.isLoading ? 'Submitting...' : 'Submit Question'}
                </button>
                <button
                  onClick={() => { setShowAskForm(false); setQuestionText(''); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
              {askMutation.isError && (
                <p className="text-sm text-red-600 mt-2">{askMutation.error?.response?.data?.message || 'Failed to submit'}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
          <p className="text-sm text-gray-600">
            <a href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</a> to ask a question
          </p>
        </div>
      )}

      {/* Questions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse space-y-2 py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : questions.length > 0 ? (
        <>
          <div className="divide-y divide-gray-100">
            {questions.map(q => (
              <QuestionItem key={q._id} question={q} productId={productId} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No questions yet. Be the first to ask!
        </div>
      )}

      {/* Total count */}
      {pagination.total > 0 && (
        <p className="text-xs text-gray-400 text-center mt-3">
          {pagination.total} question{pagination.total !== 1 ? 's' : ''} total
        </p>
      )}
    </div>
  );
}
