import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { TextControl, NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { Image as ImageIcon, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';

export const SliderSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { slides = [], style = {} } = nodeProps;
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null); // index of slide to set image for
  const {
    autoplay = false,
    autoplaySpeed = 3000,
    showArrows = true,
    showDots = true,
    showCaptions = true,
    infinite = true,
    animationSpeed = 0.5,
    height = 400,
    arrowsColor = '#ffffff',
    dotsColor = '#ffffff80',
    dotsActiveColor = '#3b82f6',
    captionPosition = 'bottom',
    captionBgColor = 'rgba(0,0,0,0.7)',
    captionTextColor = '#ffffff'
  } = style;

  const updateStyle = (key, value) => setProp((p) => { if (!p.style) p.style = {}; p.style[key] = value; });

  const updateSlide = (index, field, value) => {
    setProp((p) => { p.slides[index][field] = value; });
  };

  const addSlide = () => {
    setProp((p) => {
      p.slides = [...(p.slides || []), { image: '', title: `Slide ${(p.slides || []).length + 1}`, caption: `Caption for slide ${(p.slides || []).length + 1}` }];
    });
  };

  const removeSlide = (index) => {
    setProp((p) => { p.slides = p.slides.filter((_, i) => i !== index); });
  };

  const moveSlide = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    setProp((p) => {
      const arr = [...p.slides];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      p.slides = arr;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Slides ({slides.length})</h4>
          <button
            onClick={addSlide}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Add Slide
          </button>
        </div>

        {slides.map((slide, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="flex flex-col">
                  <button onClick={() => moveSlide(index, -1)} disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp size={12} /></button>
                  <button onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown size={12} /></button>
                </div>
                <span className="text-sm font-medium text-gray-700">Slide {index + 1}</span>
              </div>
              {slides.length > 1 && (
                <button onClick={() => removeSlide(index)}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Image preview + media library */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
              {slide.image ? (
                <div className="relative group rounded-md overflow-hidden border border-gray-200 mb-1">
                  <img src={slide.image} alt={slide.title || ''} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => { setMediaTarget(index); setMediaOpen(true); }}
                      className="px-2 py-1 text-xs bg-white text-gray-700 rounded shadow hover:bg-gray-100">Replace</button>
                    <button onClick={() => updateSlide(index, 'image', '')}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded shadow hover:bg-red-600">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setMediaTarget(index); setMediaOpen(true); }}
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
                  <ImageIcon size={20} />
                  <span className="text-xs">Choose Image</span>
                </button>
              )}
              <input type="text" value={slide.image || ''} onChange={(e) => updateSlide(index, 'image', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs mt-1" placeholder="Or paste image URL" />
            </div>

            <TextControl
              label="Title"
              value={slide.title}
              onChange={(value) => updateSlide(index, 'title', value)}
            />

            <TextControl
              label="Caption"
              value={slide.caption}
              onChange={(value) => updateSlide(index, 'caption', value)}
              multiline
            />
          </div>
        ))}
      </div>

      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => { setMediaOpen(false); setMediaTarget(null); }}
        onSelect={(url) => {
          if (mediaTarget !== null) updateSlide(mediaTarget, 'image', url);
          setMediaOpen(false);
          setMediaTarget(null);
        }}
      />

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Slider Settings</h4>

        <Checkbox
          label="Autoplay"
          checked={autoplay}
          onChange={(checked) => updateStyle('autoplay', checked)}
        />

        {autoplay && (
          <NumberControl
            label="Autoplay Speed (ms)"
            value={autoplaySpeed}
            onChange={(value) => updateStyle('autoplaySpeed', value)}
            min={1000}
            max={10000}
            step={500}
          />
        )}

        <Checkbox
          label="Show Arrows"
          checked={showArrows}
          onChange={(checked) => updateStyle('showArrows', checked)}
        />

        <Checkbox
          label="Show Dots"
          checked={showDots}
          onChange={(checked) => updateStyle('showDots', checked)}
        />

        <Checkbox
          label="Show Captions"
          checked={showCaptions}
          onChange={(checked) => updateStyle('showCaptions', checked)}
        />

        <Checkbox
          label="Infinite Loop"
          checked={infinite}
          onChange={(checked) => updateStyle('infinite', checked)}
        />

        <NumberControl
          label="Animation Speed (s)"
          value={animationSpeed}
          onChange={(value) => updateStyle('animationSpeed', value)}
          min={0.1}
          max={2}
          step={0.1}
        />

        <NumberControl
          label="Height (px)"
          value={height}
          onChange={(value) => updateStyle('height', value)}
          min={200}
          max={800}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Colors</h4>

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Arrows Color"
            value={arrowsColor}
            onChange={(value) => updateStyle('arrowsColor', value)}
          />

          <ColorControl
            label="Dots Color"
            value={dotsColor}
            onChange={(value) => updateStyle('dotsColor', value)}
          />

          <ColorControl
            label="Active Dots Color"
            value={dotsActiveColor}
            onChange={(value) => updateStyle('dotsActiveColor', value)}
          />

          <ColorControl
            label="Caption Background"
            value={captionBgColor}
            onChange={(value) => updateStyle('captionBgColor', value)}
          />

          <ColorControl
            label="Caption Text"
            value={captionTextColor}
            onChange={(value) => updateStyle('captionTextColor', value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SliderSettings;
