import React, { useState, useRef } from 'react';

export const BeforeAfter = ({
  beforeImage = 'https://placehold.co/600x400/e2e8f0/64748b?text=Before',
  afterImage = 'https://placehold.co/600x400/3b82f6/ffffff?text=After',
  beforeLabel = 'Before',
  afterLabel = 'After',
  height = '300px',
  className = '',
  style = {},
}) => {
  const [pos, setPos] = useState(50);
  const containerRef = useRef(null);

  const handleMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };

  return (
    <div ref={containerRef} className={className}
      style={{ position: 'relative', overflow: 'hidden', height, cursor: 'col-resize', userSelect: 'none', borderRadius: '8px', ...style }}
      onMouseMove={(e) => { if (e.buttons === 1) handleMove(e); }}
      onTouchMove={handleMove}>
      <img src={afterImage} alt={afterLabel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, width: `${pos}%`, overflow: 'hidden' }}>
        <img src={beforeImage} alt={beforeLabel} style={{ width: containerRef.current?.offsetWidth || '100%', height: '100%', objectFit: 'cover', maxWidth: 'none' }} />
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: '3px', backgroundColor: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 32, height: 32, borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: 14 }}>⇔</div>
      </div>
      <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{beforeLabel}</span>
      <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{afterLabel}</span>
    </div>
  );
};

BeforeAfter.craft = { displayName: 'Before After' };
