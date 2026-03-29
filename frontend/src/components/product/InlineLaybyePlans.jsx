import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { laybyPlansAPI } from '@/services/api';
import { useCurrencyStore, useAuthStore, useUIStore } from '@/store';
import toast from '@/utils/toast';

export default function InlineLaybyePlans({ product, settings, onLaybyeSelect }) {
  const { formatPrice } = useCurrencyStore();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [enabled, setEnabled] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const ld = settings?.laybyeDisplay || {};
  const productPrice = product?.salePrice || product?.regularPrice || 0;

  const { data: plansData } = useQuery(
    ['laybyPlans', product?._id],
    () => laybyPlansAPI.getActive(),
    { staleTime: 5 * 60 * 1000, enabled: !!product?._id }
  );

  const plans = useMemo(() => {
    const raw = plansData?.data?.data || plansData?.data || [];
    return (Array.isArray(raw) ? raw : []).filter(p => {
      if (!p.isActive) return false;
      if (p.minimumProductValue > 0 && productPrice < p.minimumProductValue) return false;
      if (p.maximumProductValue > 0 && productPrice > p.maximumProductValue) return false;
      return true;
    });
  }, [plansData, productPrice]);

  const selectedPlan = plans.find(p => p._id === selectedPlanId) || plans[0] || null;

  const calcDeposit = (plan) => {
    if (!plan) return 0;
    if (plan.depositAmount > 0) return Math.min(plan.depositAmount, productPrice);
    return (productPrice * (plan.depositPercentage || 20)) / 100;
  };

  const calcInstallment = (plan) => {
    if (!plan) return 0;
    const deposit = calcDeposit(plan);
    const remaining = productPrice - deposit;
    return remaining / (plan.numberOfPayments || 1);
  };

  const deposit = calcDeposit(selectedPlan);
  const installment = calcInstallment(selectedPlan);
  const totalPayable = deposit + installment * (selectedPlan?.numberOfPayments || 0);

  const handleToggle = (val) => {
    if (val && !isAuthenticated) {
      openAuthModal('login');
      toast('Please sign in or register to use laybye', { icon: '🔐' });
      return;
    }
    setEnabled(val);
    if (val && selectedPlan) {
      if (!selectedPlanId) setSelectedPlanId(selectedPlan._id);
      onLaybyeSelect?.({ plan: selectedPlan, deposit: calcDeposit(selectedPlan), installment: calcInstallment(selectedPlan) });
    } else {
      onLaybyeSelect?.(null);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan._id);
    onLaybyeSelect?.({ plan, deposit: calcDeposit(plan), installment: calcInstallment(plan) });
  };

  if (!plans.length) return null;

  const frequencyLabel = (freq) => {
    switch (freq) {
      case 'weekly': return '/week';
      case 'biweekly': return '/2 weeks';
      case 'monthly': return '/month';
      default: return '/month';
    }
  };

  return (
    <div className="laybye-section" style={{ borderTop: '1px solid #e5eae6', paddingTop: 16, marginTop: 12 }}>
      {/* Toggle */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ position: 'relative', marginTop: 2 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => handleToggle(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
          <div style={{
            width: 40, height: 20, borderRadius: 10,
            background: enabled ? '#1b5e35' : '#ccc',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2, left: enabled ? 22 : 2,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{ld.toggleIcon || '💳'}</span>
            <span>{ld.toggleLabel || 'Pay with Laybye'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#76889a', marginTop: 2 }}>
            {ld.toggleSubLabel || 'Split into monthly payments — no credit check'}
          </div>
        </div>
      </label>

      {/* Plan Cards */}
      {enabled && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: plans.length <= 4 ? `repeat(${plans.length}, 1fr)` : `repeat(${plans.length}, minmax(130px, 1fr))`, gap: 8, marginBottom: 14, overflowX: plans.length > 4 ? 'auto' : 'visible' }}>
            {plans.map((plan) => {
              const isSelected = plan._id === (selectedPlanId || plans[0]?._id);
              const dep = calcDeposit(plan);
              const inst = calcInstallment(plan);
              return (
                <button
                  key={plan._id}
                  onClick={() => handleSelectPlan(plan)}
                  style={{
                    padding: '12px 10px',
                    border: isSelected ? '2px solid #1b5e35' : '1px solid #e5eae6',
                    background: isSelected ? '#f0fdf4' : '#fff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative',
                    minWidth: plans.length > 4 ? 130 : undefined,
                  }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: -1, right: -1, background: '#1b5e35', color: '#fff', fontSize: 9, padding: '2px 6px', fontWeight: 700 }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{plan.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e35', marginTop: 4 }}>
                    {formatPrice(inst)}
                  </div>
                  <div style={{ fontSize: 11, color: '#76889a' }}>
                    {frequencyLabel(plan.frequency)}
                  </div>
                  <div style={{ fontSize: 10, color: '#76889a', marginTop: 4 }}>
                    Deposit: {formatPrice(dep)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Breakdown */}
          {selectedPlan && (
            <div style={{ background: '#fafbfc', border: '1px solid #e5eae6', padding: 14, fontSize: 13 }}>
              {ld.showDepositCalculation !== false && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#76889a' }}>Deposit ({selectedPlan.depositPercentage || 20}%)</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(deposit)}</span>
                </div>
              )}
              {ld.showMonthlyBreakdown !== false && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#76889a' }}>{selectedPlan.numberOfPayments}× installments</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(installment)}{frequencyLabel(selectedPlan.frequency)}</span>
                </div>
              )}
              {ld.showTotalPayable !== false && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5eae6', paddingTop: 6, marginTop: 4 }}>
                  <span style={{ fontWeight: 700 }}>Total payable</span>
                  <span style={{ fontWeight: 800, color: '#1b5e35' }}>{formatPrice(totalPayable)}</span>
                </div>
              )}
            </div>
          )}

          {/* Info Bullets */}
          {ld.showInfoBullets !== false && ld.infoBullets?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
              {ld.infoBullets.map((bullet, i) => (
                <span key={i} style={{ fontSize: 11, color: '#76889a' }}>{bullet}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
