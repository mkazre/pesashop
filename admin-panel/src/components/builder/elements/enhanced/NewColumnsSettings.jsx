import React from 'react';
import { useEditor } from '@craftjs/core';
import { WIDTH_PRESETS } from './NewColumns';
import { Column } from './Column';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

export const NewColumnsSettings = ({ nodeId }) => {
  const { breakpoint } = useBreakpoint();
  const { props, linkedNodes } = useEditor((state) => ({
    props: state.nodes[nodeId]?.data?.props ?? {},
    linkedNodes: state.nodes[nodeId]?.data?.linkedNodes || {},
  }));
  const { actions, query } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const columns = props.columns ?? 2;
  const columnWidths = props.columnWidths || '';
  const gap = props.gap ?? '16px';
  const stackOn = props.stackOn ?? 'mobile';
  const existingCount = Object.keys(linkedNodes).length;

  // Responsive-aware prop update
  const updateProp = (key, value) => {
    setProp((p) => {
      if (breakpoint === 'desktop') {
        p[key] = value;
      } else {
        if (!p.responsiveProps) p.responsiveProps = {};
        if (!p.responsiveProps[breakpoint]) p.responsiveProps[breakpoint] = {};
        p.responsiveProps[breakpoint][key] = value;
      }
    });
  };
  const getProp = (key, fallback) => {
    if (breakpoint === 'desktop') return props[key] ?? fallback;
    const override = props.responsiveProps?.[breakpoint]?.[key];
    return override !== undefined ? override : (props[key] ?? fallback);
  };
  const hasPropOverride = (key) => breakpoint !== 'desktop' && props.responsiveProps?.[breakpoint]?.[key] !== undefined;
  const clearPropOverride = (key) => {
    setProp((p) => { if (p.responsiveProps?.[breakpoint]) delete p.responsiveProps[breakpoint][key]; });
  };

  // Sync Craft.js linked Column nodes when column count changes
  const setColumnCount = (newCount) => {
    const current = existingCount;
    // Add new Column linked nodes if needed
    if (newCount > current) {
      for (let i = current; i < newCount; i++) {
        try {
          const tree = query.parseReactElement(
            React.createElement(Column, { className: '', style: {} })
          ).toNodeTree();
          actions.addLinkedNodeFromTree(tree, nodeId, `col-${i}`);
        } catch (e) {
          console.warn('Could not add column node:', e);
        }
      }
    }
    // Remove excess Column linked nodes if needed
    if (newCount < current) {
      for (let i = current - 1; i >= newCount; i--) {
        const linkedNodeId = linkedNodes[`col-${i}`];
        if (linkedNodeId) {
          try {
            actions.delete(linkedNodeId);
          } catch (e) {
            console.warn('Could not remove column node:', e);
          }
        }
      }
    }
  };

  // Apply a width preset — updates both column count and widths
  const applyPreset = (presetKey) => {
    const widths = WIDTH_PRESETS[presetKey];
    if (!widths) return;
    setColumnCount(widths.length);
    setProp((p) => {
      p.columns = widths.length;
      p.columnWidths = widths.join(',');
    });
  };

  // Group presets by column count
  const presetsByCount = {
    2: ['50-50', '60-40', '40-60', '70-30', '30-70', '25-75', '75-25'],
    3: ['33-33-33', '25-50-25', '20-60-20'],
    4: ['25-25-25-25'],
    5: ['20-20-20-20-20'],
  };

  const effectiveWidths = getProp('columnWidths', columnWidths);
  const effectiveGap = getProp('gap', gap);

  return (
    <div className="space-y-4">
      {/* Breakpoint info */}
      {breakpoint !== 'desktop' && (
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">
          Editing {breakpoint} overrides. Column count is set on Desktop ({columns} columns).
        </div>
      )}

      {/* Column count — desktop only */}
      {breakpoint === 'desktop' && (
        <>
          <div>
            <label className={labelCls}>Number of Columns</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setColumnCount(n);
                    const equalWidth = `${(100 / n).toFixed(3)}%`;
                    setProp((p) => {
                      p.columns = n;
                      p.columnWidths = Array(n).fill(equalWidth).join(',');
                    });
                  }}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                    columns === n
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Width ratio presets */}
          <div>
            <label className={labelCls}>Column Width Presets</label>
            <div className="space-y-2">
              {Object.entries(presetsByCount).map(([count, presets]) => (
                <div key={count}>
                  <p className="text-[10px] text-gray-400 mb-1">{count} columns</p>
                  <div className="flex flex-wrap gap-1">
                    {presets.map((preset) => {
                      const widths = WIDTH_PRESETS[preset];
                      const isActive = columns === widths.length && columnWidths === widths.join(',');
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`px-2 py-1 text-[10px] font-medium rounded border transition-colors ${
                            isActive
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {preset.replace(/-/g, ' / ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Responsive stacking */}
          <div>
            <label className={labelCls}>Stack Columns On</label>
            <select
              value={stackOn}
              onChange={(e) => updateProp('stackOn', e.target.value)}
              className={inputCls}
            >
              <option value="mobile">Mobile only (phone)</option>
              <option value="tablet">Tablet &amp; Mobile</option>
              <option value="never">Never (always horizontal)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-0.5">
              When stacked, columns become full-width and stack vertically.
            </p>
          </div>
        </>
      )}

      {/* Responsive layout presets — tablet/mobile */}
      {breakpoint !== 'desktop' && (() => {
        const desktopWidths = columnWidths || Array(columns).fill(`${(100 / columns).toFixed(3)}%`).join(',');
        const presets = [
          { label: 'Stack (1 column)', value: 'repeat(1,1fr)' },
        ];
        if (columns >= 2) presets.push({ label: '2 per row', value: 'repeat(2,1fr)' });
        if (columns >= 3) presets.push({ label: '3 per row', value: 'repeat(3,1fr)' });
        presets.push({ label: `Same as desktop`, value: '__desktop__' });
        return (
          <div>
            <label className={labelCls}>
              Responsive Layout
              {hasPropOverride('columnWidths') && (
                <button onClick={() => clearPropOverride('columnWidths')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">\u2715</button>
              )}
            </label>
            <div className="space-y-1">
              {presets.map(p => (
                <button key={p.label} type="button" onClick={() => {
                  if (p.value === '__desktop__') { clearPropOverride('columnWidths'); }
                  else { updateProp('columnWidths', p.value); }
                }}
                  className={`w-full px-2 py-1.5 text-[10px] font-medium rounded border text-left ${(p.value === '__desktop__' ? !hasPropOverride('columnWidths') : effectiveWidths === p.value) ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${hasPropOverride('columnWidths') ? 'ring-1 ring-amber-400' : ''}`}>{p.label}</button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Custom widths — always shown */}
      <div>
        <label className={labelCls}>
          Custom Column Widths
          {hasPropOverride('columnWidths') && (
            <button onClick={() => clearPropOverride('columnWidths')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">\u2715</button>
          )}
        </label>
        <input
          type="text"
          value={effectiveWidths}
          onChange={(e) => updateProp('columnWidths', e.target.value)}
          className={`${inputCls} ${hasPropOverride('columnWidths') ? 'ring-1 ring-amber-400' : ''}`}
          placeholder={breakpoint === 'desktop' ? 'e.g. 60%,40% or 25%,50%,25%' : 'e.g. 100%,100% to stack'}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">{breakpoint === 'desktop' ? 'Comma-separated percentages. Must match column count.' : 'Use 100% for each column to stack them.'}</p>
      </div>

      {/* Gap — always shown, responsive-aware */}
      <div>
        <label className={labelCls}>
          Gap
          {hasPropOverride('gap') && (
            <button onClick={() => clearPropOverride('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">\u2715</button>
          )}
        </label>
        <input
          type="text"
          value={effectiveGap}
          onChange={(e) => updateProp('gap', e.target.value)}
          className={`${inputCls} ${hasPropOverride('gap') ? 'ring-1 ring-amber-400' : ''}`}
          placeholder="16px"
        />
        <div className="flex gap-1 mt-1">
          {['0px', '8px', '16px', '24px', '32px'].map(v => (
            <button key={v} type="button" onClick={() => updateProp('gap', v)}
              className={`flex-1 px-1 py-0.5 text-[10px] rounded border ${effectiveGap === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Visual preview */}
      <div>
        <label className={labelCls}>Layout Preview</label>
        <div className="flex gap-1 p-2 bg-gray-50 rounded border border-gray-200 flex-wrap" style={{ minHeight: '40px' }}>
          {(effectiveWidths ? effectiveWidths.split(',') : Array(columns).fill(`${100/columns}%`)).map((w, i) => (
            <div
              key={i}
              className="bg-blue-200 rounded flex items-center justify-center text-[9px] text-blue-700 font-medium"
              style={{ width: w.trim() === '100%' ? '100%' : w.trim(), height: '24px' }}
            >
              {w.trim()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewColumnsSettings;
