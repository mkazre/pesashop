import { useState, useMemo } from 'react';
import { IoChevronBack, IoChevronForward, IoExpand, IoPlayCircle } from 'react-icons/io5';
import { FaYoutube, FaVimeo } from 'react-icons/fa';
import { getVideoRenderInfo } from '@/utils/videoUrl';

function VideoBadge({ platform }) {
  const Icon = platform === 'youtube' ? FaYoutube : platform === 'vimeo' ? FaVimeo : IoPlayCircle;
  return (
    <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-black/55 flex items-center justify-center pointer-events-none">
      <Icon size={16} className="text-white" />
    </div>
  );
}

export default function ProductGallery({ images = [], videos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const slides = useMemo(() => {
    const imageSlides = images.map((src) => ({ type: 'image', src }));
    const videoSlides = videos
      .filter((v) => v && v.url)
      .map((video) => ({ type: 'video', video, ...getVideoRenderInfo(video) }));
    return [...imageSlides, ...videoSlides];
  }, [images, videos]);

  const currentSlide = slides[currentIndex] || { type: 'image', src: '/placeholder.jpg' };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleZoomToggle = () => {
    if (currentSlide.type !== 'image') return;
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="space-y-4">
      {/* Main Slide */}
      <div className="relative bg-gray-100 aspect-square group">
        {currentSlide.type === 'video' ? (
          currentSlide.kind === 'file' ? (
            <video
              key={currentSlide.src}
              src={currentSlide.src}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full bg-black">
              <iframe
                key={currentSlide.src}
                src={currentSlide.src}
                title="Product video"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={!currentSlide.platform}
              />
              {currentSlide.platform && <VideoBadge platform={currentSlide.platform} />}
            </div>
          )
        ) : (
          <img
            src={currentSlide.src}
            alt="Product"
            className={`w-full h-full object-cover ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={handleZoomToggle}
          />
        )}

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-primary hover:text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
            >
              <IoChevronBack size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-primary hover:text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
            >
              <IoChevronForward size={24} />
            </button>
          </>
        )}

        {/* Zoom Button */}
        {currentSlide.type === 'image' && (
          <button
            onClick={handleZoomToggle}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white hover:bg-primary hover:text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
          >
            <IoExpand size={20} />
          </button>
        )}

        {/* Slide Counter */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 text-sm">
            {currentIndex + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {slides.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative aspect-square bg-gray-100 border-2 overflow-hidden transition-all ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {slide.type === 'video' ? (
                <>
                  {slide.thumbnail ? (
                    <img src={slide.thumbnail} alt={`Video ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IoPlayCircle size={24} className="text-white drop-shadow" />
                  </div>
                </>
              ) : (
                <img
                  src={slide.src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && currentSlide.type === 'image' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleZoomToggle}
        >
          <img
            src={currentSlide.src}
            alt="Product Zoomed"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={handleZoomToggle}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
