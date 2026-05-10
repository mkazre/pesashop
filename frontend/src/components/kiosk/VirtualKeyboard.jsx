import React, { useState } from 'react';
import { IoBackspaceOutline, IoArrowUpOutline } from 'react-icons/io5';

const ROWS_LETTERS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

const ROWS_NUMBERS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['-','/',':',';','(',')','$','&','@','"'],
  ['.',',','?','!','\''],
];

export default function VirtualKeyboard({ value = '', onChange, onSubmit, layout = 'letters', showSubmit = false }) {
  const [shift, setShift] = useState(false);
  const [mode, setMode] = useState(layout); // 'letters' | 'numbers'

  const append = (ch) => {
    const c = shift ? ch.toUpperCase() : ch;
    onChange((value || '') + c);
    if (shift) setShift(false);
  };

  const backspace = () => onChange((value || '').slice(0, -1));
  const space = () => onChange((value || '') + ' ');
  const clear = () => onChange('');

  const rows = mode === 'numbers' ? ROWS_NUMBERS : ROWS_LETTERS;

  return (
    <div className="bg-gray-800 p-3 md:p-4 rounded-2xl shadow-2xl select-none">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1.5 md:gap-2 justify-center my-1.5">
          {i === rows.length - 1 && mode === 'letters' && (
            <Key wide onClick={() => setShift(!shift)} highlighted={shift}>
              <IoArrowUpOutline size={22} />
            </Key>
          )}
          {row.map(ch => (
            <Key key={ch} onClick={() => append(ch)}>{shift ? ch.toUpperCase() : ch}</Key>
          ))}
          {i === rows.length - 1 && (
            <Key wide onClick={backspace}><IoBackspaceOutline size={22} /></Key>
          )}
        </div>
      ))}
      <div className="flex gap-1.5 md:gap-2 justify-center mt-1.5">
        <Key wide onClick={() => setMode(mode === 'letters' ? 'numbers' : 'letters')}>
          {mode === 'letters' ? '123' : 'ABC'}
        </Key>
        <Key onClick={clear} muted>Clear</Key>
        <button
          onClick={space}
          className="flex-1 h-14 md:h-16 max-w-2xl bg-white text-gray-900 rounded-lg font-medium text-lg active:bg-gray-200"
        >
          Space
        </button>
        {showSubmit && (
          <Key wide highlighted onClick={onSubmit}>Search</Key>
        )}
      </div>
    </div>
  );
}

function Key({ children, onClick, wide, highlighted, muted }) {
  const base = 'h-14 md:h-16 rounded-lg font-medium text-xl flex items-center justify-center transition-transform active:scale-95';
  const cls = highlighted
    ? 'bg-secondary text-black px-5 md:px-6'
    : muted
    ? 'bg-gray-600 text-white px-4 md:px-5'
    : 'bg-white text-gray-900 px-4 md:px-5';
  const widthCls = wide ? 'min-w-[80px] md:min-w-[100px]' : 'min-w-[40px] md:min-w-[52px]';
  return (
    <button type="button" onClick={onClick} className={`${base} ${cls} ${widthCls}`}>
      {children}
    </button>
  );
}
