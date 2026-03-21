import React from 'react';
import { Link } from 'react-router-dom';

export default function OfferStrip({ block }) {
  const bgStyle = {
    backgroundColor: block.stripBgColor || '#0F604B',
    color: block.stripTextColor || '#ffffff',
    fontSize: block.stripFontSize || '18px',
    paddingTop: block.paddingTop || '16px',
    paddingBottom: block.paddingBottom || '16px',
  };

  const content = (
    <div className="flex items-center justify-center gap-3 font-bold text-center">
      {block.stripText && <span>{block.stripText}</span>}
      {block.highlightText && (
        <span style={{ color: block.stripHighlightColor || '#f7bd20' }}>
          {block.highlightText}
        </span>
      )}
    </div>
  );

  if (block.enableMarquee) {
    return (
      <section style={bgStyle} className="overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="relative overflow-hidden">
            <div
              className="inline-flex whitespace-nowrap"
              style={{
                animation: `marquee ${60000 / (block.marqueeSpeed || 30)}ms linear infinite`,
              }}
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-8 mx-8">
                  {content}
                </div>
              ))}
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </div>
        </div>
      </section>
    );
  }

  const inner = (
    <section style={bgStyle}>
      <div className="max-w-[1400px] mx-auto px-4">
        {content}
      </div>
    </section>
  );

  if (block.stripLink) {
    return (
      <Link to={block.stripLink} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }

  return inner;
}
