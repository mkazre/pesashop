import React from 'react';

export const MediaPlayer = ({
  src = '',
  type = 'video',
  poster = '',
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  width = '100%',
  height = 'auto',
  className = '',
  style = {},
}) => {
  if (type === 'audio') {
    return (
      <div className={className} style={style}>
        <audio src={src} autoPlay={autoplay} loop={loop} muted={muted} controls={controls} style={{ width }} />
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      <video src={src} poster={poster} autoPlay={autoplay} loop={loop} muted={muted} controls={controls}
        style={{ width, height, objectFit: 'cover', borderRadius: '8px' }} />
    </div>
  );
};

MediaPlayer.craft = { displayName: 'Media Player' };
