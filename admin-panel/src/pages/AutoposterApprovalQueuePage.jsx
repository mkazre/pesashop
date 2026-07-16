import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { autoposterAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoTiktok,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoTimeOutline,
  IoPencilOutline,
  IoPowerOutline,
} from 'react-icons/io5';

const PLATFORM_ICON = {
  facebook: { Icon: IoLogoFacebook, color: '#1877F2' },
  instagram: { Icon: IoLogoInstagram, color: '#E4405F' },
  x: { Icon: IoLogoTwitter, color: '#000000' },
  linkedin: { Icon: IoLogoLinkedin, color: '#0A66C2' },
  tiktok: { Icon: IoLogoTiktok, color: '#000000' },
};

// Swipe threshold in px past which a drag commits to approve/reject instead of
// snapping back — matches the "swipe right = approve, swipe left = reject"
// mobile interaction called for by Spec 12.2.
const SWIPE_COMMIT_PX = 110;

function ApprovalCard({ decision, onApprove, onReject, onSnooze, busy }) {
  const [editing, setEditing] = useState(false);
  const [chosenIndex, setChosenIndex] = useState(decision.chosenVariant ?? 0);
  const [editedCaption, setEditedCaption] = useState(null);
  const [dragX, setDragX] = useState(0);
  const dragState = useRef({ startX: 0, dragging: false });

  const platform = PLATFORM_ICON[decision.platform] || {};
  const { Icon, color } = platform;
  const activeCaption = editedCaption ?? decision.variants[chosenIndex] ?? decision.variants[0] ?? '';

  const handleTouchStart = (e) => {
    dragState.current = { startX: e.touches[0].clientX, dragging: true };
  };
  const handleTouchMove = (e) => {
    if (!dragState.current.dragging) return;
    setDragX(e.touches[0].clientX - dragState.current.startX);
  };
  const handleTouchEnd = () => {
    dragState.current.dragging = false;
    if (dragX > SWIPE_COMMIT_PX) {
      onApprove(decision, activeCaption);
    } else if (dragX < -SWIPE_COMMIT_PX) {
      onReject(decision);
    }
    setDragX(0);
  };

  const swipeHint = dragX > 30 ? 'approve' : dragX < -30 ? 'reject' : null;

  return (
    <div
      className="relative touch-pan-y select-none"
      style={{ transform: `translateX(${dragX}px) rotate(${dragX / 30}deg)`, transition: dragState.current.dragging ? 'none' : 'transform 0.2s ease' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {swipeHint && (
        <div
          className={`absolute inset-0 flex items-center rounded-lg pointer-events-none z-10 ${
            swipeHint === 'approve' ? 'justify-start bg-green-100/80 pl-4' : 'justify-end bg-red-100/80 pr-4'
          }`}
        >
          {swipeHint === 'approve' ? (
            <IoCheckmarkCircle size={32} className="text-green-600" />
          ) : (
            <IoCloseCircle size={32} className="text-red-600" />
          )}
        </div>
      )}

      <Card>
        <div className="flex items-start gap-3">
          {decision.product?.featuredImage && (
            <img
              src={decision.product.featuredImage}
              alt={decision.product.name}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {Icon && <Icon size={18} color={color} />}
              <span className="font-semibold truncate">{decision.product?.name}</span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              Trending: <span className="font-medium">{decision.trend?.term}</span>
            </p>
          </div>
        </div>

        <div className="mt-3">
          {decision.variants.length > 1 && !editing && (
            <div className="flex gap-2 mb-2">
              {decision.variants.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`text-xs px-2 py-1 rounded-full border ${
                    i === chosenIndex ? 'bg-primary-600 text-white border-primary-600' : 'text-gray-500 border-gray-300'
                  }`}
                  onClick={() => setChosenIndex(i)}
                >
                  Variant {i + 1}
                </button>
              ))}
            </div>
          )}

          {editing ? (
            <textarea
              className="w-full border rounded-md p-2 text-sm"
              rows={4}
              value={activeCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              autoFocus
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{activeCaption}</p>
          )}

          <button
            type="button"
            className="mt-1 text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600"
            onClick={() => setEditing((v) => !v)}
          >
            <IoPencilOutline size={12} />
            {editing ? 'Done editing' : 'Edit caption'}
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="success" size="sm" fullWidth loading={busy === 'approve'} onClick={() => onApprove(decision, activeCaption)}>
            <IoCheckmarkCircle size={16} className="mr-1" />
            Approve
          </Button>
          <Button variant="ghost" size="sm" loading={busy === 'snooze'} onClick={() => onSnooze(decision)}>
            <IoTimeOutline size={16} />
          </Button>
          <Button variant="danger" size="sm" fullWidth loading={busy === 'reject'} onClick={() => onReject(decision)}>
            <IoCloseCircle size={16} className="mr-1" />
            Reject
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function AutoposterApprovalQueuePage({ showKillSwitch = true } = {}) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const { data, isLoading } = useQuery('autoposter-approval-queue', () => autoposterAPI.listApprovalQueue(), {
    refetchInterval: 30000, // new decisions arrive from the composer cron every 15 min — poll so the queue doesn't feel stale
  });
  const decisions = data?.data?.data || [];

  const { data: engineStatusData } = useQuery('autoposter-engine-status', () => autoposterAPI.getEngineStatus(), {
    refetchInterval: 30000,
  });
  const killSwitchEngaged = !!engineStatusData?.data?.data?.killSwitchEnabled;

  const invalidate = () => {
    queryClient.invalidateQueries('autoposter-approval-queue');
    setBusyId(null);
    setBusyAction(null);
  };

  const approveMutation = useMutation(
    ({ id, editedCaption }) => autoposterAPI.approveDecision(id, { editedCaption }),
    {
      onSuccess: () => { toast.success('Approved — queued for publishing'); invalidate(); },
      onError: (error) => { toast.error(error.response?.data?.message || 'Approve failed'); invalidate(); },
    }
  );

  const rejectMutation = useMutation(
    (id) => autoposterAPI.rejectDecision(id, {}),
    {
      onSuccess: () => { toast.success('Rejected'); invalidate(); },
      onError: (error) => { toast.error(error.response?.data?.message || 'Reject failed'); invalidate(); },
    }
  );

  const snoozeMutation = useMutation(
    (id) => autoposterAPI.snoozeDecision(id, 60),
    {
      onSuccess: () => { toast.success('Snoozed for 1 hour'); invalidate(); },
      onError: (error) => { toast.error(error.response?.data?.message || 'Snooze failed'); invalidate(); },
    }
  );

  const bulkApproveMutation = useMutation(
    (platform) => autoposterAPI.bulkApproveByPlatform(platform),
    {
      onSuccess: (res, platform) => {
        const results = res.data?.data || [];
        const okCount = results.filter((r) => r.ok).length;
        toast.success(`Approved ${okCount}/${results.length} pending ${platform} post(s)`);
        invalidate();
      },
      onError: (error) => { toast.error(error.response?.data?.message || 'Bulk approve failed'); invalidate(); },
    }
  );

  const bulkRejectMutation = useMutation(
    (trendId) => autoposterAPI.bulkRejectByTrend(trendId, 'Bulk rejected from approval queue'),
    {
      onSuccess: (res) => {
        const results = res.data?.data || [];
        const okCount = results.filter((r) => r.ok).length;
        toast.success(`Rejected ${okCount}/${results.length} post(s) for that trend`);
        invalidate();
      },
      onError: (error) => { toast.error(error.response?.data?.message || 'Bulk reject failed'); invalidate(); },
    }
  );

  const killSwitchMutation = useMutation(
    () => (killSwitchEngaged ? autoposterAPI.resumeEngine() : autoposterAPI.pauseEngine()),
    {
      onSuccess: () => {
        toast.success(killSwitchEngaged ? 'Engine resumed' : 'Engine paused — trend-driven posts will not publish');
        queryClient.invalidateQueries('autoposter-engine-status');
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Could not toggle engine'),
    }
  );

  const handleApprove = (decision, editedCaption) => {
    setBusyId(decision._id);
    setBusyAction('approve');
    const original = decision.variants[decision.chosenVariant ?? 0];
    approveMutation.mutate({ id: decision._id, editedCaption: editedCaption !== original ? editedCaption : undefined });
  };
  const handleReject = (decision) => {
    setBusyId(decision._id);
    setBusyAction('reject');
    rejectMutation.mutate(decision._id);
  };
  const handleSnooze = (decision) => {
    setBusyId(decision._id);
    setBusyAction('snooze');
    snoozeMutation.mutate(decision._id);
  };

  // Bulk actions (Spec 12.2): "approve all under one platform" / "reject all
  // from one trend" — derived from whatever's actually in the current queue,
  // not a fixed platform/trend list, so a button never targets something
  // with nothing pending.
  const platformCounts = decisions.reduce((acc, d) => { acc[d.platform] = (acc[d.platform] || 0) + 1; return acc; }, {});
  const trendGroups = Object.values(
    decisions.reduce((acc, d) => {
      const id = d.trend?._id;
      if (!id) return acc;
      if (!acc[id]) acc[id] = { id, term: d.trend.term, count: 0 };
      acc[id].count++;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trend Post Approvals</h1>
          <p className="text-gray-500 mt-1">
            Swipe right to approve, left to reject — or use the buttons. {decisions.length} pending.
          </p>
        </div>
      </div>

      {showKillSwitch && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
            killSwitchEngaged ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <IoPowerOutline size={20} className={killSwitchEngaged ? 'text-red-600' : 'text-green-600'} />
            <span className={`font-medium ${killSwitchEngaged ? 'text-red-700' : 'text-green-700'}`}>
              Trend Engine: {killSwitchEngaged ? 'Paused' : 'Running'}
            </span>
          </div>
          <Button
            variant={killSwitchEngaged ? 'success' : 'danger'}
            size="sm"
            loading={killSwitchMutation.isLoading}
            onClick={() => killSwitchMutation.mutate()}
          >
            {killSwitchEngaged ? 'Resume Engine' : 'Pause Engine'}
          </Button>
        </div>
      )}

      {decisions.length > 0 && (
        <Card title="Bulk actions">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Approve all pending, by platform</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platformCounts).map(([platform, count]) => (
                  <Button
                    key={platform}
                    variant="success"
                    size="sm"
                    loading={bulkApproveMutation.isLoading && bulkApproveMutation.variables === platform}
                    onClick={() => bulkApproveMutation.mutate(platform)}
                  >
                    Approve all {platform} ({count})
                  </Button>
                ))}
              </div>
            </div>
            {trendGroups.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Reject all pending, by trend</p>
                <div className="flex flex-wrap gap-2">
                  {trendGroups.map((g) => (
                    <Button
                      key={g.id}
                      variant="danger"
                      size="sm"
                      loading={bulkRejectMutation.isLoading && bulkRejectMutation.variables === g.id}
                      onClick={() => bulkRejectMutation.mutate(g.id)}
                    >
                      Reject all "{g.term}" ({g.count})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : decisions.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500 text-center py-6">
            No posts waiting for approval right now. The composer checks for new trend matches every 15 minutes.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {decisions.map((decision) => (
            <ApprovalCard
              key={decision._id}
              decision={decision}
              busy={busyId === decision._id ? busyAction : null}
              onApprove={handleApprove}
              onReject={handleReject}
              onSnooze={handleSnooze}
            />
          ))}
        </div>
      )}
    </div>
  );
}
