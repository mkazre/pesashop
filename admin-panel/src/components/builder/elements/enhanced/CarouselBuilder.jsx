import React, { useState, useRef, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ChevronLeft, ChevronRight, Pause, Play, Image as ImageIcon, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { TextControl, NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CarouselBuilder = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { className = '', style = {} } = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  const {
    slides = [
      { title: 'Slide 1', content: 'Content for slide 1', image: 'https://picsum.photos/seed/carousel1/800/400.jpg' },
      { title: 'Slide 2', content: 'Content for slide 2', image: 'https://picsum.photos/seed/carousel2/800/400.jpg' },
      { title: 'Slide 3', content: 'Content for slide 3', image: 'https://picsum.photos/seed/carousel3/800/400.jpg' }
    ],
    autoplay = false,
    autoplaySpeed = 3000,
    showArrows = true,
    showDots = true,
    infinite = true,
    animationSpeed = 0.5,
    height = 400,
    arrowsColor = '#ffffff',
    dotsColor = '#ffffff',
    dotsActiveColor = '#3b82f6',
    backgroundColor = '#f3f4f6',
    showCaptions = true,
    captionPosition = 'bottom',
    captionBgColor = 'rgba(0,0,0,0.7)',
    captionTextColor = '#ffffff'
  } = style;

  useEffect(() => {
    if (autoplay && isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= slides.length ? (infinite ? 0 : prev) : nextIndex;
        });
      }, autoplaySpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoplay, isPlaying, autoplaySpeed, slides.length, infinite]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      return newIndex < 0 ? (infinite ? slides.length - 1 : 0) : newIndex;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= slides.length ? (infinite ? 0 : prev) : newIndex;
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSlide = slides[currentIndex];

  const getCaptionPositionStyles = () => {
    const positions = {
      top: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
      },
      bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
      },
      overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };
    return positions[captionPosition] || positions.bottom;
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`carousel-builder relative overflow-hidden ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...style,
        height: `${height}px`,
        backgroundColor,
        borderRadius: '8px'
      }}
    >
      {/* Slides Container */}
      <div 
        className="relative h-full"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: `transform ${animationSpeed}s ease-in-out`,
          display: 'flex',
          height: '100%'
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}
          >
            {/* Caption */}
            {showCaptions && (
              <div
                style={{
                  ...getCaptionPositionStyles(),
                  backgroundColor: captionBgColor,
                  color: captionTextColor,
                  padding: '20px',
                  textAlign: captionPosition === 'overlay' ? 'center' : 'left'
                }}
              >
                <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
                <p className="text-lg">{slide.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
            style={{ backgroundColor: arrowsColor }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
            style={{ backgroundColor: arrowsColor }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              style={{ backgroundColor: index === currentIndex ? dotsActiveColor : dotsColor }}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Button */}
      {autoplay && (
        <button
          onClick={togglePlayPause}
          className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
          style={{ backgroundColor: arrowsColor }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      )}
    </div>
  );
};

// Settings Panel Component
export const CarouselBuilderSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const {
    slides = [],
    autoplay = false,
    autoplaySpeed = 3000,
    showArrows = true,
    showDots = true,
    infinite = true,
    animationSpeed = 0.5,
    height = 400,
    arrowsColor = '#ffffff',
    dotsColor = '#ffffff80',
    dotsActiveColor = '#3b82f6',
    backgroundColor = '#f3f4f6',
    showCaptions = true,
    captionPosition = 'bottom',
    captionBgColor = 'rgba(0,0,0,0.7)',
    captionTextColor = '#ffffff'
  } = nodeProps;

  const updateSlide = (index, field, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setProp((p) => { p.slides = updatedSlides; });
  };

  const addSlide = () => {
    const newSlide = {
      title: `Slide ${slides.length + 1}`,
      content: 'Content for new slide',
      image: ''
    };
    setProp((p) => { p.slides = [...slides, newSlide]; });
  };

  const removeSlide = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setProp((p) => { p.slides = updatedSlides; });
  };

  const moveSlide = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    setProp((p) => {
      const arr = [...(p.slides || slides)];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      p.slides = arr;
    });
  };

  const captionPositionOptions = [
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'overlay', label: 'Overlay' }
  ];

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
              label="Content"
              value={slide.content}
              onChange={(value) => updateSlide(index, 'content', value)}
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
        <h4 className="text-sm font-medium text-gray-700">Carousel Settings</h4>

        <Checkbox
          label="Autoplay"
          checked={autoplay}
          onChange={(checked) => setProp((p) => { p.autoplay = checked; })}
        />

        {autoplay && (
          <NumberControl
            label="Autoplay Speed (ms)"
            value={autoplaySpeed}
            onChange={(value) => setProp((p) => { p.autoplaySpeed = value; })}
            min={1000}
            max={10000}
            step={500}
          />
        )}

        <Checkbox
          label="Show Arrows"
          checked={showArrows}
          onChange={(checked) => setProp((p) => { p.showArrows = checked; })}
        />

        <Checkbox
          label="Show Dots"
          checked={showDots}
          onChange={(checked) => setProp((p) => { p.showDots = checked; })}
        />

        <Checkbox
          label="Infinite Loop"
          checked={infinite}
          onChange={(checked) => setProp((p) => { p.infinite = checked; })}
        />

        <Checkbox
          label="Show Captions"
          checked={showCaptions}
          onChange={(checked) => setProp((p) => { p.showCaptions = checked; })}
        />

        {showCaptions && (
          <SelectControl
            label="Caption Position"
            value={captionPosition}
            onChange={(value) => setProp((p) => { p.captionPosition = value; })}
            options={captionPositionOptions}
          />
        )}

        <NumberControl
          label="Animation Speed (s)"
          value={animationSpeed}
          onChange={(value) => setProp((p) => { p.animationSpeed = value; })}
          min={0.1}
          max={2}
          step={0.1}
        />

        <NumberControl
          label="Height (px)"
          value={height}
          onChange={(value) => setProp((p) => { p.height = value; })}
          min={200}
          max={800}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Colors</h4>

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Background"
            value={backgroundColor}
            onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
          />

          <ColorControl
            label="Arrows"
            value={arrowsColor}
            onChange={(value) => setProp((p) => { p.arrowsColor = value; })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Dots"
            value={dotsColor}
            onChange={(value) => setProp((p) => { p.dotsColor = value; })}
          />

          <ColorControl
            label="Active Dots"
            value={dotsActiveColor}
            onChange={(value) => setProp((p) => { p.dotsActiveColor = value; })}
          />
        </div>

        {showCaptions && (
          <div className="grid grid-cols-2 gap-4">
            <ColorControl
              label="Caption Background"
              value={captionBgColor}
              onChange={(value) => setProp((p) => { p.captionBgColor = value; })}
            />

            <ColorControl
              label="Caption Text"
              value={captionTextColor}
              onChange={(value) => setProp((p) => { p.captionTextColor = value; })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Craft.js Configuration
CarouselBuilder.craft = {
  displayName: 'Carousel Builder',
  props: {
    className: '',
    style: {
      slides: [
        { title: 'Slide 1', content: 'Content for slide 1', image: 'https://picsum.photos/seed/carousel1/800/400.jpg' },
        { title: 'Slide 2', content: 'Content for slide 2', image: 'https://picsum.photos/seed/carousel2/800/400.jpg' },
        { title: 'Slide 3', content: 'Content for slide 3', image: 'https://picsum.photos/seed/carousel3/800/400.jpg' }
      ],
      autoplay: false,
      autoplaySpeed: 3000,
      showArrows: true,
      showDots: true,
      infinite: true,
      animationSpeed: 0.5,
      height: 400,
      arrowsColor: '#ffffff',
      dotsColor: '#ffffff80',
      dotsActiveColor: '#3b82f6',
      backgroundColor: '#f3f4f6',
      showCaptions: true,
      captionPosition: 'bottom',
      captionBgColor: 'rgba(0,0,0,0.7)',
      captionTextColor: '#ffffff'
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  isCanvas: true,
  related: {
    settings: CarouselBuilderSettings,
  },
};

export default CarouselBuilder;
