import { useEffect, useMemo, useRef, useState } from 'react';
import { ICON_CATALOG, getCatalogByGroup, getIconComponent } from '@/constants/iconCatalog';
import { imagesAPI } from '@/services/api';
import toast from '@/utils/toast';
import { IoClose, IoSearch, IoCloudUpload, IoTrash } from 'react-icons/io5';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const COMMON_EMOJIS = ['🎉','✨','🛒','💝','🎁','🔥','⭐','💎','🚀','💯','🏆','💰','🛍️','📦','🚚','💳','🔒','✅','⚠️','❌','🔍','📍','📞','📧','💬','📱','🏠','🌟','🎊','🎯'];

/**
 * Normalize legacy string values into the {type, value} shape used everywhere.
 * Plain strings are treated as emoji.
 */
function normalize(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'string') return { type: 'emoji', value: v };
  if (typeof v === 'object' && v.type && v.value) return v;
  return null;
}

function resolveImageUrl(path) {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

export default function IconPicker({ label, sublabel, value, onChange, allow = ['emoji', 'icon', 'image'] }) {
  const [open, setOpen] = useState(false);
  const desc = normalize(value);

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      {sublabel && <p className="text-xs text-gray-400 mb-1">{sublabel}</p>}
      <div className="flex items-center gap-3">
        <Preview desc={desc} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
        >
          {desc ? 'Change' : 'Pick…'}
        </button>
        {desc && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>
      {open && (
        <PickerModal
          allow={allow}
          initial={desc}
          onClose={() => setOpen(false)}
          onPick={(next) => { onChange(next); setOpen(false); }}
        />
      )}
    </div>
  );
}

function Preview({ desc }) {
  if (!desc) {
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 border border-gray-200 rounded text-gray-400 text-xs">
        none
      </div>
    );
  }
  if (desc.type === 'icon') {
    const Cmp = getIconComponent(desc.value);
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-200 rounded text-gray-700">
        {Cmp ? <Cmp size={24} /> : <span className="text-xs">{desc.value}</span>}
      </div>
    );
  }
  if (desc.type === 'image') {
    return (
      <img
        src={resolveImageUrl(desc.value)}
        alt=""
        className="w-12 h-12 object-contain bg-gray-50 border border-gray-200 rounded"
      />
    );
  }
  // emoji
  return (
    <div className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-200 rounded text-2xl">
      {desc.value}
    </div>
  );
}

function PickerModal({ allow, initial, onPick, onClose }) {
  const [tab, setTab] = useState(initial?.type || allow[0] || 'icon');

  // Close on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Pick an icon</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><IoClose size={20} /></button>
        </div>
        <div className="flex border-b border-gray-200 px-4">
          {allow.includes('icon') && <Tab active={tab === 'icon'} onClick={() => setTab('icon')} label="Icon" />}
          {allow.includes('emoji') && <Tab active={tab === 'emoji'} onClick={() => setTab('emoji')} label="Emoji" />}
          {allow.includes('image') && <Tab active={tab === 'image'} onClick={() => setTab('image')} label="Image" />}
        </div>
        <div className="flex-1 overflow-auto p-4">
          {tab === 'icon' && <IconTab onPick={onPick} initial={initial} />}
          {tab === 'emoji' && <EmojiTab onPick={onPick} initial={initial} />}
          {tab === 'image' && <ImageTab onPick={onPick} initial={initial} />}
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Icon tab ───────────────────────────────────────────────────────────────
function IconTab({ onPick, initial }) {
  const [query, setQuery] = useState('');
  const grouped = useMemo(() => getCatalogByGroup(), []);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? [{ group: 'Results', items: ICON_CATALOG.filter((it) =>
        it.name.includes(q) || it.label.toLowerCase().includes(q) || it.group.toLowerCase().includes(q)
      ) }]
    : grouped;

  return (
    <div>
      <div className="relative mb-3">
        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons (e.g. cart, heart, shield)…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
        />
      </div>
      {filtered.map(({ group, items }) => (
        <div key={group} className="mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group}</div>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {items.map((it) => {
              const Cmp = it.Component;
              const selected = initial?.type === 'icon' && initial?.value === it.name;
              return (
                <button
                  key={it.name}
                  type="button"
                  onClick={() => onPick({ type: 'icon', value: it.name })}
                  title={it.label}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-transparent hover:border-blue-200'
                  }`}
                >
                  <Cmp size={20} />
                </button>
              );
            })}
          </div>
          {items.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-4">No icons match "{query}"</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Emoji tab ──────────────────────────────────────────────────────────────
function EmojiTab({ onPick, initial }) {
  const [val, setVal] = useState(initial?.type === 'emoji' ? initial.value : '');
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Type or paste an emoji</label>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="🎁"
        className="w-full px-3 py-2 text-2xl border border-gray-300 rounded focus:border-blue-500 focus:outline-none mb-3"
      />
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick picks</div>
      <div className="grid grid-cols-10 gap-2 mb-3">
        {COMMON_EMOJIS.map((e) => (
          <button
            type="button"
            key={e}
            onClick={() => onPick({ type: 'emoji', value: e })}
            className="w-10 h-10 flex items-center justify-center text-2xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded"
          >
            {e}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!val.trim()}
        onClick={() => onPick({ type: 'emoji', value: val.trim() })}
        className="w-full py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Use this emoji
      </button>
    </div>
  );
}

// ─── Image tab ──────────────────────────────────────────────────────────────
function ImageTab({ onPick, initial }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(initial?.type === 'image' ? initial.value : '');
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await imagesAPI.upload(file);
      const next = res.data?.url || res.data?.data?.url || '';
      if (next) {
        setUrl(next);
        onPick({ type: 'image', value: next });
        toast.success('Image uploaded');
      } else {
        toast.error('Upload returned no URL');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-blue-400 transition-colors">
        {url ? (
          <div className="flex flex-col items-center gap-3">
            <img src={resolveImageUrl(url)} alt="" className="max-h-40 object-contain" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 hover:bg-blue-50 rounded"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => { setUrl(''); }}
                className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 hover:bg-red-50 rounded inline-flex items-center gap-1"
              >
                <IoTrash size={12} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IoCloudUpload size={36} className="text-gray-400" />
            <div className="text-sm text-gray-600">Upload an image to use as the icon</div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Choose file'}
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>
      {url && (
        <button
          type="button"
          onClick={() => onPick({ type: 'image', value: url })}
          className="w-full mt-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          Use this image
        </button>
      )}
    </div>
  );
}
