import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, ListChecks, Asterisk } from 'lucide-react';
import { FIELD_TYPES } from './fieldRegistry';

function FieldCard({ field, selectedId, onSelect, onDuplicate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field._id });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const meta = FIELD_TYPES[field.fieldType];
  const selected = field._id === selectedId;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      onClick={() => onSelect(field._id)}
      className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <button {...attributes} {...listeners} className="text-gray-400 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical size={14} />
        </button>
        <span className="text-xs font-medium text-gray-600 flex-1">{field.label || meta?.label}</span>
        {field.required && <Asterisk size={11} className="text-red-500" />}
        <span className="text-[10px] text-gray-400 uppercase">{meta?.label}</span>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(field._id); }} className="text-gray-400 hover:text-gray-700" title="Duplicate">
          <Copy size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(field._id); }} className="text-gray-400 hover:text-red-600" title="Remove">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="p-3 bg-white pointer-events-none">
        {field.fieldType === 'section-break' ? (
          <div className="text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1">{field.label || 'Section'}</div>
        ) : field.fieldType === 'textarea' ? (
          <div className="w-full h-14 border border-gray-200 rounded bg-gray-50" />
        ) : field.fieldType === 'checkbox' || field.fieldType === 'radio' ? (
          <div className="space-y-1">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <ListChecks size={12} /> {opt}
              </div>
            ))}
          </div>
        ) : field.fieldType === 'select' ? (
          <div className="w-full h-8 border border-gray-200 rounded bg-gray-50 px-2 flex items-center text-xs text-gray-400">
            {(field.options || []).join(' / ') || 'Options'}
          </div>
        ) : field.fieldType === 'hidden' ? (
          <div className="text-xs text-gray-400 italic">Hidden — not shown to the visitor</div>
        ) : (
          <div className="w-full h-8 border border-gray-200 rounded bg-gray-50 px-2 flex items-center text-xs text-gray-400">
            {field.placeholder || meta?.label}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FieldCanvas({ fields, selectedId, onSelect, onReorder, onDuplicate, onRemove }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f._id === active.id);
    const newIndex = fields.findIndex((f) => f._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(fields, oldIndex, newIndex));
  };

  if (fields.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center px-8">
        <div>
          <p className="text-sm text-gray-400">This form has no fields yet.</p>
          <p className="text-xs text-gray-400 mt-1">Click a field type on the left to add it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 max-w-2xl mx-auto">
            {fields.map((field) => (
              <FieldCard
                key={field._id}
                field={field}
                selectedId={selectedId}
                onSelect={onSelect}
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
