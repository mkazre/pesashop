import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared wrapper for all home page blocks.
 * Handles section title, view-all link, container width, padding, background.
 */
export default function BlockWrapper({ block, children }) {
  const containerClass = block.containerWidth === 'full' ? '' : 'max-w-[1400px] mx-auto px-4';
  const style = {
    backgroundColor: block.backgroundColor || undefined,
    paddingTop: block.paddingTop || '40px',
    paddingBottom: block.paddingBottom || '40px',
  };

  return (
    <section style={style}>
      <div className={containerClass}>
        {block.showSectionTitle && block.sectionTitle && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="font-bold text-gray-900"
                style={{
                  fontSize: block.sectionTitleSize || '24px',
                  color: block.sectionTitleColor || undefined,
                }}
              >
                {block.sectionTitle}
              </h2>
              {block.sectionSubtitle && (
                <p
                  className="text-gray-500 mt-1"
                  style={{
                    fontSize: block.sectionSubtitleSize || '14px',
                    color: block.sectionSubtitleColor || undefined,
                  }}
                >
                  {block.sectionSubtitle}
                </p>
              )}
            </div>
            {block.showViewAll && block.viewAllLink && (
              <Link
                to={block.viewAllLink}
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{ color: block.linkColor || block.primaryColor || '#0F604B' }}
              >
                {block.viewAllText || 'View All'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
