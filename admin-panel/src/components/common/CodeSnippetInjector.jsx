import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { codeSnippetsAPI } from '@/services/api';

/**
 * Code Snippet Injector Component
 * Safely injects code snippets into the React app.
 * Cleans up previous injections on route change to prevent accumulation.
 */
const CodeSnippetInjector = ({ environment = 'admin' }) => {
  const location = useLocation();
  const injectedIds = useRef(new Set());

  useEffect(() => {
    // Clean up previous route's snippets
    injectedIds.current.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    injectedIds.current.clear();

    const injectSnippets = async () => {
      try {
        const pageType = getPageType(location.pathname);
        const pagePath = location.pathname;

        const locations = ['header', 'footer', 'body_start', 'body_end',
          'after_opening_head', 'before_closing_head', 'after_opening_body', 'before_closing_body'];

        for (const loc of locations) {
          try {
            const response = await codeSnippetsAPI.getActive(environment, loc, {
              pagePath,
              pageType
            });

            if (response.data.success && response.data.data) {
              injectSnippetsForLocation(response.data.data, loc, injectedIds);
            }
          } catch (error) {
            console.error(`Error loading snippets for ${loc}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in code snippet injection:', error);
      }
    };

    injectSnippets();

    return () => {
      injectedIds.current.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      injectedIds.current.clear();
    };
  }, [location.pathname, environment]);

  return null;
};

/**
 * Inject snippets for a specific location
 */
const injectSnippetsForLocation = (snippets, location, injectedIdsRef) => {
  if (!snippets || snippets.length === 0) return;

  snippets.forEach(snippet => {
    try {
      // Check device target
      if (snippet.deviceTarget !== 'all') {
        const width = window.innerWidth;
        let shouldInject = false;

        switch (snippet.deviceTarget) {
          case 'mobile':
            shouldInject = width <= 768;
            break;
          case 'tablet':
            shouldInject = width > 768 && width <= 1024;
            break;
          case 'desktop':
            shouldInject = width > 1024;
            break;
        }

        if (!shouldInject) return;
      }

      switch (snippet.type) {
        case 'javascript':
          injectJavaScript(snippet, location, injectedIdsRef);
          break;
        case 'css':
          injectCSS(snippet, injectedIdsRef);
          break;
        case 'html':
          injectHTML(snippet, location, injectedIdsRef);
          break;
      }
    } catch (error) {
      console.error(`Error injecting snippet ${snippet.name}:`, error);
    }
  });
};

/**
 * Inject JavaScript snippet
 */
const injectJavaScript = (snippet, location, injectedIdsRef) => {
  const elId = `snippet-${snippet._id}`;
  if (document.getElementById(elId)) return;

  const script = document.createElement('script');
  script.id = elId;
  script.textContent = snippet.code;
  
  if (snippet.async) script.async = true;
  if (snippet.defer) script.defer = true;

  const target = getInjectionTarget(location);
  target.appendChild(script);
  if (injectedIdsRef) injectedIdsRef.current.add(elId);
};

/**
 * Inject CSS snippet
 */
const injectCSS = (snippet, injectedIdsRef) => {
  const elId = `snippet-${snippet._id}`;
  if (document.getElementById(elId)) return;

  const style = document.createElement('style');
  style.id = elId;
  
  if (snippet.deviceTarget !== 'all') {
    const mediaQuery = getCSSMediaQuery(snippet.deviceTarget);
    style.textContent = `@media ${mediaQuery} {\n${snippet.code}\n}`;
  } else {
    style.textContent = snippet.code;
  }

  document.head.appendChild(style);
  if (injectedIdsRef) injectedIdsRef.current.add(elId);
};

/**
 * Inject HTML snippet
 */
const injectHTML = (snippet, location, injectedIdsRef) => {
  const elId = `snippet-${snippet._id}`;
  if (document.getElementById(elId)) return;

  const div = document.createElement('div');
  div.id = elId;
  div.innerHTML = snippet.code;

  const target = getInjectionTarget(location);
  target.appendChild(div);
  if (injectedIdsRef) injectedIdsRef.current.add(elId);
};

/**
 * Get injection target element
 */
const getInjectionTarget = (location) => {
  switch (location) {
    case 'header':
    case 'body_start':
      return document.head;
    case 'footer':
    case 'body_end':
      return document.body;
    default:
      return document.body;
  }
};

/**
 * Get CSS media query for device target
 */
const getCSSMediaQuery = (deviceTarget) => {
  const queries = {
    mobile: '(max-width: 768px)',
    tablet: '(min-width: 769px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)'
  };
  return queries[deviceTarget] || '';
};

/**
 * Determine page type from pathname
 */
const getPageType = (pathname) => {
  if (pathname === '/') return 'homepage';
  if (pathname.startsWith('/products') || pathname.startsWith('/shop')) return 'shop';
  if (pathname.startsWith('/product/')) return 'product';
  if (pathname.startsWith('/cart')) return 'cart';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/account')) return 'account';
  if (pathname === '/login') return 'login';
  if (pathname === '/register') return 'register';
  return 'custom';
};

export default CodeSnippetInjector;
