import React from 'react';
import { Link } from 'react-router-dom';

/** View-only CategoryList for page builder */
export const CategoryList = ({ categories = [], className = '' }) => {
  if (!categories.length) {
    return <div className={`text-gray-500 ${className}`}>No categories</div>;
  }
  return (
    <ul className={`space-y-1 ${className}`}>
      {categories.map((cat) => (
        <li key={cat._id}>
          <Link to={`/shop/${cat.slug}`} className="text-primary hover:underline">
            {cat.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

CategoryList.craft = { displayName: 'CategoryList' };
