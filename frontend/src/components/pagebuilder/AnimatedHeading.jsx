import React, { useState, useEffect, useRef } from 'react';

export const AnimatedHeading = ({
  text = 'Animated Heading',
  animationType = 'fadeIn',
  animationDuration = 0.6,
  animationDelay = 0,
  animationEasing = 'ease-out',
  color = '#000000',
  fontSize = 32,
  fontWeight = 'bold',
  className = '',
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setIsVisible(entry.isIntersecting); },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => { if (elementRef.current) observer.unobserve(elementRef.current); };
  }, []);

  const getAnimationClass = () => {
    if (!isVisible) return 'pb-anim-hidden';
    const animations = {
      fadeIn: 'pb-anim-fade-in',
      slideUp: 'pb-anim-slide-up',
      slideDown: 'pb-anim-slide-down',
      slideLeft: 'pb-anim-slide-left',
      slideRight: 'pb-anim-slide-right',
      zoomIn: 'pb-anim-zoom-in',
      typewriter: 'pb-anim-typewriter',
      bounce: 'pb-anim-bounce',
      rotate: 'pb-anim-rotate',
    };
    return animations[animationType] || 'pb-anim-fade-in';
  };

  const getAnimationStyle = () => {
    const baseStyle = {
      color,
      fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
      fontWeight,
      ...style,
      transition: `all ${animationDuration}s ${animationEasing} ${animationDelay}s`,
    };
    if (animationType === 'typewriter') {
      return {
        ...baseStyle,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderRight: `2px solid ${color || '#000'}`,
        animation: isVisible
          ? `pb-typewriter ${animationDuration || 2}s steps(${text.length}) ${animationDelay}s ${animationEasing} forwards`
          : 'none',
      };
    }
    return baseStyle;
  };

  return (
    <>
      <h1
        ref={elementRef}
        className={`${className} ${getAnimationClass()}`}
        style={getAnimationStyle()}
      >
        {text}
      </h1>
      <style dangerouslySetInnerHTML={{ __html: `
        .pb-anim-hidden { opacity: 0; transform: translateY(20px); }

        @keyframes pb-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pb-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pb-slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pb-slide-left {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pb-slide-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pb-zoom-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pb-typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes pb-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes pb-rotate {
          from { transform: rotate(0deg); opacity: 0; }
          to { transform: rotate(360deg); opacity: 1; }
        }

        .pb-anim-fade-in { animation: pb-fade-in 0.6s ease-out forwards; }
        .pb-anim-slide-up { animation: pb-slide-up 0.6s ease-out forwards; }
        .pb-anim-slide-down { animation: pb-slide-down 0.6s ease-out forwards; }
        .pb-anim-slide-left { animation: pb-slide-left 0.6s ease-out forwards; }
        .pb-anim-slide-right { animation: pb-slide-right 0.6s ease-out forwards; }
        .pb-anim-zoom-in { animation: pb-zoom-in 0.6s ease-out forwards; }
        .pb-anim-typewriter { animation: pb-typewriter 2s steps(40) 1s ease-out forwards; }
        .pb-anim-bounce { animation: pb-bounce 1s ease-out forwards; }
        .pb-anim-rotate { animation: pb-rotate 1s ease-out forwards; }
      ` }} />
    </>
  );
};

AnimatedHeading.craft = { displayName: 'Animated Heading' };
