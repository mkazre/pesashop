import React, { useState, useEffect, useRef } from 'react';

export const Counter = ({
  endValue = 100,
  startValue = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  fontSize = '48px',
  fontWeight = '700',
  color = '#1f2937',
  label = '',
  labelColor = '#6b7280',
  className = '',
  style = {},
}) => {
  const [value, setValue] = useState(startValue);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          setValue(Math.round(startValue + (endValue - startValue) * progress));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [endValue, startValue, duration]);

  return (
    <div ref={ref} className={className} style={{ textAlign: 'center', ...style }}>
      <div style={{ fontSize, fontWeight, color, fontVariantNumeric: 'tabular-nums' }}>
        {prefix}{value.toLocaleString()}{suffix}
      </div>
      {label && <div style={{ fontSize: '14px', color: labelColor, marginTop: '4px' }}>{label}</div>}
    </div>
  );
};

Counter.craft = { displayName: 'Counter' };
