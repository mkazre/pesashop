import React from 'react';

export const UltimateVideo = ({
  src = '',
  type = 'youtube',
  youtubeId = 'dQw4w9WgXcQ',
  vimeoId = '',
  poster = 'https://placehold.co/640x360/1f2937/e5e7eb?text=Video',
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  width = '100%',
  aspectRatio = '16/9',
  borderRadius = '8px',
  overlayColor = 'rgba(0,0,0,0.3)',
  showPlayButton = true,
  className = '',
  style = {},
}) => {
  const renderVideo = () => {
    if (type === 'youtube' && youtubeId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}&controls=${controls ? 1 : 0}`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius }}
          allow="autoplay; fullscreen"
          title="YouTube Video"
        />
      );
    }
    if (type === 'vimeo' && vimeoId) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius }}
          allow="autoplay; fullscreen"
          title="Vimeo Video"
        />
      );
    }
    if (type === 'self' && src) {
      return (
        <video src={src} poster={poster} autoPlay={autoplay} loop={loop} muted={muted} controls={controls}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }} />
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius, position: 'relative' }}>
        {poster && <img src={poster} alt="Video poster" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius, position: 'absolute', top: 0, left: 0 }} />}
        {showPlayButton && (
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: overlayColor, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <div style={{ width: 0, height: 0, borderLeft: '20px solid #fff', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: '4px' }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className} style={{ width, aspectRatio, overflow: 'hidden', borderRadius, ...style }}>
      {renderVideo()}
    </div>
  );
};

UltimateVideo.craft = { displayName: 'Ultimate Video' };
