import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { whatsappAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoPaperPlane, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

const EVENTS = [
  'order_confirmed', 'order_shipped', 'order_delivered', 'layby_reminder',
  'recurring_renewal', 'abandoned_cart', 'otp', 'broadcast', 'welcome', 'manual'
];

const WhatsAppPage = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testBody, setTestBody] = useState('Hi from PesaShop! 👋');

  const { data: status } = useQuery('whatsapp-status', () => whatsappAPI.status());
  const { data: tplData } = useQuery('whatsapp-templates', () => whatsappAPI.list());
  const templates = tplData?.data?.data || [];
  const s = status?.data?.data || {};

  const save = useMutation((t) => t._id ? whatsappAPI.update(t._id, t) : whatsappAPI.create(t), {
    onSuccess: () => { qc.invalidateQueries('whatsapp-templates'); toast.success('Saved'); setEditing(null); }
  });
  const remove = useMutation((id) => whatsappAPI.remove(id), {
    onSuccess: () => { qc.invalidateQueries('whatsapp-templates'); toast.success('Deleted'); }
  });
  const testSend = useMutation(() => whatsappAPI.testSend({ phone: testPhone, body: testBody }), {
    onSuccess: (res) => {
      const d = res?.data;
      if (d?.messageId) {
        toast.success(`Meta accepted message ${d.messageId.slice(-10)}. If your phone didn't receive it, the recipient probably isn't on the test number's allowed list, OR the 24h window hasn't been opened — try the hello_world button instead.`, { duration: 10000 });
      } else {
        toast.success('Sent (no message ID returned)');
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Send failed', { duration: 10000 })
  });

  const testHello = useMutation(() => whatsappAPI.testHelloWorld(testPhone), {
    onSuccess: (res) => {
      const d = res?.data;
      toast.success(d?.message || 'hello_world template sent', { duration: 10000 });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Send failed', { duration: 10000 })
  });

  const blankTemplate = { name: '', metaTemplateName: '', language: 'en', category: 'UTILITY', status: 'draft', triggerEvent: 'manual', bodyTemplate: '', isActive: true };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">WhatsApp Commerce</h1>
        <p className="text-sm text-gray-500">Configure Meta Cloud API templates and trigger events.</p>
      </div>

      <Card>
        <div className="p-5 space-y-2">
          <h2 className="font-semibold">Connection</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Configured" value={s.configured ? <span className="text-green-600 flex items-center gap-1"><IoCheckmarkCircle /> Yes</span> : <span className="text-rose-600 flex items-center gap-1"><IoCloseCircle /> No</span>} />
            <Row label="Phone Number ID" value={s.phoneNumberId} />
            <Row label="API Token" value={s.token} />
            <Row label="Verify Token" value={s.verifyToken} />
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
            <p className="font-semibold mb-1">Webhook URL (paste into Meta Developer Console):</p>
            <code className="break-all">{s.webhookUrl}</code>
            <p className="mt-2 text-gray-500">Set <code>WHATSAPP_CLOUD_API_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code> and <code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code> in Railway env vars.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 space-y-3">
          <h2 className="font-semibold">Send a test message</h2>
          <div className="flex gap-2 flex-wrap">
            <input className="input input-bordered input-sm flex-1 min-w-[200px]" placeholder="27821234567" value={testPhone} onChange={e => setTestPhone(e.target.value)} />
            <input className="input input-bordered input-sm flex-1 min-w-[300px]" value={testBody} onChange={e => setTestBody(e.target.value)} />
            <Button onClick={() => testSend.mutate()} disabled={!testPhone || testSend.isLoading}><IoPaperPlane className="mr-1" /> Send free-form</Button>
            <Button onClick={() => testHello.mutate()} disabled={!testPhone || testHello.isLoading} className="bg-green-600 hover:bg-green-700"><IoPaperPlane className="mr-1" /> Send hello_world</Button>
          </div>
          <p className="text-xs text-gray-500">
            <strong>Free-form</strong> only works within 24h of the recipient messaging you. <strong>hello_world</strong> is a Meta pre-approved template — works any time and is the right way to confirm your setup is correct.
          </p>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Message Templates</h2>
        <Button onClick={() => setEditing(blankTemplate)}><IoAdd className="mr-1" /> New template</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Trigger</th><th>Meta Name</th><th>Status</th><th>Active</th><th>Sent</th><th></th></tr></thead>
            <tbody>
              {templates.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td><span className="badge badge-ghost text-xs">{t.triggerEvent}</span></td>
                  <td className="font-mono text-xs">{t.metaTemplateName}</td>
                  <td><span className={`badge ${t.status === 'approved' ? 'badge-success' : t.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{t.status}</span></td>
                  <td>{t.isActive ? 'Yes' : 'No'}</td>
                  <td>{t.stats?.sent || 0}</td>
                  <td>
                    <button className="btn btn-xs btn-ghost" onClick={() => setEditing(t)}>Edit</button>
                    <button className="btn btn-xs btn-ghost text-rose-600" onClick={() => { if (confirm('Delete template?')) remove.mutate(t._id); }}><IoTrash /></button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">No templates yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing._id ? 'Edit' : 'New'} template</h3>
            <input className="input input-bordered w-full input-sm" placeholder="Friendly name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            <input className="input input-bordered w-full input-sm font-mono" placeholder="meta_template_name" value={editing.metaTemplateName} onChange={e => setEditing({ ...editing, metaTemplateName: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="select select-bordered select-sm" value={editing.triggerEvent} onChange={e => setEditing({ ...editing, triggerEvent: e.target.value })}>
                {EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
              <select className="select select-bordered select-sm" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                <option value="draft">draft</option>
                <option value="submitted">submitted</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <textarea className="textarea textarea-bordered w-full" rows={5} placeholder="Body template (use {{name}} {{order_number}} etc.)" value={editing.bodyTemplate} onChange={e => setEditing({ ...editing, bodyTemplate: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} /> Active
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <Button onClick={() => save.mutate(editing)}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between"><span className="text-gray-500">{label}:</span><span className="font-medium">{value}</span></div>
);

export default WhatsAppPage;
