import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Code Snippet Injector for the Frontend Storefront
 * Fetches and injects active code snippets (JS/CSS/HTML) based on current route.
 * Cleans up previous injections on route change to prevent accumulation.
 */
const CodeSnippetInjector = ({ environment = 'frontend' }) => {
  const location = useLocation();
  const injectedIds = useRef(new Set());

  const getPageType = useCallback((pathname) => {
    if (pathname === '/') return 'homepage';
    if (pathname.startsWith('/products') || pathname.startsWith('/shop')) return 'shop';
    if (pathname.startsWith('/product/')) return 'product';
    if (pathname.startsWith('/cart')) return 'cart';
    if (pathname.startsWith('/checkout')) return 'checkout';
    if (pathname.startsWith('/account')) return 'account';
    if (pathname === '/login') return 'login';
    if (pathname === '/register') return 'register';
    return 'custom';
  }, []);

  const cleanupSnippets = useCallback(() => {
    injectedIds.current.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    injectedIds.current.clear();
  }, []);

  const getCSSMediaQuery = (deviceTarget) => {
    const queries = {
      mobile: '(max-width: 768px)',
      tablet: '(min-width: 769px) and (max-width: 1024px)',
      desktop: '(min-width: 1025px)'
    };
    return queries[deviceTarget] || '';
  };

  const shouldInjectForDevice = (deviceTarget) => {
    if (deviceTarget === 'all') return true;
    const w = window.innerWidth;
    if (deviceTarget === 'mobile') return w <= 768;
    if (deviceTarget === 'tablet') return w > 768 && w <= 1024;
    if (deviceTarget === 'desktop') return w > 1024;
    return true;
  };

  const injectJS = (snippet, loc) => {
    const elId = `snippet-${snippet._id}`;
    if (document.getElementById(elId)) return;
    const script = document.createElement('script');
    script.id = elId;
    script.textContent = snippet.code;
    if (snippet.async) script.async = true;
    if (snippet.defer) script.defer = true;
    const target = (loc === 'header' || loc === 'before_closing_head' || loc === 'after_opening_head')
      ? document.head : document.body;
    target.appendChild(script);
    injectedIds.current.add(elId);
  };

  const injectCSS = (snippet) => {
    const elId = `snippet-${snippet._id}`;
    if (document.getElementById(elId)) return;
    const style = document.createElement('style');
    style.id = elId;
    if (snippet.deviceTarget && snippet.deviceTarget !== 'all') {
      const mq = getCSSMediaQuery(snippet.deviceTarget);
      style.textContent = `@media ${mq} {\n${snippet.code}\n}`;
    } else {
      style.textContent = snippet.code;
    }
    document.head.appendChild(style);
    injectedIds.current.add(elId);
  };

  const injectHTML = (snippet, loc) => {
    const elId = `snippet-${snippet._id}`;
    if (document.getElementById(elId)) return;
    const div = document.createElement('div');
    div.id = elId;
    div.innerHTML = snippet.code;
    const target = (loc === 'header' || loc === 'before_closing_head' || loc === 'after_opening_head')
      ? document.head : document.body;
    target.appendChild(div);
    injectedIds.current.add(elId);
  };

  useEffect(() => {
    const injectAll = async () => {
      // Clean up previous route's snippets
      cleanupSnippets();

      const pageType = getPageType(location.pathname);
      const pagePath = location.pathname;
      const locations = ['header', 'footer', 'body_start', 'body_end',
        'after_opening_head', 'before_closing_head', 'after_opening_body', 'before_closing_body'];

      for (const loc of locations) {
        try {
          const res = await fetch(
            `${API_URL}/api/code-snippets/active/${environment}/${loc}?pagePath=${encodeURIComponent(pagePath)}&pageType=${encodeURIComponent(pageType)}`
          );
          if (!res.ok) continue;
          const json = await res.json();
          if (!json.success || !json.data) continue;

          for (const snippet of json.data) {
            if (!shouldInjectForDevice(snippet.deviceTarget)) continue;
            switch (snippet.type) {
              case 'javascript': injectJS(snippet, loc); break;
              case 'css': injectCSS(snippet); break;
              case 'html': injectHTML(snippet, loc); break;
            }
          }
        } catch {
          // Silently fail — don't break the storefront
        }
      }
    };

    injectAll();

    return () => cleanupSnippets();
  }, [location.pathname, environment, getPageType, cleanupSnippets]);

  return null;
};

export default CodeSnippetInjector;
