import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <button
      onClick={scrollUp}
      aria-label="Scroll to top"
      className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl md:bottom-8 md:right-8"
      style={{ animation: 'fadeInUp 0.2s ease-out' }}
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
}
