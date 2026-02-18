import React, { useState, useEffect } from 'react';

export const ReadingProgressBar = ({
  color = '#3b82f6',
  height = '4px',
  position = 'top',
  zIndex = 9999,
  className = '',
  style = {},
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={className} style={{ position: 'fixed', [position]: 0, left: 0, width: '100%', height, backgroundColor: 'transparent', zIndex, ...style }}>
      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: color, transition: 'width 0.1s linear' }} />
    </div>
  );
};

ReadingProgressBar.craft = { displayName: 'Reading Progress Bar' };
