import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formsAPI } from '@/services/api';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { ArrowLeft, Sliders, Settings as SettingsIcon, Inbox } from 'lucide-react';
import FieldPalette from './FieldPalette';
import FieldCanvas from './FieldCanvas';
import FieldSettingsPanel from './FieldSettingsPanel';
import FormSettingsPanel from './FormSettingsPanel';
import { createFieldFromType } from './fieldRegistry';

export default function FormEditor({ formId, onBack, onViewSubmissions }) {
  const queryClient = useQueryClient();
  const { data: formResponse, isLoading } = useQuery(['form', formId], () => formsAPI.getOne(formId));
  const form = formResponse?.data?.data;

  const [fields, setFields] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [rightTab, setRightTab] = useState('field');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (form) {
      setFields(form.fields || []);
      setSettings({
        title: form.title,
        description: form.description,
        submitButtonText: form.submitButtonText,
        successMessage: form.successMessage,
        notificationEmail: form.notificationEmail,
        sendConfirmationToSubmitter: form.sendConfirmationToSubmitter,
        confirmationEmailField: form.confirmationEmailField,
        status: form.status,
      });
      setDirty(false);
    }
  }, [form?._id]);

  const updateFields = (next) => { setFields(next); setDirty(true); };
  const updateSettings = (next) => { setSettings(next); setDirty(true); };

  const insertField = (fieldType) => {
    const field = createFieldFromType(fieldType, fields.length);
    updateFields([...fields, field]);
    setSelectedId(field._id);
    setRightTab('field');
  };

  const reorderFields = (next) => updateFields(next.map((f, i) => ({ ...f, order: i })));

  const duplicateField = (id) => {
    const field = fields.find((f) => f._id === id);
    if (!field) return;
    const copy = { ...JSON.parse(JSON.stringify(field)), _id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    const idx = fields.findIndex((f) => f._id === id);
    updateFields([...fields.slice(0, idx + 1), copy, ...fields.slice(idx + 1)].map((f, i) => ({ ...f, order: i })));
  };

  const removeField = (id) => {
    updateFields(fields.filter((f) => f._id !== id).map((f, i) => ({ ...f, order: i })));
    if (selectedId === id) setSelectedId(null);
  };

  const updateSelectedField = (nextField) => {
    updateFields(fields.map((f) => (f._id === selectedId ? nextField : f)));
  };

  const selectedField = fields.find((f) => f._id === selectedId) || null;

  const saveMutation = useMutation((data) => formsAPI.update(formId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['form', formId]);
      queryClient.invalidateQueries('forms');
      setDirty(false);
      toast.success('Saved');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to save'),
  });

  const handleSave = () => saveMutation.mutate({ ...settings, fields });

  if (isLoading || !form || !settings) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{form.title}</h2>
            <p className="text-xs text-gray-400">{fields.length} field(s)</p>
          </div>
          {dirty && <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onViewSubmissions(formId)}>
            <Inbox size={16} className="mr-1.5" /> Submissions
          </Button>
          <Button onClick={handleSave} loading={saveMutation.isLoading}>Save</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          <FieldPalette onInsert={insertField} />
        </div>

        <div className="flex-1 bg-gray-50 overflow-hidden">
          <FieldCanvas
            fields={fields}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setRightTab('field'); }}
            onReorder={reorderFields}
            onDuplicate={duplicateField}
            onRemove={removeField}
          />
        </div>

        <div className="w-96 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() => setRightTab('field')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${rightTab === 'field' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <Sliders size={14} /> Field
            </button>
            <button
              onClick={() => setRightTab('form')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${rightTab === 'form' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <SettingsIcon size={14} /> Form Settings
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === 'field' && (
              selectedField ? (
                <FieldSettingsPanel field={selectedField} onChange={updateSelectedField} />
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">Select a field to edit its settings.</p>
              )
            )}
            {rightTab === 'form' && (
              <FormSettingsPanel form={settings} fields={fields} onChange={updateSettings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
