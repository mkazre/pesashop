import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function NewsletterBlock({ block }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success('Subscribed successfully!');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Subscription failed');
      }
    } catch {
      toast.error('Subscription failed');
    } finally {
      setSubmitting(false);
    }
  };

  const bgStyle = {
    backgroundColor: block.bgColor || '#0F604B',
    backgroundImage: block.bgImage ? `url(${resolveImg(block.bgImage)})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    paddingTop: block.paddingTop || '60px',
    paddingBottom: block.paddingBottom || '60px',
  };

  return (
    <section style={bgStyle} className="relative">
      {block.bgImage && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          {block.showIcon !== false && (
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke={block.textColor || '#ffffff'} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          )}
          {block.heading && (
            <h2
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ color: block.textColor || '#ffffff' }}
            >
              {block.heading}
            </h2>
          )}
          {block.subtitle && (
            <p
              className="text-sm md:text-base mb-6 opacity-90"
              style={{ color: block.textColor || '#ffffff' }}
            >
              {block.subtitle}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={block.placeholder || 'Enter your email address'}
              required
              className="flex-1 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: block.buttonBgColor || '#f7bd20',
                color: block.buttonTextColor || '#333333',
              }}
            >
              {submitting ? '...' : (block.buttonText || 'Subscribe')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
