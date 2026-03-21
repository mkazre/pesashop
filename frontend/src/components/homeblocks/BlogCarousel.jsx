import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import BlockWrapper from './BlockWrapper';

export default function BlogCarousel({ block }) {
  const slidesToShow = block.slidesToShow || 3;
  const [offset, setOffset] = useState(0);

  // Fetch blog posts from API
  const { data: posts = [], isLoading } = useQuery(
    ['blogPosts', block.blogSource, block.blogLimit],
    async () => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/blog?sort=${block.blogSource || 'latest'}&limit=${block.blogLimit || 6}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.posts || json.data || [];
    },
    { staleTime: 5 * 60 * 1000, retry: false }
  );

  const maxOffset = Math.max(0, posts.length - slidesToShow);

  useEffect(() => {
    if (posts.length <= slidesToShow) return;
    const timer = setInterval(() => {
      setOffset(o => (o >= maxOffset ? 0 : o + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [posts.length, slidesToShow, maxOffset]);

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  if (isLoading) {
    return (
      <BlockWrapper block={block}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(slidesToShow)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-80" />
          ))}
        </div>
      </BlockWrapper>
    );
  }

  if (!posts.length) return null;

  return (
    <BlockWrapper block={block}>
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${offset * (100 / slidesToShow)}%)` }}
        >
          {posts.map((post, i) => (
            <div
              key={post._id || i}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / slidesToShow}%` }}
            >
              <div
                className="bg-white border rounded-xl overflow-hidden group h-full flex flex-col"
                style={{ borderRadius: block.cardBorderRadius || '12px' }}
              >
                {post.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={resolveImg(post.image)}
                      alt={post.title || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  {block.showDate !== false && post.createdAt && (
                    <span className="text-xs text-gray-400 mb-2">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                  </h4>
                  {block.showExcerpt !== false && post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{post.excerpt}</p>
                  )}
                  {block.showReadMore !== false && (
                    <Link
                      to={`/blog/${post.slug || post._id}`}
                      className="text-sm font-semibold inline-flex items-center gap-1 mt-auto"
                      style={{ color: block.linkColor || block.primaryColor || '#0F604B' }}
                    >
                      Read More
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length > slidesToShow && (
          <>
            <button onClick={() => setOffset(o => Math.max(o - 1, 0))} disabled={offset === 0} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setOffset(o => Math.min(o + 1, maxOffset))} disabled={offset >= maxOffset} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
    </BlockWrapper>
  );
}
