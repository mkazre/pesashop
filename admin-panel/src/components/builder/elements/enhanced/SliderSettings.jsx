import React from 'react';
import { useEditor } from '@craftjs/core';
import { TextControl, NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';

export const SliderSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { slides = [], style = {} } = nodeProps;
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
      p.slides = [...(p.slides || []), { image: `https://picsum.photos/seed/slider${(p.slides || []).length + 1}/800/400.jpg`, title: `Slide ${(p.slides || []).length + 1}`, caption: `Caption for slide ${(p.slides || []).length + 1}` }];
    });
  };

  const removeSlide = (index) => {
    setProp((p) => { p.slides = p.slides.filter((_, i) => i !== index); });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Slides</h4>
          <button
            onClick={addSlide}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Slide
          </button>
        </div>

        {slides.map((slide, index) => (
          <div key={index} className="p-3 border rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Slide {index + 1}</span>
              {slides.length > 1 && (
                <button
                  onClick={() => removeSlide(index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              )}
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

            <TextControl
              label="Image URL"
              value={slide.image}
              onChange={(value) => updateSlide(index, 'image', value)}
            />
          </div>
        ))}
      </div>

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
