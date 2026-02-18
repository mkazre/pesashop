import React from 'react';

export const EasyPosts = ({
  layout = 'grid',
  columns = 3,
  gap = '20px',
  showImage = true,
  showTitle = true,
  showExcerpt = true,
  showDate = true,
  showAuthor = false,
  excerptLength = 120,
  posts = [],
  className = '',
  style = {},
}) => (
  <div className={className} style={{
    display: layout === 'grid' ? 'grid' : 'flex',
    gridTemplateColumns: layout === 'grid' ? `repeat(${columns}, 1fr)` : undefined,
    flexDirection: layout === 'list' ? 'column' : undefined,
    gap, ...style,
  }}>
    {posts.map((post, i) => (
      <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        {showImage && post.image && <img src={post.image} alt={post.title} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />}
        <div style={{ padding: '16px' }}>
          {showTitle && <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{post.title}</h3>}
          {(showDate || showAuthor) && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
              {showDate && post.date}{showDate && showAuthor && ' · '}{showAuthor && post.author}
            </div>
          )}
          {showExcerpt && <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{post.excerpt?.slice(0, excerptLength)}{post.excerpt?.length > excerptLength ? '...' : ''}</p>}
        </div>
      </div>
    ))}
  </div>
);

EasyPosts.craft = { displayName: 'Easy Posts' };
