import { IoStar, IoStarHalf, IoStarOutline } from 'react-icons/io5';

export default function StarRating({ rating = 0, count, size = 'md', showCount = true }) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<IoStar key={`full-${i}`} className="text-yellow-400" />);
    }

    // Half star
    if (hasHalfStar && fullStars < 5) {
      stars.push(<IoStarHalf key="half" className="text-yellow-400" />);
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<IoStarOutline key={`empty-${i}`} className="text-yellow-400" />);
    }

    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${sizes[size]}`}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showCount && count !== undefined && (
        <span className="text-gray-600 text-sm ml-1">({count})</span>
      )}
    </div>
  );
}
