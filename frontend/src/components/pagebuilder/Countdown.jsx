import React, { useState, useEffect } from 'react';

export const Countdown = ({
  targetDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  label = '',
  completedText = 'Time is up!',
  digitColor = '#1f2937',
  labelColor = '#6b7280',
  digitSize = '36px',
  separator = ':',
  className = '',
  style = {},
}) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        done: false,
      };
    };
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (timeLeft.done) return <div className={className} style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600, ...style }}>{completedText}</div>;

  const units = [
    { val: timeLeft.days, label: 'Days' },
    { val: timeLeft.hours, label: 'Hours' },
    { val: timeLeft.minutes, label: 'Min' },
    { val: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <div className={className} style={{ textAlign: 'center', ...style }}>
      {label && <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>{label}</div>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            {i > 0 && <span style={{ fontSize: digitSize, color: digitColor, fontWeight: 300 }}>{separator}</span>}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: digitSize, fontWeight: 700, color: digitColor, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                {String(u.val).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '12px', color: labelColor, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{u.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

Countdown.craft = { displayName: 'Countdown' };
