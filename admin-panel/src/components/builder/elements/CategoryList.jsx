import React, { useState, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { categoriesAPI } from '@/services/api';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';
import { Folder } from 'lucide-react';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CategoryList = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { 
  layout = 'grid', // 'grid' or 'list'
  columns = 3,
  showImage = true,
  showDescription = false,
  responsiveProps = {},
  className = '',
  style = {}
} = resolved;

  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, '16px', responsiveProps);
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await categoriesAPI.getAll();
        setCategories(response.data.data || response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div
        ref={(ref) => connect(drag(ref))}
        className={`category-list-loading ${className} ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${hovered ? 'ring-2 ring-blue-300' : ''} p-4 text-center text-gray-500`}
      >
        Loading categories...
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`category-list ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      {layout === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`, gap: effectiveGap }}>
          {categories.map((category) => (
            <a
              key={category._id || category.id}
              href={`/category/${category.slug || category._id}`}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {showImage && (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Folder size={48} className="text-gray-400" />
                  )}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                {showDescription && category.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <a
              key={category._id || category.id}
              href={`/category/${category.slug || category._id}`}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showImage && category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{category.name}</h3>
                {showDescription && category.description && (
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {category.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

CategoryList.craft = {
  displayName: 'Category List',
  props: {
    layout: 'grid',
    columns: 3,
    responsiveProps: {},
    showImage: true,
    showDescription: false,
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
