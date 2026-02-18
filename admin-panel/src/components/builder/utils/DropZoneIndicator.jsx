import React, { useEffect, useRef } from 'react';
import { useEditor } from '@craftjs/core';

/**
 * DropZoneIndicator — injects global drag-over visual feedback for canvas containers.
 * When a user drags an element over a canvas container on the canvas, that container
 * gets a highlighted border + background to clearly show the drop target.
 *
 * This component should be rendered once inside the <Editor> tree.
 */
export const DropZoneIndicator = () => {
  const styleRef = useRef(null);
  const cleanupRef = useRef([]);

  useEffect(() => {
    // Inject global CSS for drop zone styling
    const style = document.createElement('style');
    style.textContent = `
      /* Drop zone indicator styles */
      .craft-drop-target {
        outline: 2px solid #3b82f6 !important;
        outline-offset: -2px;
        background-color: rgba(59, 130, 246, 0.06) !important;
        transition: outline 150ms ease, background-color 150ms ease;
      }
      .craft-drop-target::after {
        content: 'Drop here';
        position: absolute;
        top: 4px;
        left: 50%;
        transform: translateX(-50%);
        background: #3b82f6;
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        z-index: 9999;
        pointer-events: none;
        white-space: nowrap;
      }
      /* Craft.js built-in indicator line */
      .craft-indicator {
        background: #3b82f6 !important;
        height: 3px !important;
        border-radius: 2px;
        z-index: 9999;
      }
      /* Canvas containers get a subtle dashed border during any drag */
      body.craft-dragging [data-craft-id] {
        position: relative;
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;

    // Listen for drag events on the canvas to highlight drop targets
    const handleDragOver = (e) => {
      // Find the closest canvas container (element with data-craft-id)
      const target = e.target.closest?.('[data-craft-id]');
      if (!target) return;

      // Remove highlight from all others
      document.querySelectorAll('.craft-drop-target').forEach(el => {
        if (el !== target) el.classList.remove('craft-drop-target');
      });

      // Add highlight to current target
      target.classList.add('craft-drop-target');
    };

    const handleDragLeave = (e) => {
      const target = e.target.closest?.('[data-craft-id]');
      if (target) {
        // Only remove if we're truly leaving (not entering a child)
        const related = e.relatedTarget?.closest?.('[data-craft-id]');
        if (related !== target) {
          target.classList.remove('craft-drop-target');
        }
      }
    };

    const handleDrop = () => {
      // Clean up all highlights on drop
      document.querySelectorAll('.craft-drop-target').forEach(el => {
        el.classList.remove('craft-drop-target');
      });
      document.body.classList.remove('craft-dragging');
    };

    const handleDragStart = () => {
      document.body.classList.add('craft-dragging');
    };

    const handleDragEnd = () => {
      document.querySelectorAll('.craft-drop-target').forEach(el => {
        el.classList.remove('craft-drop-target');
      });
      document.body.classList.remove('craft-dragging');
    };

    document.addEventListener('dragover', handleDragOver, true);
    document.addEventListener('dragleave', handleDragLeave, true);
    document.addEventListener('drop', handleDrop, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('dragend', handleDragEnd, true);

    return () => {
      document.removeEventListener('dragover', handleDragOver, true);
      document.removeEventListener('dragleave', handleDragLeave, true);
      document.removeEventListener('drop', handleDrop, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('dragend', handleDragEnd, true);
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
      }
    };
  }, []);

  return null; // This component only injects side effects
};

export default DropZoneIndicator;
