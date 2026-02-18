import { useState } from 'react';
import { IoChevronBack, IoChevronForward, IoExpand } from 'react-icons/io5';

export default function ProductGallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImage = images[currentIndex] || '/placeholder.jpg';

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-gray-100 aspect-square group">
        <img
          src={currentImage}
          alt="Product"
          className={`w-full h-full object-cover ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={handleZoomToggle}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
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
        <button
          onClick={handleZoomToggle}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white hover:bg-primary hover:text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
        >
          <IoExpand size={20} />
        </button>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`aspect-square bg-gray-100 border-2 overflow-hidden transition-all ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleZoomToggle}
        >
          <img
            src={currentImage}
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
