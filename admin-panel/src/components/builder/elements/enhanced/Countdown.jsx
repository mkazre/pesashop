import React, { useState, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Countdown = ({
  targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  expiredText = 'Event has ended!',
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  labelDays = 'Days',
  labelHours = 'Hours',
  labelMinutes = 'Minutes',
  labelSeconds = 'Seconds',
  numberColor = '#111827',
  labelColor = '#6b7280',
  separatorColor = '#d1d5db',
  numberSize = '36px',
  labelSize = '12px',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setExpired(false);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [];
  if (showDays) units.push({ value: timeLeft.days, label: labelDays });
  if (showHours) units.push({ value: timeLeft.hours, label: labelHours });
  if (showMinutes) units.push({ value: timeLeft.minutes, label: labelMinutes });
  if (showSeconds) units.push({ value: timeLeft.seconds, label: labelSeconds });

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`countdown-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      {expired ? (
        <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 600, color: numberColor }}>{expiredText}</div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          {units.map((u, i) => (
            <React.Fragment key={u.label}>
              {i > 0 && <span style={{ fontSize: numberSize, color: separatorColor, fontWeight: 300 }}>:</span>}
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontSize: numberSize, fontWeight: 700, color: numberColor, lineHeight: 1.2 }}>
                  {String(u.value).padStart(2, '0')}
                </div>
                <div style={{ fontSize: labelSize, color: labelColor, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  {u.label}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export const CountdownSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { targetDate = '', expiredText = '', showDays = true, showHours = true, showMinutes = true, showSeconds = true, numberColor = '#111827', labelColor = '#6b7280', numberSize = '36px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Countdown</h4>
        <div><label className="block text-sm font-medium text-gray-700">Target Date</label><input type="datetime-local" value={targetDate} onChange={(e) => setProp((p) => { p.targetDate = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Expired Text</label><input type="text" value={expiredText} onChange={(e) => setProp((p) => { p.expiredText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Show Units</h4>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showDays} onChange={(e) => setProp((p) => { p.showDays = e.target.checked; })} />Days</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showHours} onChange={(e) => setProp((p) => { p.showHours = e.target.checked; })} />Hours</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showMinutes} onChange={(e) => setProp((p) => { p.showMinutes = e.target.checked; })} />Minutes</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSeconds} onChange={(e) => setProp((p) => { p.showSeconds = e.target.checked; })} />Seconds</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Number Color</label><input type="color" value={numberColor} onChange={(e) => setProp((p) => { p.numberColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Label Color</label><input type="color" value={labelColor} onChange={(e) => setProp((p) => { p.labelColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Number Size</label><input type="text" value={numberSize} onChange={(e) => setProp((p) => { p.numberSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

Countdown.craft = {
  displayName: 'Countdown',
  props: { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), expiredText: 'Event has ended!', showDays: true, showHours: true, showMinutes: true, showSeconds: true, labelDays: 'Days', labelHours: 'Hours', labelMinutes: 'Minutes', labelSeconds: 'Seconds', numberColor: '#111827', labelColor: '#6b7280', separatorColor: '#d1d5db', numberSize: '36px', labelSize: '12px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
