import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { liveStreamsAPI } from '../services/api';

const LivePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await liveStreamsAPI.getOne(id);
        if (!cancelled) setStream(res.data.data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load stream');
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  useEffect(() => {
    if (!stream || !videoRef.current || stream.source !== 'hls' || !stream.playbackUrl) return;
    const video = videoRef.current;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.playbackUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(stream.playbackUrl);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      // Fall back to letting the browser try
      video.src = stream.playbackUrl;
    }
  }, [stream]);

  const handleTap = async (productId, action) => {
    try { await liveStreamsAPI.tap(id, productId, action); } catch {}
  };

  if (error) return <div className="p-6 max-w-md mx-auto text-center"><p className="text-rose-600">{error}</p><Link to="/" className="text-blue-600">Home</Link></div>;
  if (!stream) return <div className="p-6">Loading...</div>;

  const isYoutube = stream.source === 'youtube' && stream.playbackUrl;
  const isEnded = stream.status === 'ended';
  const playUrl = isEnded ? (stream.vodPlaybackUrl || stream.playbackUrl) : stream.playbackUrl;

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {stream.status === 'live' && <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded animate-pulse">LIVE</span>}
              {stream.title}
            </h1>
            {stream.hostName && <p className="text-sm opacity-70">with {stream.hostName}</p>}
          </div>
          <button onClick={() => navigate('/')} className="text-sm opacity-70">Close</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 relative bg-black aspect-video">
            {isYoutube ? (
              <iframe src={playUrl} className="w-full h-full" allowFullScreen title="Live stream" />
            ) : (
              <video ref={videoRef} controls autoPlay playsInline className="w-full h-full bg-black" poster={stream.posterImage} />
            )}
            {stream.currentPin && (
              <button onClick={() => navigate(`/product/${stream.currentPin.slug}`)} className="absolute bottom-4 left-4 right-4 bg-white text-black rounded-lg p-3 flex items-center gap-3 shadow-lg hover:bg-yellow-50">
                {stream.currentPin.images?.[0] && <img src={stream.currentPin.images[0].url || stream.currentPin.images[0]} alt="" className="w-12 h-12 object-cover rounded" />}
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{stream.currentPin.name}</p>
                  <p className="text-xs text-gray-600">R {(stream.currentPin.salePrice || stream.currentPin.price)?.toFixed(2)} · Tap to view</p>
                </div>
                <span className="bg-rose-600 text-white text-xs px-2 py-1 rounded">Live</span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold mb-2">Featured products</p>
            {stream.products.map(p => (
              <div key={p._id} className="bg-white/10 hover:bg-white/20 rounded p-2 flex gap-2 items-center cursor-pointer" onClick={() => { handleTap(p._id, 'tap'); navigate(`/product/${p.slug}`); }}>
                {p.images?.[0] && <img src={p.images[0].url || p.images[0]} alt="" className="w-12 h-12 object-cover rounded" />}
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs opacity-70">R {(p.salePrice || p.price)?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;
