import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { liveStreamsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoStop, IoRadio } from 'react-icons/io5';

const LiveStreamControlPage = () => {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery(['live-stream', id], () => liveStreamsAPI.getOne(id), { refetchInterval: 5000 });
  const stream = data?.data?.data;

  const pin = useMutation(({ productId, duration }) => liveStreamsAPI.pin(id, productId, duration), {
    onSuccess: () => qc.invalidateQueries(['live-stream', id])
  });
  const unpin = useMutation(() => liveStreamsAPI.unpin(id), {
    onSuccess: () => qc.invalidateQueries(['live-stream', id])
  });
  const end = useMutation((vodUrl) => liveStreamsAPI.end(id, { vodPlaybackUrl: vodUrl }), {
    onSuccess: () => { qc.invalidateQueries(['live-stream', id]); toast.success('Stream ended'); }
  });

  if (!stream) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><IoRadio className="text-rose-500 animate-pulse" /> {stream.title}</h1>
          <p className="text-xs text-gray-500">Status: {stream.status} · {stream.stats?.totalViewers || 0} total viewers · {stream.stats?.cartAdds || 0} cart adds</p>
        </div>
        <Button onClick={() => { const url = prompt('VOD playback URL (optional):'); end.mutate(url || ''); }} className="bg-rose-600"><IoStop className="mr-1" /> End stream</Button>
      </div>

      <Card>
        <div className="p-4">
          <p className="font-semibold mb-2">Currently pinned</p>
          {stream.currentPin ? (
            <div className="flex items-center justify-between">
              <span>{stream.currentPin.name} (expires {new Date(stream.currentPinExpiresAt).toLocaleTimeString()})</span>
              <button className="btn btn-sm btn-ghost text-rose-600" onClick={() => unpin.mutate()}>Unpin</button>
            </div>
          ) : <p className="text-gray-500 text-sm">No product pinned</p>}
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <p className="font-semibold mb-3">Featured products — tap to pin</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stream.products.map(p => (
              <button key={p._id} className={`border rounded-lg p-3 text-left hover:bg-blue-50 ${String(stream.currentPin?._id) === String(p._id) ? 'bg-blue-50 border-blue-400' : ''}`} onClick={() => pin.mutate({ productId: p._id, duration: 60 })}>
                {p.images?.[0] && <img src={p.images[0].url || p.images[0]} alt={p.name} className="w-full h-24 object-cover rounded mb-2" />}
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-500">R {(p.salePrice || p.price)?.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <p className="font-semibold mb-2">Pin history</p>
          {(stream.pinEvents || []).length === 0 ? <p className="text-sm text-gray-500">No pins yet.</p> : (
            <ul className="text-sm space-y-1">
              {stream.pinEvents.map((ev, i) => (
                <li key={i} className="flex justify-between border-b py-1">
                  <span>{ev.product?.name || 'Product'} · {new Date(ev.pinnedAt).toLocaleTimeString()}</span>
                  <span className="text-gray-500">{ev.taps || 0} taps · {ev.addToCarts || 0} cart adds</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LiveStreamControlPage;
