import React, { useState, useEffect } from 'react';

export const BackToTop = ({
  threshold = 300,
  icon = '↑',
  backgroundColor = '#3b82f6',
  color = '#ffffff',
  size = '44px',
  borderRadius = '50%',
  className = '',
  style = {},
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button className={className} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ position: 'fixed', bottom: '24px', right: '24px', width: size, height: size, backgroundColor, color, border: 'none', borderRadius, cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9990, transition: 'opacity 0.3s', ...style }}>
      {icon}
    </button>
  );
};

BackToTop.craft = { displayName: 'Back to Top' };
