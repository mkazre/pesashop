import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { digitalKioskAPI, mediaAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import {
  IoFilmOutline, IoCloudUploadOutline, IoTrashOutline,
  IoArrowUpOutline, IoArrowDownOutline, IoSaveOutline, IoVideocamOutline, IoImageOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

export default function ScreensaverMediaPage() {
  const queryClient = useQueryClient();
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery('digital-kiosk-config', digitalKioskAPI.getConfig, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.data?.data?.screensaverMedia) {
      setMedia([...data.data.data.screensaverMedia].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
  }, [data]);

  const saveMutation = useMutation(
    () => digitalKioskAPI.updateConfig({ screensaverMedia: media.map((m, i) => ({ url: m.url, type: m.type, duration: m.duration, order: i })) }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('digital-kiosk-config');
        toast.success('Screensaver saved');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
    }
  );

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 50 MB limit`);
          continue;
        }
        const res = await mediaAPI.upload(file, { folder: 'kiosk-screensaver' });
        const url = res.data?.data?.url || res.data?.url;
        if (url) {
          setMedia(prev => [...prev, { url, type: isVideo ? 'video' : 'image', duration: isVideo ? 0 : 8, order: prev.length }]);
        }
      }
      toast.success('Uploaded — remember to save changes');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const move = (i, dir) => {
    const next = [...media];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setMedia(next);
  };

  const remove = (i) => {
    if (!window.confirm('Remove this media item?')) return;
    setMedia(media.filter((_, idx) => idx !== i));
  };

  const setDuration = (i, value) => {
    const next = [...media];
    next[i] = { ...next[i], duration: Number(value) };
    setMedia(next);
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IoFilmOutline size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Screensaver Media</h1>
            <p className="text-sm text-gray-500">Videos and images that play when the kiosk is idle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded border cursor-pointer ${uploading ? 'opacity-50' : 'hover:bg-gray-50'}`}>
            <IoCloudUploadOutline size={18} />
            {uploading ? 'Uploading…' : 'Upload Media'}
            <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}>
            <IoSaveOutline size={18} className="mr-2" />
            Save Order
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          {media.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <IoFilmOutline size={48} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No screensaver media yet</p>
              <p className="text-sm">Upload images (≤ 50 MB each) or short videos (MP4 / WebM, muted) to play when the kiosk is idle.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {media.map((m, i) => (
                <li key={`${m.url}-${i}`} className="flex items-center gap-4 py-3">
                  <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {m.type === 'video' ? (
                      <video src={resolveUrl(m.url)} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={resolveUrl(m.url)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {m.type === 'video' ? <IoVideocamOutline className="text-gray-500" /> : <IoImageOutline className="text-gray-500" />}
                      <span className="text-sm font-medium text-gray-800 capitalize">{m.type}</span>
                      <span className="text-xs text-gray-500 truncate">{m.url}</span>
                    </div>
                    {m.type === 'image' && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                        <span>Display for</span>
                        <input type="number" min={2} max={120} value={m.duration} onChange={(e) => setDuration(i, e.target.value)} className="border rounded px-2 py-1 w-20" />
                        <span>seconds</span>
                      </div>
                    )}
                    {m.type === 'video' && (
                      <div className="mt-1 text-xs text-gray-500">Plays in full — videos are muted &amp; loop</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><IoArrowUpOutline /></button>
                    <button onClick={() => move(i, 1)} disabled={i === media.length - 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><IoArrowDownOutline /></button>
                    <button onClick={() => remove(i)} className="p-2 rounded hover:bg-red-50 text-red-600"><IoTrashOutline /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
