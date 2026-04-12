import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { b2bkingAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import {
  IoAdd, IoTrash, IoCreate, IoPeople, IoSearch,
  IoFlash, IoPaperPlane, IoRefresh, IoClose
} from 'react-icons/io5';

// ---------------------------------------------------------------------------
// Rule builder config — defines available fields, their operators, and value
// input types for the dynamic group membership rule engine.
// ---------------------------------------------------------------------------

const RULE_FIELDS = [
  { value: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'non-binary', 'prefer_not_to_say'] },
  { value: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'] },
  { value: 'householdSize', label: 'Household Size', type: 'number' },
  { value: 'employmentStatus', label: 'Employment Status', type: 'select', options: ['employed', 'self_employed', 'student', 'retired', 'unemployed', 'prefer_not_to_say'] },
  { value: 'incomeRange', label: 'Income Range', type: 'select', options: ['<15k', '15k-30k', '30k-60k', '60k-120k', '>120k', 'prefer_not_to_say'] },
  { value: 'educationLevel', label: 'Education Level', type: 'text' },
  { value: 'province', label: 'Province', type: 'select', options: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'] },
  { value: 'suburb', label: 'Suburb', type: 'text' },
  { value: 'lifeStage', label: 'Life Stage', type: 'select', options: ['student', 'young_professional', 'new_parent', 'established_family', 'empty_nester', 'retiree'] },
  { value: 'customerSegment', label: 'Customer Segment', type: 'select', options: ['budget', 'value', 'premium', 'luxury'] },
  { value: 'churnRisk', label: 'Churn Risk', type: 'select', options: ['low', 'medium', 'high'] },
  { value: 'hobbies', label: 'Hobbies', type: 'text', arrayField: true },
  { value: 'interests', label: 'Interests', type: 'text', arrayField: true },
  { value: 'avgOrderValue', label: 'Avg Order Value (R)', type: 'number' },
  { value: 'purchaseFrequency', label: 'Purchase Frequency', type: 'select', options: ['daily', 'weekly', 'fortnightly', 'monthly', 'occasionally'] },
  { value: 'profileCompletionScore', label: 'Profile Completion (%)', type: 'number' },
  { value: 'marketingOptIn', label: 'Marketing Opt-In', type: 'boolean' },
];

const getOperatorsForField = (field) => {
  if (!field) return [];
  const config = RULE_FIELDS.find(f => f.value === field);
  if (!config) return [];
  if (config.type === 'boolean') return [{ value: 'eq', label: 'is' }];
  if (config.arrayField) return [
    { value: 'contains', label: 'contains' },
    { value: 'nin', label: 'does not contain' },
  ];
  if (config.type === 'number') return [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
  ];
  return [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
    { value: 'in', label: 'is one of' },
    { value: 'nin', label: 'is not one of' },
  ];
};

const emptyRule = () => ({ field: 'gender', operator: 'eq', value: '' });

// ---------------------------------------------------------------------------
// RuleRow — single rule editor row
// ---------------------------------------------------------------------------
const RuleRow = ({ rule, index, onChange, onRemove, canRemove }) => {
  const fieldConfig = RULE_FIELDS.find(f => f.value === rule.field) || {};
  const operators = getOperatorsForField(rule.field);

  const handleFieldChange = (newField) => {
    const newConfig = RULE_FIELDS.find(f => f.value === newField) || {};
    const newOps = getOperatorsForField(newField);
    onChange(index, { field: newField, operator: newOps[0]?.value || 'eq', value: newConfig.type === 'boolean' ? 'true' : '' });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Field */}
      <select
        className="select select-bordered select-sm flex-1"
        value={rule.field}
        onChange={(e) => handleFieldChange(e.target.value)}
      >
        {RULE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      {/* Operator */}
      <select
        className="select select-bordered select-sm w-36"
        value={rule.operator}
        onChange={(e) => onChange(index, { ...rule, operator: e.target.value })}
      >
        {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>

      {/* Value */}
      {fieldConfig.type === 'boolean' ? (
        <select
          className="select select-bordered select-sm w-28"
          value={rule.value}
          onChange={(e) => onChange(index, { ...rule, value: e.target.value })}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : fieldConfig.type === 'select' ? (
        <select
          className="select select-bordered select-sm flex-1"
          value={rule.value}
          onChange={(e) => onChange(index, { ...rule, value: e.target.value })}
        >
          <option value="">— select —</option>
          {(fieldConfig.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className="input input-bordered input-sm flex-1"
          placeholder={fieldConfig.type === 'number' ? '0' : 'value'}
          type={fieldConfig.type === 'number' ? 'number' : 'text'}
          value={rule.value}
          onChange={(e) => onChange(index, { ...rule, value: e.target.value })}
        />
      )}

      {/* Remove */}
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square text-red-400"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
      >
        <IoClose size={14} />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CustomerGroupsPage
// ---------------------------------------------------------------------------
const CustomerGroupsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isActiveFilter, setIsActiveFilter] = useState('');

  // Dynamic rule state (outside react-hook-form because it's complex nested state)
  const [isDynamic, setIsDynamic] = useState(false);
  const [ruleLogic, setRuleLogic] = useState('and');
  const [rules, setRules] = useState([emptyRule()]);
  const [previewCount, setPreviewCount] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      defaultDiscount: 0,
      minimumOrderAmount: 0,
      minimumOrderQuantity: 0,
      paymentTerms: 'immediate',
      customPaymentTerms: '',
      creditLimit: 0,
      taxExempt: false,
      showPrices: true,
      showRetailPrices: false,
      isActive: true,
      priority: 0,
    }
  });

  const { data, isLoading } = useQuery(
    ['customer-groups', page, search, isActiveFilter],
    () => b2bkingAPI.getCustomerGroups({
      page,
      limit: 20,
      search: search.length >= 2 ? search : undefined,
      isActive: isActiveFilter || undefined
    }),
    { keepPreviousData: true }
  );

  const saveMutation = useMutation(
    (formData) => {
      const payload = {
        ...formData,
        isDynamic,
        rules: isDynamic ? rules : [],
        ruleLogic: isDynamic ? ruleLogic : 'and',
      };
      return editingGroup
        ? b2bkingAPI.updateCustomerGroup(editingGroup._id, payload)
        : b2bkingAPI.createCustomerGroup(payload);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customer-groups');
        toast.success(`Customer group ${editingGroup ? 'updated' : 'created'} successfully`);
        closeForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save customer group');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => b2bkingAPI.deleteCustomerGroup(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customer-groups');
        toast.success('Customer group deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete customer group');
      },
    }
  );

  const syncMutation = useMutation(
    (id) => b2bkingAPI.syncGroupMembers(id),
    {
      onSuccess: (_, id) => {
        queryClient.invalidateQueries('customer-groups');
        toast.success('Group membership synced.');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Sync failed'),
    }
  );

  const closeForm = () => {
    setShowForm(false);
    setEditingGroup(null);
    setIsDynamic(false);
    setRuleLogic('and');
    setRules([emptyRule()]);
    setPreviewCount(null);
    reset();
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setIsDynamic(group.isDynamic || false);
    setRuleLogic(group.ruleLogic || 'and');
    setRules(group.rules?.length ? group.rules : [emptyRule()]);
    setPreviewCount(null);
    reset({
      name: group.name,
      description: group.description || '',
      defaultDiscount: group.defaultDiscount || 0,
      minimumOrderAmount: group.minimumOrderAmount || 0,
      minimumOrderQuantity: group.minimumOrderQuantity || 0,
      paymentTerms: group.paymentTerms || 'immediate',
      customPaymentTerms: group.customPaymentTerms || '',
      creditLimit: group.creditLimit || 0,
      taxExempt: group.taxExempt || false,
      showPrices: group.showPrices !== false,
      showRetailPrices: group.showRetailPrices || false,
      isActive: group.isActive !== false,
      priority: group.priority || 0,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingGroup(null);
    setIsDynamic(false);
    setRuleLogic('and');
    setRules([emptyRule()]);
    setPreviewCount(null);
    reset();
    setShowForm(true);
  };

  const handleRuleChange = useCallback((index, updated) => {
    setRules(prev => prev.map((r, i) => i === index ? updated : r));
    setPreviewCount(null);
  }, []);

  const handleRuleRemove = useCallback((index) => {
    setRules(prev => prev.filter((_, i) => i !== index));
    setPreviewCount(null);
  }, []);

  const handleAddRule = () => {
    setRules(prev => [...prev, emptyRule()]);
    setPreviewCount(null);
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const res = await b2bkingAPI.previewGroupCount({ rules, ruleLogic });
      setPreviewCount(res.data?.count ?? 0);
    } catch (e) {
      toast.error('Preview failed — check your rules');
    } finally {
      setIsPreviewing(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{row.name}</span>
            {row.isDynamic && (
              <span className="badge badge-xs badge-info gap-1">
                <IoFlash size={10} /> Dynamic
              </span>
            )}
          </div>
          {row.description && (
            <div className="text-sm text-gray-500">{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Default Discount',
      accessor: 'defaultDiscount',
      cell: (row) => (
        <span className="text-green-600 font-medium">
          {row.defaultDiscount > 0 ? `${row.defaultDiscount}%` : '-'}
        </span>
      )
    },
    {
      header: 'Customers',
      accessor: 'customerCount',
      cell: (row) => (
        <span className="text-gray-600">{row.customerCount || 0}</span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      cell: (row) => (
        <span className="text-gray-600">{row.priority || 0}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-xs btn-square"
            title="Edit"
            onClick={() => handleEdit(row)}
          >
            <IoCreate size={16} />
          </button>
          {row.isDynamic && (
            <button
              className="btn btn-ghost btn-xs btn-square text-blue-500"
              title="Sync membership"
              onClick={() => syncMutation.mutate(row._id)}
              disabled={syncMutation.isLoading}
            >
              <IoRefresh size={14} />
            </button>
          )}
          <button
            className="btn btn-ghost btn-xs btn-square text-violet-500"
            title="Send campaign to this group"
            onClick={() => navigate(`/emails?group=${row._id}&groupName=${encodeURIComponent(row.name)}`)}
          >
            <IoPaperPlane size={14} />
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-red-500"
            title="Delete"
            onClick={() => setDeleteModal(row)}
          >
            <IoTrash size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IoPeople size={28} />
            Customer Groups
          </h1>
          <p className="text-gray-600 mt-1">Manage customer groups, B2B pricing tiers, and dynamic segments</p>
        </div>
        <Button onClick={handleNew}>
          <IoAdd size={20} className="mr-2" />
          New Group
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search customer groups..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Active Only' },
                { value: 'false', label: 'Inactive Only' }
              ]}
              className="w-40"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={data?.data?.data || []}
          isLoading={isLoading}
          pagination={{
            page,
            totalPages: data?.data?.pagination?.pages || 1,
            onPageChange: setPage
          }}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingGroup ? 'Edit Customer Group' : 'New Customer Group'}
        size="large"
      >
        <form onSubmit={handleSubmit(saveMutation.mutate)} className="space-y-4">
          <Input
            label="Name *"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Description"
            type="textarea"
            rows={2}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Discount (%)"
              type="number"
              min="0"
              max="100"
              {...register('defaultDiscount', { valueAsNumber: true })}
            />
            <Input
              label="Priority"
              type="number"
              {...register('priority', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Order Amount"
              type="number"
              min="0"
              {...register('minimumOrderAmount', { valueAsNumber: true })}
            />
            <Input
              label="Minimum Order Quantity"
              type="number"
              min="0"
              {...register('minimumOrderQuantity', { valueAsNumber: true })}
            />
          </div>

          <Select
            label="Payment Terms"
            {...register('paymentTerms')}
            options={[
              { value: 'immediate', label: 'Immediate' },
              { value: 'net_7', label: 'Net 7' },
              { value: 'net_15', label: 'Net 15' },
              { value: 'net_30', label: 'Net 30' },
              { value: 'net_60', label: 'Net 60' },
              { value: 'custom', label: 'Custom' }
            ]}
          />

          <Input
            label="Credit Limit"
            type="number"
            min="0"
            {...register('creditLimit', { valueAsNumber: true })}
          />

          <div className="flex flex-wrap gap-4">
            {[
              { name: 'taxExempt', label: 'Tax Exempt' },
              { name: 'showPrices', label: 'Show Prices' },
              { name: 'showRetailPrices', label: 'Show Retail Prices' },
              { name: 'isActive', label: 'Active' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register(name)} className="checkbox checkbox-primary checkbox-sm" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          {/* ----------------------------------------------------------------
              Dynamic Rule Builder
          ---------------------------------------------------------------- */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 flex items-center gap-1.5">
                  <IoFlash size={16} className="text-blue-500" />
                  Dynamic Membership Rules
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customers are added/removed automatically based on their demographics
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDynamic}
                  onChange={(e) => {
                    setIsDynamic(e.target.checked);
                    setPreviewCount(null);
                  }}
                  className="toggle toggle-primary toggle-sm"
                />
                <span className="text-sm font-medium text-gray-700">
                  {isDynamic ? 'Dynamic' : 'Manual'}
                </span>
              </label>
            </div>

            {isDynamic && (
              <div className="space-y-3">
                {/* Logic toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Match</span>
                  <div className="join">
                    <button
                      type="button"
                      className={`btn btn-xs join-item ${ruleLogic === 'and' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setRuleLogic('and')}
                    >
                      ALL rules
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs join-item ${ruleLogic === 'or' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setRuleLogic('or')}
                    >
                      ANY rule
                    </button>
                  </div>
                </div>

                {/* Rule rows */}
                <div className="space-y-2">
                  {rules.map((rule, i) => (
                    <RuleRow
                      key={i}
                      rule={rule}
                      index={i}
                      onChange={handleRuleChange}
                      onRemove={handleRuleRemove}
                      canRemove={rules.length > 1}
                    />
                  ))}
                </div>

                {/* Add rule + Preview */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs gap-1"
                    onClick={handleAddRule}
                  >
                    <IoAdd size={14} /> Add rule
                  </button>
                  <div className="flex-1" />
                  {previewCount !== null && (
                    <span className="text-sm text-blue-700 font-medium">
                      ~{previewCount} customers match
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handlePreview}
                    disabled={isPreviewing}
                  >
                    {isPreviewing
                      ? <span className="loading loading-spinner loading-xs" />
                      : 'Preview count'
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isLoading}>
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Customer Group"
      >
        <p className="mb-4">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>?
          {deleteModal?.customerCount > 0 && (
            <span className="block mt-2 text-red-600">
              This group has {deleteModal.customerCount} customer(s) assigned. You must reassign them first.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteModal._id)}
            loading={deleteMutation.isLoading}
            disabled={deleteModal?.customerCount > 0}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerGroupsPage;
