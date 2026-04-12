import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoArrowBack, IoSave, IoEye, IoGift } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';

const DISPLAY_PAGES = [
  { value: 'home', label: 'Home Page' },
  { value: 'product_detail', label: 'Product Detail Page' },
  { value: 'checkout', label: 'Checkout Page' },
  { value: 'account', label: 'My Account / Dashboard' },
];

const defaultOffer = {
  title: '',
  shortDescription: '',
  description: '',
  logoUrl: '',
  bannerImageUrl: '',
  providerName: '',
  providerContact: '',
  offerType: 'contact_request',
  pricing: { amount: 0, currency: 'ZAR', billingCycle: 'once' },
  contactEmail: '',
  contactSubject: '',
  commissionRate: 0,
  terms: '',
  displayPages: ['account'],
  targetCustomerGroups: [],
  badgeText: '',
  badgeColor: '#3B82F6',
  ctaButtonText: 'Get This Offer',
  isActive: true,
  displayOrder: 0,
};

const OfferBuilderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id && id !== 'new');

  const [offer, setOffer] = useState(defaultOffer);
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const { isLoading: loadingOffer } = useQuery(
    ['offer-detail', id],
    () => offersAPI.getOne(id),
    {
      enabled: isEdit,
      onSuccess: (res) => {
        const d = res.data?.data;
        if (d) setOffer({ ...defaultOffer, ...d });
      },
      onError: () => toast.error('Failed to load offer')
    }
  );

  const saveMutation = useMutation(
    (data) => isEdit ? offersAPI.update(id, data) : offersAPI.create(data),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries('offers-admin');
        toast.success(isEdit ? 'Offer updated' : 'Offer created');
        if (!isEdit) navigate(`/offers/${res.data?.data?._id}`);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed')
    }
  );

  const set = (field, value) => setOffer(prev => ({ ...prev, [field]: value }));
  const setPricing = (field, value) => setOffer(prev => ({ ...prev, pricing: { ...prev.pricing, [field]: value } }));

  const togglePage = (page) => {
    setOffer(prev => ({
      ...prev,
      displayPages: prev.displayPages.includes(page)
        ? prev.displayPages.filter(p => p !== page)
        : [...prev.displayPages, page]
    }));
  };

  const handleSave = () => saveMutation.mutate(offer);

  const steps = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Type & Pricing' },
    { num: 3, label: 'Display' },
    { num: 4, label: 'Settings' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/offers')} className="btn btn-ghost btn-sm btn-square">
            <IoArrowBack size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Offer' : 'Create Offer'}</h1>
            <p className="text-sm text-gray-500">Build a compelling offer for your customers</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2" onClick={() => setShowPreview(!showPreview)}>
            <IoEye size={16} /> Preview
          </button>
          <Button onClick={handleSave} loading={saveMutation.isLoading}>
            <IoSave size={16} className="mr-2" /> {isEdit ? 'Update' : 'Publish'} Offer
          </Button>
        </div>
      </div>

      {/* Step navigation */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === s.num ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num ? 'bg-white text-primary' : 'bg-gray-300 text-white'
              }`}>{s.num}</span>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className="h-px w-4 bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Basics */}
      {step === 1 && (
        <Card>
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">Offer Basics</h3>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Offer Title *"
                value={offer.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Comprehensive Funeral Cover"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input
                  className="input input-bordered w-full"
                  value={offer.shortDescription}
                  maxLength={200}
                  onChange={(e) => set('shortDescription', e.target.value)}
                  placeholder="2-3 sentence summary shown on offer cards"
                />
                <p className="text-xs text-gray-400 mt-1">{offer.shortDescription.length}/200</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea
                  className="textarea textarea-bordered w-full h-32"
                  value={offer.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Full details about the offer, benefits, inclusions..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Logo URL"
                  value={offer.logoUrl}
                  onChange={(e) => set('logoUrl', e.target.value)}
                  placeholder="https://..."
                />
                <Input
                  label="Banner Image URL"
                  value={offer.bannerImageUrl}
                  onChange={(e) => set('bannerImageUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Provider / Partner Name"
                  value={offer.providerName}
                  onChange={(e) => set('providerName', e.target.value)}
                  placeholder="e.g. Momentum, Vodacom"
                />
                <Input
                  label="Provider Contact"
                  value={offer.providerContact}
                  onChange={(e) => set('providerContact', e.target.value)}
                  placeholder="email or phone"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2 — Type & Pricing */}
      {step === 2 && (
        <Card>
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">Offer Type & Pricing</h3>

            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Offer Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'purchasable', label: 'Purchasable', desc: 'Customer pays once and gets the offer.' },
                  { value: 'subscription', label: 'Subscription', desc: 'Customer pays on a recurring billing cycle.' },
                  { value: 'contact_request', label: 'Contact Request', desc: 'Customer requests info; you contact them.' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => set('offerType', t.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      offer.offerType === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-800">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing fields (hidden for contact_request) */}
            {offer.offerType !== 'contact_request' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered w-full"
                    value={offer.pricing.amount}
                    onChange={(e) => setPricing('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                {offer.offerType === 'subscription' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      className="select select-bordered w-full"
                      value={offer.pricing.billingCycle}
                      onChange={(e) => setPricing('billingCycle', e.target.value)}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input input-bordered w-full"
                    value={offer.commissionRate}
                    onChange={(e) => set('commissionRate', parseFloat(e.target.value) || 0)}
                    placeholder="0 if internal offer"
                  />
                </div>
              </div>
            )}

            {/* Contact settings (shown for contact_request) */}
            {offer.offerType === 'contact_request' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Email (receives lead notification)"
                  value={offer.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  placeholder="leads@yourdomain.com"
                />
                <Input
                  label="Email Subject"
                  value={offer.contactSubject}
                  onChange={(e) => set('contactSubject', e.target.value)}
                  placeholder="New lead for: Funeral Cover"
                />
              </div>
            )}

            {/* CTA button text */}
            <Input
              label="CTA Button Text"
              value={offer.ctaButtonText}
              onChange={(e) => set('ctaButtonText', e.target.value)}
              placeholder="Get This Offer"
            />
          </div>
        </Card>
      )}

      {/* Step 3 — Display */}
      {step === 3 && (
        <Card>
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">Display Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Show on Pages</label>
              <div className="grid grid-cols-2 gap-3">
                {DISPLAY_PAGES.map(p => (
                  <label key={p.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={offer.displayPages.includes(p.value)}
                      onChange={() => togglePage(p.value)}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="text-sm text-gray-700">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text (optional)</label>
                <input
                  className="input input-bordered w-full"
                  value={offer.badgeText}
                  onChange={(e) => set('badgeText', e.target.value)}
                  placeholder="e.g. Popular, New, Limited"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min="0"
                  className="input input-bordered w-full"
                  value={offer.displayOrder}
                  onChange={(e) => set('displayOrder', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4 — Settings */}
      {step === 4 && (
        <Card>
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">Advanced Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea
                className="textarea textarea-bordered w-full h-28"
                value={offer.terms}
                onChange={(e) => set('terms', e.target.value)}
                placeholder="Terms and conditions for this offer..."
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offer.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="toggle toggle-primary"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Offer Active</p>
                  <p className="text-xs text-gray-500">When inactive, this offer will not be shown to customers.</p>
                </div>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Preview */}
      {showPreview && (
        <Card>
          <div className="p-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Offer Card Preview</p>
            <div className="max-w-sm border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {offer.bannerImageUrl && (
                <img src={offer.bannerImageUrl} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {offer.logoUrl ? (
                    <img src={offer.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IoGift className="text-primary" size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {offer.badgeText && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 mb-1">
                        {offer.badgeText}
                      </span>
                    )}
                    <h4 className="font-semibold text-gray-800 text-sm leading-tight">{offer.title || 'Offer Title'}</h4>
                    {offer.providerName && <p className="text-xs text-gray-500 mt-0.5">by {offer.providerName}</p>}
                  </div>
                </div>
                {offer.shortDescription && (
                  <p className="text-xs text-gray-600 mb-3">{offer.shortDescription}</p>
                )}
                {offer.offerType !== 'contact_request' && offer.pricing.amount > 0 && (
                  <p className="text-sm font-bold text-gray-800 mb-3">
                    R{offer.pricing.amount.toFixed(2)}
                    {offer.offerType === 'subscription' && (
                      <span className="text-xs font-normal text-gray-500"> / {offer.pricing.billingCycle}</span>
                    )}
                  </p>
                )}
                <button className="btn btn-primary btn-sm w-full">
                  {offer.ctaButtonText || 'Get This Offer'}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          className="btn btn-ghost"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          ← Previous
        </button>
        {step < 4 ? (
          <button
            className="btn btn-primary"
            onClick={() => setStep(s => Math.min(4, s + 1))}
          >
            Next →
          </button>
        ) : (
          <Button onClick={handleSave} loading={saveMutation.isLoading}>
            <IoSave size={16} className="mr-2" /> {isEdit ? 'Update' : 'Publish'} Offer
          </Button>
        )}
      </div>
    </div>
  );
};

export default OfferBuilderPage;
