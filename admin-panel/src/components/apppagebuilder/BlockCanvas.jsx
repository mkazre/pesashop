import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Copy, Trash2, FileText } from 'lucide-react';
import { getBlockMeta } from './blockRegistry';
import { getPreviewRenderer } from './previews';

function BlockCard({ block, selected, onSelect, onToggleEnabled, onDuplicate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const meta = getBlockMeta(block.blockType);
  const Preview = getPreviewRenderer(block.blockType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(block._id)}
      className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      } ${!block.enabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <button {...attributes} {...listeners} className="text-gray-400 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical size={14} />
        </button>
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
    </div>
  );
}

export default function BlockCanvas({ blocks, selectedId, onSelect, onReorder, onToggleEnabled, onDuplicate, onRemove }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b._id === active.id);
    const newIndex = blocks.findIndex((b) => b._id === over.id);
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
                selected={block._id === selectedId}
                onSelect={onSelect}
                onToggleEnabled={onToggleEnabled}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
