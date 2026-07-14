import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { autoposterAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoAdd, IoCreate, IoTrash, IoCheckmarkCircle } from 'react-icons/io5';

// Product Post Profile management (Spec 9.5.2). Exposes the base `config`
// switches from Spec 9.5.1; per-platform overrides (Spec 9.5.4) aren't
// editable from this UI yet — they can still be set directly via the API if
// needed. Flagged simplification, not a silent gap: this keeps the form to a
// manageable size for a first pass.
const DEFAULT_CONFIG = {
  images: 'featured_only', galleryCount: 0,
  video: 'exclude',
  productName: 'include', abbreviateLength: 40,
  price: 'show', currency: 'ZAR',
  discountInfo: 'show', discountThreshold: 10,
  shortDescription: 'include', truncateLength: 160,
  fullDescription: 'exclude',
  categoryTags: 'hashtags',
  stockStatus: 'hide',
  productUrl: 'shortened', utmTracking: 'auto_tag',
  ratingReviews: 'hide', ratingThreshold: 4,
  skuItemCode: 'hide',
  deliveryInfo: 'region_aware',
  ctaPhrase: 'shop_now', customCtaText: '',
  brandWatermark: 'on', watermarkPosition: 'bottom_right',
};

function ProfileForm({ initial, onSave, saving }) {
  const [name, setName] = useState(initial?.name || '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG, ...(initial?.config || {}) });

  const set = (patch) => setConfig((c) => ({ ...c, ...patch }));

  return (
    <div className="space-y-4">
      <Input label="Profile name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Make this the store-default profile
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Images</label>
          <select className="input w-full" value={config.images} onChange={(e) => set({ images: e.target.value })}>
            <option value="featured_only">Featured only</option>
            <option value="featured_plus_gallery">Featured + N gallery</option>
            <option value="all_gallery">All gallery</option>
            <option value="none">None</option>
          </select>
        </div>
        {config.images === 'featured_plus_gallery' && (
          <Input label="Gallery count" type="number" value={config.galleryCount} onChange={(e) => set({ galleryCount: parseInt(e.target.value) || 0 })} />
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Product name</label>
          <select className="input w-full" value={config.productName} onChange={(e) => set({ productName: e.target.value })}>
            <option value="include">Include</option>
            <option value="abbreviate">Abbreviate</option>
            <option value="exclude">Exclude</option>
          </select>
        </div>
        {config.productName === 'abbreviate' && (
          <Input label="Abbreviate length" type="number" value={config.abbreviateLength} onChange={(e) => set({ abbreviateLength: parseInt(e.target.value) || 40 })} />
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <select className="input w-full" value={config.price} onChange={(e) => set({ price: e.target.value })}>
            <option value="show">Show</option>
            <option value="hide">Hide</option>
            <option value="overlay_only">Overlay only (Designer, Phase 7)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <select className="input w-full" value={config.currency} onChange={(e) => set({ currency: e.target.value })}>
            <option value="ZAR">ZAR</option>
            <option value="USD">USD</option>
            <option value="ZWL">ZWL</option>
            <option value="multi">Multi (ZAR + USD)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Discount info</label>
          <select className="input w-full" value={config.discountInfo} onChange={(e) => set({ discountInfo: e.target.value })}>
            <option value="show">Show</option>
            <option value="hide">Hide</option>
            <option value="show_if_above_threshold">Show if above threshold</option>
          </select>
        </div>
        {config.discountInfo === 'show_if_above_threshold' && (
          <Input label="Threshold (%)" type="number" value={config.discountThreshold} onChange={(e) => set({ discountThreshold: parseInt(e.target.value) || 10 })} />
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Short description</label>
          <select className="input w-full" value={config.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })}>
            <option value="include">Include</option>
            <option value="truncate">Truncate</option>
            <option value="exclude">Exclude</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full description</label>
          <select className="input w-full" value={config.fullDescription} onChange={(e) => set({ fullDescription: e.target.value })}>
            <option value="exclude">Exclude</option>
            <option value="include">Include</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category / tags</label>
          <select className="input w-full" value={config.categoryTags} onChange={(e) => set({ categoryTags: e.target.value })}>
            <option value="hashtags">As hashtags</option>
            <option value="text">As text</option>
            <option value="exclude">Exclude</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock status</label>
          <select className="input w-full" value={config.stockStatus} onChange={(e) => set({ stockStatus: e.target.value })}>
            <option value="hide">Hide</option>
            <option value="show">Show</option>
            <option value="show_if_low">Show if low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product URL</label>
          <select className="input w-full" value={config.productUrl} onChange={(e) => set({ productUrl: e.target.value })}>
            <option value="shortened">Shortened</option>
            <option value="full">Full</option>
            <option value="hide">Hide</option>
            <option value="link_in_bio">Link-in-bio note</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">CTA phrase</label>
          <select className="input w-full" value={config.ctaPhrase} onChange={(e) => set({ ctaPhrase: e.target.value })}>
            <option value="shop_now">Shop now</option>
            <option value="order_today">Order today</option>
            <option value="send_to_family">Send to family</option>
            <option value="link_in_bio">Link in bio</option>
            <option value="custom">Custom</option>
            <option value="none">None</option>
          </select>
        </div>
        {config.ctaPhrase === 'custom' && (
          <Input label="Custom CTA text" value={config.customCtaText} onChange={(e) => set({ customCtaText: e.target.value })} fullWidth />
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Rating / reviews</label>
          <select className="input w-full" value={config.ratingReviews} onChange={(e) => set({ ratingReviews: e.target.value })}>
            <option value="hide">Hide</option>
            <option value="show">Show</option>
            <option value="show_if_above_threshold">Show if ≥ N stars</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU / item code</label>
          <select className="input w-full" value={config.skuItemCode} onChange={(e) => set({ skuItemCode: e.target.value })}>
            <option value="hide">Hide</option>
            <option value="show">Show</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Delivery info</label>
          <select className="input w-full" value={config.deliveryInfo} onChange={(e) => set({ deliveryInfo: e.target.value })}>
            <option value="region_aware">Region-aware</option>
            <option value="show">Show (generic)</option>
            <option value="hide">Hide</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Brand watermark</label>
          <select className="input w-full" value={config.brandWatermark} onChange={(e) => set({ brandWatermark: e.target.value })}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onSave({ name, isDefault, config })} loading={saving}>Save Profile</Button>
      </div>
    </div>
  );
}

export default function AutoposterProfilesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'new' | profile object

  const { data, isLoading } = useQuery('autoposter-profiles', () => autoposterAPI.listProfiles());
  const profiles = data?.data?.data || [];

  const saveMutation = useMutation(
    (payload) => (modal?._id ? autoposterAPI.updateProfile(modal._id, payload) : autoposterAPI.createProfile(payload)),
    {
      onSuccess: () => {
        toast.success('Profile saved');
        queryClient.invalidateQueries('autoposter-profiles');
        setModal(null);
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to save profile'),
    }
  );

  const deleteMutation = useMutation((id) => autoposterAPI.deleteProfile(id), {
    onSuccess: () => { toast.success('Profile deleted'); queryClient.invalidateQueries('autoposter-profiles'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete profile'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Post Profiles</h1>
          <p className="text-gray-500 mt-1">Control exactly what shows in an auto-generated product post.</p>
        </div>
        <Button onClick={() => setModal('new')}><IoAdd size={20} className="mr-2" />New Profile</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p>Loading…</p> : profiles.map((p) => (
          <Card key={p._id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-1">
                {p.name}
                {p.isDefault && <IoCheckmarkCircle className="text-primary" title="Default profile" />}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Price: {p.config?.price} · Images: {p.config?.images} · CTA: {p.config?.ctaPhrase}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setModal(p)}><IoCreate size={16} className="mr-1" />Edit</Button>
              {!p.isDefault && (
                <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(p._id)}><IoTrash size={16} className="mr-1" />Delete</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?._id ? `Edit ${modal.name}` : 'New Profile'} size="xl" showFooter={false}>
        <ProfileForm
          key={modal?._id || 'new'}
          initial={modal !== 'new' ? modal : null}
          saving={saveMutation.isLoading}
          onSave={(payload) => saveMutation.mutate(payload)}
        />
      </Modal>
    </div>
  );
}
