import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { autoposterAPI, mediaAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoTiktok,
  IoCloudUploadOutline,
  IoCloseOutline,
} from 'react-icons/io5';

// Composer (Spec Section 6). Simplifications made for this first pass, noted
// rather than silently skipped: media upload is a plain file picker (not a
// full drag-and-drop zone), hashtags are a free-text chip input (not a
// reusable "saved sets" library — Spec 6.2), and platform previews show the
// resolved caption + counter rather than a pixel-accurate per-platform mock.
// "Add to queue" recurring scheduling (Spec 6.5) isn't built — Publish Now and
// Schedule For are.
const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', Icon: IoLogoFacebook, color: '#1877F2', limit: 63206 },
  { key: 'instagram', label: 'Instagram', Icon: IoLogoInstagram, color: '#E4405F', limit: 2200 },
  { key: 'x', label: 'X', Icon: IoLogoTwitter, color: '#000000', limit: 280 },
  { key: 'linkedin', label: 'LinkedIn', Icon: IoLogoLinkedin, color: '#0A66C2', limit: 3000 },
  { key: 'tiktok', label: 'TikTok', Icon: IoLogoTiktok, color: '#000000', limit: 2200 },
];

function emptyTargetState() {
  return { account: '', captionOverride: '', hashtags: '', firstComment: '', extra: {} };
}

export default function AutoposterComposePage() {
  const navigate = useNavigate();

  const { data: accountsData } = useQuery('autoposter-accounts', () => autoposterAPI.listAccounts());
  const accounts = accountsData?.data?.data || [];

  const [title, setTitle] = useState('');
  const [baseCaption, setBaseCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [media, setMedia] = useState([]); // [{ type, url, alt }]
  const [uploading, setUploading] = useState(false);

  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [perPlatform, setPerPlatform] = useState({}); // { [platform]: targetState }

  const [scheduleMode, setScheduleMode] = useState('now'); // 'now' | 'scheduled'
  const [scheduledFor, setScheduledFor] = useState('');

  const togglePlatform = (key) => {
    setSelectedPlatforms((prev) => {
      const isSelected = prev.includes(key);
      const next = isSelected ? prev.filter((p) => p !== key) : [...prev, key];
      if (!isSelected) {
        setPerPlatform((pp) => (pp[key] ? pp : { ...pp, [key]: emptyTargetState() }));
        setActiveTab(key);
      } else if (activeTab === key) {
        setActiveTab(next[0] || null);
      }
      return next;
    });
  };

  const updateTarget = (platform, patch) => {
    setPerPlatform((pp) => ({ ...pp, [platform]: { ...pp[platform], ...patch } }));
  };

  const updateTargetExtra = (platform, patch) => {
    setPerPlatform((pp) => ({ ...pp, [platform]: { ...pp[platform], extra: { ...pp[platform]?.extra, ...patch } } }));
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) setHashtags((h) => [...h, tag]);
    setHashtagInput('');
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const res = await mediaAPI.upload(file, { folder: 'autoposter' });
        const uploaded = res.data?.data || res.data;
        setMedia((m) => [...m, {
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: uploaded.url || uploaded.secure_url,
          alt: file.name,
        }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const effectiveCaption = (platform) => perPlatform[platform]?.captionOverride || baseCaption;

  const overLimitPlatforms = useMemo(() => {
    return selectedPlatforms.filter((key) => {
      const target = perPlatform[key];
      if (key === 'x' && target?.extra?.threadMode) return false;
      const platformDef = PLATFORMS.find((p) => p.key === key);
      return effectiveCaption(key).length > platformDef.limit;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatforms, perPlatform, baseCaption]);

  const buildTargetsPayload = () =>
    selectedPlatforms.map((key) => {
      const t = perPlatform[key] || emptyTargetState();
      return {
        platform: key,
        account: t.account || undefined,
        captionOverride: t.captionOverride || undefined,
        hashtags: t.hashtags ? t.hashtags.split(',').map((h) => h.trim()).filter(Boolean) : undefined,
        firstComment: t.firstComment || undefined,
        extra: t.extra,
      };
    });

  const createMutation = useMutation((payload) => autoposterAPI.createPost(payload));
  const publishNowMutation = useMutation((id) => autoposterAPI.publishNow(id));

  const validateBeforeSubmit = () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return false;
    }
    if (overLimitPlatforms.length > 0) {
      toast.error(`Caption too long for: ${overLimitPlatforms.join(', ')}`);
      return false;
    }
    if (scheduleMode === 'scheduled' && !scheduledFor) {
      toast.error('Pick a date/time to schedule for');
      return false;
    }
    return true;
  };

  const handleSave = async (mode) => {
    if (!validateBeforeSubmit()) return;
    try {
      const payload = {
        title: title || undefined,
        baseCaption,
        mediaRefs: media,
        linkUrl: linkUrl || undefined,
        scheduledFor: mode === 'scheduled' ? new Date(scheduledFor).toISOString() : undefined,
        targets: buildTargetsPayload(),
      };
      const res = await createMutation.mutateAsync(payload);
      const postId = res.data.data._id;

      if (mode === 'now') {
        try {
          await publishNowMutation.mutateAsync(postId);
        } catch (publishError) {
          // Expected until Phases 4–5 exist — the post itself saved fine.
          toast.error(publishError.response?.data?.message || 'Publish not available yet');
          navigate('/autoposter/accounts');
          return;
        }
      }

      toast.success(mode === 'scheduled' ? 'Post scheduled' : 'Draft saved');
      navigate('/autoposter/accounts');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compose Post</h1>
          <p className="text-gray-500 mt-1">Write once, adjust per platform, then schedule or publish.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" loading={createMutation.isLoading} onClick={() => handleSave('draft')}>
            Save Draft
          </Button>
          <Button variant="secondary" loading={createMutation.isLoading} onClick={() => handleSave('scheduled')}>
            Schedule
          </Button>
          <Button loading={createMutation.isLoading || publishNowMutation.isLoading} onClick={() => handleSave('now')}>
            Publish Now
          </Button>
        </div>
      </div>

      {/* Platform toggles */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ key, label, Icon, color }) => {
          const isSelected = selectedPlatforms.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => togglePlatform(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                isSelected ? 'border-primary bg-primary/10' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} color={color} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shared fields */}
        <Card title="Shared Content">
          <div className="space-y-4">
            <Input label="Internal title (not published)" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base caption</label>
              <textarea
                className="input w-full min-h-[120px]"
                value={baseCaption}
                onChange={(e) => setBaseCaption(e.target.value)}
                placeholder="Used as the fallback for any platform without its own override…"
              />
            </div>

            <Input label="Link URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} fullWidth placeholder="https://pesashop.com/p/…" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">
                    #{tag}
                    <IoCloseOutline className="cursor-pointer" onClick={() => setHashtags((h) => h.filter((t) => t !== tag))} />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                  placeholder="Type a hashtag and press Enter"
                  fullWidth
                />
                <Button type="button" variant="ghost" onClick={addHashtag}>Add</Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
              <label className="flex items-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <IoCloudUploadOutline size={20} />
                <span>{uploading ? 'Uploading…' : 'Click to upload images or video'}</span>
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaUpload} disabled={uploading} />
              </label>
              {media.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {media.map((m, i) => (
                    <div key={m.url} className="relative">
                      {m.type === 'video' ? (
                        <video src={m.url} className="w-full h-20 object-cover rounded" />
                      ) : (
                        <img src={m.url} alt={m.alt} className="w-full h-20 object-cover rounded" />
                      )}
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black/60 rounded-full text-white p-0.5"
                        onClick={() => setMedia((mm) => mm.filter((_, idx) => idx !== i))}
                      >
                        <IoCloseOutline size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} />
                  Publish now
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={scheduleMode === 'scheduled'} onChange={() => setScheduleMode('scheduled')} />
                  Schedule for
                </label>
                {scheduleMode === 'scheduled' && (
                  <input
                    type="datetime-local"
                    className="input"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Per-platform tabs */}
        <Card title="Per-Platform Overrides">
          {selectedPlatforms.length === 0 ? (
            <p className="text-gray-400 text-sm">Select at least one platform above to customise it here.</p>
          ) : (
            <>
              <div className="flex gap-2 border-b mb-4">
                {selectedPlatforms.map((key) => {
                  const platformDef = PLATFORMS.find((p) => p.key === key);
                  const isOver = overLimitPlatforms.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                        activeTab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500'
                      } ${isOver ? 'text-red-600' : ''}`}
                    >
                      {platformDef.label}{isOver ? ' ⚠' : ''}
                    </button>
                  );
                })}
              </div>

              {activeTab && <PlatformTab
                platform={activeTab}
                target={perPlatform[activeTab] || emptyTargetState()}
                onChange={(patch) => updateTarget(activeTab, patch)}
                onChangeExtra={(patch) => updateTargetExtra(activeTab, patch)}
                caption={effectiveCaption(activeTab)}
                accounts={accounts.filter((a) => a.platform === activeTab)}
              />}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function CharCounter({ length, limit }) {
  const over = length > limit;
  const nearLimit = length > limit * 0.9;
  return (
    <span className={`text-xs ${over ? 'text-red-600 font-semibold' : nearLimit ? 'text-yellow-600' : 'text-gray-400'}`}>
      {length} / {limit}
    </span>
  );
}

function PlatformTab({ platform, target, onChange, onChangeExtra, caption, accounts }) {
  const platformDef = PLATFORMS.find((p) => p.key === platform);
  const threadMode = platform === 'x' && target.extra?.threadMode;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
        <select className="input w-full" value={target.account} onChange={(e) => onChange({ account: e.target.value })}>
          <option value="">Use default / select an account…</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>{a.displayName} {a.status !== 'active' ? `(${a.status})` : ''}</option>
          ))}
        </select>
        {accounts.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">No {platformDef.label} account connected yet — connect one on the Accounts page first.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Caption override</label>
          <CharCounter length={caption.length} limit={platformDef.limit} />
        </div>
        <textarea
          className="input w-full min-h-[100px]"
          value={target.captionOverride}
          onChange={(e) => onChange({ captionOverride: e.target.value })}
          placeholder="Leave blank to use the shared base caption"
        />
        {threadMode && <p className="text-xs text-gray-400 mt-1">Thread mode is on — the 280-character limit isn't enforced here; it'll be split per-tweet.</p>}
      </div>

      {platform === 'facebook' && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!target.extra?.linkPreview} onChange={(e) => onChangeExtra({ linkPreview: e.target.checked })} />
          Show link preview
        </label>
      )}

      {platform === 'instagram' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post type</label>
            <select className="input w-full" value={target.extra?.postType || 'feed'} onChange={(e) => onChangeExtra({ postType: e.target.value })}>
              <option value="feed">Feed</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!target.extra?.firstCommentHashtags} onChange={(e) => onChangeExtra({ firstCommentHashtags: e.target.checked })} />
            Post hashtags as first comment
          </label>
        </>
      )}

      {platform === 'x' && (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!target.extra?.threadMode} onChange={(e) => onChangeExtra({ threadMode: e.target.checked })} />
            Thread mode (split into multiple tweets)
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Who can reply</label>
            <select className="input w-full" value={target.extra?.replySettings || 'everyone'} onChange={(e) => onChangeExtra({ replySettings: e.target.value })}>
              <option value="everyone">Everyone</option>
              <option value="following">People you follow</option>
              <option value="mentioned">Only people you mention</option>
            </select>
          </div>
        </>
      )}

      {platform === 'linkedin' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <select className="input w-full" value={target.extra?.authorType || 'company'} onChange={(e) => onChangeExtra({ authorType: e.target.value })}>
              <option value="company">Company Page</option>
              <option value="personal">Personal profile</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select className="input w-full" value={target.extra?.visibility || 'public'} onChange={(e) => onChangeExtra({ visibility: e.target.value })}>
              <option value="public">Public</option>
              <option value="connections">Connections only</option>
            </select>
          </div>
        </>
      )}

      {platform === 'tiktok' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
            <select className="input w-full" value={target.extra?.privacy || 'public'} onChange={(e) => onChangeExtra({ privacy: e.target.value })}>
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posting mode</label>
            <select className="input w-full" value={target.extra?.postMode || 'upload_to_inbox'} onChange={(e) => onChangeExtra({ postMode: e.target.value })}>
              <option value="direct">Direct post</option>
              <option value="upload_to_inbox">Upload to inbox (manual post from app)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!target.extra?.allowComments} onChange={(e) => onChangeExtra({ allowComments: e.target.checked })} />
            Allow comments
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!target.extra?.allowDuet} onChange={(e) => onChangeExtra({ allowDuet: e.target.checked })} />
            Allow duet
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!target.extra?.allowStitch} onChange={(e) => onChangeExtra({ allowStitch: e.target.checked })} />
            Allow stitch
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!target.extra?.discloseCommercial} onChange={(e) => onChangeExtra({ discloseCommercial: e.target.checked })} />
            Disclose commercial content
          </label>
        </>
      )}
    </div>
  );
}
