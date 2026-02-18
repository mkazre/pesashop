import React, { useState, useRef, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { TextControl, NumberControl, ColorControl, Checkbox } from '@/components/builder/controls/PropertyControls';

export const ContentSlider = ({ className = '', style = {} }) => {
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
      { title: 'Slide 1', content: 'Content for slide 1', image: 'https://picsum.photos/seed/slide1/800/400.jpg' },
      { title: 'Slide 2', content: 'Content for slide 2', image: 'https://picsum.photos/seed/slide2/800/400.jpg' },
      { title: 'Slide 3', content: 'Content for slide 3', image: 'https://picsum.photos/seed/slide3/800/400.jpg' }
    ],
    autoplay = false,
    autoplaySpeed = 3000,
    showArrows = true,
    showDots = true,
    infinite = true,
    animationSpeed = 0.5
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

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`content-slider relative overflow-hidden ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...style,
        height: style.height || '400px',
        backgroundColor: style.backgroundColor || '#f3f4f6'
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
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            <div 
              className="w-full p-6"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: 'white'
              }}
            >
              <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
              <p className="text-lg">{slide.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
            style={{ backgroundColor: style.arrowColor || '#ffffff' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
            style={{ backgroundColor: style.arrowColor || '#ffffff' }}
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
              style={{ backgroundColor: index === currentIndex ? (style.dotActiveColor || '#ffffff') : (style.dotColor || '#ffffff80') }}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Button */}
      {autoplay && (
        <button
          onClick={togglePlayPause}
          className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
          style={{ backgroundColor: style.playButtonColor || '#ffffff' }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      )}

      {/* Slide Counter */}
      {style.showSlideCounter && (
        <div 
          className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm"
          style={{ backgroundColor: style.counterBgColor || '#00000080' }}
        >
          {currentIndex + 1} / {slides.length}
        </div>
      )}
    </div>
  );
};

// Settings Panel Component
export const ContentSliderSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    slides = [],
    autoplay = false,
    autoplaySpeed = 3000,
    showArrows = true,
    showDots = true,
    infinite = true,
    animationSpeed = 0.5,
    height = 400,
    arrowColor = '#ffffff',
    dotColor = '#ffffff80',
    dotActiveColor = '#ffffff',
    playButtonColor = '#ffffff',
    counterBgColor = '#00000080',
    showSlideCounter = false
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
      image: `https://picsum.photos/seed/slide${slides.length + 1}/800/400.jpg`
    };
    setProp((p) => { p.slides = [...slides, newSlide]; });
  };

  const removeSlide = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setProp((p) => { p.slides = updatedSlides; });
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
              label="Content"
              value={slide.content}
              onChange={(value) => updateSlide(index, 'content', value)}
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
          onChange={(checked) => setProp((p) => { if (!p.style) p.style = {}; p.style.autoplay = checked ; })}
        />

        {autoplay && (
          <NumberControl
            label="Autoplay Speed (ms)"
            value={autoplaySpeed}
            onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.autoplaySpeed = value ; })}
            min={1000}
            max={10000}
            step={500}
          />
        )}

        <Checkbox
          label="Show Arrows"
          checked={showArrows}
          onChange={(checked) => setProp((p) => { if (!p.style) p.style = {}; p.style.showArrows = checked ; })}
        />

        <Checkbox
          label="Show Dots"
          checked={showDots}
          onChange={(checked) => setProp((p) => { if (!p.style) p.style = {}; p.style.showDots = checked ; })}
        />

        <Checkbox
          label="Infinite Loop"
          checked={infinite}
          onChange={(checked) => setProp((p) => { if (!p.style) p.style = {}; p.style.infinite = checked ; })}
        />

        <Checkbox
          label="Show Slide Counter"
          checked={showSlideCounter}
          onChange={(checked) => setProp((p) => { if (!p.style) p.style = {}; p.style.showSlideCounter = checked ; })}
        />

        <NumberControl
          label="Animation Speed (s)"
          value={animationSpeed}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.animationSpeed = value ; })}
          min={0.1}
          max={2}
          step={0.1}
        />

        <NumberControl
          label="Height (px)"
          value={height}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.height = value ; })}
          min={200}
          max={800}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Colors</h4>

        <ColorControl
          label="Arrow Color"
          value={arrowColor}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.arrowColor = value ; })}
        />

        <ColorControl
          label="Dot Color"
          value={dotColor}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.dotColor = value ; })}
        />

        <ColorControl
          label="Active Dot Color"
          value={dotActiveColor}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.dotActiveColor = value ; })}
        />

        <ColorControl
          label="Play Button Color"
          value={playButtonColor}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.playButtonColor = value ; })}
        />

        <ColorControl
          label="Counter Background"
          value={counterBgColor}
          onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.counterBgColor = value ; })}
        />
      </div>
    </div>
  );
};

// Craft.js Configuration
ContentSlider.craft = {
  displayName: 'Content Slider',
  props: {
    className: '',
    style: {
      slides: [
        { title: 'Slide 1', content: 'Content for slide 1', image: 'https://picsum.photos/seed/slide1/800/400.jpg' },
        { title: 'Slide 2', content: 'Content for slide 2', image: 'https://picsum.photos/seed/slide2/800/400.jpg' },
        { title: 'Slide 3', content: 'Content for slide 3', image: 'https://picsum.photos/seed/slide3/800/400.jpg' }
      ],
      autoplay: false,
      autoplaySpeed: 3000,
      showArrows: true,
      showDots: true,
      infinite: true,
      animationSpeed: 0.5,
      height: 400,
      arrowColor: '#ffffff',
      dotColor: '#ffffff80',
      dotActiveColor: '#ffffff',
      playButtonColor: '#ffffff',
      counterBgColor: '#00000080',
      showSlideCounter: false
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
    settings: ContentSliderSettings,
  },
};

export default ContentSlider;
