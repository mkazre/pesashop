import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from '@/utils/toast';
import {
  IoAdd, IoTrash, IoChevronUp, IoChevronDown, IoEye, IoEyeOff,
  IoSettings, IoClose, IoSave, IoRefresh, IoCopy, IoImage,
  IoReorderThree, IoChevronForward, IoLayers, IoColorPalette,
  IoGrid, IoText, IoLink, IoMail, IoCall, IoLocation,
  IoLogoFacebook, IoLogoTwitter, IoLogoInstagram, IoLogoLinkedin,
  IoLogoPinterest, IoLogoYoutube, IoLogoTiktok,
  IoDesktop, IoTabletPortrait, IoPhonePortrait,
} from 'react-icons/io5';
import { footerConfigAPI, imagesAPI } from '../services/api';

// ── Breakpoint definitions ────────────────────────────────────────
const BREAKPOINTS = [
  { id: 'desktop', label: 'Desktop', icon: IoDesktop, hint: '≥ 1024px' },
  { id: 'tablet', label: 'Tablet', icon: IoTabletPortrait, hint: '768–1023px' },
  { id: 'mobile', label: 'Mobile', icon: IoPhonePortrait, hint: '< 768px' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Content type definitions ──────────────────────────────────────
const CONTENT_TYPES = [
  { type: 'logo', label: 'Logo & Description', icon: '🏷️' },
  { type: 'links', label: 'Link List', icon: '🔗' },
  { type: 'text', label: 'Text / Rich Text', icon: '📝' },
  { type: 'contact', label: 'Contact Info', icon: '📍' },
  { type: 'social', label: 'Social Icons', icon: '📱' },
  { type: 'newsletter', label: 'Newsletter', icon: '📧' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'html', label: 'Custom HTML', icon: '🧩' },
  { type: 'payment-icons', label: 'Payment Icons', icon: '💳' },
];

const COLUMN_WIDTHS = [
  { value: 'auto', label: 'Auto' },
  { value: '1/6', label: '1/6' },
  { value: '1/4', label: '1/4' },
  { value: '1/3', label: '1/3' },
  { value: '1/2', label: '1/2' },
  { value: '2/3', label: '2/3' },
  { value: '3/4', label: '3/4' },
  { value: 'full', label: 'Full' },
];

const SOCIAL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: IoLogoFacebook },
  { id: 'twitter', label: 'Twitter / X', icon: IoLogoTwitter },
  { id: 'instagram', label: 'Instagram', icon: IoLogoInstagram },
  { id: 'linkedin', label: 'LinkedIn', icon: IoLogoLinkedin },
  { id: 'pinterest', label: 'Pinterest', icon: IoLogoPinterest },
  { id: 'youtube', label: 'YouTube', icon: IoLogoYoutube },
  { id: 'tiktok', label: 'TikTok', icon: IoLogoTiktok },
];

// ── Helpers ───────────────────────────────────────────────────────
function getDefaultContent(type) {
  const base = { type };
  switch (type) {
    case 'logo':
      return { ...base, logoImage: '', logoWidth: '150px', logoLink: '/', description: 'Your store description goes here.' };
    case 'links':
      return { ...base, heading: 'Quick Links', links: [
        { label: 'About Us', url: '/about' },
        { label: 'Contact', url: '/contact' },
        { label: 'Privacy Policy', url: '/privacy' },
      ]};
    case 'text':
      return { ...base, heading: '', content: 'Your text content here.' };
    case 'contact':
      return { ...base, heading: 'Contact Us', address: '123 Main Street, City', phone: '+1 234 567 890', email: 'info@example.com', showIcons: true };
    case 'social':
      return { ...base, heading: 'Follow Us', socialLinks: [
        { platform: 'facebook', url: '' },
        { platform: 'instagram', url: '' },
        { platform: 'twitter', url: '' },
      ], socialStyle: 'circle', socialColor: '', socialHoverColor: '' };
    case 'newsletter':
      return { ...base, newsletterTitle: 'Subscribe to Newsletter', newsletterText: 'Get the latest updates and offers.', newsletterButtonText: 'Subscribe', newsletterButtonBg: '', newsletterButtonColor: '' };
    case 'image':
      return { ...base, image: '', imageWidth: '100%', imageLink: '' };
    case 'html':
      return { ...base, content: '' };
    case 'payment-icons':
      return { ...base, heading: 'We Accept', paymentIcons: [
        { label: 'VISA', color: '#1e40af', bgColor: '#ffffff' },
        { label: 'MC', color: '#d97706', bgColor: '#ffffff' },
        { label: 'PayPal', color: '#003087', bgColor: '#ffffff' },
      ]};
    default:
      return base;
  }
}

function getDefaultRow() {
  return {
    enabled: true,
    label: 'New Row',
    columnCount: 4,
    columnGap: '32px',
    backgroundColor: '',
    textColor: '',
    linkColor: '',
    linkHoverColor: '',
    headingColor: '',
    headingSize: '18px',
    fontSize: '14px',
    containerWidth: 'contained',
    paddingTop: '48px',
    paddingBottom: '48px',
    borderTop: '',
    borderBottom: '',
    columns: [
      { width: 'auto', content: [getDefaultContent('logo')], verticalAlign: 'top' },
      { width: 'auto', content: [getDefaultContent('links')], verticalAlign: 'top' },
      { width: 'auto', content: [{ ...getDefaultContent('links'), heading: 'My Account', links: [{ label: 'Your Account', url: '/account' }, { label: 'Orders', url: '/account/orders' }, { label: 'Wishlist', url: '/account/wishlist' }] }], verticalAlign: 'top' },
      { width: 'auto', content: [getDefaultContent('contact')], verticalAlign: 'top' },
    ],
  };
}

// ── Image Upload Field ────────────────────────────────────────────
function ImageUploadField({ value, onChange, label }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await imagesAPI.upload(file);
      onChange(res.data?.data?.url || res.data?.url || '');
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative w-20 h-14 rounded border overflow-hidden flex-shrink-0">
            <img src={value.startsWith('http') ? value : `${API_URL}${value}`} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onChange('')} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><IoClose size={10} /></button>
          </div>
        ) : (
          <div className="w-20 h-14 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 flex-shrink-0"><IoImage size={20} /></div>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded border transition-colors">
          {uploading ? 'Uploading...' : value ? 'Change' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {value && <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full text-xs px-2 py-1 border rounded" placeholder="Or paste URL" />}
    </div>
  );
}

// ── Color field ───────────────────────────────────────────────────
function ColorField({ label, value, onChange, placeholder = '#000000' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input type="color" value={value || placeholder} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 text-xs px-2 py-1.5 border rounded" placeholder={placeholder} />
      </div>
    </div>
  );
}

// ── Content editors ───────────────────────────────────────────────
function LogoContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div className="space-y-3">
      <ImageUploadField label="Logo Image" value={item.logoImage || ''} onChange={(v) => u('logoImage', v)} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500">Logo Width</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={item.logoWidth || '150px'} onChange={(e) => u('logoWidth', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">Logo Link</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={item.logoLink || '/'} onChange={(e) => u('logoLink', e.target.value)} /></div>
      </div>
      <div><label className="text-xs text-gray-500">Description</label>
        <textarea className="w-full text-sm px-3 py-2 border rounded" rows={3} value={item.description || ''} onChange={(e) => u('description', e.target.value)} />
      </div>
    </div>
  );
}

function LinksContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  const links = item.links || [];
  const updateLink = (i, link) => { const l = [...links]; l[i] = link; u('links', l); };
  const removeLink = (i) => { const l = [...links]; l.splice(i, 1); u('links', l); };
  const addLink = () => u('links', [...links, { label: 'New Link', url: '#' }]);
  return (
    <div className="space-y-3">
      <input className="w-full text-sm px-3 py-2 border rounded font-medium" placeholder="Heading" value={item.heading || ''} onChange={(e) => u('heading', e.target.value)} />
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white border rounded">
            <input className="flex-1 text-xs px-2 py-1 border rounded" placeholder="Label" value={link.label || ''} onChange={(e) => updateLink(i, { ...link, label: e.target.value })} />
            <input className="flex-1 text-xs px-2 py-1 border rounded" placeholder="URL" value={link.url || ''} onChange={(e) => updateLink(i, { ...link, url: e.target.value })} />
            <label className="text-xs flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={link.openInNewTab || false} onChange={(e) => updateLink(i, { ...link, openInNewTab: e.target.checked })} />New tab</label>
            <button onClick={() => removeLink(i)} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
          </div>
        ))}
      </div>
      <button onClick={addLink} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"><IoAdd size={14} /> Add Link</button>
    </div>
  );
}

function TextContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div className="space-y-3">
      <input className="w-full text-sm px-3 py-2 border rounded font-medium" placeholder="Heading (optional)" value={item.heading || ''} onChange={(e) => u('heading', e.target.value)} />
      <textarea className="w-full text-sm px-3 py-2 border rounded" rows={4} value={item.content || ''} onChange={(e) => u('content', e.target.value)} placeholder="Text content..." />
    </div>
  );
}

function ContactContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div className="space-y-3">
      <input className="w-full text-sm px-3 py-2 border rounded font-medium" placeholder="Heading" value={item.heading || ''} onChange={(e) => u('heading', e.target.value)} />
      <div className="space-y-2">
        <div className="flex items-center gap-2"><IoLocation className="text-gray-400" size={16} /><input className="flex-1 text-sm px-2 py-1.5 border rounded" placeholder="Address" value={item.address || ''} onChange={(e) => u('address', e.target.value)} /></div>
        <div className="flex items-center gap-2"><IoCall className="text-gray-400" size={16} /><input className="flex-1 text-sm px-2 py-1.5 border rounded" placeholder="Phone" value={item.phone || ''} onChange={(e) => u('phone', e.target.value)} /></div>
        <div className="flex items-center gap-2"><IoMail className="text-gray-400" size={16} /><input className="flex-1 text-sm px-2 py-1.5 border rounded" placeholder="Email" value={item.email || ''} onChange={(e) => u('email', e.target.value)} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.showIcons !== false} onChange={(e) => u('showIcons', e.target.checked)} />Show icons</label>
    </div>
  );
}

function SocialContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  const links = item.socialLinks || [];
  const updateSocial = (i, sl) => { const l = [...links]; l[i] = sl; u('socialLinks', l); };
  const removeSocial = (i) => { const l = [...links]; l.splice(i, 1); u('socialLinks', l); };
  const addSocial = () => u('socialLinks', [...links, { platform: 'facebook', url: '' }]);
  return (
    <div className="space-y-3">
      <input className="w-full text-sm px-3 py-2 border rounded font-medium" placeholder="Heading (optional)" value={item.heading || ''} onChange={(e) => u('heading', e.target.value)} />
      <div className="space-y-2">
        {links.map((sl, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white border rounded">
            <select className="text-xs px-2 py-1 border rounded" value={sl.platform || 'facebook'} onChange={(e) => updateSocial(i, { ...sl, platform: e.target.value })}>
              {SOCIAL_PLATFORMS.map(sp => <option key={sp.id} value={sp.id}>{sp.label}</option>)}
            </select>
            <input className="flex-1 text-xs px-2 py-1 border rounded" placeholder="URL" value={sl.url || ''} onChange={(e) => updateSocial(i, { ...sl, url: e.target.value })} />
            <button onClick={() => removeSocial(i)} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
          </div>
        ))}
      </div>
      <button onClick={addSocial} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"><IoAdd size={14} /> Add Social</button>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-xs text-gray-500">Style</label>
          <select className="w-full text-xs px-2 py-1.5 border rounded" value={item.socialStyle || 'circle'} onChange={(e) => u('socialStyle', e.target.value)}>
            <option value="circle">Circle</option><option value="square">Square</option><option value="plain">Plain</option>
          </select>
        </div>
        <ColorField label="Color" value={item.socialColor} onChange={(v) => u('socialColor', v)} placeholder="#ffffff" />
        <ColorField label="Hover" value={item.socialHoverColor} onChange={(v) => u('socialHoverColor', v)} placeholder="#f59e0b" />
      </div>
    </div>
  );
}

function NewsletterContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div className="space-y-3">
      <input className="w-full text-sm px-3 py-2 border rounded font-medium" placeholder="Title" value={item.newsletterTitle || ''} onChange={(e) => u('newsletterTitle', e.target.value)} />
      <textarea className="w-full text-sm px-3 py-2 border rounded" rows={2} value={item.newsletterText || ''} onChange={(e) => u('newsletterText', e.target.value)} placeholder="Subtitle text..." />
      <input className="w-full text-sm px-3 py-2 border rounded" placeholder="Button Text" value={item.newsletterButtonText || 'Subscribe'} onChange={(e) => u('newsletterButtonText', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Button BG" value={item.newsletterButtonBg} onChange={(v) => u('newsletterButtonBg', v)} placeholder="#f59e0b" />
        <ColorField label="Button Text" value={item.newsletterButtonColor} onChange={(v) => u('newsletterButtonColor', v)} placeholder="#000000" />
      </div>
    </div>
  );
}

function ImageContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div className="space-y-3">
      <ImageUploadField label="Image" value={item.image || ''} onChange={(v) => u('image', v)} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500">Width</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={item.imageWidth || '100%'} onChange={(e) => u('imageWidth', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">Link (optional)</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={item.imageLink || ''} onChange={(e) => u('imageLink', e.target.value)} /></div>
      </div>
    </div>
  );
}

function PaymentIconsContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  const icons = item.paymentIcons || [];
  const updateIcon = (i, ic) => { const l = [...icons]; l[i] = ic; u('paymentIcons', l); };
  const removeIcon = (i) => { const l = [...icons]; l.splice(i, 1); u('paymentIcons', l); };
  const addIcon = () => u('paymentIcons', [...icons, { label: 'New', color: '#000', bgColor: '#fff' }]);
  return (
    <div className="space-y-3">
      <input className="w-full text-sm px-3 py-2 border rounded font-medium" placeholder="Heading (optional)" value={item.heading || ''} onChange={(e) => u('heading', e.target.value)} />
      <div className="space-y-2">
        {icons.map((ic, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white border rounded">
            <input className="w-20 text-xs px-2 py-1 border rounded" placeholder="Label" value={ic.label || ''} onChange={(e) => updateIcon(i, { ...ic, label: e.target.value })} />
            <ImageUploadField value={ic.image || ''} onChange={(v) => updateIcon(i, { ...ic, image: v })} />
            <input type="color" className="w-7 h-7 border-0 rounded cursor-pointer" value={ic.color || '#000'} onChange={(e) => updateIcon(i, { ...ic, color: e.target.value })} title="Text color" />
            <input type="color" className="w-7 h-7 border-0 rounded cursor-pointer" value={ic.bgColor || '#fff'} onChange={(e) => updateIcon(i, { ...ic, bgColor: e.target.value })} title="BG color" />
            <button onClick={() => removeIcon(i)} className="text-red-500 hover:text-red-700"><IoTrash size={14} /></button>
          </div>
        ))}
      </div>
      <button onClick={addIcon} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"><IoAdd size={14} /> Add Icon</button>
    </div>
  );
}

function HtmlContentEditor({ item, onChange }) {
  const u = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div className="space-y-3">
      <textarea className="w-full text-sm px-3 py-2 border rounded font-mono" rows={6} value={item.content || ''} onChange={(e) => u('content', e.target.value)} placeholder="<div>Custom HTML here...</div>" />
    </div>
  );
}

// ── Content item editor (delegates to type-specific editor) ───────
function ContentItemEditor({ item, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(true);
  const typeDef = CONTENT_TYPES.find(t => t.type === item.type);
  const editors = {
    logo: LogoContentEditor, links: LinksContentEditor, text: TextContentEditor,
    contact: ContactContentEditor, social: SocialContentEditor, newsletter: NewsletterContentEditor,
    image: ImageContentEditor, html: HtmlContentEditor, 'payment-icons': PaymentIconsContentEditor,
  };
  const Editor = editors[item.type] || TextContentEditor;

  return (
    <div className="border rounded-lg bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{typeDef?.icon || '📄'}</span>
          <span className="text-xs font-semibold text-gray-700">{typeDef?.label || item.type}</span>
          {item.heading && <span className="text-xs text-gray-400">— {item.heading}</span>}
        </div>
        <div className="flex items-center gap-1">
          {!isFirst && <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 hover:bg-gray-200 rounded"><IoChevronUp size={12} /></button>}
          {!isLast && <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 hover:bg-gray-200 rounded"><IoChevronDown size={12} /></button>}
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 hover:bg-red-100 rounded text-red-500"><IoTrash size={12} /></button>
          <IoChevronForward size={12} className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="p-3">
          <Editor item={item} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ── Column editor ─────────────────────────────────────────────────
function ColumnEditor({ column, colIndex, onChange, totalColumns }) {
  const [showAddContent, setShowAddContent] = useState(false);
  const content = column.content || [];

  const updateContent = (i, c) => { const arr = [...content]; arr[i] = c; onChange({ ...column, content: arr }); };
  const removeContent = (i) => { const arr = [...content]; arr.splice(i, 1); onChange({ ...column, content: arr }); };
  const addContent = (type) => { onChange({ ...column, content: [...content, getDefaultContent(type)] }); setShowAddContent(false); };
  const moveContent = (i, dir) => {
    const arr = [...content]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange({ ...column, content: arr });
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="px-3 py-2 bg-blue-50 border-b flex items-center justify-between">
        <span className="text-xs font-bold text-blue-700">Column {colIndex + 1}</span>
        <div className="flex items-center gap-2">
          <select className="text-xs px-2 py-1 border rounded bg-white" value={column.width || 'auto'} onChange={(e) => onChange({ ...column, width: e.target.value })}>
            {COLUMN_WIDTHS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
          <select className="text-xs px-2 py-1 border rounded bg-white" value={column.verticalAlign || 'top'} onChange={(e) => onChange({ ...column, verticalAlign: e.target.value })}>
            <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
          </select>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {content.map((item, i) => (
          <ContentItemEditor
            key={i} item={item} index={i}
            onChange={(c) => updateContent(i, c)}
            onRemove={() => removeContent(i)}
            onMoveUp={() => moveContent(i, -1)}
            onMoveDown={() => moveContent(i, 1)}
            isFirst={i === 0} isLast={i === content.length - 1}
          />
        ))}
        {content.length === 0 && <div className="text-center py-4 text-xs text-gray-400">No content yet</div>}

        {showAddContent ? (
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Add Content</span>
              <button onClick={() => setShowAddContent(false)} className="text-gray-400 hover:text-gray-600"><IoClose size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {CONTENT_TYPES.map(ct => (
                <button key={ct.type} onClick={() => addContent(ct.type)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs bg-white border rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors">
                  <span>{ct.icon}</span>{ct.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddContent(true)} className="w-full flex items-center justify-center gap-1 py-2 text-xs text-emerald-600 hover:bg-emerald-50 border border-dashed border-emerald-300 rounded">
            <IoAdd size={14} /> Add Content
          </button>
        )}
      </div>
    </div>
  );
}

// ── Responsive override field ─────────────────────────────────────
function OverrideField({ label, field, overrides, onUpdate, desktopVal, placeholder, type = 'text' }) {
  const val = overrides?.[field] ?? '';
  const hasOvr = val !== undefined && val !== '';
  const set = (v) => onUpdate({ ...overrides, [field]: v });
  const clear = () => { const o = { ...overrides }; delete o[field]; onUpdate(o); };
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
        {label} {hasOvr && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" title="Overridden" />}
      </label>
      <div className="flex items-center gap-1">
        <input type={type} className={`w-full text-sm px-2 py-1.5 border rounded ${hasOvr ? 'border-orange-300 bg-orange-50' : ''}`}
          value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder || desktopVal || 'inherit'} />
        {hasOvr && <button onClick={clear} className="text-orange-400 hover:text-orange-600 flex-shrink-0" title="Reset to inherit"><IoClose size={14} /></button>}
      </div>
    </div>
  );
}

// ── Responsive settings panel ─────────────────────────────────────
function ResponsivePanel({ bp, overrides, onUpdate, desktopRow }) {
  const o = overrides || {};
  const set = (k, v) => onUpdate({ ...o, [k]: v });
  const clear = (k) => { const n = { ...o }; delete n[k]; onUpdate(n); };
  const hasOvr = (k) => o[k] !== undefined && o[k] !== '';
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded">
        <span className="font-semibold">{bp === 'tablet' ? 'Tablet (768-1023px)' : 'Mobile (< 768px)'}</span>
        <span className="text-orange-500">Empty fields inherit desktop values.</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
            Columns {hasOvr('columnCount') && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => set('columnCount', n)}
                className={`w-7 h-7 text-xs font-bold rounded border transition-colors ${o.columnCount === n ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}>{n}</button>
            ))}
            {hasOvr('columnCount') && <button onClick={() => clear('columnCount')} className="text-orange-400 hover:text-orange-600"><IoClose size={14} /></button>}
          </div>
        </div>
        <OverrideField label="Column Gap" field="columnGap" overrides={o} onUpdate={onUpdate} desktopVal={desktopRow.columnGap} />
        <OverrideField label="Heading Size" field="headingSize" overrides={o} onUpdate={onUpdate} desktopVal={desktopRow.headingSize} />
        <OverrideField label="Font Size" field="fontSize" overrides={o} onUpdate={onUpdate} desktopVal={desktopRow.fontSize} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <OverrideField label="Padding Top" field="paddingTop" overrides={o} onUpdate={onUpdate} desktopVal={desktopRow.paddingTop} />
        <OverrideField label="Padding Bottom" field="paddingBottom" overrides={o} onUpdate={onUpdate} desktopVal={desktopRow.paddingBottom} />
        <OverrideField label="Text Align" field="textAlign" overrides={o} onUpdate={onUpdate} desktopVal="" placeholder="left" />
        <div>
          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
            Stack Columns {hasOvr('stackColumns') && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={o.stackColumns || false} onChange={(e) => set('stackColumns', e.target.checked)} className="rounded" />
              Stack vertically
            </label>
            {hasOvr('stackColumns') && <button onClick={() => clear('stackColumns')} className="text-orange-400 hover:text-orange-600"><IoClose size={14} /></button>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
            Hide Columns {hasOvr('hiddenColumns') && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
          </label>
          <input className={`w-full text-sm px-2 py-1.5 border rounded ${hasOvr('hiddenColumns') ? 'border-orange-300 bg-orange-50' : ''}`}
            value={(o.hiddenColumns || []).join(',')} placeholder="e.g. 3,4 (1-based)"
            onChange={(e) => set('hiddenColumns', e.target.value ? e.target.value.split(',').map(Number).filter(n => !isNaN(n)) : [])} />
          <span className="text-[10px] text-gray-400">Column numbers to hide</span>
        </div>
        <OverrideField label="Logo Width" field="logoWidth" overrides={o} onUpdate={onUpdate} desktopVal="" placeholder="120px" />
        <OverrideField label="Column Order" field="columnOrder" overrides={o} onUpdate={onUpdate} desktopVal="" placeholder="e.g. 1,3,2,4" />
        <OverrideField label="Row Gap (stacked)" field="rowGap" overrides={o} onUpdate={onUpdate} desktopVal="" placeholder="24px" />
      </div>
    </div>
  );
}

// ── Row editor ────────────────────────────────────────────────────
function RowEditor({ row, rowIndex, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeBp, setActiveBp] = useState('desktop');
  const columns = row.columns || [];
  const responsive = row.responsive || {};

  const updateColumn = (i, col) => { const arr = [...columns]; arr[i] = col; onChange({ ...row, columns: arr }); };

  const setColumnCount = (count) => {
    const newCols = [...columns];
    while (newCols.length < count) newCols.push({ width: 'auto', content: [], verticalAlign: 'top' });
    while (newCols.length > count) newCols.pop();
    onChange({ ...row, columnCount: count, columns: newCols });
  };

  const updateResponsive = (bp, overrides) => {
    onChange({ ...row, responsive: { ...responsive, [bp]: overrides } });
  };

  const hasTOverrides = responsive.tablet && Object.keys(responsive.tablet).length > 0;
  const hasMOverrides = responsive.mobile && Object.keys(responsive.mobile).length > 0;

  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-colors ${row.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-3">
          <IoReorderThree size={18} className="text-gray-400 cursor-grab" />
          <input className="text-sm font-semibold bg-transparent border-none outline-none text-gray-700 w-40" value={row.label || ''} onChange={(e) => onChange({ ...row, label: e.target.value })} placeholder="Row Label" />
          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{columns.length} cols</span>
          {hasTOverrides && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">T</span>}
          {hasMOverrides && <span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-medium">M</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onChange({ ...row, enabled: !row.enabled })} className={`p-1.5 rounded ${row.enabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`} title={row.enabled ? 'Enabled' : 'Disabled'}>
            {row.enabled ? <IoEye size={16} /> : <IoEyeOff size={16} />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded ${showSettings ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}><IoSettings size={16} /></button>
          {!isFirst && <button onClick={onMoveUp} className="p-1.5 rounded text-gray-400 hover:bg-gray-100"><IoChevronUp size={16} /></button>}
          {!isLast && <button onClick={onMoveDown} className="p-1.5 rounded text-gray-400 hover:bg-gray-100"><IoChevronDown size={16} /></button>}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100">
            <IoChevronForward size={16} className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <button onClick={onRemove} className="p-1.5 rounded text-red-400 hover:bg-red-50"><IoTrash size={16} /></button>
        </div>
      </div>

      {/* Row settings panel */}
      {showSettings && (
        <div className="p-4 bg-blue-50/50 border-b space-y-4">
          {/* Breakpoint toggle */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Row Settings</h4>
            <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg overflow-hidden bg-white">
              {BREAKPOINTS.map(bp => {
                const Icon = bp.icon;
                const isActive = activeBp === bp.id;
                const hasOvr = bp.id !== 'desktop' && responsive[bp.id] && Object.keys(responsive[bp.id]).length > 0;
                return (
                  <button key={bp.id} onClick={() => setActiveBp(bp.id)} title={`${bp.label} ${bp.hint}`}
                    className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors relative ${
                      isActive
                        ? bp.id === 'desktop' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}>
                    <Icon size={14} /> {bp.label}
                    {hasOvr && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop settings */}
          {activeBp === 'desktop' && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Columns</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setColumnCount(n)} className={`w-8 h-8 text-xs font-bold rounded border transition-colors ${columns.length === n ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">Column Gap</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={row.columnGap || '32px'} onChange={(e) => onChange({ ...row, columnGap: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Container</label>
                  <select className="w-full text-sm px-2 py-1.5 border rounded" value={row.containerWidth || 'contained'} onChange={(e) => onChange({ ...row, containerWidth: e.target.value })}>
                    <option value="contained">Contained</option><option value="full">Full Width</option>
                  </select>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">Heading Size</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={row.headingSize || '18px'} onChange={(e) => onChange({ ...row, headingSize: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Padding Top</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={row.paddingTop || '48px'} onChange={(e) => onChange({ ...row, paddingTop: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Padding Bottom</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={row.paddingBottom || '48px'} onChange={(e) => onChange({ ...row, paddingBottom: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Border Top</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={row.borderTop || ''} onChange={(e) => onChange({ ...row, borderTop: e.target.value })} placeholder="1px solid rgba(255,255,255,0.1)" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Border Bottom</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={row.borderBottom || ''} onChange={(e) => onChange({ ...row, borderBottom: e.target.value })} placeholder="none" /></div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <ColorField label="Background" value={row.backgroundColor} onChange={(v) => onChange({ ...row, backgroundColor: v })} placeholder="#1b5e35" />
                <ColorField label="Text" value={row.textColor} onChange={(v) => onChange({ ...row, textColor: v })} placeholder="#ffffff" />
                <ColorField label="Links" value={row.linkColor} onChange={(v) => onChange({ ...row, linkColor: v })} placeholder="#d1d5db" />
                <ColorField label="Link Hover" value={row.linkHoverColor} onChange={(v) => onChange({ ...row, linkHoverColor: v })} placeholder="#ffffff" />
                <ColorField label="Headings" value={row.headingColor} onChange={(v) => onChange({ ...row, headingColor: v })} placeholder="#ffffff" />
              </div>
            </>
          )}

          {/* Tablet / Mobile responsive overrides */}
          {activeBp !== 'desktop' && (
            <ResponsivePanel bp={activeBp} overrides={responsive[activeBp]} onUpdate={(o) => updateResponsive(activeBp, o)} desktopRow={row} />
          )}
        </div>
      )}

      {/* Columns */}
      {expanded && (
        <div className="p-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
            {columns.map((col, i) => (
              <ColumnEditor key={i} column={col} colIndex={i} onChange={(c) => updateColumn(i, c)} totalColumns={columns.length} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
export default function FooterBuilderPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showBottomBarSettings, setShowBottomBarSettings] = useState(false);

  // Fetch config
  const { isLoading } = useQuery('footerConfig', () => footerConfigAPI.get(), {
    onSuccess: (res) => {
      setConfig(res.data?.data || { rows: [], isActive: false });
    },
    staleTime: 30 * 1000,
  });

  // Save mutation
  const saveMutation = useMutation((data) => footerConfigAPI.update(data), {
    onSuccess: () => {
      toast.success('Footer saved!');
      setHasChanges(false);
      queryClient.invalidateQueries('footerConfig');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  // Reset mutation
  const resetMutation = useMutation(() => footerConfigAPI.reset(), {
    onSuccess: () => {
      toast.success('Footer reset to default');
      setHasChanges(false);
      queryClient.invalidateQueries('footerConfig');
    },
  });

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const rows = config?.rows || [];

  const updateRow = (i, row) => {
    const arr = [...rows]; arr[i] = row;
    updateConfig({ rows: arr });
  };
  const removeRow = (i) => {
    const arr = [...rows]; arr.splice(i, 1);
    updateConfig({ rows: arr });
  };
  const moveRow = (i, dir) => {
    const arr = [...rows]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updateConfig({ rows: arr });
  };
  const addRow = () => {
    updateConfig({ rows: [...rows, { ...getDefaultRow(), order: rows.length }] });
  };
  const duplicateRow = (i) => {
    const arr = [...rows];
    const clone = JSON.parse(JSON.stringify(arr[i]));
    clone.label = `${clone.label} (copy)`;
    arr.splice(i + 1, 0, clone);
    updateConfig({ rows: arr });
  };

  const handleSave = () => {
    if (!config) return;
    saveMutation.mutate(config);
  };

  if (isLoading || !config) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IoLayers className="text-emerald-600" /> Footer Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">Design your footer with multiple rows, columns, and content blocks</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Active toggle */}
          <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer">
            <input type="checkbox" className="rounded" checked={config.isActive || false} onChange={(e) => updateConfig({ isActive: e.target.checked })} />
            <span className="text-sm font-medium">{config.isActive ? 'Active' : 'Inactive'}</span>
          </label>
          <button onClick={() => setShowGlobalSettings(!showGlobalSettings)} className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition-colors ${showGlobalSettings ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'}`}>
            <IoColorPalette size={16} /> Global Colors
          </button>
          <button onClick={() => setShowBottomBarSettings(!showBottomBarSettings)} className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition-colors ${showBottomBarSettings ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-white hover:bg-gray-50'}`}>
            <IoGrid size={16} /> Bottom Bar
          </button>
          <button onClick={() => { if (confirm('Reset footer to empty?')) resetMutation.mutate(); }} className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-gray-600">
            <IoRefresh size={16} /> Reset
          </button>
          <button onClick={handleSave} disabled={!hasChanges || saveMutation.isLoading} className={`px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-2 transition-colors ${hasChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <IoSave size={16} /> {saveMutation.isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {!config.isActive && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <IoEyeOff className="text-amber-500" size={20} />
          <div>
            <span className="text-sm font-medium text-amber-800">Footer builder is inactive.</span>
            <span className="text-sm text-amber-600 ml-1">The existing menu-based footer is being used. Toggle "Active" to use this builder instead.</span>
          </div>
        </div>
      )}

      {/* Global color settings */}
      {showGlobalSettings && (
        <div className="mb-4 p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><IoColorPalette size={16} /> Global Footer Colors</h3>
          <p className="text-xs text-gray-500">These apply to all rows unless overridden at row level.</p>
          <div className="grid grid-cols-6 gap-3">
            <ColorField label="Background" value={config.globalBackgroundColor} onChange={(v) => updateConfig({ globalBackgroundColor: v })} placeholder="#1b5e35" />
            <ColorField label="Text" value={config.globalTextColor} onChange={(v) => updateConfig({ globalTextColor: v })} placeholder="#ffffff" />
            <ColorField label="Links" value={config.globalLinkColor} onChange={(v) => updateConfig({ globalLinkColor: v })} placeholder="#d1d5db" />
            <ColorField label="Link Hover" value={config.globalLinkHoverColor} onChange={(v) => updateConfig({ globalLinkHoverColor: v })} placeholder="#ffffff" />
            <ColorField label="Headings" value={config.globalHeadingColor} onChange={(v) => updateConfig({ globalHeadingColor: v })} placeholder="#ffffff" />
            <div><label className="text-xs text-gray-500 mb-1 block">Font Family</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={config.globalFontFamily || ''} onChange={(e) => updateConfig({ globalFontFamily: e.target.value })} placeholder="inherit" /></div>
          </div>
        </div>
      )}

      {/* Bottom bar settings */}
      {showBottomBarSettings && (
        <div className="mb-4 p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><IoGrid size={16} /> Bottom Bar (Copyright & Payment)</h3>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.bottomBarEnabled !== false} onChange={(e) => updateConfig({ bottomBarEnabled: e.target.checked })} />Enabled</label>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Copyright Text</label><input className="w-full text-sm px-3 py-2 border rounded" value={config.copyrightText || ''} onChange={(e) => updateConfig({ copyrightText: e.target.value })} placeholder={`© ${new Date().getFullYear()} Your Store. All rights reserved.`} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Position</label>
              <select className="w-full text-sm px-2 py-1.5 border rounded" value={config.copyrightPosition || 'left'} onChange={(e) => updateConfig({ copyrightPosition: e.target.value })}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </div>
            <div><label className="text-xs text-gray-500 mb-1 block">Border Top</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={config.bottomBarBorderTop || ''} onChange={(e) => updateConfig({ bottomBarBorderTop: e.target.value })} placeholder="1px solid rgba(255,255,255,0.1)" /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <ColorField label="Background" value={config.bottomBarBackgroundColor} onChange={(v) => updateConfig({ bottomBarBackgroundColor: v })} placeholder="transparent" />
            <ColorField label="Text Color" value={config.bottomBarTextColor} onChange={(v) => updateConfig({ bottomBarTextColor: v })} placeholder="#9ca3af" />
            <div><label className="text-xs text-gray-500 mb-1 block">Padding Top</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={config.bottomBarPaddingTop || '24px'} onChange={(e) => updateConfig({ bottomBarPaddingTop: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Padding Bottom</label><input className="w-full text-sm px-2 py-1.5 border rounded" value={config.bottomBarPaddingBottom || '24px'} onChange={(e) => updateConfig({ bottomBarPaddingBottom: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.showPaymentIcons || false} onChange={(e) => updateConfig({ showPaymentIcons: e.target.checked })} />Show Payment Icons</label>
          {config.showPaymentIcons && (
            <PaymentIconsContentEditor item={{ paymentIcons: config.paymentIcons || [] }} onChange={(updated) => updateConfig({ paymentIcons: updated.paymentIcons })} />
          )}
        </div>
      )}

      {/* Rows */}
      <div className="space-y-4">
        {rows.map((row, i) => (
          <RowEditor
            key={i} row={row} rowIndex={i}
            onChange={(r) => updateRow(i, r)}
            onRemove={() => { if (confirm('Remove this row?')) removeRow(i); }}
            onMoveUp={() => moveRow(i, -1)}
            onMoveDown={() => moveRow(i, 1)}
            isFirst={i === 0} isLast={i === rows.length - 1}
          />
        ))}

        {rows.length === 0 && (
          <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <IoLayers size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">No footer rows yet</h3>
            <p className="text-sm text-gray-400 mb-4">Start building your footer by adding a row</p>
            <button onClick={addRow} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto">
              <IoAdd size={16} /> Add First Row
            </button>
          </div>
        )}

        {rows.length > 0 && (
          <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
            <IoAdd size={16} /> Add Row
          </button>
        )}
      </div>
    </div>
  );
}
