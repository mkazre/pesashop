import React, { useRef } from 'react';

/**
 * Touch-friendly button with ripple + scale-on-press animations.
 * Drop-in replacement for <button>; pass any className/children/onClick.
 */
export default function KioskTapButton({ children, className = '', onClick, type = 'button', disabled, ...rest }) {
  const ref = useRef(null);

  const spawnRipple = (e) => {
    const button = ref.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (e.clientX || (e.touches && e.touches[0]?.clientX) || rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (e.clientY || (e.touches && e.touches[0]?.clientY) || rect.top + rect.height / 2) - rect.top - size / 2;
    const span = document.createElement('span');
    span.className = 'kiosk-ripple-span';
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    button.appendChild(span);
    setTimeout(() => span.remove(), 700);
  };

  const handleClick = (e) => {
    if (disabled) return;
    spawnRipple(e);
    if (onClick) onClick(e);
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`relative overflow-hidden kiosk-tile select-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
