import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { IoClose, IoChevronDown, IoChevronUp } from 'react-icons/io5';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const POSITIONS = [
  { value: 'top-left', label: '↖ TL' },
  { value: 'top-center', label: '↑ TC' },
  { value: 'top-right', label: '↗ TR' },
  { value: 'middle-left', label: '← ML' },
  { value: 'middle-right', label: '→ MR' },
  { value: 'bottom-left', label: '↙ BL' },
  { value: 'bottom-center', label: '↓ BC' },
  { value: 'bottom-right', label: '↘ BR' },
];

const BadgeModulePicker = ({ selectedIds = [], overrides = {}, onChangeIds, onChangeOverrides }) => {
  const { token } = useAuthStore();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchBadges = async () => {
      try {
        const res = await fetch(`${API}/badges/active/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setBadges(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch badges:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBadges();
    return () => { cancelled = true; };
  }, [token]);

  const toggleBadge = (id) => {
    if (selectedIds.includes(id)) {
      onChangeIds(selectedIds.filter((x) => x !== id));
      // Clean up overrides
      const newOv = { ...overrides };
      delete newOv[id];
      onChangeOverrides(newOv);
    } else {
      onChangeIds([...selectedIds, id]);
    }
  };

  const updateOverride = (id, key, value) => {
    onChangeOverrides({
      ...overrides,
      [id]: { ...(overrides[id] || {}), [key]: value },
    });
  };

  if (loading) {
    return <p className="text-xs text-gray-400 py-2">Loading badges...</p>;
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">No badges created yet.</p>
        <a href="/badges" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
          Go to Badge Manager →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {badges.map((badge) => {
        const isSelected = selectedIds.includes(badge._id);
        const isExpanded = expandedId === badge._id;
        const ov = overrides[badge._id] || {};
        const s = badge.style || {};

        return (
          <div key={badge._id} className={`border rounded-lg transition-colors ${isSelected ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'}`}>
            {/* Badge row */}
            <div className="flex items-center gap-2 px-2.5 py-2 cursor-pointer" onClick={() => toggleBadge(badge._id)}>
              <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded pointer-events-none" />

              {/* Mini preview */}
              {s.badgeType === 'image' && s.imageUrl ? (
                <img src={s.imageUrl} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <span className="inline-block text-[9px] px-1.5 py-0.5 rounded" style={{
                  backgroundColor: s.useGradient ? undefined : (s.backgroundColor || '#ef4444'),
                  backgroundImage: s.useGradient ? `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientFrom || '#ef4444'}, ${s.gradientTo || '#f97316'})` : undefined,
                  color: s.textColor || '#fff',
                  fontWeight: s.fontWeight || '700',
                  textTransform: s.textTransform || 'uppercase',
                  borderRadius: s.borderRadius || '4px',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}>
                  {s.text || badge.name}
                </span>
              )}

              <span className="text-xs text-gray-700 font-medium flex-1 truncate">{badge.name}</span>

              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : badge._id); }}
                  className="p-0.5 hover:bg-blue-100 rounded"
                  title="Position override"
                >
                  {isExpanded ? <IoChevronUp size={12} className="text-blue-500" /> : <IoChevronDown size={12} className="text-blue-500" />}
                </button>
              )}
            </div>

            {/* Expanded: position override for this badge */}
            {isSelected && isExpanded && (
              <div className="px-2.5 pb-2.5 pt-0 border-t border-blue-200">
                <p className="text-[10px] text-gray-500 mb-1.5 mt-1.5">Override position for this element:</p>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => updateOverride(badge._id, 'position', '')}
                    className={`px-1 py-1 text-[9px] rounded border transition-colors ${!ov.position ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Default
                  </button>
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => updateOverride(badge._id, 'position', pos.value)}
                      className={`px-1 py-1 text-[9px] rounded border transition-colors ${ov.position === pos.value ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selectedIds.length > 0 && (
        <p className="text-[10px] text-blue-600 mt-2">{selectedIds.length} badge{selectedIds.length > 1 ? 's' : ''} selected — each renders independently with its own position.</p>
      )}
    </div>
  );
};

export default BadgeModulePicker;
