import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import {
  Copy, Scissors, Clipboard, Trash2, CopyPlus, Box, Type,
  ArrowUp, ArrowDown, MousePointer, Paintbrush, ClipboardPaste,
  CornerLeftUp, Eye, EyeOff, Plus,
} from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

const MenuItem = ({ icon: Icon, label, shortcut, onAction, disabled, danger, hidden }) => {
  if (hidden) return null;
  return (
    <div
      role="menuitem"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!disabled && onAction) onAction();
      }}
      className={`w-full px-3 py-1.5 text-left text-[13px] flex items-center gap-2.5 transition-colors select-none ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : danger
            ? 'text-red-600 hover:bg-red-50 cursor-pointer'
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
      }`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[11px] text-gray-400 ml-4 font-mono">{shortcut}</span>}
    </div>
  );
};

const Divider = () => <div className="border-t border-gray-200 my-1" />;

export const ContextMenu = ({
  x,
  y,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onWrapWithDiv,
  onRename,
  onMoveUp,
  onMoveDown,
  onSelectParent,
  onCopyStyle,
  onPasteStyle,
  onToggleVisibility,
  onAddChild,
  hasClipboard,
  hasStyleClipboard,
  isHidden,
  isRoot,
  nodeName,
}) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Clamp to viewport so menu doesn't go off-screen
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw - 8) left = vw - rect.width - 8;
    if (top + rect.height > vh - 8) top = vh - rect.height - 8;
    if (left < 4) left = 4;
    if (top < 4) top = 4;
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const fire = (fn) => () => { if (fn) fn(); onClose(); };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
    >
      {/* Header */}
      {nodeName && (
        <>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate max-w-[220px]">
            {nodeName}
          </div>
          <Divider />
        </>
      )}

      <MenuItem icon={Copy} label="Copy" shortcut={`${MOD}+C`} onAction={fire(onCopy)} />
      <MenuItem icon={Scissors} label="Cut" shortcut={`${MOD}+X`} onAction={fire(onCut)} />
      <MenuItem icon={Clipboard} label="Paste" shortcut={`${MOD}+V`} onAction={fire(onPaste)} disabled={!hasClipboard} />
      <MenuItem icon={CopyPlus} label="Duplicate" shortcut={`${MOD}+D`} onAction={fire(onDuplicate)} />

      <Divider />

      <MenuItem icon={Box} label="Wrap with Div" onAction={fire(onWrapWithDiv)} hidden={!onWrapWithDiv} />
      <MenuItem icon={Plus} label="Add Child Element" onAction={fire(onAddChild)} hidden={!onAddChild} />
      <MenuItem icon={CornerLeftUp} label="Select Parent" onAction={fire(onSelectParent)} hidden={!onSelectParent} />

      {(onMoveUp || onMoveDown) && (
        <>
          <Divider />
          <MenuItem icon={ArrowUp} label="Move Up" onAction={fire(onMoveUp)} hidden={!onMoveUp} />
          <MenuItem icon={ArrowDown} label="Move Down" onAction={fire(onMoveDown)} hidden={!onMoveDown} />
        </>
      )}

      {(onCopyStyle || onPasteStyle) && (
        <>
          <Divider />
          <MenuItem icon={Paintbrush} label="Copy Style" onAction={fire(onCopyStyle)} hidden={!onCopyStyle} />
          <MenuItem icon={ClipboardPaste} label="Paste Style" onAction={fire(onPasteStyle)} disabled={!hasStyleClipboard} hidden={!onPasteStyle} />
        </>
      )}

      {onToggleVisibility && (
        <MenuItem icon={isHidden ? Eye : EyeOff} label={isHidden ? 'Show Element' : 'Hide Element'} onAction={fire(onToggleVisibility)} />
      )}

      {onRename && (
        <MenuItem icon={Type} label="Rename" onAction={fire(onRename)} />
      )}

      <Divider />
      <MenuItem icon={Trash2} label="Delete" shortcut="Del" onAction={fire(onDelete)} danger disabled={isRoot} />
    </div>
  );
};
