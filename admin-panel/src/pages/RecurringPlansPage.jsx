import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurringOrdersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoPencil, IoArrowBack, IoCheckmark, IoClose, IoSave } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly (Every 2 Weeks)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'bimonthly', label: 'Every 2 Months' },
  { value: 'quarterly', label: 'Quarterly (Every 3 Months)' },
];

const defaultPlan = {
  name: '',
  description: '',
  frequency: 'monthly',
  minQuantity: 1,
  maxQuantity: 100,
  allowedPaymentModes: ['upfront', 'pay_as_you_go'],
  minProductValue: 0,
  maxProductValue: '',
  minInstances: 2,
  maxInstances: 24,
  isActive: true,
  displayOrder: 0,
};

const RecurringPlansPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultPlan);

  const { data, isLoading } = useQuery('recurring-plans-admin', () => recurringOrdersAPI.getPlans());
  const plans = data?.data?.data || [];

  const createMutation = useMutation((d) => recurringOrdersAPI.createPlan(d), {
    onSuccess: () => { queryClient.invalidateQueries('recurring-plans-admin'); resetForm(); toast.success('Plan created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error creating plan')
  });

  const updateMutation = useMutation(({ id, data }) => recurringOrdersAPI.updatePlan(id, data), {
    onSuccess: () => { queryClient.invalidateQueries('recurring-plans-admin'); resetForm(); toast.success('Plan updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error updating plan')
  });

  const deleteMutation = useMutation((id) => recurringOrdersAPI.deletePlan(id), {
    onSuccess: () => { queryClient.invalidateQueries('recurring-plans-admin'); toast.success('Plan deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error deleting plan')
  });

  const resetForm = () => { setForm(defaultPlan); setShowForm(false); setEditingId(null); };

  const startEdit = (plan) => {
    setForm({ ...defaultPlan, ...plan, maxProductValue: plan.maxProductValue || '' });
    setEditingId(plan._id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { ...form, maxProductValue: form.maxProductValue || undefined };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const toggleMode = (mode) => {
    setForm(prev => ({
      ...prev,
      allowedPaymentModes: prev.allowedPaymentModes.includes(mode)
        ? prev.allowedPaymentModes.filter(m => m !== mode)
        : [...prev.allowedPaymentModes, mode]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/recurring-orders')} className="btn btn-ghost btn-sm btn-square">
            <IoArrowBack size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Recurring Plans</h1>
            <p className="text-sm text-gray-500">Define frequency templates for recurring purchases</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <IoAdd size={18} className="mr-2" /> New Plan
        </Button>
      </div>

      {/* Plan Form */}
      {showForm && (
        <Card>
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit Plan' : 'New Recurring Plan'}</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Plan Name *"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Monthly Essentials"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                <select
                  className="select select-bordered w-full"
                  value={form.frequency}
                  onChange={(e) => setForm(f => ({ ...f, frequency: e.target.value }))}
                >
                  {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                className="input input-bordered w-full"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Payment Modes</label>
              <div className="flex gap-4">
                {[['upfront', 'Pay Upfront'], ['pay_as_you_go', 'Pay As You Go']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowedPaymentModes.includes(val)}
                      onChange={() => toggleMode(val)}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Min Quantity" type="number" min="1"
                value={form.minQuantity} onChange={(e) => setForm(f => ({ ...f, minQuantity: parseInt(e.target.value) || 1 }))} />
              <Input label="Max Quantity" type="number"
                value={form.maxQuantity} onChange={(e) => setForm(f => ({ ...f, maxQuantity: parseInt(e.target.value) || 100 }))} />
              <Input label="Min Product Value (R)" type="number" min="0"
                value={form.minProductValue} onChange={(e) => setForm(f => ({ ...f, minProductValue: parseFloat(e.target.value) || 0 }))} />
              <Input label="Max Product Value (R)" type="number" placeholder="No limit"
                value={form.maxProductValue} onChange={(e) => setForm(f => ({ ...f, maxProductValue: e.target.value }))} />
            </div>

            {form.allowedPaymentModes.includes('upfront') && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Min Deliveries (Upfront)" type="number" min="1"
                  value={form.minInstances} onChange={(e) => setForm(f => ({ ...f, minInstances: parseInt(e.target.value) || 2 }))} />
                <Input label="Max Deliveries (Upfront)" type="number"
                  value={form.maxInstances} onChange={(e) => setForm(f => ({ ...f, maxInstances: parseInt(e.target.value) || 24 }))} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input label="Display Order" type="number"
                value={form.displayOrder} onChange={(e) => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="toggle toggle-primary" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
              <Button onClick={handleSave} loading={createMutation.isLoading || updateMutation.isLoading}>
                <IoSave size={16} className="mr-2" /> Save Plan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Plans List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-36"><span className="loading loading-spinner loading-md text-primary" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No recurring plans yet. Create your first plan to enable recurring purchases.</p>
          </div>
        ) : (
          <div className="divide-y">
            {plans.map(plan => (
              <div key={plan._id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{plan.name}</p>
                    <span className={`badge badge-sm ${plan.isActive ? 'badge-success' : 'badge-ghost'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-xs text-gray-500">📅 {FREQ_OPTIONS.find(f => f.value === plan.frequency)?.label || plan.frequency}</span>
                    <span className="text-xs text-gray-500">Qty: {plan.minQuantity}–{plan.maxQuantity}</span>
                    {plan.allowedPaymentModes?.map(m => (
                      <span key={m} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {m === 'upfront' ? 'Upfront' : 'Pay As You Go'}
                      </span>
                    ))}
                    {plan.minProductValue > 0 && (
                      <span className="text-xs text-gray-500">Min: R{plan.minProductValue}</span>
                    )}
                    {plan.maxProductValue && (
                      <span className="text-xs text-gray-500">Max: R{plan.maxProductValue}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-sm btn-square" onClick={() => startEdit(plan)}>
                    <IoPencil size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-square text-red-500"
                    onClick={() => { if (window.confirm(`Delete plan "${plan.name}"?`)) deleteMutation.mutate(plan._id); }}
                  ><IoTrash size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecurringPlansPage;
