import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { categoriesAPI } from '@/services/api';
import { IoChevronForward, IoChevronBack } from 'react-icons/io5';
import { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getImageSrc(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

const CARD_STYLES = {
  minimal: '',
  bordered: 'border border-gray-200',
  elevated: 'shadow-md',
  filled: 'bg-gray-100',
};

export default function CategoryShowcase({ settings = {} }) {
  const cs = settings?.categoryShowcase || {};
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data } = useQuery(
    'categoriesPublic',
    () => categoriesAPI.getAll({ isActive: true }),
    { staleTime: 5 * 60 * 1000 }
  );

  const categories = (data?.data?.data || data?.data || []);

  if (!categories.length) return null;

  const iconSize = cs.iconSize || 64;
  const cardStyle = CARD_STYLES[cs.cardStyle || 'bordered'];
  const displayType = cs.displayType || 'carousel';

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const CategoryCard = ({ category }) => {
    const iconUrl = getImageSrc(category.iconImage?.url || category.image?.url);
    return (
      <Link
        to={`/shop/${category.slug}`}
        className={`flex flex-col items-center p-4 rounded-lg hover:shadow-lg transition-all duration-200 group ${cardStyle}`}
        style={{ minWidth: displayType === 'carousel' ? '140px' : undefined }}
      >
        {cs.showIcon !== false && iconUrl && (
          <div
            className="rounded-full overflow-hidden bg-gray-100 flex-shrink-0 mb-2"
            style={{ width: iconSize, height: iconSize }}
          >
            <img src={iconUrl} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
        {cs.showIcon !== false && !iconUrl && (
          <div
            className="rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 mb-2"
            style={{ width: iconSize, height: iconSize, fontSize: iconSize * 0.35 }}
          >
            {category.name?.charAt(0)}
          </div>
        )}
        {cs.showName !== false && (
          <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors text-center leading-tight">
            {category.name}
          </span>
        )}
        {cs.showCount !== false && (
          <span className="text-[11px] text-gray-500 mt-0.5">{category.productCount || 0} products</span>
        )}
        {cs.showDescription && category.description && (
          <p className="text-[11px] text-gray-500 mt-1 text-center line-clamp-2">{category.description}</p>
        )}
      </Link>
    );
  };

  // ─── CAROUSEL ────────────────────────────────────────────────────────────
  if (displayType === 'carousel') {
    return (
      <div className="mb-6 relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Browse Categories</h3>
          <Link to="/shop" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="relative group/carousel">
          {canScrollLeft && (
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <IoChevronBack size={18} />
            </button>
          )}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {categories.map(cat => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
          </div>
          {canScrollRight && (
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <IoChevronForward size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── GRID / ICON-GRID ───────────────────────────────────────────────────
  const colsD = cs.columnsDesktop || 6;
  const colsT = cs.columnsTablet || 4;
  const colsM = cs.columnsMobile || 3;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Browse Categories</h3>
        <Link to="/shop" className="text-sm text-primary hover:underline">View All</Link>
      </div>
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${colsM}, 1fr)`,
        }}
      >
        {categories.map(cat => (
          <CategoryCard key={cat._id} category={cat} />
        ))}
      </div>
      <style>{`
        @media (min-width: 640px) {
          .category-showcase-grid { grid-template-columns: repeat(${colsT}, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .category-showcase-grid { grid-template-columns: repeat(${colsD}, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
