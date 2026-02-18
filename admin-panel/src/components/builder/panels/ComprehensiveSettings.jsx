import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Column } from '@/components/builder/elements/enhanced/Column';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { Monitor, Tablet, Smartphone, Database, Trash2, Plus, Upload } from 'lucide-react';
import { DynamicDataPicker } from '@/components/builder/utils/DynamicDataPicker';
import { isDynamicValue, extractField, getPropType, DATA_POINT_CATEGORIES, ALL_DATA_POINTS, makeDynamicToken } from '@/components/builder/utils/dynamicData';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
const selectCls = inputCls;
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const sectionCls = 'space-y-3';
const headingCls = 'text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway',
  'Nunito', 'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Ubuntu',
  'Oswald', 'Rubik', 'Work Sans', 'Fira Sans', 'Quicksand', 'Barlow',
  'Mulish', 'DM Sans', 'Manrope', 'Space Grotesk', 'Outfit', 'Plus Jakarta Sans',
  'Josefin Sans', 'Libre Baskerville', 'Crimson Text', 'PT Serif', 'Lora',
  'Bitter', 'Noto Sans', 'Noto Serif', 'Karla', 'Cabin', 'Archivo',
];

const SYSTEM_FONTS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: "'Helvetica Neue', Helvetica, sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'System UI', value: 'system-ui, -apple-system, sans-serif' },
];

/**
 * ComprehensiveSettings — Oxygen Builder-style settings with full CSS control.
 * No local state for props. Reads reactively from Craft.js, writes via actions.setProp
 * with Immer-compatible mutation callbacks so serialize() picks up every change.
 */
const BP_ICONS = { desktop: Monitor, tablet: Tablet, phone: Smartphone };
const BP_LABELS = { desktop: 'Desktop', tablet: 'Tablet', phone: 'Phone' };

const MediaLibraryButton = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm border border-indigo-300 rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
        <Database size={14} /> Browse Media Library
      </button>
      <MediaLibraryModal isOpen={open} onClose={() => setOpen(false)} onSelect={(url) => { onSelect(url); setOpen(false); }} />
    </>
  );
};

export const ComprehensiveSettings = ({ nodeId, displayName, activeTab }) => {
  const [openSections, setOpenSections] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProp, setPickerProp] = useState(null);
  const [pickerType, setPickerType] = useState('any');
  const [addingNew, setAddingNew] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const { breakpoint } = useBreakpoint();

  if (!nodeId) {
    return <div className="p-4 text-sm text-gray-500">No element selected</div>;
  }

  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions, query } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  // If this is a Column child, find the parent Columns node so we can show its layout controls
  const parentColumnsInfo = useEditor((state) => {
    const dn = (displayName || '').toLowerCase();
    if (dn !== 'column') return null;
    const node = state.nodes[nodeId];
    const parentId = node?.data?.parent;
    if (!parentId) return null;
    const parentNode = state.nodes[parentId];
    const parentDn = (parentNode?.data?.displayName || '').toLowerCase();
    if (parentDn === 'columns' || parentDn === 'new columns' || parentDn === 'newcolumns') {
      return { parentId, parentProps: parentNode?.data?.props ?? {}, linkedNodes: parentNode?.data?.linkedNodes || {} };
    }
    return null;
  });
  const setParentProp = parentColumnsInfo
    ? (cb) => actions.setProp(parentColumnsInfo.parentId, cb)
    : null;
  const parentProps = parentColumnsInfo?.parentProps ?? {};

  // Get the columns node ID and its linked nodes for adding/removing columns
  const currentLinkedNodes = useEditor((state) => state.nodes[nodeId]?.data?.linkedNodes || {});
  const columnsNodeId = parentColumnsInfo ? parentColumnsInfo.parentId : nodeId;
  const columnsLinkedNodes = parentColumnsInfo ? parentColumnsInfo.linkedNodes : currentLinkedNodes;

  // Sync Craft.js linked Column nodes when column count changes
  const syncColumnNodes = (newCount) => {
    const current = Object.keys(columnsLinkedNodes).length;
    if (newCount > current) {
      for (let i = current; i < newCount; i++) {
        try {
          const tree = query.parseReactElement(
            React.createElement(Column, { className: '', style: {} })
          ).toNodeTree();
          actions.addLinkedNodeFromTree(tree, columnsNodeId, `col-${i}`);
        } catch (e) {
          console.warn('Could not add column node:', e);
        }
      }
    }
    if (newCount < current) {
      for (let i = current - 1; i >= newCount; i--) {
        const linkedNodeId = columnsLinkedNodes[`col-${i}`];
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

  const {
    content = '',
    className = '',
    customCSS = '',
    style = {},
    level,
  } = props;

  // Merge desktop base styles with current breakpoint overrides
  const responsive = style.responsive || {};
  const bpOverrides = responsive[breakpoint] || {};
  const s = breakpoint === 'desktop' ? style : { ...style, ...bpOverrides };

  const updateProp = (key, value) => {
    setProp((p) => { p[key] = value; });
  };

  // Responsive-aware prop update — stores per-breakpoint overrides in responsiveProps
  const updateResponsiveProp = (key, value) => {
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

  // Get the effective value of a responsive prop for the current breakpoint
  const getResponsiveProp = (key, fallback) => {
    if (breakpoint === 'desktop') return props[key] ?? fallback;
    const override = props.responsiveProps?.[breakpoint]?.[key];
    return override !== undefined ? override : (props[key] ?? fallback);
  };

  const hasResponsivePropOverride = (key) => {
    return breakpoint !== 'desktop' && props.responsiveProps?.[breakpoint]?.[key] !== undefined;
  };

  const clearResponsivePropOverride = (key) => {
    setProp((p) => {
      if (p.responsiveProps?.[breakpoint]) {
        delete p.responsiveProps[breakpoint][key];
      }
    });
  };

  const updateStyle = (key, value) => {
    setProp((p) => {
      if (!p.style) p.style = {};
      if (breakpoint === 'desktop') {
        p.style[key] = value;
      } else {
        // Store override under style.responsive.{breakpoint}
        if (!p.style.responsive) p.style.responsive = {};
        if (!p.style.responsive[breakpoint]) p.style.responsive[breakpoint] = {};
        p.style.responsive[breakpoint][key] = value;
      }
    });
  };

  const clearOverride = (key) => {
    setProp((p) => {
      if (p.style?.responsive?.[breakpoint]) {
        delete p.style.responsive[breakpoint][key];
      }
    });
  };

  const hasOverride = (key) => {
    return breakpoint !== 'desktop' && responsive[breakpoint]?.[key] !== undefined;
  };

  // Breakpoint indicator bar
  const BpIcon = BP_ICONS[breakpoint] || Monitor;
  const BreakpointBar = () => (
    breakpoint !== 'desktop' ? (
      <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
        <BpIcon size={14} />
        <span className="font-medium">Editing {BP_LABELS[breakpoint]} overrides</span>
        <span className="text-amber-600 ml-auto">Desktop styles used as base</span>
      </div>
    ) : null
  );

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSectionOpen = (id, defaultOpen = true) => {
    return openSections[id] !== undefined ? openSections[id] : defaultOpen;
  };

  const CollapsibleSection = ({ id, title, defaultOpen = true, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
        <span className="text-gray-400 text-xs">{isSectionOpen(id, defaultOpen) ? '▾' : '▸'}</span>
      </button>
      {isSectionOpen(id, defaultOpen) && (
        <div className="p-3 space-y-3">{children}</div>
      )}
    </div>
  );

  // ── Element-specific helpers ──────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateProp('src', reader.result);
    reader.readAsDataURL(file);
  };

  const dn = (displayName || '').toLowerCase();
  const isImage = dn === 'image' || dn === 'ultimate image';
  const isButton = dn === 'button' || dn === 'link button' || dn === 'hover animated button' || dn === 'dual button' || dn === 'add to cart button' || dn === 'product cart button';
  const isHeading = dn === 'heading' || dn === 'animated heading' || dn === 'fancy heading' || dn === 'highlighted heading' || dn === 'dual color text' || dn === 'product title';
  const isText = dn === 'text' || dn === 'rich text' || dn === 'text block' || dn === 'span';
  const isLink = dn === 'link text' || dn === 'link wrapper';
  const isVideo = dn === 'video' || dn === 'ultimate video' || dn === 'media player';
  const isIconBox = dn === 'icon box' || dn === 'fancy icon';
  const isColumn = dn === 'column';
  const isColumns = dn === 'columns' || dn === 'new columns' || dn === 'newcolumns';
  const showColumnsControls = isColumns || (isColumn && parentColumnsInfo);
  const colProps = isColumns ? props : parentProps;
  // Responsive-aware column prop update — columnWidths/gap/stackOn stored per-breakpoint
  const updateColProp = (key, value) => {
    const setter = isColumns ? setProp : setParentProp;
    if (!setter) return;
    setter((p) => {
      if (breakpoint === 'desktop') {
        p[key] = value;
      } else {
        if (!p.responsiveProps) p.responsiveProps = {};
        if (!p.responsiveProps[breakpoint]) p.responsiveProps[breakpoint] = {};
        p.responsiveProps[breakpoint][key] = value;
      }
    });
  };
  const getColProp = (key, fallback) => {
    if (breakpoint === 'desktop') return colProps[key] ?? fallback;
    const override = colProps.responsiveProps?.[breakpoint]?.[key];
    return override !== undefined ? override : (colProps[key] ?? fallback);
  };
  const hasColPropOverride = (key) => {
    return breakpoint !== 'desktop' && colProps.responsiveProps?.[breakpoint]?.[key] !== undefined;
  };
  const clearColPropOverride = (key) => {
    const setter = isColumns ? setProp : setParentProp;
    if (!setter) return;
    setter((p) => {
      if (p.responsiveProps?.[breakpoint]) {
        delete p.responsiveProps[breakpoint][key];
      }
    });
  };
  const isContainer = dn === 'container' || dn === 'section' || dn === 'div block' || dn === 'columns' || dn === 'superbox' || dn === 'header' || dn === 'header row';
  const isAccordion = dn === 'accordion';
  const isTabs = dn === 'tabs' || dn === 'dynamic tabs';
  const isGallery = dn === 'gallery' || dn === 'gallery slider';
  const isTestimonial = dn === 'testimonial';
  const isPricingBox = dn === 'pricing box';
  const isProgressBar = dn === 'progress bar' || dn === 'circular progress' || dn === 'reading progress bar';
  const isToggle = dn === 'toggle' || dn === 'toggle switch';
  const isModal = dn === 'modal' || dn === 'off canvas' || dn === 'lightbox';
  const isForm = dn === 'search form' || dn === 'login form';
  const isCountdown = dn === 'countdown';
  const isCounter = dn === 'counter';
  const isMap = dn === 'map' || dn === 'mapembed';
  const isCodeBlock = dn === 'code block';
  const isSocialIcons = dn === 'social icons' || dn === 'social share buttons';
  const isRepeater = dn === 'repeater';
  const isGridElement = dn === 'product grid' || dn === 'easy posts' || dn === 'category list' || dn === 'archive products' || dn === 'archive categories' || dn === 'product related' || dn === 'product upsells' || dn === 'product cross-sells';
  const isSlider = dn === 'slider' || dn === 'content slider' || dn === 'carousel builder';
  const isMenu = dn === 'menu' || dn === 'sliding menu' || dn === 'mega menu';
  const isShapeDivider = dn === 'shape divider';
  const hasContentProp = props.content !== undefined && !isImage && !isButton && !isLink && !isVideo && !isIconBox;
  const hasTextProp = props.text !== undefined && !isHeading && !isText && !isLink && !isVideo && !isIconBox;

  // ── Layout Tab ────────────────────────────────────────────────────
  const renderLayoutSettings = () => (
    <div className="space-y-3">
      <BreakpointBar />

      {/* ── Image-specific controls ── */}
      {isImage && (
        <CollapsibleSection id="imageProps" title="Image">
          <div>
            <label className={labelCls}>Image Source (URL)</label>
            <input type="text" value={props.src || ''} onChange={(e) => updateProp('src', e.target.value)} className={inputCls} placeholder="https://example.com/image.jpg" />
          </div>
          <div>
            <label className={labelCls}>Upload Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id={`img-upload-${nodeId}`} />
            <button type="button" onClick={() => document.getElementById(`img-upload-${nodeId}`)?.click()}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-dashed border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Upload size={14} /> Choose File
            </button>
            <MediaLibraryButton onSelect={(url) => updateProp('src', url)} />
          </div>
          <div>
            <label className={labelCls}>Alt Text</label>
            <input type="text" value={props.alt || ''} onChange={(e) => updateProp('alt', e.target.value)} className={inputCls} placeholder="Describe the image" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Width</label>
              <input type="text" value={props.width || ''} onChange={(e) => updateProp('width', e.target.value)} className={inputCls} placeholder="100%" />
            </div>
            <div>
              <label className={labelCls}>Height</label>
              <input type="text" value={props.height || ''} onChange={(e) => updateProp('height', e.target.value)} className={inputCls} placeholder="auto" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Object Fit</label>
            <select value={s.objectFit || 'contain'} onChange={(e) => updateStyle('objectFit', e.target.value)} className={selectCls}>
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Object Position</label>
            <select value={s.objectPosition || 'center'} onChange={(e) => updateStyle('objectPosition', e.target.value)} className={selectCls}>
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="top left">Top Left</option>
              <option value="top right">Top Right</option>
              <option value="bottom left">Bottom Left</option>
              <option value="bottom right">Bottom Right</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Border Radius</label>
            <input type="text" value={s.borderRadius || ''} onChange={(e) => updateStyle('borderRadius', e.target.value)} className={inputCls} placeholder="0px" />
            <div className="flex gap-1 mt-1">
              {['0px', '4px', '8px', '12px', '50%', '9999px'].map(v => (
                <button key={v} type="button" onClick={() => updateStyle('borderRadius', v)}
                  className={`flex-1 px-1 py-0.5 text-[10px] rounded border ${s.borderRadius === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>CSS Filter</label>
            <input type="text" value={s.filter || ''} onChange={(e) => updateStyle('filter', e.target.value)} className={inputCls} placeholder="e.g. grayscale(100%) blur(2px)" />
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: 'Grayscale', val: 'grayscale(100%)' },
                { label: 'Sepia', val: 'sepia(100%)' },
                { label: 'Blur', val: 'blur(3px)' },
                { label: 'Bright', val: 'brightness(1.3)' },
                { label: 'Contrast', val: 'contrast(1.3)' },
                { label: 'Saturate', val: 'saturate(1.5)' },
                { label: 'None', val: 'none' },
              ].map(p => (
                <button key={p.label} type="button" onClick={() => updateStyle('filter', p.val)}
                  className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 rounded border border-gray-200">{p.label}</button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Heading-specific controls ── */}
      {isHeading && (
        <CollapsibleSection id="headingProps" title="Heading">
          <div>
            <label className={labelCls}>Content</label>
            <textarea value={content} onChange={(e) => updateProp('content', e.target.value)} className={inputCls} placeholder="Enter heading text" rows={2} />
          </div>
          <div>
            <label className={labelCls}>Heading Level</label>
            <div className="flex gap-1">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} type="button" onClick={() => updateProp('level', n)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                    level === n ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>H{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Text Align</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(val => (
                <button key={val} type="button" onClick={() => updateStyle('textAlign', val)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${s.textAlign === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >{val.charAt(0).toUpperCase() + val.slice(1)}</button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Text-specific controls ── */}
      {isText && !isHeading && (
        <CollapsibleSection id="textProps" title="Text Content">
          <textarea value={content} onChange={(e) => updateProp('content', e.target.value)} className={inputCls} placeholder="Enter text content" rows={3} />
          <div>
            <label className={labelCls}>Text Align</label>
            <div className="flex gap-1">
              {['left', 'center', 'right', 'justify'].map(val => (
                <button key={val} type="button" onClick={() => updateStyle('textAlign', val)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${s.textAlign === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >{val.charAt(0).toUpperCase() + val.slice(1)}</button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Button-specific controls ── */}
      {isButton && (
        <CollapsibleSection id="buttonProps" title="Button">
          <div>
            <label className={labelCls}>Button Text</label>
            <input type="text" value={props.text || ''} onChange={(e) => updateProp('text', e.target.value)} className={inputCls} placeholder="Click me" />
          </div>
          <div>
            <label className={labelCls}>Link URL</label>
            <input type="text" value={props.link || props.url || ''} onChange={(e) => updateProp(props.url !== undefined ? 'url' : 'link', e.target.value)} className={inputCls} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Target</label>
              <select value={props.target || '_self'} onChange={(e) => updateProp('target', e.target.value)} className={selectCls}>
                <option value="_self">Same Tab</option>
                <option value="_blank">New Tab</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Size</label>
              <select value={props.size || 'md'} onChange={(e) => updateProp('size', e.target.value)} className={selectCls}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Variant</label>
            <div className="flex gap-1">
              {['primary', 'secondary', 'outline'].map(v => (
                <button key={v} type="button" onClick={() => updateProp('variant', v)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                    (props.variant || 'primary') === v ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Background Color</label>
              <div className="flex gap-1">
                <input type="color" value={s.backgroundColor || '#3b82f6'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
                <input type="text" value={s.backgroundColor || ''} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className={inputCls} placeholder="#3b82f6" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Text Color</label>
              <div className="flex gap-1">
                <input type="color" value={s.color || '#ffffff'} onChange={(e) => updateStyle('color', e.target.value)} className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
                <input type="text" value={s.color || ''} onChange={(e) => updateStyle('color', e.target.value)} className={inputCls} placeholder="#ffffff" />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Border Radius</label>
            <input type="text" value={s.borderRadius || ''} onChange={(e) => updateStyle('borderRadius', e.target.value)} className={inputCls} placeholder="6px" />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Link-specific controls (for Link Text, Link Wrapper) ── */}
      {isLink && !isButton && (
        <CollapsibleSection id="linkProps" title="Link">
          {props.text !== undefined && (
            <div>
              <label className={labelCls}>Link Text</label>
              <input type="text" value={props.text || ''} onChange={(e) => updateProp('text', e.target.value)} className={inputCls} placeholder="Link text" />
            </div>
          )}
          <div>
            <label className={labelCls}>URL</label>
            <input type="text" value={props.url || props.link || ''} onChange={(e) => updateProp(props.url !== undefined ? 'url' : 'link', e.target.value)} className={inputCls} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>Target</label>
            <select value={props.target || '_self'} onChange={(e) => updateProp('target', e.target.value)} className={selectCls}>
              <option value="_self">Same Tab</option>
              <option value="_blank">New Tab</option>
            </select>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Video-specific controls ── */}
      {isVideo && (
        <CollapsibleSection id="videoProps" title="Video">
          <div>
            <label className={labelCls}>Video URL</label>
            <input type="text" value={props.src || props.url || ''} onChange={(e) => updateProp(props.src !== undefined ? 'src' : 'url', e.target.value)} className={inputCls} placeholder="https://youtube.com/watch?v=..." />
          </div>
          {props.autoplay !== undefined && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!props.autoplay} onChange={(e) => updateProp('autoplay', e.target.checked)} className="rounded" />
              <label className="text-xs text-gray-600">Autoplay</label>
            </div>
          )}
          {props.controls !== undefined && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.controls !== false} onChange={(e) => updateProp('controls', e.target.checked)} className="rounded" />
              <label className="text-xs text-gray-600">Show Controls</label>
            </div>
          )}
          {props.loop !== undefined && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!props.loop} onChange={(e) => updateProp('loop', e.target.checked)} className="rounded" />
              <label className="text-xs text-gray-600">Loop</label>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ── Icon Box-specific controls ── */}
      {isIconBox && (
        <CollapsibleSection id="iconBoxProps" title="Icon Box">
          <div>
            <label className={labelCls}>Icon (emoji or text)</label>
            <input type="text" value={props.icon || ''} onChange={(e) => updateProp('icon', e.target.value)} className={inputCls} placeholder="⭐" />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={props.title || ''} onChange={(e) => updateProp('title', e.target.value)} className={inputCls} placeholder="Feature Title" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={props.description || ''} onChange={(e) => updateProp('description', e.target.value)} className={inputCls} placeholder="Description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Icon Size</label>
              <input type="text" value={props.iconSize || ''} onChange={(e) => updateProp('iconSize', e.target.value)} className={inputCls} placeholder="48px" />
            </div>
            <div>
              <label className={labelCls}>Icon Color</label>
              <div className="flex gap-1">
                <input type="color" value={props.iconColor || '#3b82f6'} onChange={(e) => updateProp('iconColor', e.target.value)} className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
                <input type="text" value={props.iconColor || ''} onChange={(e) => updateProp('iconColor', e.target.value)} className={inputCls} placeholder="#3b82f6" />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Layout</label>
            <div className="flex gap-1">
              {['top', 'left'].map(v => (
                <button key={v} type="button" onClick={() => updateProp('layout', v)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border ${(props.layout || 'top') === v ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >{v === 'top' ? 'Icon Top' : 'Icon Left'}</button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Columns-specific controls (shown for Columns parent OR Column child) ── */}
      {showColumnsControls && (
        <CollapsibleSection id="columnsProps" title="Columns Layout">
          {isColumn && <p className="text-[10px] text-blue-600 mb-2">Editing parent Columns layout</p>}

          {/* Desktop: full column count + width presets (syncs Craft.js nodes) */}
          {breakpoint === 'desktop' && (
            <>
              <div>
                <label className={labelCls}>Number of Columns</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button key={n} type="button" onClick={() => {
                      syncColumnNodes(n);
                      const eq = `${(100 / n).toFixed(3)}%`;
                      updateColProp('columns', n);
                      updateColProp('columnWidths', Array(n).fill(eq).join(','));
                    }} className={`flex-1 px-1.5 py-1.5 text-xs font-medium rounded border ${(colProps.columns || 2) === n ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <label className={labelCls}>Width Presets</label>
                <div className="space-y-1.5">
                  {[
                    { label: '50 / 50', key: '50%,50%', cols: 2 },
                    { label: '60 / 40', key: '60%,40%', cols: 2 },
                    { label: '40 / 60', key: '40%,60%', cols: 2 },
                    { label: '70 / 30', key: '70%,30%', cols: 2 },
                    { label: '30 / 70', key: '30%,70%', cols: 2 },
                    { label: '75 / 25', key: '75%,25%', cols: 2 },
                    { label: '25 / 75', key: '25%,75%', cols: 2 },
                    { label: '33 / 33 / 33', key: '33.333%,33.333%,33.333%', cols: 3 },
                    { label: '25 / 50 / 25', key: '25%,50%,25%', cols: 3 },
                    { label: '20 / 60 / 20', key: '20%,60%,20%', cols: 3 },
                    { label: '25 / 25 / 25 / 25', key: '25%,25%,25%,25%', cols: 4 },
                    { label: '20 / 20 / 20 / 20 / 20', key: '20%,20%,20%,20%,20%', cols: 5 },
                  ].map(p => (
                    <button key={p.key} type="button" onClick={() => { syncColumnNodes(p.cols); updateColProp('columns', p.cols); updateColProp('columnWidths', p.key); }}
                      className={`w-full px-2 py-1 text-[10px] font-medium rounded border text-left ${colProps.columnWidths === p.key ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p.label}</button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <label className={labelCls}>Custom Widths</label>
                <input type="text" value={colProps.columnWidths || ''} onChange={(e) => updateColProp('columnWidths', e.target.value)} className={inputCls} placeholder="e.g. 60%,40%" />
                <p className="text-[10px] text-gray-400 mt-0.5">Comma-separated percentages matching column count</p>
              </div>
              <div className="mt-2">
                <label className={labelCls}>Stack On</label>
                <select value={colProps.stackOn || 'mobile'} onChange={(e) => updateColProp('stackOn', e.target.value)} className={inputCls}>
                  <option value="mobile">Mobile only</option>
                  <option value="tablet">Tablet &amp; Mobile</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </>
          )}

          {/* Tablet/Mobile: responsive layout override (no node changes) */}
          {breakpoint !== 'desktop' && (() => {
            const desktopCols = colProps.columns || 2;
            const desktopWidths = colProps.columnWidths || Array(desktopCols).fill(`${(100 / desktopCols).toFixed(3)}%`).join(',');
            const currentWidths = getColProp('columnWidths', desktopWidths);
            // Build layout presets based on desktop column count
            const layoutPresets = [
              { label: 'Stack (1 column)', value: 'repeat(1,1fr)' },
            ];
            if (desktopCols >= 2) layoutPresets.push({ label: '2 per row', value: 'repeat(2,1fr)' });
            if (desktopCols >= 3) layoutPresets.push({ label: '3 per row', value: 'repeat(3,1fr)' });
            if (desktopCols >= 4) layoutPresets.push({ label: '4 per row', value: 'repeat(4,1fr)' });
            layoutPresets.push({ label: `Same as desktop (${desktopCols} cols)`, value: '__desktop__' });
            return (
              <>
                <div className="px-3 py-2 mb-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[10px]">
                  Column count is set on Desktop ({desktopCols} columns). Choose a responsive layout below.
                </div>
                <div>
                  <label className={labelCls}>
                    Responsive Layout
                    {hasColPropOverride('columnWidths') && (
                      <button onClick={() => clearColPropOverride('columnWidths')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
                    )}
                  </label>
                  <div className="space-y-1">
                    {layoutPresets.map(p => (
                      <button key={p.label} type="button" onClick={() => {
                        if (p.value === '__desktop__') { clearColPropOverride('columnWidths'); }
                        else { updateColProp('columnWidths', p.value); }
                      }}
                        className={`w-full px-2 py-1.5 text-[10px] font-medium rounded border text-left ${(p.value === '__desktop__' ? !hasColPropOverride('columnWidths') : currentWidths === p.value) ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${hasColPropOverride('columnWidths') ? 'ring-1 ring-amber-400' : ''}`}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <label className={labelCls}>Custom Widths</label>
                  <input type="text" value={currentWidths} onChange={(e) => updateColProp('columnWidths', e.target.value)} className={`${inputCls} ${hasColPropOverride('columnWidths') ? 'ring-1 ring-amber-400' : ''}`} placeholder="e.g. repeat(2,1fr)" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Use repeat(N,1fr) for N columns per row, or 1fr for stacked</p>
                </div>
              </>
            );
          })()}

          {/* Gap — always shown, responsive-aware */}
          <div className="mt-2">
            <label className={labelCls}>
              Gap
              {hasColPropOverride('gap') && (
                <button onClick={() => clearColPropOverride('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <input type="text" value={getColProp('gap', '16px')} onChange={(e) => updateColProp('gap', e.target.value)} className={`${inputCls} ${hasColPropOverride('gap') ? 'ring-1 ring-amber-400' : ''}`} placeholder="16px" />
            <div className="flex gap-1 mt-1">
              {['0px', '8px', '16px', '24px', '32px'].map(v => (
                <button key={v} type="button" onClick={() => updateColProp('gap', v)}
                  className={`flex-1 px-1 py-0.5 text-[10px] rounded border ${getColProp('gap', '16px') === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
              ))}
            </div>
          </div>

          {/* Visual preview */}
          <div className="mt-2">
            <label className={labelCls}>Preview</label>
            <div className="flex gap-1 p-2 bg-gray-50 rounded border border-gray-200 flex-wrap" style={{ minHeight: '32px' }}>
              {(getColProp('columnWidths', '') ? getColProp('columnWidths', '').split(',') : Array(colProps.columns || 2).fill(`${100/(colProps.columns||2)}%`)).map((w, i) => (
                <div key={i} className="bg-blue-200 rounded flex items-center justify-center text-[8px] text-blue-700 font-medium" style={{ width: w.trim() === '100%' ? '100%' : `calc(${w.trim()} - 4px)`, height: '24px' }}>{w.trim()}</div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Accordion-specific controls ── */}
      {isAccordion && (
        <CollapsibleSection id="accordionProps" title="Accordion">
          <div>
            <label className={labelCls}>Allow Multiple Open</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!props.allowMultiple} onChange={(e) => updateProp('allowMultiple', e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-500">{props.allowMultiple ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Default Open Index</label>
            <input type="number" value={props.defaultOpen ?? 0} onChange={(e) => updateProp('defaultOpen', parseInt(e.target.value) || 0)} className={inputCls} min={-1} placeholder="-1 for none" />
          </div>
          <div>
            <label className={labelCls}>Icon Position</label>
            <select value={props.iconPosition || 'right'} onChange={(e) => updateProp('iconPosition', e.target.value)} className={selectCls}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Header Background</label>
            <div className="flex gap-1">
              <input type="color" value={props.headerBg || '#f3f4f6'} onChange={(e) => updateProp('headerBg', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.headerBg || ''} onChange={(e) => updateProp('headerBg', e.target.value)} className={inputCls} placeholder="#f3f4f6" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Header Text Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.headerColor || '#111827'} onChange={(e) => updateProp('headerColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.headerColor || ''} onChange={(e) => updateProp('headerColor', e.target.value)} className={inputCls} placeholder="#111827" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Border Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.borderColor || '#e5e7eb'} onChange={(e) => updateProp('borderColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.borderColor || ''} onChange={(e) => updateProp('borderColor', e.target.value)} className={inputCls} placeholder="#e5e7eb" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Tabs-specific controls ── */}
      {isTabs && (
        <CollapsibleSection id="tabsProps" title="Tabs">
          <div>
            <label className={labelCls}>Tab Style</label>
            <select value={props.tabStyle || 'default'} onChange={(e) => updateProp('tabStyle', e.target.value)} className={selectCls}>
              <option value="default">Default</option>
              <option value="pills">Pills</option>
              <option value="underline">Underline</option>
              <option value="boxed">Boxed</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tab Alignment</label>
            <div className="flex gap-1">
              {['left', 'center', 'right', 'stretch'].map(v => (
                <button key={v} type="button" onClick={() => updateProp('tabAlign', v)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${(props.tabAlign || 'left') === v ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Active Tab Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.activeColor || '#3b82f6'} onChange={(e) => updateProp('activeColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.activeColor || ''} onChange={(e) => updateProp('activeColor', e.target.value)} className={inputCls} placeholder="#3b82f6" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tab Background</label>
            <div className="flex gap-1">
              <input type="color" value={props.tabBg || '#f9fafb'} onChange={(e) => updateProp('tabBg', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.tabBg || ''} onChange={(e) => updateProp('tabBg', e.target.value)} className={inputCls} placeholder="#f9fafb" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Gallery-specific controls ── */}
      {isGallery && (
        <CollapsibleSection id="galleryProps" title="Gallery">
          <div>
            <label className={labelCls}>
              Columns
              {hasResponsivePropOverride('columns') && (
                <button onClick={() => clearResponsivePropOverride('columns')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <select value={getResponsiveProp('columns', 3)} onChange={(e) => updateResponsiveProp('columns', parseInt(e.target.value))} className={`${selectCls} ${hasResponsivePropOverride('columns') ? 'ring-1 ring-amber-400' : ''}`}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Gap
              {hasResponsivePropOverride('gap') && (
                <button onClick={() => clearResponsivePropOverride('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <input type="text" value={getResponsiveProp('gap', '8px')} onChange={(e) => updateResponsiveProp('gap', e.target.value)} className={`${inputCls} ${hasResponsivePropOverride('gap') ? 'ring-1 ring-amber-400' : ''}`} placeholder="8px" />
          </div>
          <div>
            <label className={labelCls}>Image Fit</label>
            <select value={props.imageFit || 'cover'} onChange={(e) => updateProp('imageFit', e.target.value)} className={selectCls}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Lightbox on Click</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.lightbox !== false} onChange={(e) => updateProp('lightbox', e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-500">{props.lightbox !== false ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Border Radius</label>
            <input type="text" value={props.imageRadius || ''} onChange={(e) => updateProp('imageRadius', e.target.value)} className={inputCls} placeholder="0px" />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Testimonial-specific controls ── */}
      {isTestimonial && (
        <CollapsibleSection id="testimonialProps" title="Testimonial">
          <div>
            <label className={labelCls}>Layout</label>
            <select value={props.layout || 'card'} onChange={(e) => updateProp('layout', e.target.value)} className={selectCls}>
              <option value="card">Card</option>
              <option value="inline">Inline</option>
              <option value="centered">Centered</option>
              <option value="bubble">Speech Bubble</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Show Avatar</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showAvatar !== false} onChange={(e) => updateProp('showAvatar', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Show Stars</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showStars !== false} onChange={(e) => updateProp('showStars', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Star Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.starColor || '#f59e0b'} onChange={(e) => updateProp('starColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.starColor || ''} onChange={(e) => updateProp('starColor', e.target.value)} className={inputCls} placeholder="#f59e0b" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Quote Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.quoteColor || '#e5e7eb'} onChange={(e) => updateProp('quoteColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.quoteColor || ''} onChange={(e) => updateProp('quoteColor', e.target.value)} className={inputCls} placeholder="#e5e7eb" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── PricingBox-specific controls ── */}
      {isPricingBox && (
        <CollapsibleSection id="pricingProps" title="Pricing Box">
          <div>
            <label className={labelCls}>Featured / Highlighted</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!props.featured} onChange={(e) => updateProp('featured', e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-500">{props.featured ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Accent Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.accentColor || '#3b82f6'} onChange={(e) => updateProp('accentColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.accentColor || ''} onChange={(e) => updateProp('accentColor', e.target.value)} className={inputCls} placeholder="#3b82f6" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Currency Symbol</label>
            <input type="text" value={props.currency || 'R'} onChange={(e) => updateProp('currency', e.target.value)} className={inputCls} placeholder="R" />
          </div>
          <div>
            <label className={labelCls}>Period</label>
            <select value={props.period || '/month'} onChange={(e) => updateProp('period', e.target.value)} className={selectCls}>
              <option value="/month">/month</option>
              <option value="/year">/year</option>
              <option value="/week">/week</option>
              <option value="">One-time</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Button Text</label>
            <input type="text" value={props.buttonText || 'Get Started'} onChange={(e) => updateProp('buttonText', e.target.value)} className={inputCls} />
          </div>
        </CollapsibleSection>
      )}

      {/* ── ProgressBar-specific controls ── */}
      {isProgressBar && (
        <CollapsibleSection id="progressProps" title="Progress Bar">
          <div>
            <label className={labelCls}>Value (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" value={props.value || 50} onChange={(e) => updateProp('value', parseInt(e.target.value))} className="flex-1" />
              <span className="text-xs text-gray-500 w-8 text-right">{props.value || 50}%</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Bar Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.barColor || '#3b82f6'} onChange={(e) => updateProp('barColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.barColor || ''} onChange={(e) => updateProp('barColor', e.target.value)} className={inputCls} placeholder="#3b82f6" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Track Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.trackColor || '#e5e7eb'} onChange={(e) => updateProp('trackColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.trackColor || ''} onChange={(e) => updateProp('trackColor', e.target.value)} className={inputCls} placeholder="#e5e7eb" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Height</label>
            <input type="text" value={props.barHeight || '8px'} onChange={(e) => updateProp('barHeight', e.target.value)} className={inputCls} placeholder="8px" />
          </div>
          <div>
            <label className={labelCls}>Show Label</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showLabel !== false} onChange={(e) => updateProp('showLabel', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Animate</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.animate !== false} onChange={(e) => updateProp('animate', e.target.checked)} className="rounded" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Countdown-specific controls ── */}
      {isCountdown && (
        <CollapsibleSection id="countdownProps" title="Countdown">
          <div>
            <label className={labelCls}>Target Date</label>
            <input type="datetime-local" value={props.targetDate || ''} onChange={(e) => updateProp('targetDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Layout</label>
            <select value={props.layout || 'inline'} onChange={(e) => updateProp('layout', e.target.value)} className={selectCls}>
              <option value="inline">Inline</option>
              <option value="stacked">Stacked</option>
              <option value="circles">Circles</option>
              <option value="flip">Flip Cards</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Show Labels</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showLabels !== false} onChange={(e) => updateProp('showLabels', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Number Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.numberColor || '#111827'} onChange={(e) => updateProp('numberColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.numberColor || ''} onChange={(e) => updateProp('numberColor', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Label Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.labelColor || '#6b7280'} onChange={(e) => updateProp('labelColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.labelColor || ''} onChange={(e) => updateProp('labelColor', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Separator</label>
            <input type="text" value={props.separator || ':'} onChange={(e) => updateProp('separator', e.target.value)} className={inputCls} placeholder=":" />
          </div>
          <div>
            <label className={labelCls}>Expired Message</label>
            <input type="text" value={props.expiredMessage || 'Expired!'} onChange={(e) => updateProp('expiredMessage', e.target.value)} className={inputCls} />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Counter-specific controls ── */}
      {isCounter && (
        <CollapsibleSection id="counterProps" title="Counter">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Start Value</label>
              <input type="number" value={props.startValue || 0} onChange={(e) => updateProp('startValue', parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Value</label>
              <input type="number" value={props.endValue || 100} onChange={(e) => updateProp('endValue', parseInt(e.target.value) || 100)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Duration (ms)</label>
              <input type="number" value={props.duration || 2000} onChange={(e) => updateProp('duration', parseInt(e.target.value) || 2000)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Decimal Places</label>
              <input type="number" value={props.decimals || 0} onChange={(e) => updateProp('decimals', parseInt(e.target.value) || 0)} className={inputCls} min={0} max={4} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Prefix</label>
            <input type="text" value={props.prefix || ''} onChange={(e) => updateProp('prefix', e.target.value)} className={inputCls} placeholder="e.g. R" />
          </div>
          <div>
            <label className={labelCls}>Suffix</label>
            <input type="text" value={props.suffix || ''} onChange={(e) => updateProp('suffix', e.target.value)} className={inputCls} placeholder="e.g. +" />
          </div>
          <div>
            <label className={labelCls}>Thousand Separator</label>
            <input type="text" value={props.separator ?? ','} onChange={(e) => updateProp('separator', e.target.value)} className={inputCls} placeholder="," />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Slider/Carousel-specific controls ── */}
      {isSlider && (
        <CollapsibleSection id="sliderProps" title="Slider / Carousel">
          <div>
            <label className={labelCls}>Autoplay</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!props.autoplay} onChange={(e) => updateProp('autoplay', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Autoplay Speed (ms)</label>
            <input type="number" value={props.autoplaySpeed || 3000} onChange={(e) => updateProp('autoplaySpeed', parseInt(e.target.value) || 3000)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Loop</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.loop !== false} onChange={(e) => updateProp('loop', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Show Arrows</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showArrows !== false} onChange={(e) => updateProp('showArrows', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Show Dots</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showDots !== false} onChange={(e) => updateProp('showDots', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              Slides Per View
              {hasResponsivePropOverride('slidesPerView') && (
                <button onClick={() => clearResponsivePropOverride('slidesPerView')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <input type="number" value={getResponsiveProp('slidesPerView', 1)} onChange={(e) => updateResponsiveProp('slidesPerView', parseInt(e.target.value) || 1)} className={`${inputCls} ${hasResponsivePropOverride('slidesPerView') ? 'ring-1 ring-amber-400' : ''}`} min={1} max={6} />
          </div>
          <div>
            <label className={labelCls}>Transition Effect</label>
            <select value={props.effect || 'slide'} onChange={(e) => updateProp('effect', e.target.value)} className={selectCls}>
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
              <option value="cube">Cube</option>
              <option value="flip">Flip</option>
            </select>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Modal/OffCanvas-specific controls ── */}
      {isModal && (
        <CollapsibleSection id="modalProps" title="Modal / Overlay">
          <div>
            <label className={labelCls}>Trigger Text</label>
            <input type="text" value={props.triggerText || 'Open'} onChange={(e) => updateProp('triggerText', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <select value={props.position || 'center'} onChange={(e) => updateProp('position', e.target.value)} className={selectCls}>
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left (Slide)</option>
              <option value="right">Right (Slide)</option>
              <option value="fullscreen">Fullscreen</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Overlay Color</label>
            <input type="text" value={props.overlayColor || 'rgba(0,0,0,0.5)'} onChange={(e) => updateProp('overlayColor', e.target.value)} className={inputCls} placeholder="rgba(0,0,0,0.5)" />
          </div>
          <div>
            <label className={labelCls}>Close on Overlay Click</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.closeOnOverlay !== false} onChange={(e) => updateProp('closeOnOverlay', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Show Close Button</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={props.showClose !== false} onChange={(e) => updateProp('showClose', e.target.checked)} className="rounded" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Animation</label>
            <select value={props.animation || 'fade'} onChange={(e) => updateProp('animation', e.target.value)} className={selectCls}>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="scale">Scale</option>
              <option value="none">None</option>
            </select>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Map-specific controls ── */}
      {isMap && (
        <CollapsibleSection id="mapProps" title="Map">
          <div>
            <label className={labelCls}>Address / Location</label>
            <input type="text" value={props.address || ''} onChange={(e) => updateProp('address', e.target.value)} className={inputCls} placeholder="123 Main St, City" />
          </div>
          <div>
            <label className={labelCls}>Zoom Level</label>
            <div className="flex items-center gap-2">
              <input type="range" min="1" max="20" value={props.zoom || 14} onChange={(e) => updateProp('zoom', parseInt(e.target.value))} className="flex-1" />
              <span className="text-xs text-gray-500 w-6 text-right">{props.zoom || 14}</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Map Height</label>
            <input type="text" value={props.mapHeight || '400px'} onChange={(e) => updateProp('mapHeight', e.target.value)} className={inputCls} placeholder="400px" />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Toggle-specific controls ── */}
      {isToggle && (
        <CollapsibleSection id="toggleProps" title="Toggle">
          <div>
            <label className={labelCls}>Default State</label>
            <select value={props.defaultOpen ? 'open' : 'closed'} onChange={(e) => updateProp('defaultOpen', e.target.value === 'open')} className={selectCls}>
              <option value="closed">Closed</option>
              <option value="open">Open</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Toggle Icon</label>
            <select value={props.toggleIcon || 'chevron'} onChange={(e) => updateProp('toggleIcon', e.target.value)} className={selectCls}>
              <option value="chevron">Chevron</option>
              <option value="plus">Plus/Minus</option>
              <option value="arrow">Arrow</option>
              <option value="none">None</option>
            </select>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Form-specific controls ── */}
      {isForm && (
        <CollapsibleSection id="formProps" title="Form">
          <div>
            <label className={labelCls}>Placeholder Text</label>
            <input type="text" value={props.placeholder || ''} onChange={(e) => updateProp('placeholder', e.target.value)} className={inputCls} placeholder="Search..." />
          </div>
          <div>
            <label className={labelCls}>Button Text</label>
            <input type="text" value={props.buttonText || 'Submit'} onChange={(e) => updateProp('buttonText', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Input Background</label>
            <div className="flex gap-1">
              <input type="color" value={props.inputBg || '#ffffff'} onChange={(e) => updateProp('inputBg', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.inputBg || ''} onChange={(e) => updateProp('inputBg', e.target.value)} className={inputCls} placeholder="#ffffff" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Input Border Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.inputBorderColor || '#d1d5db'} onChange={(e) => updateProp('inputBorderColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.inputBorderColor || ''} onChange={(e) => updateProp('inputBorderColor', e.target.value)} className={inputCls} placeholder="#d1d5db" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Input Border Radius</label>
            <input type="text" value={props.inputRadius || '6px'} onChange={(e) => updateProp('inputRadius', e.target.value)} className={inputCls} placeholder="6px" />
          </div>
        </CollapsibleSection>
      )}

      {/* ── ShapeDivider-specific controls ── */}
      {isShapeDivider && (
        <CollapsibleSection id="shapeDividerProps" title="Shape Divider">
          <div>
            <label className={labelCls}>Shape</label>
            <select value={props.shape || 'wave'} onChange={(e) => updateProp('shape', e.target.value)} className={selectCls}>
              <option value="wave">Wave</option>
              <option value="triangle">Triangle</option>
              <option value="curve">Curve</option>
              <option value="zigzag">Zigzag</option>
              <option value="arrow">Arrow</option>
              <option value="tilt">Tilt</option>
              <option value="mountains">Mountains</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <select value={props.dividerPosition || 'bottom'} onChange={(e) => updateProp('dividerPosition', e.target.value)} className={selectCls}>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex gap-1">
              <input type="color" value={props.dividerColor || '#ffffff'} onChange={(e) => updateProp('dividerColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props.dividerColor || ''} onChange={(e) => updateProp('dividerColor', e.target.value)} className={inputCls} placeholder="#ffffff" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Height</label>
            <input type="text" value={props.dividerHeight || '80px'} onChange={(e) => updateProp('dividerHeight', e.target.value)} className={inputCls} placeholder="80px" />
          </div>
          <div>
            <label className={labelCls}>Flip</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!props.flip} onChange={(e) => updateProp('flip', e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-500">Mirror horizontally</span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Repeater-specific quick controls ── */}
      {isRepeater && (
        <CollapsibleSection id="repeaterQuick" title="Repeater Quick Settings">
          <div>
            <label className={labelCls}>
              Columns
              {hasResponsivePropOverride('columns') && (
                <button onClick={() => clearResponsivePropOverride('columns')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <select value={getResponsiveProp('columns', 4)} onChange={(e) => updateResponsiveProp('columns', parseInt(e.target.value))} className={`${selectCls} ${hasResponsivePropOverride('columns') ? 'ring-1 ring-amber-400' : ''}`}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Gap
              {hasResponsivePropOverride('gap') && (
                <button onClick={() => clearResponsivePropOverride('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <input type="text" value={getResponsiveProp('gap', '16px')} onChange={(e) => updateResponsiveProp('gap', e.target.value)} className={`${inputCls} ${hasResponsivePropOverride('gap') ? 'ring-1 ring-amber-400' : ''}`} placeholder="16px" />
          </div>
          <div>
            <label className={labelCls}>Limit</label>
            <input type="number" value={props.limit || 8} onChange={(e) => updateProp('limit', parseInt(e.target.value) || 8)} className={inputCls} min={1} max={50} />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Grid element columns/gap (ProductGrid, EasyPosts, ArchiveProducts, etc.) ── */}
      {isGridElement && (
        <CollapsibleSection id="gridElementProps" title="Grid Layout">
          <div>
            <label className={labelCls}>
              Columns
              {hasResponsivePropOverride('columns') && (
                <button onClick={() => clearResponsivePropOverride('columns')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <select value={getResponsiveProp('columns', 3)} onChange={(e) => updateResponsiveProp('columns', parseInt(e.target.value))} className={`${selectCls} ${hasResponsivePropOverride('columns') ? 'ring-1 ring-amber-400' : ''}`}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Gap
              {hasResponsivePropOverride('gap') && (
                <button onClick={() => clearResponsivePropOverride('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <input type="text" value={getResponsiveProp('gap', '16px')} onChange={(e) => updateResponsiveProp('gap', e.target.value)} className={`${inputCls} ${hasResponsivePropOverride('gap') ? 'ring-1 ring-amber-400' : ''}`} placeholder="16px" />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Generic content for elements that have content but aren't specifically handled ── */}
      {hasContentProp && !isHeading && !isText && (
        <CollapsibleSection id="content" title="Content">
          <textarea value={content} onChange={(e) => updateProp('content', e.target.value)} className={inputCls} placeholder="Enter content" rows={3} />
        </CollapsibleSection>
      )}

      {/* ── Generic text prop for non-button elements that have a text prop ── */}
      {hasTextProp && !isButton && (
        <CollapsibleSection id="textProp" title="Text">
          <input type="text" value={props.text || ''} onChange={(e) => updateProp('text', e.target.value)} className={inputCls} placeholder="Enter text" />
        </CollapsibleSection>
      )}

      {/* ── Generic prop editor for any remaining custom props ── */}
      {(() => {
        const skipProps = ['content', 'className', 'customCSS', 'style', 'level', 'dynamicBindings',
          'src', 'alt', 'width', 'height', 'text', 'link', 'url', 'target', 'size', 'variant',
          'icon', 'title', 'description', 'iconSize', 'iconColor', 'layout',
          'autoplay', 'controls', 'loop', 'muted', 'children',
          'columns', 'columnWidths', 'gap', 'stackOn',
          'hoverStyles', 'focusStyles', 'elementId',
          'allowMultiple', 'defaultOpen', 'iconPosition', 'headerBg', 'headerColor', 'borderColor',
          'tabStyle', 'tabAlign', 'activeColor', 'tabBg',
          'imageFit', 'lightbox', 'imageRadius',
          'showAvatar', 'showStars', 'starColor', 'quoteColor',
          'featured', 'accentColor', 'currency', 'period', 'buttonText',
          'value', 'barColor', 'trackColor', 'barHeight', 'showLabel', 'animate',
          'targetDate', 'showLabels', 'numberColor', 'labelColor', 'separator', 'expiredMessage',
          'startValue', 'endValue', 'duration', 'decimals', 'prefix', 'suffix',
          'autoplaySpeed', 'showArrows', 'showDots', 'slidesPerView', 'effect',
          'triggerText', 'position', 'overlayColor', 'closeOnOverlay', 'showClose', 'animation',
          'address', 'zoom', 'mapHeight',
          'toggleIcon', 'placeholder', 'inputBg', 'inputBorderColor', 'inputRadius',
          'shape', 'dividerPosition', 'dividerColor', 'dividerHeight', 'flip',
          'dataSource', 'sourceFilter', 'categoryId', 'sortBy', 'sortOrder', 'limit',
          'responsiveProps'];
        const customProps = Object.entries(props).filter(([k, v]) =>
          !skipProps.includes(k) && typeof v !== 'object' && typeof v !== 'function'
        );
        if (customProps.length === 0) return null;
        return (
          <CollapsibleSection id="elementProps" title="Element Properties" defaultOpen={false}>
            {customProps.map(([key, value]) => (
              <div key={key}>
                <label className={labelCls}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                {typeof value === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={value} onChange={(e) => updateProp(key, e.target.checked)} className="rounded" />
                    <span className="text-xs text-gray-500">{value ? 'Enabled' : 'Disabled'}</span>
                  </div>
                ) : typeof value === 'number' ? (
                  <input type="number" value={value} onChange={(e) => updateProp(key, Number(e.target.value))} className={inputCls} />
                ) : (
                  <input type="text" value={String(value)} onChange={(e) => updateProp(key, e.target.value)} className={inputCls} />
                )}
              </div>
            ))}
          </CollapsibleSection>
        );
      })()}

      <CollapsibleSection id="display" title="Display">
        <div>
          <label className={labelCls}>Display</label>
          <select value={s.display || 'block'} onChange={(e) => updateStyle('display', e.target.value)} className={selectCls}>
            <option value="block">Block</option>
            <option value="inline">Inline</option>
            <option value="inline-block">Inline Block</option>
            <option value="flex">Flex</option>
            <option value="inline-flex">Inline Flex</option>
            <option value="grid">Grid</option>
            <option value="inline-grid">Inline Grid</option>
            <option value="none">None</option>
          </select>
        </div>
        {(s.display === 'flex' || s.display === 'inline-flex') && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Direction</label>
                <select value={s.flexDirection || 'row'} onChange={(e) => updateStyle('flexDirection', e.target.value)} className={selectCls}>
                  <option value="row">Row</option>
                  <option value="row-reverse">Row Reverse</option>
                  <option value="column">Column</option>
                  <option value="column-reverse">Column Reverse</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Wrap</label>
                <select value={s.flexWrap || 'nowrap'} onChange={(e) => updateStyle('flexWrap', e.target.value)} className={selectCls}>
                  <option value="nowrap">No Wrap</option>
                  <option value="wrap">Wrap</option>
                  <option value="wrap-reverse">Wrap Reverse</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Justify Content</label>
                <select value={s.justifyContent || 'flex-start'} onChange={(e) => updateStyle('justifyContent', e.target.value)} className={selectCls}>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                  <option value="space-evenly">Space Evenly</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Align Items</label>
                <select value={s.alignItems || 'stretch'} onChange={(e) => updateStyle('alignItems', e.target.value)} className={selectCls}>
                  <option value="stretch">Stretch</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="baseline">Baseline</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Gap</label>
              <input type="text" value={s.gap || ''} onChange={(e) => updateStyle('gap', e.target.value)} className={inputCls} placeholder="0px" />
            </div>
            <div>
              <label className={labelCls}>Align Content</label>
              <select value={s.alignContent || ''} onChange={(e) => updateStyle('alignContent', e.target.value)} className={selectCls}>
                <option value="">Default</option>
                <option value="flex-start">Start</option>
                <option value="center">Center</option>
                <option value="flex-end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
          </>
        )}
        {(s.display === 'grid' || s.display === 'inline-grid') && (
          <>
            <div>
              <label className={labelCls}>Grid Template Columns</label>
              <input type="text" value={s.gridTemplateColumns || ''} onChange={(e) => updateStyle('gridTemplateColumns', e.target.value)} className={inputCls} placeholder="repeat(3, 1fr)" />
              <div className="flex flex-wrap gap-1 mt-1">
                {[
                  { label: '2 cols', val: 'repeat(2, 1fr)' },
                  { label: '3 cols', val: 'repeat(3, 1fr)' },
                  { label: '4 cols', val: 'repeat(4, 1fr)' },
                  { label: 'Auto-fill', val: 'repeat(auto-fill, minmax(250px, 1fr))' },
                  { label: 'Auto-fit', val: 'repeat(auto-fit, minmax(250px, 1fr))' },
                ].map(p => (
                  <button key={p.label} type="button" onClick={() => updateStyle('gridTemplateColumns', p.val)}
                    className={`px-2 py-0.5 text-[10px] rounded border ${s.gridTemplateColumns === p.val ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{p.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Grid Template Rows</label>
              <input type="text" value={s.gridTemplateRows || ''} onChange={(e) => updateStyle('gridTemplateRows', e.target.value)} className={inputCls} placeholder="auto" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Column Gap</label>
                <input type="text" value={s.columnGap || s.gap || ''} onChange={(e) => updateStyle('columnGap', e.target.value)} className={inputCls} placeholder="16px" />
              </div>
              <div>
                <label className={labelCls}>Row Gap</label>
                <input type="text" value={s.rowGap || s.gap || ''} onChange={(e) => updateStyle('rowGap', e.target.value)} className={inputCls} placeholder="16px" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Justify Items</label>
                <select value={s.justifyItems || ''} onChange={(e) => updateStyle('justifyItems', e.target.value)} className={selectCls}>
                  <option value="">Default</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Align Items</label>
                <select value={s.alignItems || ''} onChange={(e) => updateStyle('alignItems', e.target.value)} className={selectCls}>
                  <option value="">Default</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection id="flexChild" title="Flex/Grid Child" defaultOpen={false}>
        <p className="text-[10px] text-gray-400 mb-2">Controls for this element when inside a flex or grid parent.</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>Flex Grow</label>
            <input type="number" value={s.flexGrow ?? ''} onChange={(e) => updateStyle('flexGrow', e.target.value)} className={inputCls} placeholder="0" min="0" />
          </div>
          <div>
            <label className={labelCls}>Flex Shrink</label>
            <input type="number" value={s.flexShrink ?? ''} onChange={(e) => updateStyle('flexShrink', e.target.value)} className={inputCls} placeholder="1" min="0" />
          </div>
          <div>
            <label className={labelCls}>Flex Basis</label>
            <input type="text" value={s.flexBasis || ''} onChange={(e) => updateStyle('flexBasis', e.target.value)} className={inputCls} placeholder="auto" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Align Self</label>
            <select value={s.alignSelf || ''} onChange={(e) => updateStyle('alignSelf', e.target.value)} className={selectCls}>
              <option value="">Auto</option>
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="stretch">Stretch</option>
              <option value="baseline">Baseline</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Justify Self</label>
            <select value={s.justifySelf || ''} onChange={(e) => updateStyle('justifySelf', e.target.value)} className={selectCls}>
              <option value="">Auto</option>
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Order</label>
          <input type="number" value={s.order ?? ''} onChange={(e) => updateStyle('order', e.target.value)} className={inputCls} placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Grid Column</label>
            <input type="text" value={s.gridColumn || ''} onChange={(e) => updateStyle('gridColumn', e.target.value)} className={inputCls} placeholder="span 2" />
          </div>
          <div>
            <label className={labelCls}>Grid Row</label>
            <input type="text" value={s.gridRow || ''} onChange={(e) => updateStyle('gridRow', e.target.value)} className={inputCls} placeholder="span 1" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="dimensions" title="Size & Dimensions">
        {/* Width Presets */}
        <div>
          <label className={labelCls}>Width Preset</label>
          <div className="flex gap-1 mb-2">
            {[
              { label: 'Full', value: '100%' },
              { label: 'Boxed', value: '1200px', extra: { maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' } },
              { label: 'Auto', value: 'auto' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  updateStyle('width', preset.value);
                  if (preset.extra) {
                    Object.entries(preset.extra).forEach(([k, v]) => updateStyle(k, v));
                  }
                }}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                  s.width === preset.value
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        {/* Width */}
        <div>
          <label className={labelCls}>Width</label>
          <div className="flex gap-1">
            <input type="text" value={s.width || ''} onChange={(e) => updateStyle('width', e.target.value)} className={inputCls + ' flex-1'} placeholder="auto" />
            <div className="flex rounded border border-gray-300 overflow-hidden">
              {['px', '%', 'vw'].map((u) => (
                <button key={u} onClick={() => {
                  const num = parseFloat(s.width) || 100;
                  updateStyle('width', `${num}${u}`);
                }} className={`px-2 py-1 text-xs ${String(s.width || '').endsWith(u) ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>{u}</button>
              ))}
            </div>
          </div>
        </div>
        {/* Height */}
        <div>
          <label className={labelCls}>Height</label>
          <div className="flex gap-1">
            <input type="text" value={s.height || ''} onChange={(e) => updateStyle('height', e.target.value)} className={inputCls + ' flex-1'} placeholder="auto" />
            <div className="flex rounded border border-gray-300 overflow-hidden">
              {['px', '%', 'vh'].map((u) => (
                <button key={u} onClick={() => {
                  const num = parseFloat(s.height) || 100;
                  updateStyle('height', `${num}${u}`);
                }} className={`px-2 py-1 text-xs ${String(s.height || '').endsWith(u) ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>{u}</button>
              ))}
            </div>
          </div>
        </div>
        {/* Min / Max */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Min Width</label>
            <input type="text" value={s.minWidth || ''} onChange={(e) => updateStyle('minWidth', e.target.value)} className={inputCls} placeholder="none" />
          </div>
          <div>
            <label className={labelCls}>Max Width</label>
            <input type="text" value={s.maxWidth || ''} onChange={(e) => updateStyle('maxWidth', e.target.value)} className={inputCls} placeholder="none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Min Height</label>
            <input type="text" value={s.minHeight || ''} onChange={(e) => updateStyle('minHeight', e.target.value)} className={inputCls} placeholder="none" />
          </div>
          <div>
            <label className={labelCls}>Max Height</label>
            <input type="text" value={s.maxHeight || ''} onChange={(e) => updateStyle('maxHeight', e.target.value)} className={inputCls} placeholder="none" />
          </div>
        </div>
        {/* Overflow */}
        <div>
          <label className={labelCls}>Overflow</label>
          <select value={s.overflow || 'visible'} onChange={(e) => updateStyle('overflow', e.target.value)} className={selectCls}>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="scroll">Scroll</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        {/* Box Sizing */}
        <div>
          <label className={labelCls}>Box Sizing</label>
          <select value={s.boxSizing || 'border-box'} onChange={(e) => updateStyle('boxSizing', e.target.value)} className={selectCls}>
            <option value="border-box">Border Box</option>
            <option value="content-box">Content Box</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="spacing" title="Spacing">
        <div>
          <label className={labelCls}>Margin</label>
          <div className="grid grid-cols-4 gap-1">
            <input type="text" value={s.marginTop || ''} onChange={(e) => updateStyle('marginTop', e.target.value)} className={inputCls} placeholder="T" title="Margin Top" />
            <input type="text" value={s.marginRight || ''} onChange={(e) => updateStyle('marginRight', e.target.value)} className={inputCls} placeholder="R" title="Margin Right" />
            <input type="text" value={s.marginBottom || ''} onChange={(e) => updateStyle('marginBottom', e.target.value)} className={inputCls} placeholder="B" title="Margin Bottom" />
            <input type="text" value={s.marginLeft || ''} onChange={(e) => updateStyle('marginLeft', e.target.value)} className={inputCls} placeholder="L" title="Margin Left" />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Top / Right / Bottom / Left — or use shorthand below</p>
          <input type="text" value={s.margin || ''} onChange={(e) => updateStyle('margin', e.target.value)} className={inputCls + ' mt-1'} placeholder="e.g. 10px 20px" />
        </div>
        <div>
          <label className={labelCls}>Padding</label>
          <div className="grid grid-cols-4 gap-1">
            <input type="text" value={s.paddingTop || ''} onChange={(e) => updateStyle('paddingTop', e.target.value)} className={inputCls} placeholder="T" title="Padding Top" />
            <input type="text" value={s.paddingRight || ''} onChange={(e) => updateStyle('paddingRight', e.target.value)} className={inputCls} placeholder="R" title="Padding Right" />
            <input type="text" value={s.paddingBottom || ''} onChange={(e) => updateStyle('paddingBottom', e.target.value)} className={inputCls} placeholder="B" title="Padding Bottom" />
            <input type="text" value={s.paddingLeft || ''} onChange={(e) => updateStyle('paddingLeft', e.target.value)} className={inputCls} placeholder="L" title="Padding Left" />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Top / Right / Bottom / Left — or use shorthand below</p>
          <input type="text" value={s.padding || ''} onChange={(e) => updateStyle('padding', e.target.value)} className={inputCls + ' mt-1'} placeholder="e.g. 10px 20px" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="background" title="Background">
        <div>
          <label className={labelCls}>Background Color</label>
          <div className="flex gap-2">
            <input type="color" value={s.backgroundColor || '#ffffff'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className="w-10 h-9 border border-gray-300 rounded cursor-pointer" />
            <input type="text" value={s.backgroundColor || ''} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className={inputCls} placeholder="transparent" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {['transparent', '#ffffff', '#000000', '#f3f4f6', '#1f2937', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b'].map(c => (
              <button key={c} type="button" onClick={() => updateStyle('backgroundColor', c)}
                className={`w-6 h-6 rounded border ${s.backgroundColor === c ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-300'}`}
                style={{ backgroundColor: c === 'transparent' ? '#fff' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }}
                title={c} />
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Gradient</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { label: 'None', val: '' },
              { label: '→', val: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' },
              { label: '↓', val: 'linear-gradient(180deg, #3b82f6, #8b5cf6)' },
              { label: '↘', val: 'linear-gradient(135deg, #667eea, #764ba2)' },
              { label: 'Sunset', val: 'linear-gradient(135deg, #f093fb, #f5576c)' },
              { label: 'Ocean', val: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
              { label: 'Forest', val: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
              { label: 'Fire', val: 'linear-gradient(135deg, #f83600, #f9d423)' },
              { label: 'Night', val: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)' },
              { label: 'Radial', val: 'radial-gradient(circle, #3b82f6, #1e3a5f)' },
            ].map(g => (
              <button key={g.label} type="button" onClick={() => updateStyle('backgroundImage', g.val)}
                className={`px-2 py-1 text-[10px] rounded border transition-colors ${(s.backgroundImage || '') === g.val ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                style={g.val ? { background: g.val, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' } : {}}
              >{g.label}</button>
            ))}
          </div>
          <input type="text" value={s.backgroundImage || ''} onChange={(e) => updateStyle('backgroundImage', e.target.value)} className={inputCls} placeholder="linear-gradient(...) or url(...)" />
        </div>
        <div>
          <label className={labelCls}>Background Image URL</label>
          <input type="text" value={(() => { const v = s.backgroundImage || ''; const m = v.match(/url\(['"]?([^'")\s]+)['"]?\)/); return m ? m[1] : ''; })()} onChange={(e) => { const url = e.target.value; updateStyle('backgroundImage', url ? `url('${url}')` : ''); }} className={inputCls} placeholder="https://example.com/image.jpg" />
          <MediaLibraryButton onSelect={(url) => updateStyle('backgroundImage', `url('${url}')`)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Background Size</label>
            <select value={s.backgroundSize || ''} onChange={(e) => updateStyle('backgroundSize', e.target.value)} className={selectCls}>
              <option value="">Default</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="auto">Auto</option>
              <option value="100% 100%">Stretch</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Background Position</label>
            <select value={s.backgroundPosition || ''} onChange={(e) => updateStyle('backgroundPosition', e.target.value)} className={selectCls}>
              <option value="">Default</option>
              <option value="center center">Center</option>
              <option value="top center">Top</option>
              <option value="bottom center">Bottom</option>
              <option value="left center">Left</option>
              <option value="right center">Right</option>
              <option value="top left">Top Left</option>
              <option value="top right">Top Right</option>
              <option value="bottom left">Bottom Left</option>
              <option value="bottom right">Bottom Right</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Background Repeat</label>
            <select value={s.backgroundRepeat || ''} onChange={(e) => updateStyle('backgroundRepeat', e.target.value)} className={selectCls}>
              <option value="">Default</option>
              <option value="no-repeat">No Repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Background Attachment</label>
            <select value={s.backgroundAttachment || ''} onChange={(e) => updateStyle('backgroundAttachment', e.target.value)} className={selectCls}>
              <option value="">Default</option>
              <option value="scroll">Scroll</option>
              <option value="fixed">Fixed (Parallax)</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Background Blend Mode</label>
          <select value={s.backgroundBlendMode || ''} onChange={(e) => updateStyle('backgroundBlendMode', e.target.value)} className={selectCls}>
            <option value="">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
            <option value="soft-light">Soft Light</option>
            <option value="hard-light">Hard Light</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="borders" title="Borders" defaultOpen={false}>
        <div>
          <label className={labelCls}>Border Style</label>
          <select value={s.borderStyle || 'none'} onChange={(e) => updateStyle('borderStyle', e.target.value)} className={selectCls}>
            <option value="none">None</option>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
            <option value="groove">Groove</option>
            <option value="ridge">Ridge</option>
            <option value="inset">Inset</option>
            <option value="outset">Outset</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Border Width</label>
            <input type="text" value={s.borderWidth || ''} onChange={(e) => updateStyle('borderWidth', e.target.value)} className={inputCls} placeholder="0px" />
          </div>
          <div>
            <label className={labelCls}>Border Color</label>
            <div className="flex gap-1">
              <input type="color" value={s.borderColor || '#000000'} onChange={(e) => updateStyle('borderColor', e.target.value)} className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={s.borderColor || ''} onChange={(e) => updateStyle('borderColor', e.target.value)} className={inputCls} placeholder="#000" />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Per-Side Border Width</label>
          <div className="grid grid-cols-4 gap-1">
            <input type="text" value={s.borderTopWidth || ''} onChange={(e) => updateStyle('borderTopWidth', e.target.value)} className={inputCls} placeholder="T" title="Top" />
            <input type="text" value={s.borderRightWidth || ''} onChange={(e) => updateStyle('borderRightWidth', e.target.value)} className={inputCls} placeholder="R" title="Right" />
            <input type="text" value={s.borderBottomWidth || ''} onChange={(e) => updateStyle('borderBottomWidth', e.target.value)} className={inputCls} placeholder="B" title="Bottom" />
            <input type="text" value={s.borderLeftWidth || ''} onChange={(e) => updateStyle('borderLeftWidth', e.target.value)} className={inputCls} placeholder="L" title="Left" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Border Radius</label>
          <input type="text" value={s.borderRadius || ''} onChange={(e) => updateStyle('borderRadius', e.target.value)} className={inputCls} placeholder="0px" />
        </div>
        <div>
          <label className={labelCls}>Per-Corner Radius</label>
          <div className="grid grid-cols-4 gap-1">
            <input type="text" value={s.borderTopLeftRadius || ''} onChange={(e) => updateStyle('borderTopLeftRadius', e.target.value)} className={inputCls} placeholder="TL" title="Top Left" />
            <input type="text" value={s.borderTopRightRadius || ''} onChange={(e) => updateStyle('borderTopRightRadius', e.target.value)} className={inputCls} placeholder="TR" title="Top Right" />
            <input type="text" value={s.borderBottomRightRadius || ''} onChange={(e) => updateStyle('borderBottomRightRadius', e.target.value)} className={inputCls} placeholder="BR" title="Bottom Right" />
            <input type="text" value={s.borderBottomLeftRadius || ''} onChange={(e) => updateStyle('borderBottomLeftRadius', e.target.value)} className={inputCls} placeholder="BL" title="Bottom Left" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="shadow" title="Box Shadow" defaultOpen={false}>
        <div>
          <label className={labelCls}>Box Shadow</label>
          <input type="text" value={s.boxShadow || ''} onChange={(e) => updateStyle('boxShadow', e.target.value)} className={inputCls} placeholder="0px 4px 6px rgba(0,0,0,0.1)" />
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'SM', val: '0 1px 2px 0 rgba(0,0,0,0.05)' },
              { label: 'MD', val: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
              { label: 'LG', val: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' },
              { label: 'XL', val: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' },
              { label: 'None', val: 'none' },
            ].map(preset => (
              <button key={preset.label} type="button" onClick={() => updateStyle('boxShadow', preset.val)}
                className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 rounded border border-gray-200"
              >{preset.label}</button>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="badge" title="Badge Text" defaultOpen={false}>
        {/* Enable toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!(s.badge?.enabled)}
            onChange={(e) => {
              setProp((p) => {
                if (!p.style) p.style = {};
                if (!p.style.badge) p.style.badge = {};
                p.style.badge.enabled = e.target.checked;
                if (e.target.checked && !p.style.badge.text) p.style.badge.text = 'Sale';
              });
            }}
            className="rounded"
          />
          <label className="text-xs text-gray-600">Show Badge</label>
        </div>

        {s.badge?.enabled && (() => {
          const b = s.badge || {};
          const updateBadge = (key, value) => {
            setProp((p) => {
              if (!p.style) p.style = {};
              if (!p.style.badge) p.style.badge = {};
              p.style.badge[key] = value;
            });
          };
          return (
            <>
              {/* Badge Text */}
              <div>
                <label className={labelCls}>Badge Text</label>
                <input type="text" value={b.text || ''} onChange={(e) => updateBadge('text', e.target.value)} className={inputCls} placeholder="Sale" />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Sale', 'New', 'Hot', 'Best Seller', 'Limited', 'Free Shipping', '-20%', 'Sold Out'].map(preset => (
                    <button key={preset} type="button" onClick={() => updateBadge('text', preset)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${b.text === preset ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>{preset}</button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className={labelCls}>Position</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'top-left', label: '↖ Top Left' },
                    { value: 'top-center', label: '↑ Top Center' },
                    { value: 'top-right', label: '↗ Top Right' },
                    { value: 'middle-left', label: '← Mid Left' },
                    { value: 'middle-right', label: '→ Mid Right', colStart: 3 },
                    { value: 'bottom-left', label: '↙ Btm Left' },
                    { value: 'bottom-center', label: '↓ Btm Center' },
                    { value: 'bottom-right', label: '↘ Btm Right' },
                  ].map(pos => (
                    <button key={pos.value} type="button" onClick={() => updateBadge('position', pos.value)}
                      className={`px-1 py-1.5 text-[10px] font-medium rounded border transition-colors ${
                        (b.position || 'top-right') === pos.value ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={pos.colStart ? { gridColumn: pos.colStart } : undefined}
                    >{pos.label}</button>
                  ))}
                </div>
              </div>

              {/* Margin (4-sided) */}
              <div>
                <label className={labelCls}>Badge Margin (offset from edge)</label>
                <div className="grid grid-cols-4 gap-1">
                  <input type="text" value={b.marginTop || ''} onChange={(e) => updateBadge('marginTop', e.target.value)} className={inputCls} placeholder="T" title="Margin Top" />
                  <input type="text" value={b.marginRight || ''} onChange={(e) => updateBadge('marginRight', e.target.value)} className={inputCls} placeholder="R" title="Margin Right" />
                  <input type="text" value={b.marginBottom || ''} onChange={(e) => updateBadge('marginBottom', e.target.value)} className={inputCls} placeholder="B" title="Margin Bottom" />
                  <input type="text" value={b.marginLeft || ''} onChange={(e) => updateBadge('marginLeft', e.target.value)} className={inputCls} placeholder="L" title="Margin Left" />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Top / Right / Bottom / Left</p>
              </div>

              {/* Padding (4-sided) */}
              <div>
                <label className={labelCls}>Badge Padding (inner spacing)</label>
                <div className="grid grid-cols-4 gap-1">
                  <input type="text" value={b.paddingTop || ''} onChange={(e) => updateBadge('paddingTop', e.target.value)} className={inputCls} placeholder="T" title="Padding Top" />
                  <input type="text" value={b.paddingRight || ''} onChange={(e) => updateBadge('paddingRight', e.target.value)} className={inputCls} placeholder="R" title="Padding Right" />
                  <input type="text" value={b.paddingBottom || ''} onChange={(e) => updateBadge('paddingBottom', e.target.value)} className={inputCls} placeholder="B" title="Padding Bottom" />
                  <input type="text" value={b.paddingLeft || ''} onChange={(e) => updateBadge('paddingLeft', e.target.value)} className={inputCls} placeholder="L" title="Padding Left" />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Top / Right / Bottom / Left</p>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Font Size</label>
                  <input type="text" value={b.fontSize || ''} onChange={(e) => updateBadge('fontSize', e.target.value)} className={inputCls} placeholder="11px" />
                  <div className="flex gap-1 mt-1">
                    {['9px', '11px', '12px', '14px', '16px'].map(v => (
                      <button key={v} type="button" onClick={() => updateBadge('fontSize', v)}
                        className={`flex-1 px-1 py-0.5 text-[10px] rounded border ${(b.fontSize || '11px') === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Font Weight</label>
                  <select value={b.fontWeight || '700'} onChange={(e) => updateBadge('fontWeight', e.target.value)} className={selectCls}>
                    <option value="400">400 - Normal</option>
                    <option value="500">500 - Medium</option>
                    <option value="600">600 - Semi Bold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - Extra Bold</option>
                    <option value="900">900 - Black</option>
                  </select>
                </div>
              </div>

              {/* Font Style & Text Transform */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Font Style</label>
                  <select value={b.fontStyle || 'normal'} onChange={(e) => updateBadge('fontStyle', e.target.value)} className={selectCls}>
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Text Transform</label>
                  <select value={b.textTransform || 'uppercase'} onChange={(e) => updateBadge('textTransform', e.target.value)} className={selectCls}>
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className={labelCls}>Letter Spacing</label>
                <input type="text" value={b.letterSpacing || ''} onChange={(e) => updateBadge('letterSpacing', e.target.value)} className={inputCls} placeholder="0.5px" />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Text Color</label>
                  <div className="flex gap-1">
                    <input type="color" value={b.color || '#ffffff'} onChange={(e) => updateBadge('color', e.target.value)} className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
                    <input type="text" value={b.color || ''} onChange={(e) => updateBadge('color', e.target.value)} className={inputCls} placeholder="#ffffff" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Background</label>
                  <div className="flex gap-1">
                    <input type="color" value={b.backgroundColor || '#ef4444'} onChange={(e) => updateBadge('backgroundColor', e.target.value)} className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
                    <input type="text" value={b.backgroundColor || ''} onChange={(e) => updateBadge('backgroundColor', e.target.value)} className={inputCls} placeholder="#ef4444" />
                  </div>
                </div>
              </div>
              {/* Color presets */}
              <div>
                <label className={labelCls}>Color Presets</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Red', bg: '#ef4444', fg: '#ffffff' },
                    { label: 'Green', bg: '#22c55e', fg: '#ffffff' },
                    { label: 'Blue', bg: '#3b82f6', fg: '#ffffff' },
                    { label: 'Orange', bg: '#f97316', fg: '#ffffff' },
                    { label: 'Purple', bg: '#8b5cf6', fg: '#ffffff' },
                    { label: 'Black', bg: '#111827', fg: '#ffffff' },
                    { label: 'Gold', bg: '#f59e0b', fg: '#111827' },
                    { label: 'Pink', bg: '#ec4899', fg: '#ffffff' },
                  ].map(preset => (
                    <button key={preset.label} type="button" onClick={() => { updateBadge('backgroundColor', preset.bg); updateBadge('color', preset.fg); }}
                      className="px-2 py-0.5 text-[10px] rounded border border-gray-200 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: preset.bg, color: preset.fg }}>{preset.label}</button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className={labelCls}>Border Radius</label>
                <input type="text" value={b.borderRadius || ''} onChange={(e) => updateBadge('borderRadius', e.target.value)} className={inputCls} placeholder="4px" />
                <div className="flex gap-1 mt-1">
                  {['0px', '2px', '4px', '8px', '12px', '9999px'].map(v => (
                    <button key={v} type="button" onClick={() => updateBadge('borderRadius', v)}
                      className={`flex-1 px-1 py-0.5 text-[10px] rounded border ${(b.borderRadius || '4px') === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className={labelCls}>Preview</label>
                <div className="relative p-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center min-h-[60px]">
                  <span className="text-xs text-gray-400">Element</span>
                  <span style={{
                    position: 'absolute',
                    ...((() => {
                      const pos = b.position || 'top-right';
                      const map = {
                        'top-left': { top: 0, left: 0 }, 'top-center': { top: 0, left: '50%', transform: 'translateX(-50%)' }, 'top-right': { top: 0, right: 0 },
                        'middle-left': { top: '50%', left: 0, transform: 'translateY(-50%)' }, 'middle-right': { top: '50%', right: 0, transform: 'translateY(-50%)' },
                        'bottom-left': { bottom: 0, left: 0 }, 'bottom-center': { bottom: 0, left: '50%', transform: 'translateX(-50%)' }, 'bottom-right': { bottom: 0, right: 0 },
                      };
                      return map[pos] || map['top-right'];
                    })()),
                    marginTop: b.marginTop || '0px', marginRight: b.marginRight || '0px', marginBottom: b.marginBottom || '0px', marginLeft: b.marginLeft || '0px',
                    paddingTop: b.paddingTop || '4px', paddingRight: b.paddingRight || '8px', paddingBottom: b.paddingBottom || '4px', paddingLeft: b.paddingLeft || '8px',
                    fontSize: b.fontSize || '11px', fontWeight: b.fontWeight || '700', fontStyle: b.fontStyle || 'normal',
                    textTransform: b.textTransform || 'uppercase', letterSpacing: b.letterSpacing || '0.5px',
                    color: b.color || '#ffffff', backgroundColor: b.backgroundColor || '#ef4444', borderRadius: b.borderRadius || '4px',
                    lineHeight: 1, whiteSpace: 'nowrap',
                  }}>
                    {b.text || 'Sale'}
                  </span>
                </div>
              </div>
            </>
          );
        })()}
      </CollapsibleSection>
    </div>
  );

  // ── Typography Tab ────────────────────────────────────────────────
  const renderTypographySettings = () => (
    <div className="space-y-3">
      <BreakpointBar />
      <CollapsibleSection id="font" title="Font">
        <div>
          <label className={labelCls}>Font Family</label>
          <select value={s.fontFamily || ''} onChange={(e) => updateStyle('fontFamily', e.target.value)} className={selectCls}>
            <option value="">Default</option>
            <optgroup label="Google Fonts">
              {GOOGLE_FONTS.map(f => <option key={f} value={`'${f}', sans-serif`}>{f}</option>)}
            </optgroup>
            <optgroup label="System Fonts">
              {SYSTEM_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </optgroup>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Font Size</label>
            <input type="text" value={s.fontSize || ''} onChange={(e) => updateStyle('fontSize', e.target.value)} className={inputCls} placeholder="16px" />
          </div>
          <div>
            <label className={labelCls}>Font Weight</label>
            <select value={s.fontWeight || ''} onChange={(e) => updateStyle('fontWeight', e.target.value)} className={selectCls}>
              <option value="">Default</option>
              <option value="100">100 - Thin</option>
              <option value="200">200 - Extra Light</option>
              <option value="300">300 - Light</option>
              <option value="normal">400 - Normal</option>
              <option value="500">500 - Medium</option>
              <option value="600">600 - Semi Bold</option>
              <option value="bold">700 - Bold</option>
              <option value="800">800 - Extra Bold</option>
              <option value="900">900 - Black</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Font Style</label>
          <select value={s.fontStyle || 'normal'} onChange={(e) => updateStyle('fontStyle', e.target.value)} className={selectCls}>
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
            <option value="oblique">Oblique</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="text" title="Text">
        <div>
          <label className={labelCls}>Text Color</label>
          <div className="flex gap-2">
            <input type="color" value={s.color || '#000000'} onChange={(e) => updateStyle('color', e.target.value)} className="w-10 h-9 border border-gray-300 rounded cursor-pointer" />
            <input type="text" value={s.color || ''} onChange={(e) => updateStyle('color', e.target.value)} className={inputCls} placeholder="#000000" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Text Align</label>
          <div className="flex gap-1">
            {['left', 'center', 'right', 'justify'].map(val => (
              <button key={val} type="button" onClick={() => updateStyle('textAlign', val)}
                className={`flex-1 px-2 py-1.5 text-xs rounded border ${s.textAlign === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >{val.charAt(0).toUpperCase() + val.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Line Height</label>
            <input type="text" value={s.lineHeight || ''} onChange={(e) => updateStyle('lineHeight', e.target.value)} className={inputCls} placeholder="1.5" />
          </div>
          <div>
            <label className={labelCls}>Letter Spacing</label>
            <input type="text" value={s.letterSpacing || ''} onChange={(e) => updateStyle('letterSpacing', e.target.value)} className={inputCls} placeholder="0px" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Word Spacing</label>
          <input type="text" value={s.wordSpacing || ''} onChange={(e) => updateStyle('wordSpacing', e.target.value)} className={inputCls} placeholder="normal" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="textDecoration" title="Text Decoration" defaultOpen={false}>
        <div>
          <label className={labelCls}>Text Decoration</label>
          <select value={s.textDecoration || 'none'} onChange={(e) => updateStyle('textDecoration', e.target.value)} className={selectCls}>
            <option value="none">None</option>
            <option value="underline">Underline</option>
            <option value="overline">Overline</option>
            <option value="line-through">Line Through</option>
            <option value="underline overline">Underline + Overline</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Text Transform</label>
          <select value={s.textTransform || 'none'} onChange={(e) => updateStyle('textTransform', e.target.value)} className={selectCls}>
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Text Indent</label>
          <input type="text" value={s.textIndent || ''} onChange={(e) => updateStyle('textIndent', e.target.value)} className={inputCls} placeholder="0px" />
        </div>
        <div>
          <label className={labelCls}>White Space</label>
          <select value={s.whiteSpace || ''} onChange={(e) => updateStyle('whiteSpace', e.target.value)} className={selectCls}>
            <option value="">Default</option>
            <option value="normal">Normal</option>
            <option value="nowrap">No Wrap</option>
            <option value="pre">Pre</option>
            <option value="pre-wrap">Pre Wrap</option>
            <option value="pre-line">Pre Line</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Text Overflow</label>
          <select value={s.textOverflow || ''} onChange={(e) => updateStyle('textOverflow', e.target.value)} className={selectCls}>
            <option value="">Default</option>
            <option value="clip">Clip</option>
            <option value="ellipsis">Ellipsis</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Overflow Wrap</label>
          <select value={s.overflowWrap || ''} onChange={(e) => updateStyle('overflowWrap', e.target.value)} className={selectCls}>
            <option value="">Default</option>
            <option value="normal">Normal</option>
            <option value="break-word">Break Word</option>
            <option value="anywhere">Anywhere</option>
          </select>
        </div>
      </CollapsibleSection>

      {/* Text Clamping — show for any element that could contain text */}
      {!isImage && !isVideo && (
        <CollapsibleSection id="textClamping" title="Text Clamping" defaultOpen={false}>
          <p className="text-[10px] text-gray-500 mb-2">
            Limit visible text to a set number of lines with an ellipsis. Set to 0 or leave empty for no limit.
          </p>
          <div>
            <label className={labelCls}>Line Clamp (number of lines)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={s.WebkitLineClamp || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (val > 0) {
                  updateStyle('display', '-webkit-box');
                  updateStyle('WebkitLineClamp', val);
                  updateStyle('WebkitBoxOrient', 'vertical');
                  updateStyle('overflow', 'hidden');
                  updateStyle('textOverflow', 'ellipsis');
                } else {
                  updateStyle('WebkitLineClamp', '');
                  updateStyle('WebkitBoxOrient', '');
                  // Only reset display if it was -webkit-box
                  if (s.display === '-webkit-box') {
                    updateStyle('display', 'block');
                  }
                  updateStyle('overflow', '');
                  updateStyle('textOverflow', '');
                }
              }}
              className={inputCls}
              placeholder="0 (no limit)"
            />
          </div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button key={n} type="button" onClick={() => {
                updateStyle('display', '-webkit-box');
                updateStyle('WebkitLineClamp', n);
                updateStyle('WebkitBoxOrient', 'vertical');
                updateStyle('overflow', 'hidden');
                updateStyle('textOverflow', 'ellipsis');
              }}
                className={`flex-1 px-1 py-1 text-[10px] font-medium rounded border ${
                  s.WebkitLineClamp === n ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>{n} {n === 1 ? 'line' : 'lines'}</button>
            ))}
          </div>
          <button type="button" onClick={() => {
            updateStyle('WebkitLineClamp', '');
            updateStyle('WebkitBoxOrient', '');
            if (s.display === '-webkit-box') updateStyle('display', 'block');
            updateStyle('overflow', '');
            updateStyle('textOverflow', '');
          }}
            className="w-full mt-1 px-2 py-1 text-[10px] text-gray-500 border border-gray-200 rounded hover:bg-gray-50">
            Remove Clamp
          </button>
        </CollapsibleSection>
      )}

      <CollapsibleSection id="textShadow" title="Text Shadow" defaultOpen={false}>
        <div>
          <label className={labelCls}>Text Shadow</label>
          <input type="text" value={s.textShadow || ''} onChange={(e) => updateStyle('textShadow', e.target.value)} className={inputCls} placeholder="1px 1px 2px rgba(0,0,0,0.3)" />
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'Subtle', val: '1px 1px 2px rgba(0,0,0,0.1)' },
              { label: 'Medium', val: '2px 2px 4px rgba(0,0,0,0.2)' },
              { label: 'Strong', val: '3px 3px 6px rgba(0,0,0,0.3)' },
              { label: 'Glow', val: '0 0 10px rgba(59,130,246,0.5)' },
              { label: 'None', val: 'none' },
            ].map(preset => (
              <button key={preset.label} type="button" onClick={() => updateStyle('textShadow', preset.val)}
                className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 rounded border border-gray-200"
              >{preset.label}</button>
            ))}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );

  // ── Advanced Tab ──────────────────────────────────────────────────
  const renderAdvancedSettings = () => (
    <div className="space-y-3">
      <BreakpointBar />
      <CollapsibleSection id="position" title="Position">
        <div>
          <label className={labelCls}>Position</label>
          <select value={s.position || 'static'} onChange={(e) => updateStyle('position', e.target.value)} className={selectCls}>
            <option value="static">Static</option>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
            <option value="fixed">Fixed</option>
            <option value="sticky">Sticky</option>
          </select>
        </div>
        {s.position && s.position !== 'static' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Top</label>
                <input type="text" value={s.top || ''} onChange={(e) => updateStyle('top', e.target.value)} className={inputCls} placeholder="auto" />
              </div>
              <div>
                <label className={labelCls}>Right</label>
                <input type="text" value={s.right || ''} onChange={(e) => updateStyle('right', e.target.value)} className={inputCls} placeholder="auto" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Bottom</label>
                <input type="text" value={s.bottom || ''} onChange={(e) => updateStyle('bottom', e.target.value)} className={inputCls} placeholder="auto" />
              </div>
              <div>
                <label className={labelCls}>Left</label>
                <input type="text" value={s.left || ''} onChange={(e) => updateStyle('left', e.target.value)} className={inputCls} placeholder="auto" />
              </div>
            </div>
          </>
        )}
        <div>
          <label className={labelCls}>Z-Index</label>
          <input type="text" value={s.zIndex || ''} onChange={(e) => updateStyle('zIndex', e.target.value)} className={inputCls} placeholder="auto" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="opacity" title="Opacity & Visibility">
        <div>
          <label className={labelCls}>Opacity</label>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="1" step="0.01" value={s.opacity ?? 1} onChange={(e) => updateStyle('opacity', e.target.value)} className="flex-1" />
            <span className="text-xs text-gray-500 w-8 text-right">{Math.round((s.opacity ?? 1) * 100)}%</span>
          </div>
        </div>
        <div>
          <label className={labelCls}>Visibility</label>
          <select value={s.visibility || 'visible'} onChange={(e) => updateStyle('visibility', e.target.value)} className={selectCls}>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Cursor</label>
          <select value={s.cursor || ''} onChange={(e) => updateStyle('cursor', e.target.value)} className={selectCls}>
            <option value="">Default</option>
            <option value="pointer">Pointer</option>
            <option value="crosshair">Crosshair</option>
            <option value="move">Move</option>
            <option value="text">Text</option>
            <option value="wait">Wait</option>
            <option value="help">Help</option>
            <option value="not-allowed">Not Allowed</option>
            <option value="grab">Grab</option>
            <option value="none">None</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Pointer Events</label>
          <select value={s.pointerEvents || ''} onChange={(e) => updateStyle('pointerEvents', e.target.value)} className={selectCls}>
            <option value="">Default</option>
            <option value="auto">Auto</option>
            <option value="none">None</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="transform" title="Transform" defaultOpen={false}>
        <div>
          <label className={labelCls}>Transform</label>
          <input type="text" value={s.transform || ''} onChange={(e) => updateStyle('transform', e.target.value)} className={inputCls} placeholder="e.g. rotate(5deg) scale(1.1)" />
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'Rotate 5°', val: 'rotate(5deg)' },
              { label: 'Scale 1.1', val: 'scale(1.1)' },
              { label: 'Skew 5°', val: 'skewX(5deg)' },
              { label: 'Flip H', val: 'scaleX(-1)' },
              { label: 'Flip V', val: 'scaleY(-1)' },
              { label: 'None', val: 'none' },
            ].map(preset => (
              <button key={preset.label} type="button" onClick={() => updateStyle('transform', preset.val)}
                className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 rounded border border-gray-200"
              >{preset.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Transform Origin</label>
          <select value={s.transformOrigin || ''} onChange={(e) => updateStyle('transformOrigin', e.target.value)} className={selectCls}>
            <option value="">Default (center)</option>
            <option value="top left">Top Left</option>
            <option value="top center">Top Center</option>
            <option value="top right">Top Right</option>
            <option value="center left">Center Left</option>
            <option value="center center">Center</option>
            <option value="center right">Center Right</option>
            <option value="bottom left">Bottom Left</option>
            <option value="bottom center">Bottom Center</option>
            <option value="bottom right">Bottom Right</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="transition" title="Transition & Animation" defaultOpen={false}>
        <div>
          <label className={labelCls}>Transition Property</label>
          <select value={s.transitionProperty || ''} onChange={(e) => updateStyle('transitionProperty', e.target.value)} className={selectCls}>
            <option value="">None</option>
            <option value="all">All</option>
            <option value="opacity">Opacity</option>
            <option value="transform">Transform</option>
            <option value="background-color">Background Color</option>
            <option value="color">Color</option>
            <option value="border-color">Border Color</option>
            <option value="box-shadow">Box Shadow</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Duration</label>
            <input type="text" value={s.transitionDuration || ''} onChange={(e) => updateStyle('transitionDuration', e.target.value)} className={inputCls} placeholder="0.3s" />
          </div>
          <div>
            <label className={labelCls}>Timing</label>
            <select value={s.transitionTimingFunction || ''} onChange={(e) => updateStyle('transitionTimingFunction', e.target.value)} className={selectCls}>
              <option value="">Default</option>
              <option value="ease">Ease</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In Out</option>
              <option value="linear">Linear</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Transition Delay</label>
          <input type="text" value={s.transitionDelay || ''} onChange={(e) => updateStyle('transitionDelay', e.target.value)} className={inputCls} placeholder="0s" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="filters" title="CSS Filters" defaultOpen={false}>
        <div>
          <label className={labelCls}>Filter</label>
          <input type="text" value={s.filter || ''} onChange={(e) => updateStyle('filter', e.target.value)} className={inputCls} placeholder="e.g. blur(2px) brightness(1.2)" />
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'Blur 2px', val: 'blur(2px)' },
              { label: 'Blur 5px', val: 'blur(5px)' },
              { label: 'Bright', val: 'brightness(1.3)' },
              { label: 'Dark', val: 'brightness(0.7)' },
              { label: 'Contrast', val: 'contrast(1.3)' },
              { label: 'Grayscale', val: 'grayscale(100%)' },
              { label: 'Sepia', val: 'sepia(100%)' },
              { label: 'Saturate', val: 'saturate(1.5)' },
              { label: 'Invert', val: 'invert(100%)' },
              { label: 'Hue 90°', val: 'hue-rotate(90deg)' },
              { label: 'None', val: 'none' },
            ].map(p => (
              <button key={p.label} type="button" onClick={() => updateStyle('filter', p.val)}
                className={`px-2 py-0.5 text-[10px] rounded border ${s.filter === p.val ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{p.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Backdrop Filter</label>
          <input type="text" value={s.backdropFilter || ''} onChange={(e) => updateStyle('backdropFilter', e.target.value)} className={inputCls} placeholder="e.g. blur(10px)" />
          <div className="flex flex-wrap gap-1 mt-1">
            {[
              { label: 'Blur 4px', val: 'blur(4px)' },
              { label: 'Blur 10px', val: 'blur(10px)' },
              { label: 'Blur 20px', val: 'blur(20px)' },
              { label: 'Frosted', val: 'blur(10px) saturate(180%)' },
              { label: 'None', val: 'none' },
            ].map(p => (
              <button key={p.label} type="button" onClick={() => updateStyle('backdropFilter', p.val)}
                className={`px-2 py-0.5 text-[10px] rounded border ${s.backdropFilter === p.val ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{p.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Mix Blend Mode</label>
          <select value={s.mixBlendMode || ''} onChange={(e) => updateStyle('mixBlendMode', e.target.value)} className={selectCls}>
            <option value="">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
            <option value="difference">Difference</option>
            <option value="exclusion">Exclusion</option>
            <option value="hue">Hue</option>
            <option value="saturation">Saturation</option>
            <option value="color">Color</option>
            <option value="luminosity">Luminosity</option>
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="hoverState" title="Hover & Focus States" defaultOpen={false}>
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700 mb-2">
          Set styles that apply on hover/focus. These are stored as inline style overrides and applied via custom CSS.
        </div>
        {(() => {
          const hoverStyles = props.hoverStyles || {};
          const focusStyles = props.focusStyles || {};
          const updateHover = (key, value) => {
            setProp((p) => {
              if (!p.hoverStyles) p.hoverStyles = {};
              if (value === '' || value === undefined) { delete p.hoverStyles[key]; } else { p.hoverStyles[key] = value; }
            });
          };
          const updateFocus = (key, value) => {
            setProp((p) => {
              if (!p.focusStyles) p.focusStyles = {};
              if (value === '' || value === undefined) { delete p.focusStyles[key]; } else { p.focusStyles[key] = value; }
            });
          };
          return (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">🖱️ Hover State</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Background</label>
                    <div className="flex gap-1">
                      <input type="color" value={hoverStyles.backgroundColor || s.backgroundColor || '#ffffff'} onChange={(e) => updateHover('backgroundColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
                      <input type="text" value={hoverStyles.backgroundColor || ''} onChange={(e) => updateHover('backgroundColor', e.target.value)} className={inputCls} placeholder="inherit" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Text Color</label>
                    <div className="flex gap-1">
                      <input type="color" value={hoverStyles.color || s.color || '#000000'} onChange={(e) => updateHover('color', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
                      <input type="text" value={hoverStyles.color || ''} onChange={(e) => updateHover('color', e.target.value)} className={inputCls} placeholder="inherit" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Border Color</label>
                    <input type="text" value={hoverStyles.borderColor || ''} onChange={(e) => updateHover('borderColor', e.target.value)} className={inputCls} placeholder="inherit" />
                  </div>
                  <div>
                    <label className={labelCls}>Opacity</label>
                    <input type="text" value={hoverStyles.opacity || ''} onChange={(e) => updateHover('opacity', e.target.value)} className={inputCls} placeholder="1" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Transform</label>
                  <input type="text" value={hoverStyles.transform || ''} onChange={(e) => updateHover('transform', e.target.value)} className={inputCls} placeholder="e.g. scale(1.05) translateY(-2px)" />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { label: 'Scale Up', val: 'scale(1.05)' },
                      { label: 'Lift', val: 'translateY(-4px)' },
                      { label: 'Both', val: 'scale(1.05) translateY(-2px)' },
                      { label: 'Rotate', val: 'rotate(3deg)' },
                      { label: 'None', val: '' },
                    ].map(p => (
                      <button key={p.label} type="button" onClick={() => updateHover('transform', p.val)}
                        className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 rounded border border-gray-200">{p.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Box Shadow</label>
                  <input type="text" value={hoverStyles.boxShadow || ''} onChange={(e) => updateHover('boxShadow', e.target.value)} className={inputCls} placeholder="0 10px 25px rgba(0,0,0,0.15)" />
                </div>
                <div>
                  <label className={labelCls}>Filter</label>
                  <input type="text" value={hoverStyles.filter || ''} onChange={(e) => updateHover('filter', e.target.value)} className={inputCls} placeholder="e.g. brightness(1.1)" />
                </div>
              </div>

              <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">🎯 Focus State</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Border Color</label>
                    <input type="text" value={focusStyles.borderColor || ''} onChange={(e) => updateFocus('borderColor', e.target.value)} className={inputCls} placeholder="#3b82f6" />
                  </div>
                  <div>
                    <label className={labelCls}>Box Shadow</label>
                    <input type="text" value={focusStyles.boxShadow || ''} onChange={(e) => updateFocus('boxShadow', e.target.value)} className={inputCls} placeholder="0 0 0 3px rgba(59,130,246,0.3)" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Outline</label>
                  <input type="text" value={focusStyles.outline || ''} onChange={(e) => updateFocus('outline', e.target.value)} className={inputCls} placeholder="2px solid #3b82f6" />
                </div>
                <div>
                  <label className={labelCls}>Background</label>
                  <input type="text" value={focusStyles.backgroundColor || ''} onChange={(e) => updateFocus('backgroundColor', e.target.value)} className={inputCls} placeholder="inherit" />
                </div>
              </div>
            </>
          );
        })()}
      </CollapsibleSection>

      <CollapsibleSection id="cssClass" title="CSS Class & ID">
        <div>
          <label className={labelCls}>CSS Class</label>
          <input type="text" value={className} onChange={(e) => updateProp('className', e.target.value)} className={inputCls} placeholder="e.g. my-custom-class" />
        </div>
        <div>
          <label className={labelCls}>Element ID</label>
          <input type="text" value={props.elementId || ''} onChange={(e) => updateProp('elementId', e.target.value)} className={inputCls} placeholder="e.g. my-section" />
          <p className="text-[10px] text-gray-400 mt-0.5">Used for anchor links and CSS targeting</p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="customCSS" title="Custom CSS" defaultOpen={false}>
        <div>
          <label className={labelCls}>Custom CSS (applied to this element)</label>
          <textarea
            value={customCSS}
            onChange={(e) => updateProp('customCSS', e.target.value)}
            className={inputCls + ' font-mono text-xs'}
            placeholder={`/* Example */\n.this-element {\n  filter: blur(2px);\n}`}
            rows={6}
          />
        </div>
      </CollapsibleSection>
    </div>
  );

  // ── Dynamic Data Tab ─────────────────────────────────────────────
  const renderDynamicDataSettings = () => {
    const bindings = props.dynamicBindings || {};
    const bindingEntries = Object.entries(bindings).filter(([, v]) => v);

    const openPicker = (propName, propType = 'any') => {
      setPickerProp(propName);
      setPickerType(propType);
      setPickerOpen(true);
    };

    const handleBind = (token) => {
      if (!pickerProp) return;
      setProp((p) => {
        if (!p.dynamicBindings) p.dynamicBindings = {};
        if (token) {
          p.dynamicBindings[pickerProp] = token;
        } else {
          delete p.dynamicBindings[pickerProp];
        }
      });
      setPickerProp(null);
    };

    const removeBinding = (propName) => {
      setProp((p) => {
        if (p.dynamicBindings) {
          delete p.dynamicBindings[propName];
        }
      });
    };

    const handleAddNew = () => {
      if (newPropName.trim()) {
        openPicker(newPropName.trim(), getPropType(newPropName.trim()));
        setNewPropName('');
        setAddingNew(false);
      }
    };

    // Common bindable props for this element
    const suggestedProps = [
      { key: 'content', label: 'Content / Text', type: 'text' },
      { key: 'src', label: 'Image Source', type: 'image' },
      { key: 'href', label: 'Link URL', type: 'url' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'alt', label: 'Alt Text', type: 'text' },
      { key: 'buttonText', label: 'Button Text', type: 'text' },
      { key: 'backgroundImage', label: 'Background Image', type: 'image' },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'salePrice', label: 'Sale Price', type: 'text' },
      { key: 'mainImage', label: 'Main Image', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
      { key: 'url', label: 'URL', type: 'url' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'placeholder', label: 'Placeholder', type: 'text' },
    ].filter(sp => {
      // Only show props that exist on this element or are commonly used
      return props[sp.key] !== undefined || ['content', 'src', 'href', 'title', 'backgroundImage'].includes(sp.key);
    });

    // Filter out already-bound props from suggestions
    const unboundSuggestions = suggestedProps.filter(sp => !bindings[sp.key]);

    return (
      <div className="space-y-3">
        {/* Info banner */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Database size={14} className="text-purple-600" />
            <span className="text-xs font-bold text-purple-800">Dynamic Data Bindings</span>
          </div>
          <p className="text-[10px] text-purple-600 leading-relaxed">
            Bind any property to dynamic data from a Repeater. Place this element inside a Repeater to see live data.
          </p>
        </div>

        {/* Active bindings */}
        {bindingEntries.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-700">Active Bindings</h4>
            {bindingEntries.map(([propName, token]) => {
              const field = extractField(token);
              const point = ALL_DATA_POINTS.find(p => p.field === field);
              return (
                <div key={propName} className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">{propName}</div>
                    <div className="text-[10px] text-purple-600 font-mono truncate">
                      {point ? point.label : token}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPicker(propName, getPropType(propName))}
                    className="p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors"
                    title="Change binding"
                  >
                    <Database size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBinding(propName)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove binding"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick-bind suggestions */}
        {unboundSuggestions.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-700">Bind a Property</h4>
            <div className="grid grid-cols-2 gap-1">
              {unboundSuggestions.map((sp) => (
                <button
                  key={sp.key}
                  type="button"
                  onClick={() => openPicker(sp.key, sp.type)}
                  className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-left text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  <Database size={10} className="text-gray-400" />
                  <span className="truncate">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add custom property binding */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-gray-700">Custom Property</h4>
          {addingNew ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newPropName}
                onChange={(e) => setNewPropName(e.target.value)}
                placeholder="Property name (e.g. subtitle)"
                className={inputCls + ' flex-1 text-xs'}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
              />
              <button
                type="button"
                onClick={handleAddNew}
                disabled={!newPropName.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-40 transition-colors"
              >
                Bind
              </button>
              <button
                type="button"
                onClick={() => { setAddingNew(false); setNewPropName(''); }}
                className="px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors w-full"
            >
              <Plus size={12} />
              Add custom property binding
            </button>
          )}
        </div>

        {/* Picker modal */}
        <DynamicDataPicker
          isOpen={pickerOpen}
          onClose={() => { setPickerOpen(false); setPickerProp(null); }}
          onSelect={handleBind}
          propType={pickerType}
          currentBinding={pickerProp ? (bindings[pickerProp] || '') : ''}
        />
      </div>
    );
  };

  // ── Tab router ────────────────────────────────────────────────────
  switch (activeTab) {
    case 'typography':
      return renderTypographySettings();
    case 'advanced':
      return renderAdvancedSettings();
    case 'dynamic':
      return renderDynamicDataSettings();
    case 'layout':
    default:
      return renderLayoutSettings();
  }
};
