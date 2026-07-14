import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { autoposterAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoCreate, IoTrash } from 'react-icons/io5';

const PLATFORMS = ['facebook', 'instagram', 'x', 'linkedin', 'tiktok'];
const VARIABLES = ['product_name', 'product_price', 'product_short_desc', 'product_url', 'product_category', 'store_name', 'currency', 'hashtags', 'discount_percent', 'stock_status'];

function TemplateForm({ initial, onSave, saving }) {
  const [name, setName] = useState(initial?.name || '');
  const [platform, setPlatform] = useState(initial?.platform || '');
  const [content, setContent] = useState(initial?.content || '');

  return (
    <div className="space-y-4">
      <Input label="Template name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
      <div>
        <label className="block text-sm font-medium mb-1">Platform (optional — leave blank for universal)</label>
        <select className="input w-full" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">Universal (any platform)</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Content (Handlebars)</label>
        <textarea className="input w-full min-h-[140px] font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
        <p className="text-xs text-gray-400 mt-1">Available variables: {VARIABLES.map((v) => `{{${v}}}`).join(', ')}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onSave({ name, platform: platform || null, content })} loading={saving}>Save Template</Button>
      </div>
    </div>
  );
}

export default function AutoposterCaptionTemplatesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery('autoposter-caption-templates', () => autoposterAPI.listCaptionTemplates());
  const templates = data?.data?.data || [];

  const saveMutation = useMutation(
    (payload) => (modal?._id ? autoposterAPI.updateCaptionTemplate(modal._id, payload) : autoposterAPI.createCaptionTemplate(payload)),
    {
      onSuccess: () => { toast.success('Template saved'); queryClient.invalidateQueries('autoposter-caption-templates'); setModal(null); },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to save template'),
    }
  );

  const deleteMutation = useMutation((id) => autoposterAPI.deleteCaptionTemplate(id), {
    onSuccess: () => { toast.success('Template deleted'); queryClient.invalidateQueries('autoposter-caption-templates'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete template'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caption Templates</h1>
          <p className="text-gray-500 mt-1">Reusable Handlebars captions for product auto-posts.</p>
        </div>
        <Button onClick={() => setModal('new')}><IoAdd size={20} className="mr-2" />New Template</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p>Loading…</p> : templates.map((t) => (
          <Card key={t._id}>
            <h3 className="font-semibold mb-1">{t.name}</h3>
            <p className="text-xs text-gray-400 mb-2">{t.platform || 'Universal'}</p>
            <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap line-clamp-3">{t.content}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setModal(t)}><IoCreate size={16} className="mr-1" />Edit</Button>
              <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(t._id)}><IoTrash size={16} className="mr-1" />Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?._id ? `Edit ${modal.name}` : 'New Template'} size="lg" showFooter={false}>
        <TemplateForm key={modal?._id || 'new'} initial={modal !== 'new' ? modal : null} saving={saveMutation.isLoading} onSave={(payload) => saveMutation.mutate(payload)} />
      </Modal>
    </div>
  );
}
