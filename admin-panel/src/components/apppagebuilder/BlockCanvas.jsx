import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Copy, Trash2, FileText, Plus } from 'lucide-react';
import { getBlockMeta, BLOCK_REGISTRY } from './blockRegistry';
import { getPreviewRenderer } from './previews';

// Container children can't themselves be containers — keeps nesting capped
// at one level, which is what both the admin data model and the mobile
// renderer are built to support.
const NON_CONTAINER_TYPES = Object.entries(BLOCK_REGISTRY).filter(([, meta]) => !meta.isContainer);

function AddChildControl({ onAdd }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
      >
        <option value="">Add a child block...</option>
        {NON_CONTAINER_TYPES.map(([type, meta]) => (
          <option key={type} value={type}>{meta.label}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={!value}
        onClick={() => { if (value) { onAdd(value); setValue(''); } }}
        className="p-1.5 border border-gray-300 rounded text-gray-500 hover:text-blue-600 hover:border-blue-400 disabled:opacity-40"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function BlockCard({ block, selectedId, onSelect, onToggleEnabled, onDuplicate, onRemove, isChild, onInsertChild }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block._id, disabled: isChild });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const meta = getBlockMeta(block.blockType);
  const Preview = getPreviewRenderer(block.blockType);
  const selected = block._id === selectedId;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      onClick={() => onSelect(block._id)}
      className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      } ${!block.enabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {!isChild && (
          <button {...attributes} {...listeners} className="text-gray-400 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical size={14} />
          </button>
        )}
        <span className="text-xs font-medium text-gray-600 flex-1">{meta?.label || block.blockType}</span>
        <button onClick={(e) => { e.stopPropagation(); onToggleEnabled(block._id); }} className="text-gray-400 hover:text-gray-700" title={block.enabled ? 'Hide' : 'Show'}>
          {block.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(block._id); }} className="text-gray-400 hover:text-gray-700" title="Duplicate">
          <Copy size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(block._id); }} className="text-gray-400 hover:text-red-600" title="Remove">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="p-3 bg-white pointer-events-none">
        {Preview ? <Preview block={block} /> : (
          <div className="flex items-center gap-2 text-gray-400 py-4 justify-center">
            <FileText size={16} />
            <span className="text-xs">{meta?.label || block.blockType} — no preview available</span>
          </div>
        )}
      </div>
      {meta?.isContainer && (
        <div className="p-2 bg-gray-50 border-t border-gray-200 space-y-2" onClick={(e) => e.stopPropagation()}>
          {(block.children || []).map((child) => (
            <BlockCard
              key={child._id}
              block={child}
              selectedId={selectedId}
              isChild
              onSelect={onSelect}
              onToggleEnabled={onToggleEnabled}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          ))}
          <AddChildControl onAdd={(type) => onInsertChild(block._id, type)} />
        </div>
      )}
    </div>
  );
}

export default function BlockCanvas({ blocks, selectedId, onSelect, onReorder, onToggleEnabled, onDuplicate, onRemove, onInsertChild }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b._id === active.id);
    const newIndex = blocks.findIndex((b) => b._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return; // dragging is disabled for children anyway
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  };

  if (blocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center px-8">
        <div>
          <FileText size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">This page is empty.</p>
          <p className="text-xs text-gray-400 mt-1">Click an element on the left to add it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 max-w-2xl mx-auto">
            {blocks.map((block) => (
              <BlockCard
                key={block._id}
                block={block}
                selectedId={selectedId}
                onSelect={onSelect}
                onToggleEnabled={onToggleEnabled}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onInsertChild={onInsertChild}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
