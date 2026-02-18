import React, { useState } from 'react';

export const Hotspot = ({
  children,
  markers = [],
  className = '',
  style = {},
}) => {
  const [activeMarker, setActiveMarker] = useState(null);

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {children}
      {markers.map((marker) => (
        <div key={marker.id} style={{ position: 'absolute', left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%,-50%)', zIndex: 2 }}>
          <button onClick={() => setActiveMarker(activeMarker === marker.id ? null : marker.id)}
            style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: marker.color || '#3b82f6', border: '2px solid #fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>+</button>
          {activeMarker === marker.id && marker.text && (
            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, padding: '8px 12px', backgroundColor: '#1f2937', color: '#fff', borderRadius: 6, fontSize: 13, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {marker.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

Hotspot.craft = { displayName: 'Hotspot' };
