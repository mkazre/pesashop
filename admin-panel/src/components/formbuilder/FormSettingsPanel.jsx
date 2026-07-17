import React from 'react';

export default function FormSettingsPanel({ form, fields, onChange }) {
  const set = (key, value) => onChange({ ...form, [key]: value });
  const emailFields = fields.filter((f) => f.fieldType === 'email');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Submit Button Text</label>
        <input type="text" value={form.submitButtonText || ''} onChange={(e) => set('submitButtonText', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Success Message</label>
        <textarea value={form.successMessage || ''} onChange={(e) => set('successMessage', e.target.value)} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notification Email</label>
        <input
          type="email"
          value={form.notificationEmail || ''}
          onChange={(e) => set('notificationEmail', e.target.value)}
          placeholder="Leave blank to use the store's default email"
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">Submissions are emailed here. If left blank, they go to the store's default contact email.</p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!form.sendConfirmationToSubmitter} onChange={(e) => set('sendConfirmationToSubmitter', e.target.checked)} className="rounded text-blue-600" />
        <span className="text-sm text-gray-600">Send a confirmation email to the submitter</span>
      </label>
      {form.sendConfirmationToSubmitter && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Which field is their email address?</label>
          <select
            value={form.confirmationEmailField || ''}
            onChange={(e) => set('confirmationEmailField', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="">Select an email field...</option>
            {emailFields.map((f) => <option key={f._id} value={f._id}>{f.label}</option>)}
          </select>
          {emailFields.length === 0 && <p className="text-[11px] text-amber-600 mt-1">Add an Email field to the form first.</p>}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select value={form.status || 'active'} onChange={(e) => set('status', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
          <option value="active">Active</option>
          <option value="inactive">Inactive (won't accept new submissions)</option>
        </select>
      </div>
    </div>
  );
}
