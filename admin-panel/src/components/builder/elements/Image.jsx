import React, { useState, useCallback } from 'react';
import { useNode } from '@craftjs/core';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';

export const Image = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { src = '', alt = 'Image', className = '', style = {}, width = '100%', height = 'auto' } = resolved;
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [mediaOpen, setMediaOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSelect = useCallback((url) => {
    setProp((p) => { p.src = url; });
  }, [setProp]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProp((p) => { p.src = ev.target.result; });
      };
      reader.readAsDataURL(files[0]);
    }
    const url = e.dataTransfer.getData('text/plain');
    if (url && url.startsWith('http')) {
      setProp((p) => { p.src = url; });
    }
  }, [setProp]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  return (
    <>
      <div
        ref={(ref) => connect(drag(ref))}
        className={`image-wrapper ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
        style={style}
      >
        {src ? (
          <div className="relative group">
            <img
              src={src}
              alt={alt}
              style={{ width, height, objectFit: 'contain' }}
              className="max-w-full"
            />
            {selected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setMediaOpen(true); }}
                  className="px-3 py-1.5 bg-white rounded-lg shadow text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Change Image
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={(e) => { e.stopPropagation(); if (selected) setMediaOpen(true); }}
            className={`flex items-center justify-center border-2 border-dashed p-8 text-gray-400 cursor-pointer transition-colors ${
              dragOver ? 'border-indigo-500 bg-indigo-50' : 'bg-gray-100 border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <div className="text-center">
              {dragOver ? (
                <>
                  <Upload size={32} className="mx-auto mb-2 text-indigo-500" />
                  <p className="text-sm text-indigo-600 font-medium">Drop image here</p>
                </>
              ) : (
                <>
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Click to select image</p>
                  <p className="text-xs mt-1 opacity-60">or drag & drop an image here</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
};

Image.craft = {
  displayName: 'Image',
  props: {
    src: '',
    alt: 'Image',
    className: '',
    style: {},
    width: '100%',
    height: 'auto',
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Image'),
    canMoveOut: () => true,
  },
};
