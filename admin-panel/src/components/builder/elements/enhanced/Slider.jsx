import React, { useState, useRef, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { TextControl, NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { SliderSettings } from './SliderSettings';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Slider = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { slides = [], className = '', style = {} } = resolved;

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
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef(null);

  const defaultSlides = [
    { image: 'https://picsum.photos/seed/slider1/800/400.jpg', title: 'Slide 1', caption: 'Caption for slide 1' },
    { image: 'https://picsum.photos/seed/slider2/800/400.jpg', title: 'Slide 2', caption: 'Caption for slide 2' },
    { image: 'https://picsum.photos/seed/slider3/800/400.jpg', title: 'Slide 3', caption: 'Caption for slide 3' }
  ];

  const sliderSlides = slides && slides.length > 0 ? slides : defaultSlides;

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
    dotsColor = '#ffffff',
    dotsActiveColor = '#3b82f6',
    captionPosition = 'bottom',
    captionBgColor = 'rgba(0,0,0,0.7)',
    captionTextColor = '#ffffff'
  } = style;

  useEffect(() => {
    if (autoplay && isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= sliderSlides.length ? (infinite ? 0 : prev) : nextIndex;
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
  }, [autoplay, isPlaying, autoplaySpeed, sliderSlides.length, infinite]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      return newIndex < 0 ? (infinite ? sliderSlides.length - 1 : 0) : newIndex;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= sliderSlides.length ? (infinite ? 0 : prev) : newIndex;
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSlide = sliderSlides[currentIndex];

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`slider ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...style,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6'
      }}
    >
      {/* Slides Container */}
      <div 
        className="slides-container"
        style={{
          display: 'flex',
          height: '100%',
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: `transform ${animationSpeed}s ease-in-out`
        }}
      >
        {sliderSlides.map((slide, index) => (
          <div
            key={index}
            className="slide"
            style={{
              width: '100%',
              height: '100%',
              flexShrink: 0,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}
          >
            {/* Captions */}
            {showCaptions && (
              <div
                className="slide-caption"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: captionBgColor,
                  color: captionTextColor,
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                <p>{slide.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && sliderSlides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="slider-arrow slider-arrow-prev"
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: arrowsColor,
              color: '#000000',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.8,
              transition: 'opacity 0.3s'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            className="slider-arrow slider-arrow-next"
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: arrowsColor,
              color: '#000000',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.8,
              transition: 'opacity 0.3s'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && sliderSlides.length > 1 && (
        <div
          className="slider-dots"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px'
          }}
        >
          {sliderSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="slider-dot"
              style={{
                width: index === currentIndex ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: index === currentIndex ? dotsActiveColor : dotsColor,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Button */}
      {autoplay && (
        <button
          onClick={togglePlayPause}
          className="slider-play-pause"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: arrowsColor,
            color: '#000000',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.3s'
          }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      )}
    </div>
  );
};

Slider.craft = {
  displayName: 'Slider',
  props: {
    slides: [
      { image: 'https://picsum.photos/seed/slider1/800/400.jpg', title: 'Slide 1', caption: 'Caption for slide 1' },
      { image: 'https://picsum.photos/seed/slider2/800/400.jpg', title: 'Slide 2', caption: 'Caption for slide 2' },
      { image: 'https://picsum.photos/seed/slider3/800/400.jpg', title: 'Slide 3', caption: 'Caption for slide 3' }
    ],
    className: '',
    style: {
      autoplay: false,
      autoplaySpeed: 3000,
      showArrows: true,
      showDots: true,
      showCaptions: true,
      infinite: true,
      animationSpeed: 0.5,
      height: 400,
      arrowsColor: '#ffffff',
      dotsColor: '#ffffff80',
      dotsActiveColor: '#3b82f6',
      captionPosition: 'bottom',
      captionBgColor: 'rgba(0,0,0,0.7)',
      captionTextColor: '#ffffff'
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Slider'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
  isCanvas: true, // This allows the element to contain other elements
  related: {
    settings: SliderSettings,
  },
};

export default Slider;
