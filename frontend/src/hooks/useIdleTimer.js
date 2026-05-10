import { useEffect, useRef } from 'react';

const EVENTS = ['pointerdown', 'touchstart', 'keydown', 'mousemove', 'wheel'];

export function useIdleTimer({ timeout, onIdle, onActive, enabled = true } = {}) {
  const timerRef = useRef(null);
  const idleRef = useRef(false);
  const onIdleRef = useRef(onIdle);
  const onActiveRef = useRef(onActive);

  useEffect(() => { onIdleRef.current = onIdle; }, [onIdle]);
  useEffect(() => { onActiveRef.current = onActive; }, [onActive]);

  useEffect(() => {
    if (!enabled || !timeout) return undefined;

    const reset = () => {
      if (idleRef.current) {
        idleRef.current = false;
        onActiveRef.current && onActiveRef.current();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        idleRef.current = true;
        onIdleRef.current && onIdleRef.current();
      }, timeout);
    };

    EVENTS.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      EVENTS.forEach(ev => window.removeEventListener(ev, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeout, enabled]);
}
