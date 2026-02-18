import React from 'react';

export const CodeBlock = ({
  code = '<div class="custom">\n  <p>Hello World</p>\n</div>',
  language = 'html',
  showLineNumbers = true,
  theme = 'dark',
  className = '',
  style = {},
}) => {
  const isDark = theme === 'dark';
  const lines = code.split('\n');
  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '8px 8px 0 0', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
        <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>{language}</span>
      </div>
      <pre style={{ margin: 0, padding: '16px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: '0 0 8px 8px', overflow: 'auto', fontSize: '13px', lineHeight: 1.6, color: isDark ? '#e2e8f0' : '#1e293b', fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex' }}>
            {showLineNumbers && <span style={{ display: 'inline-block', width: '40px', textAlign: 'right', marginRight: '16px', color: isDark ? '#475569' : '#94a3b8', userSelect: 'none', flexShrink: 0 }}>{i + 1}</span>}
            <code>{line}</code>
          </div>
        ))}
      </pre>
    </div>
  );
};

CodeBlock.craft = { displayName: 'Code Block' };
