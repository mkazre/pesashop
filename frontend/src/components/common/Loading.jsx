export default function Loading({ fullScreen = false, text = 'Loading...' }) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-4">
          {/* Shopping bag icon with animated dots */}
          <div className="relative">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary animate-[bounce_1.5s_ease-in-out_infinite]">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/80 animate-[pulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-[pulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-[pulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
          </div>
          {text && <p className="text-sm font-medium text-gray-500 tracking-wide">{text}</p>}
        </div>
      </div>
    </div>
  );
}
