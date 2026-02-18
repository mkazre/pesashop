import React from 'react';

export const Video = ({
  src = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  width = '100%',
  height = '400px',
  className = '',
  style = {},
}) => {
  const isYouTube = src?.includes('youtube.com') || src?.includes('youtu.be');
  const isVimeo = src?.includes('vimeo.com');

  if (isYouTube || isVimeo) {
    let embedUrl = src;
    if (isYouTube && !src.includes('/embed/')) {
      const id = src.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
      if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
    }
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
    if (muted) params.set('mute', '1');
    const paramStr = params.toString();
    return (
      <div className={className} style={style}>
        <iframe
          src={`${embedUrl}${paramStr ? '?' + paramStr : ''}`}
          style={{ width, height, border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <video
        src={src}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        style={{ width, height, objectFit: 'cover' }}
      />
    </div>
  );
};

Video.craft = { displayName: 'Video' };
