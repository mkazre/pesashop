import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { loyaltyAPI, productsAPI, categoriesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoCreate, IoTrash, IoCheckmark, IoClose } from 'react-icons/io5';

const LoyaltyRulesPage = () => {
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleTypeFilter, setRuleTypeFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['loyalty-rules', ruleTypeFilter],
    () => loyaltyAPI.getRules({ ruleType: ruleTypeFilter || undefined }),
    { keepPreviousData: true }
  );

  const { data: productsData } = useQuery(
    'products-for-rules',
    () => productsAPI.getAll({ limit: 1000 }),
    { enabled: createModal || editModal }
  );

  const { data: categoriesData } = useQuery(
    'categories-for-rules',
    () => categoriesAPI.getAll(),
    { enabled: createModal || editModal }
  );

  const { data: levelsData } = useQuery(
    'loyalty-levels',
    () => loyaltyAPI.getLevels(),
    { enabled: createModal || editModal }
  );

  const createMutation = useMutation(
    (data) => loyaltyAPI.createRule(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-rules');
        toast.success('Rule created successfully');
        setCreateModal(false);
        setEditingRule(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create rule');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => loyaltyAPI.updateRule(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-rules');
        toast.success('Rule updated successfully');
        setEditModal(false);
        setEditingRule(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update rule');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => loyaltyAPI.deleteRule(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loyalty-rules');
        toast.success('Rule deleted successfully');
        setDeleteModal(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete rule');
      },
    }
  );

  const handleCreate = () => {
    createMutation.mutate(editingRule);
  };

  const handleUpdate = () => {
    updateMutation.mutate({ id: editingRule._id, data: editingRule });
  };

  const handleEdit = (rule) => {
    setEditingRule({ ...rule });
    setEditModal(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Rule Name',
      render: (name, row) => (
        <div>
          <p className="font-medium">{name}</p>
          {row.description && (
            <p className="text-sm text-gray-500">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ruleType',
      title: 'Type',
      render: (type) => {
        if (type === 'earning') return <span className="badge badge-success">Earning</span>;
        if (type === 'redemption') return <span className="badge badge-info">Redemption</span>;
        if (type === 'profile_complete') return <span className="badge badge-warning">Profile Complete</span>;
        return <span className="badge badge-ghost">{type}</span>;
      },
    },
    {
      key: 'priority',
      title: 'Priority',
      align: 'center',
      render: (priority) => priority || 0,
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (isActive) => (
        <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'usageCount',
      title: 'Used',
      align: 'center',
      render: (count) => count || 0,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
            title="Edit Rule"
          >
            <IoCreate size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
            title="Delete Rule"
          >
            <IoTrash size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const rules = data?.data?.data || data?.data || [];
  const products = productsData?.data?.data || productsData?.data || [];
  const categories = categoriesData?.data?.data || categoriesData?.data || [];
  const levels = levelsData?.data?.data || levelsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loyalty Rules</h1>
        <div className="flex items-center gap-4">
          <select
            value={ruleTypeFilter}
            onChange={(e) => setRuleTypeFilter(e.target.value)}
            className="input"
          >
            <option value="">All Rules</option>
            <option value="earning">Earning Rules</option>
            <option value="redemption">Redemption Rules</option>
          </select>
          <Button
            onClick={() => {
              setEditingRule({
                name: '',
                description: '',
                ruleType: 'earning',
                pointsPerCurrency: null,
                pointsPerCurrencyPercentage: null,
                fixedPoints: null,
                priceBase: 'regular',
                applyToProducts: [],
                excludeProducts: [],
                applyToCategories: [],
                excludeCategories: [],
                applyToRoles: [],
                excludeRoles: [],
                applyToGroups: [],
                excludeGroups: [],
                applyToLevels: [],
                excludeLevels: [],
                minPrice: null,
                maxPrice: null,
                excludeOnSale: false,
                redemptionType: 'fixed',
                redemptionRate: null,
                minRedemptionPoints: null,
                maxRedemptionPoints: null,
                maxRedemptionPercentage: null,
                minCartAmount: null,
                allowFreeShipping: false,
                priority: 0,
                isActive: true
              });
              setCreateModal(true);
            }}
          >
            <IoAdd size={18} />
            Create Rule
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={rules}
          loading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModal || editModal}
        onClose={() => {
          setCreateModal(false);
          setEditModal(false);
          setEditingRule(null);
        }}
        title={editModal ? 'Edit Loyalty Rule' : 'Create Loyalty Rule'}
        onConfirm={editModal ? handleUpdate : handleCreate}
        confirmText={editModal ? 'Update Rule' : 'Create Rule'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        size="xl"
      >
        {editingRule && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rule Name *</label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingRule.description || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    rows={2}
                    className="input w-full resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rule Type *</label>
                    <select
                      value={editingRule.ruleType}
                      onChange={(e) => setEditingRule({ ...editingRule, ruleType: e.target.value })}
                      className="input w-full"
                      required
                    >
                      <option value="earning">Earning Rule</option>
                      <option value="redemption">Redemption Rule</option>
                      <option value="profile_complete">Profile Completion Reward</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <Input
                      type="number"
                      value={editingRule.priority || 0}
                      onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher priority rules are checked first</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRule.isActive !== false}
                    onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* Earning Rule Settings */}
            {editingRule.ruleType === 'earning' && (
              <div>
                <h3 className="font-semibold mb-4">Points Calculation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Base</label>
                    <select
                      value={editingRule.priceBase || 'regular'}
                      onChange={(e) => setEditingRule({ ...editingRule, priceBase: e.target.value })}
                      className="input w-full"
                    >
                      <option value="backend">Backend Price (Cost Price)</option>
                      <option value="regular">Regular Price</option>
                      <option value="sale">Sale/Promo Price</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Fixed Points</label>
                      <Input
                        type="number"
                        value={editingRule.fixedPoints || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          fixedPoints: e.target.value ? parseInt(e.target.value) : null,
                          pointsPerCurrency: null,
                          pointsPerCurrencyPercentage: null
                        })}
                        min="0"
                        placeholder="Fixed amount"
                      />
                      <p className="text-xs text-gray-500 mt-1">Per product/item</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Points Per Currency</label>
                      <Input
                        type="number"
                        value={editingRule.pointsPerCurrency || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          pointsPerCurrency: e.target.value ? parseFloat(e.target.value) : null,
                          fixedPoints: null,
                          pointsPerCurrencyPercentage: null
                        })}
                        min="0"
                        step="0.01"
                        placeholder="e.g., 1.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Per R1 spent</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Points Percentage (%)</label>
                      <Input
                        type="number"
                        value={editingRule.pointsPerCurrencyPercentage || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          pointsPerCurrencyPercentage: e.target.value ? parseFloat(e.target.value) : null,
                          fixedPoints: null,
                          pointsPerCurrency: null
                        })}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g., 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">% of price</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Only one calculation method can be used. Set the others to empty/null.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Completion Reward Settings */}
            {editingRule.ruleType === 'profile_complete' && (
              <div>
                <h3 className="font-semibold mb-4">Profile Completion Reward</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>How it works:</strong> When a customer fills in all required demographic fields and reaches
                      100% profile completion for the first time, they automatically receive the points set below.
                      Only one active Profile Completion Reward rule is used at a time.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">PESA Coins Reward Amount *</label>
                    <Input
                      type="number"
                      value={editingRule.fixedPoints || ''}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        fixedPoints: e.target.value ? parseInt(e.target.value) : null,
                        pointsPerCurrency: null,
                        pointsPerCurrencyPercentage: null
                      })}
                      min="1"
                      placeholder="e.g. 500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Points awarded once when profile reaches 100% completion.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Redemption Rule Settings */}
            {editingRule.ruleType === 'redemption' && (
              <div>
                <h3 className="font-semibold mb-4">Redemption Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Redemption Type</label>
                    <select
                      value={editingRule.redemptionType || 'fixed'}
                      onChange={(e) => setEditingRule({ ...editingRule, redemptionType: e.target.value })}
                      className="input w-full"
                    >
                      <option value="fixed">Fixed (points per currency unit)</option>
                      <option value="percentage">Percentage (of order total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Redemption Rate</label>
                    <Input
                      type="number"
                      value={editingRule.redemptionRate || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, redemptionRate: e.target.value ? parseFloat(e.target.value) : null })}
                      min="0"
                      step="0.01"
                      placeholder={editingRule.redemptionType === 'fixed' ? 'e.g., 0.1 (R0.10 per point)' : 'e.g., 0.1 (10%)'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Redemption Points</label>
                      <Input
                        type="number"
                        value={editingRule.minRedemptionPoints || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, minRedemptionPoints: e.target.value ? parseInt(e.target.value) : null })}
                        min="0"
                        placeholder="No minimum"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Redemption Points</label>
                      <Input
                        type="number"
                        value={editingRule.maxRedemptionPoints || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, maxRedemptionPoints: e.target.value ? parseInt(e.target.value) : null })}
                        min="0"
                        placeholder="No maximum"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Redemption Percentage (%)</label>
                    <Input
                      type="number"
                      value={editingRule.maxRedemptionPercentage || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, maxRedemptionPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                      min="0"
                      max="100"
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Cart Amount (R)</label>
                    <Input
                      type="number"
                      value={editingRule.minCartAmount || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, minCartAmount: e.target.value ? parseFloat(e.target.value) : null })}
                      min="0"
                      step="0.01"
                      placeholder="No minimum"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingRule.allowFreeShipping || false}
                      onChange={(e) => setEditingRule({ ...editingRule, allowFreeShipping: e.target.checked })}
                      className="checkbox checkbox-primary"
                    />
                    <label className="text-sm font-medium">Allow free shipping on redemption</label>
                  </div>
                </div>
              </div>
            )}

            {/* Conditions — not applicable for profile_complete rules */}
            {editingRule.ruleType !== 'profile_complete' && <div>
              <h3 className="font-semibold mb-4">Conditions</h3>
              <div className="space-y-4">
                {/* Products */}
                <div>
                  <label className="block text-sm font-medium mb-2">Apply to Products</label>
                  <select
                    multiple
                    value={editingRule.applyToProducts?.map(p => p._id || p) || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setEditingRule({ ...editingRule, applyToProducts: selected });
                    }}
                    className="input w-full h-32"
                  >
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} (SKU: {product.sku})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple. Leave empty for all products.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Exclude Products</label>
                  <select
                    multiple
                    value={editingRule.excludeProducts?.map(p => p._id || p) || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setEditingRule({ ...editingRule, excludeProducts: selected });
                    }}
                    className="input w-full h-32"
                  >
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} (SKU: {product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium mb-2">Apply to Categories</label>
                  <select
                    multiple
                    value={editingRule.applyToCategories?.map(c => c._id || c) || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setEditingRule({ ...editingRule, applyToCategories: selected });
                    }}
                    className="input w-full h-32"
                  >
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Leave empty for all categories.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Exclude Categories</label>
                  <select
                    multiple
                    value={editingRule.excludeCategories?.map(c => c._id || c) || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setEditingRule({ ...editingRule, excludeCategories: selected });
                    }}
                    className="input w-full h-32"
                  >
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Roles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Apply to Roles</label>
                    <div className="space-y-2">
                      {['customer', 'retail', 'wholesale', 'vip'].map(role => (
                        <div key={role} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(editingRule.applyToRoles || []).includes(role)}
                            onChange={(e) => {
                              const current = editingRule.applyToRoles || [];
                              if (e.target.checked) {
                                setEditingRule({ ...editingRule, applyToRoles: [...current, role] });
                              } else {
                                setEditingRule({ ...editingRule, applyToRoles: current.filter(r => r !== role) });
                              }
                            }}
                            className="checkbox checkbox-primary"
                          />
                          <label className="text-sm capitalize">{role}</label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave empty for all roles.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Exclude Roles</label>
                    <div className="space-y-2">
                      {['customer', 'retail', 'wholesale', 'vip'].map(role => (
                        <div key={role} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(editingRule.excludeRoles || []).includes(role)}
                            onChange={(e) => {
                              const current = editingRule.excludeRoles || [];
                              if (e.target.checked) {
                                setEditingRule({ ...editingRule, excludeRoles: [...current, role] });
                              } else {
                                setEditingRule({ ...editingRule, excludeRoles: current.filter(r => r !== role) });
                              }
                            }}
                            className="checkbox checkbox-primary"
                          />
                          <label className="text-sm capitalize">{role}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Customer Groups */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Apply to Customer Groups</label>
                    <Input
                      value={(editingRule.applyToGroups || []).join(', ')}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        applyToGroups: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                      })}
                      placeholder="retail, wholesale, vip"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated. Leave empty for all groups.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Exclude Customer Groups</label>
                    <Input
                      value={(editingRule.excludeGroups || []).join(', ')}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        excludeGroups: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                      })}
                      placeholder="retail, wholesale"
                    />
                  </div>
                </div>

                {/* Loyalty Levels */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Apply to Levels</label>
                    <select
                      multiple
                      value={editingRule.applyToLevels?.map(l => l._id || l) || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setEditingRule({ ...editingRule, applyToLevels: selected });
                      }}
                      className="input w-full h-32"
                    >
                      {levels.map(level => (
                        <option key={level._id} value={level._id}>
                          {level.name} ({level.minPoints}+ points)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Exclude Levels</label>
                    <select
                      multiple
                      value={editingRule.excludeLevels?.map(l => l._id || l) || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setEditingRule({ ...editingRule, excludeLevels: selected });
                      }}
                      className="input w-full h-32"
                    >
                      {levels.map(level => (
                        <option key={level._id} value={level._id}>
                          {level.name} ({level.minPoints}+ points)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Price (R)</label>
                    <Input
                      type="number"
                      value={editingRule.minPrice || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, minPrice: e.target.value ? parseFloat(e.target.value) : null })}
                      min="0"
                      step="0.01"
                      placeholder="No minimum"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Maximum Price (R)</label>
                    <Input
                      type="number"
                      value={editingRule.maxPrice || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, maxPrice: e.target.value ? parseFloat(e.target.value) : null })}
                      min="0"
                      step="0.01"
                      placeholder="No maximum"
                    />
                  </div>
                </div>

                {/* Exclude On Sale */}
                {editingRule.ruleType === 'earning' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingRule.excludeOnSale || false}
                      onChange={(e) => setEditingRule({ ...editingRule, excludeOnSale: e.target.checked })}
                      className="checkbox checkbox-primary"
                    />
                    <label className="text-sm font-medium">Exclude products on sale</label>
                  </div>
                )}
              </div>
            </div>}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Loyalty Rule"
        onConfirm={() => deleteMutation.mutate(deleteModal._id)}
        confirmText="Delete"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>?</p>
      </Modal>
    </div>
  );
};

export default LoyaltyRulesPage;
