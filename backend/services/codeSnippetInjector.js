/**
 * Safe Code Snippet Injector
 * Safely injects code snippets into HTML with error handling
 */

const CodeSnippet = require('../models/CodeSnippet');

class CodeSnippetInjector {
  /**
   * Inject snippets into HTML based on location
   */
  async injectSnippets(html, environment, pagePath, pageType) {
    try {
      // Get snippets for each location
      const locations = [
        'after_opening_head',
        'header',
        'before_closing_head',
        'after_opening_body',
        'body_start',
        'body_end',
        'before_closing_body',
        'footer'
      ];

      let modifiedHtml = html;

      for (const location of locations) {
        const snippets = await CodeSnippet.getActiveSnippets(
          environment,
          location,
          pagePath,
          pageType
        );

        if (snippets.length === 0) continue;

        const injectedCode = this.buildInjectedCode(snippets, location);

        // Inject based on location
        switch (location) {
          case 'after_opening_head':
            modifiedHtml = modifiedHtml.replace(/<head[^>]*>/i, `$&\n${injectedCode}`);
            break;
          case 'header':
          case 'before_closing_head':
            modifiedHtml = modifiedHtml.replace(/<\/head>/i, `${injectedCode}\n$&`);
            break;
          case 'after_opening_body':
          case 'body_start':
            modifiedHtml = modifiedHtml.replace(/<body[^>]*>/i, `$&\n${injectedCode}`);
            break;
          case 'body_end':
          case 'before_closing_body':
          case 'footer':
            modifiedHtml = modifiedHtml.replace(/<\/body>/i, `${injectedCode}\n$&`);
            break;
        }
      }

      return modifiedHtml;
    } catch (error) {
      console.error('Error injecting code snippets:', error);
      // Return original HTML if injection fails
      return html;
    }
  }

  /**
   * Build injected code from snippets
   */
  buildInjectedCode(snippets, location) {
    const codeBlocks = [];

    snippets.forEach(snippet => {
      try {
        const safeCode = snippet.getSafeCode();

        switch (snippet.type) {
          case 'javascript':
            codeBlocks.push(this.wrapJavaScript(safeCode, snippet));
            break;
          case 'css':
            codeBlocks.push(this.wrapCSS(safeCode, snippet));
            break;
          case 'html':
            codeBlocks.push(safeCode);
            break;
        }
      } catch (error) {
        console.error(`Error processing snippet ${snippet.name}:`, error);
        // Skip this snippet if there's an error
      }
    });

    return codeBlocks.join('\n');
  }

  /**
   * Wrap JavaScript code in script tag
   */
  wrapJavaScript(code, snippet) {
    const attrs = [];
    if (snippet.async) attrs.push('async');
    if (snippet.defer) attrs.push('defer');

    // Add device detection if needed
    if (snippet.deviceTarget !== 'all') {
      const deviceCheck = this.getDeviceCheck(snippet.deviceTarget);
      return `<script${attrs.length > 0 ? ' ' + attrs.join(' ') : ''}>
  ${deviceCheck}
  ${code}
  ${snippet.deviceTarget !== 'all' ? '}' : ''}
</script>`;
    }

    return `<script${attrs.length > 0 ? ' ' + attrs.join(' ') : ''}>
${code}
</script>`;
  }

  /**
   * Wrap CSS code in style tag
   */
  wrapCSS(code, snippet) {
    // Add device detection if needed
    if (snippet.deviceTarget !== 'all') {
      const mediaQuery = this.getCSSMediaQuery(snippet.deviceTarget);
      return `<style>
@media ${mediaQuery} {
${code}
}
</style>`;
    }

    return `<style>
${code}
</style>`;
  }

  /**
   * Get device check JavaScript
   */
  getDeviceCheck(deviceTarget) {
    const checks = {
      mobile: `if (window.innerWidth <= 768) {`,
      tablet: `if (window.innerWidth > 768 && window.innerWidth <= 1024) {`,
      desktop: `if (window.innerWidth > 1024) {`
    };
    return checks[deviceTarget] || '';
  }

  /**
   * Get CSS media query
   */
  getCSSMediaQuery(deviceTarget) {
    const queries = {
      mobile: '(max-width: 768px)',
      tablet: '(min-width: 769px) and (max-width: 1024px)',
      desktop: '(min-width: 1025px)'
    };
    return queries[deviceTarget] || '';
  }

  /**
   * Get snippets as JSON for client-side injection (for React/SPA)
   */
  async getSnippetsForClient(environment, location, pagePath, pageType) {
    try {
      const snippets = await CodeSnippet.getActiveSnippets(
        environment,
        location,
        pagePath,
        pageType
      );

      return snippets.map(snippet => ({
        id: snippet._id,
        name: snippet.name,
        type: snippet.type,
        code: snippet.getSafeCode(),
        async: snippet.async,
        defer: snippet.defer,
        deviceTarget: snippet.deviceTarget
      }));
    } catch (error) {
      console.error('Error fetching snippets for client:', error);
      return [];
    }
  }

  /**
   * Inject snippets client-side (for React apps)
   */
  injectClientSide(snippets, location) {
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
            this.injectJavaScript(snippet);
            break;
          case 'css':
            this.injectCSS(snippet);
            break;
          case 'html':
            this.injectHTML(snippet, location);
            break;
        }
      } catch (error) {
        console.error(`Error injecting snippet ${snippet.name}:`, error);
      }
    });
  }

  /**
   * Inject JavaScript client-side
   */
  injectJavaScript(snippet) {
    const script = document.createElement('script');
    script.textContent = snippet.code;
    if (snippet.async) script.async = true;
    if (snippet.defer) script.defer = true;

    // Determine where to inject
    const targetLocation = this.getClientSideLocation(snippet);
    targetLocation.appendChild(script);
  }

  /**
   * Inject CSS client-side
   */
  injectCSS(snippet) {
    const style = document.createElement('style');
    style.textContent = snippet.code;
    document.head.appendChild(style);
  }

  /**
   * Inject HTML client-side
   */
  injectHTML(snippet, location) {
    const div = document.createElement('div');
    div.innerHTML = snippet.code;

    const targetLocation = this.getClientSideLocation(snippet, location);
    targetLocation.appendChild(div);
  }

  /**
   * Get target location for client-side injection
   */
  getClientSideLocation(snippet, location) {
    // For now, default to head or body based on location
    if (location === 'header' || location === 'before_closing_head' || location === 'after_opening_head') {
      return document.head;
    }
    return document.body;
  }
}

module.exports = new CodeSnippetInjector();
