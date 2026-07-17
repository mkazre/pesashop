// ── Form Builder — field type catalog ─────────────────────────────────
// Single source of truth for the field palette + default props. Per-field
// style is intentionally minimal (just width, for side-by-side layout) —
// this is a form, not a free-form page, so the heavy styling engine used
// by the Page Builder would be overkill here.

export const FIELD_TYPES = {
  text: { label: 'Text', hasOptions: false, hasPlaceholder: true },
  email: { label: 'Email', hasOptions: false, hasPlaceholder: true },
  phone: { label: 'Phone', hasOptions: false, hasPlaceholder: true },
  textarea: { label: 'Textarea', hasOptions: false, hasPlaceholder: true },
  select: { label: 'Dropdown', hasOptions: true, hasPlaceholder: false },
  radio: { label: 'Radio Buttons', hasOptions: true, hasPlaceholder: false },
  checkbox: { label: 'Checkboxes', hasOptions: true, hasPlaceholder: false },
  date: { label: 'Date', hasOptions: false, hasPlaceholder: false },
  file: { label: 'File Upload', hasOptions: false, hasPlaceholder: false },
  hidden: { label: 'Hidden Field', hasOptions: false, hasPlaceholder: false },
  'section-break': { label: 'Section Break', hasOptions: false, hasPlaceholder: false },
};

const newId = () => `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createFieldFromType(fieldType, order = 0) {
  const meta = FIELD_TYPES[fieldType];
  if (!meta) return null;
  return {
    _id: newId(),
    fieldType,
    label: meta.label,
    placeholder: '',
    required: false,
    options: meta.hasOptions ? ['Option 1', 'Option 2'] : [],
    order,
    style: { width: 100 },
  };
}
