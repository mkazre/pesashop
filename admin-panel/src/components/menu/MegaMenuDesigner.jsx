import React, { useState, useRef, useMemo } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import {
  X, Save, Type, Heading as HeadingIcon, Image as ImageIcon,
  MousePointer, Box, ShoppingBag, List, Link as LinkIcon,
  Square, Minus, GripVertical, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react';
import Button from '@/components/common/Button';
import { RenderNode } from '@/components/builder/utils/RenderNode';
import { Container } from '@/components/builder/elements/Container';
import { Text } from '@/components/builder/elements/Text';
import { Heading } from '@/components/builder/elements/Heading';
import { Image } from '@/components/builder/elements/Image';
import { Button as ButtonElement } from '@/components/builder/elements/Button';
import { ProductCard } from '@/components/builder/elements/ProductCard';
import { CategoryList } from '@/components/builder/elements/CategoryList';
import { LinkButton } from '@/components/builder/elements/LinkButton';
import { IconBox } from '@/components/builder/elements/IconBox';

const resolver = {
  Container,
  Text,
  Heading,
  Image,
  Button: ButtonElement,
  ProductCard,
  CategoryList,
  LinkButton,
  IconBox,
};

// ── Toolbox element definitions ──────────────────────────────────────
const TOOLBOX_ELEMENTS = [
  { name: 'Heading', icon: HeadingIcon, color: 'text-purple-600 bg-purple-50', create: () => ({ type: Heading, props: { content: 'Menu Heading', level: 'h4', className: '', style: {} } }) },
  { name: 'Text', icon: Type, color: 'text-blue-600 bg-blue-50', create: () => ({ type: Text, props: { content: 'Menu text content', className: '', style: {} } }) },
  { name: 'Image', icon: ImageIcon, color: 'text-green-600 bg-green-50', create: () => ({ type: Image, props: { src: 'https://placehold.co/300x200/e2e8f0/64748b?text=Image', alt: 'Menu image', className: '', style: {} } }) },
  { name: 'Button', icon: MousePointer, color: 'text-orange-600 bg-orange-50', create: () => ({ type: ButtonElement, props: { text: 'Shop Now', link: '#', className: '', style: {} } }) },
  { name: 'Link', icon: LinkIcon, color: 'text-cyan-600 bg-cyan-50', create: () => ({ type: LinkButton, props: { text: 'View All →', link: '#', className: '', style: {} } }) },
  { name: 'Icon Box', icon: Square, color: 'text-pink-600 bg-pink-50', create: () => ({ type: IconBox, props: { icon: 'star', title: 'Feature', description: 'Description text', className: '', style: {} } }) },
  { name: 'Container', icon: Box, color: 'text-gray-600 bg-gray-50', create: () => ({ type: Container, props: { className: '', style: {} }, isCanvas: true }) },
  { name: 'Product Card', icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50', create: () => ({ type: ProductCard, props: { className: '', style: {} } }) },
  { name: 'Category List', icon: List, color: 'text-teal-600 bg-teal-50', create: () => ({ type: CategoryList, props: { className: '', style: {} } }) },
];

// ── Draggable Toolbox Item ───────────────────────────────────────────
const ToolboxItem = ({ element }) => {
  const { connectors } = useEditor();
  const Icon = element.icon;
  const ref = useRef(null);

  return (
    <div
      ref={(r) => { ref.current = r; if (r) { const el = element.create(); connectors.create(r, el.isCanvas ? <Element is={el.type} canvas {...el.props} /> : <el.type {...el.props} />); } }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all ${element.color}`}
    >
      <Icon size={16} />
      <span className="text-xs font-medium text-gray-700">{element.name}</span>
    </div>
  );
};

// ── Toolbox Panel ────────────────────────────────────────────────────
const Toolbox = () => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Elements</h3>
    <p className="text-[11px] text-gray-400 px-1">Drag elements into the columns</p>
    <div className="space-y-1.5">
      {TOOLBOX_ELEMENTS.map((el) => (
        <ToolboxItem key={el.name} element={el} />
      ))}
    </div>
  </div>
);

// ── Properties Panel (selected element) ──────────────────────────────
const PropertiesPanel = () => {
  const { selected, actions, query } = useEditor((state) => {
    const currentNodeId = state.events.selected?.values().next().value;
    let selectedData = null;
    if (currentNodeId) {
      const node = state.nodes[currentNodeId];
      if (node) {
        selectedData = {
          id: currentNodeId,
          displayName: node.data.displayName || node.data.type?.craft?.displayName || 'Element',
          props: node.data.props || {},
          isDeletable: query.node(currentNodeId).isDeletable(),
        };
      }
    }
    return { selected: selectedData };
  });

  if (!selected) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Square size={24} className="mx-auto mb-2 opacity-40" />
        <p className="text-xs">Click an element to edit</p>
      </div>
    );
  }

  const { id, displayName, props, isDeletable } = selected;

  const updateProp = (key, value) => {
    actions.setProp(id, (p) => { p[key] = value; });
  };

  const labelCls = 'block text-[11px] font-medium text-gray-500 mb-0.5';
  const inputCls = 'w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-700">{displayName}</h3>
        {isDeletable && (
          <button onClick={() => actions.delete(id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete element">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content / Text */}
      {props.content !== undefined && (
        <div>
          <label className={labelCls}>Content</label>
          <textarea value={props.content || ''} onChange={(e) => updateProp('content', e.target.value)}
            className={`${inputCls} resize-y`} rows={3} />
        </div>
      )}

      {/* Text (for buttons) */}
      {props.text !== undefined && (
        <div>
          <label className={labelCls}>Text</label>
          <input type="text" value={props.text || ''} onChange={(e) => updateProp('text', e.target.value)} className={inputCls} />
        </div>
      )}

      {/* Link */}
      {props.link !== undefined && (
        <div>
          <label className={labelCls}>Link URL</label>
          <input type="text" value={props.link || ''} onChange={(e) => updateProp('link', e.target.value)} className={inputCls} placeholder="/page or https://..." />
        </div>
      )}

      {/* Image src */}
      {props.src !== undefined && (
        <div>
          <label className={labelCls}>Image URL</label>
          <input type="text" value={props.src || ''} onChange={(e) => updateProp('src', e.target.value)} className={inputCls} />
        </div>
      )}

      {/* Alt */}
      {props.alt !== undefined && (
        <div>
          <label className={labelCls}>Alt Text</label>
          <input type="text" value={props.alt || ''} onChange={(e) => updateProp('alt', e.target.value)} className={inputCls} />
        </div>
      )}

      {/* Title (IconBox) */}
      {props.title !== undefined && (
        <div>
          <label className={labelCls}>Title</label>
          <input type="text" value={props.title || ''} onChange={(e) => updateProp('title', e.target.value)} className={inputCls} />
        </div>
      )}

      {/* Description (IconBox) */}
      {props.description !== undefined && (
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={props.description || ''} onChange={(e) => updateProp('description', e.target.value)}
            className={`${inputCls} resize-y`} rows={2} />
        </div>
      )}

      {/* Heading level */}
      {props.level !== undefined && (
        <div>
          <label className={labelCls}>Heading Level</label>
          <select value={props.level || 'h4'} onChange={(e) => updateProp('level', e.target.value)} className={inputCls}>
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
      )}

      {/* Custom class */}
      <div>
        <label className={labelCls}>CSS Class</label>
        <input type="text" value={props.className || ''} onChange={(e) => updateProp('className', e.target.value)}
          className={inputCls} placeholder="custom-class" />
      </div>
    </div>
  );
};

// ── Main MegaMenuDesigner ────────────────────────────────────────────
const MegaMenuDesigner = ({ item, onClose, onSave }) => {
  const [columns, setColumns] = useState(item.megaMenu?.columns || 4);
  const editorRef = useRef(null);

  // Parse existing saved content — Frame expects a JSON string for deserialization
  const existingData = useMemo(() => {
    const raw = item.megaMenu?.content;
    if (!raw) return null;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Object.keys(parsed).length > 0 ? raw : null; // keep as string
      } catch { return null; }
    }
    if (typeof raw === 'object' && Object.keys(raw).length > 0) {
      return JSON.stringify(raw); // convert object to JSON string for Frame
    }
    return null;
  }, [item.megaMenu?.content]);

  const hasExistingContent = !!existingData;

  const SaveHandler = () => {
    const { query } = useEditor();
    editorRef.current = query;
    return null;
  };

  const handleSave = () => {
    if (editorRef.current) {
      try {
        const serialized = editorRef.current.serialize();
        // Always save as parsed object for consistency with MongoDB Mixed type
        const data = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
        onSave(data);
      } catch (error) {
        console.error('Error serializing mega menu content:', error);
        onSave({});
      }
    } else {
      onSave({});
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Mega Menu Designer</h2>
            <p className="text-sm text-gray-500">Design content for: <strong>{item.label}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            {!hasExistingContent && (
              <select
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} Column{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            )}
            <Button onClick={handleSave} variant="primary">
              <Save size={16} className="mr-2" />
              Save Content
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body: Toolbox | Canvas | Properties */}
        <div className="flex-1 flex overflow-hidden">
          <Editor resolver={resolver} onRender={RenderNode}>
            <SaveHandler />

            {/* Left: Toolbox */}
            <div className="w-52 border-r border-gray-200 p-3 overflow-y-auto bg-white shrink-0">
              <Toolbox />
            </div>

            {/* Center: Canvas */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {hasExistingContent ? (
                <Frame data={existingData} />
              ) : (
                <Frame>
                  <Element is={Container} canvas className="bg-white rounded-lg shadow p-6 min-h-[400px]">
                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                    >
                      {Array.from({ length: columns }).map((_, index) => (
                        <Element
                          key={`col-${index}`}
                          id={`mega-col-${index}`}
                          is={Container}
                          canvas
                          className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="text-center text-gray-400 py-8 pointer-events-none">
                            <p className="text-sm font-medium">Column {index + 1}</p>
                            <p className="text-xs mt-1">Drag elements here</p>
                          </div>
                        </Element>
                      ))}
                    </div>
                  </Element>
                </Frame>
              )}
            </div>

            {/* Right: Properties */}
            <div className="w-56 border-l border-gray-200 p-3 overflow-y-auto bg-white shrink-0">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-3">Properties</h3>
              <PropertiesPanel />
            </div>
          </Editor>
        </div>
      </div>
    </div>
  );
};

export default MegaMenuDesigner;
