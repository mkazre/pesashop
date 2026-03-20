import { Link } from 'react-router-dom';
import {
  IoLogoFacebook,
  IoLogoTwitter,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoLogoPinterest,
  IoLogoYoutube,
  IoLogoTiktok,
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
} from 'react-icons/io5';
import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { menusAPI, footerConfigAPI } from '@/services/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const imgSrc = (v) => v ? (v.startsWith('http') ? v : `${API_URL}${v}`) : '';

// ── Helper: get nested setting ───────────────────────────────────────
const getSetting = (obj, path, fallback = '') => {
  if (!obj) return fallback;
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : fallback), obj);
};

// Social icon map
const SOCIAL_ICONS = {
  facebook: IoLogoFacebook,
  twitter: IoLogoTwitter,
  instagram: IoLogoInstagram,
  linkedin: IoLogoLinkedin,
  pinterest: IoLogoPinterest,
  youtube: IoLogoYoutube,
  tiktok: IoLogoTiktok,
};

// ══════════════════════════════════════════════════════════════════════
// ── Builder-based Footer Renderer ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

const COLUMN_WIDTH_MAP = {
  'auto': undefined,
  '1/6': '16.666%',
  '1/4': '25%',
  '1/3': '33.333%',
  '1/2': '50%',
  '2/3': '66.666%',
  '3/4': '75%',
  'full': '100%',
};

const VALIGN_MAP = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

function BuilderNewsletter({ item, colors }) {
  const [email, setEmail] = useState('');
  const { headingColor, headingSize, textColor, fontSize } = colors;
  const handleSubmit = (e) => { e.preventDefault(); if (email) { toast.success('Subscribed!'); setEmail(''); } };
  return (
    <div>
      {item.newsletterTitle && <h4 className="font-bold mb-2" style={{ color: headingColor, fontSize: headingSize }}>{item.newsletterTitle}</h4>}
      {item.newsletterText && <p className="mb-4 opacity-70" style={{ color: textColor, fontSize }}>{item.newsletterText}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email"
          className="flex-1 px-4 py-2.5 text-sm text-black rounded focus:outline-none"
          style={{ backgroundColor: item.newsletterInputBg || '#ffffff' }} />
        <button type="submit" className="px-5 py-2.5 font-medium text-sm rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: item.newsletterButtonBg || '#f59e0b', color: item.newsletterButtonColor || '#000' }}>
          {item.newsletterButtonText || 'Subscribe'}
        </button>
      </form>
    </div>
  );
}

function BuilderContentBlock({ item, colors }) {
  const { textColor, linkColor, linkHoverColor, headingColor, headingSize, fontSize } = colors;

  if (item.type === 'logo') {
    return (
      <div>
        {item.logoImage ? (
          <Link to={item.logoLink || '/'}>
            <img src={imgSrc(item.logoImage)} alt="Logo" className="footer-logo-img" style={{ width: item.logoWidth || '150px', maxWidth: '100%' }} />
          </Link>
        ) : null}
        {item.description && <p className="mt-3 opacity-80" style={{ color: textColor, fontSize }}>{item.description}</p>}
      </div>
    );
  }

  if (item.type === 'links') {
    return (
      <div>
        {item.heading && <h4 className="font-bold mb-4" style={{ color: headingColor, fontSize: headingSize }}>{item.heading}</h4>}
        <ul className="space-y-2.5">
          {(item.links || []).map((link, i) => (
            <li key={i}>
              <Link
                to={link.url || '#'}
                target={link.openInNewTab ? '_blank' : undefined}
                style={{ color: linkColor, fontSize }}
                className="transition-opacity hover:opacity-80"
              >
                {link.icon && <span className="mr-1.5">{link.icon}</span>}
                {link.label}
                {link.badge && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ color: link.badgeColor || '#ef4444', backgroundColor: link.badgeBgColor || '#fef2f2' }}>
                    {link.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (item.type === 'text') {
    return (
      <div>
        {item.heading && <h4 className="font-bold mb-3" style={{ color: headingColor, fontSize: headingSize }}>{item.heading}</h4>}
        <div style={{ color: textColor, fontSize }} className="opacity-80 leading-relaxed">{item.content}</div>
      </div>
    );
  }

  if (item.type === 'contact') {
    const iconClass = 'flex-shrink-0 mt-0.5 opacity-70';
    return (
      <div>
        {item.heading && <h4 className="font-bold mb-4" style={{ color: headingColor, fontSize: headingSize }}>{item.heading}</h4>}
        <div className="space-y-3" style={{ color: textColor, fontSize }}>
          {item.address && (
            <div className="flex items-start gap-2.5">
              {item.showIcons !== false && <IoLocationOutline size={18} className={iconClass} />}
              <span className="opacity-80">{item.address}</span>
            </div>
          )}
          {item.phone && (
            <div className="flex items-start gap-2.5">
              {item.showIcons !== false && <IoCallOutline size={18} className={iconClass} />}
              <a href={`tel:${item.phone}`} style={{ color: linkColor }} className="opacity-80 hover:opacity-100 transition-opacity">{item.phone}</a>
            </div>
          )}
          {item.email && (
            <div className="flex items-start gap-2.5">
              {item.showIcons !== false && <IoMailOutline size={18} className={iconClass} />}
              <a href={`mailto:${item.email}`} style={{ color: linkColor }} className="opacity-80 hover:opacity-100 transition-opacity">{item.email}</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (item.type === 'social') {
    const socColor = item.socialColor || linkColor;
    return (
      <div>
        {item.heading && <h4 className="font-bold mb-4" style={{ color: headingColor, fontSize: headingSize }}>{item.heading}</h4>}
        <div className="flex items-center gap-3 flex-wrap">
          {(item.socialLinks || []).filter(sl => sl.url).map((sl, i) => {
            const Icon = SOCIAL_ICONS[sl.platform];
            if (!Icon) return null;
            const isCircle = item.socialStyle === 'circle';
            const isSquare = item.socialStyle === 'square';
            return (
              <a key={i} href={sl.url} target="_blank" rel="noopener noreferrer"
                className={`transition-opacity hover:opacity-70 ${isCircle ? 'w-10 h-10 rounded-full flex items-center justify-center bg-white/10' : isSquare ? 'w-10 h-10 rounded-md flex items-center justify-center bg-white/10' : ''}`}
                style={{ color: socColor }}>
                <Icon size={parseInt(item.socialSize) || 20} />
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  if (item.type === 'newsletter') {
    return <BuilderNewsletter item={item} colors={colors} />;
  }

  if (item.type === 'image') {
    const img = <img src={imgSrc(item.image)} alt="" style={{ width: item.imageWidth || '100%', maxWidth: '100%' }} />;
    return item.imageLink ? <Link to={item.imageLink}>{img}</Link> : img;
  }

  if (item.type === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: item.content || '' }} />;
  }

  if (item.type === 'payment-icons') {
    return (
      <div>
        {item.heading && <h4 className="font-bold mb-3" style={{ color: headingColor, fontSize: headingSize }}>{item.heading}</h4>}
        <div className="flex items-center gap-2 flex-wrap">
          {(item.paymentIcons || []).map((ic, i) => (
            ic.image ? (
              <img key={i} src={imgSrc(ic.image)} alt={ic.label} className="h-8 rounded" />
            ) : (
              <div key={i} className="px-3 h-8 flex items-center justify-center rounded text-xs font-bold"
                style={{ backgroundColor: ic.bgColor || '#fff', color: ic.color || '#1e40af' }}>
                {ic.label}
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ── Generate responsive CSS from row config ──────────────────────
function generateResponsiveCSS(rows) {
  let css = '';
  rows.forEach((row, ri) => {
    const resp = row.responsive || {};
    const gridId = `footer-row-grid-${ri}`;
    const rowId = `footer-row-${ri}`;

    // Tablet: 768–1023px
    const t = resp.tablet || {};
    if (Object.keys(t).length > 0) {
      let tabletCSS = '';
      if (t.stackColumns) {
        tabletCSS += `#${gridId}{grid-template-columns:1fr !important;}\n`;
      } else if (t.columnCount) {
        tabletCSS += `#${gridId}{grid-template-columns:repeat(${t.columnCount},1fr) !important;}\n`;
      }
      if (t.columnGap) tabletCSS += `#${gridId}{gap:${t.columnGap} !important;}\n`;
      if (t.rowGap && t.stackColumns) tabletCSS += `#${gridId}{row-gap:${t.rowGap} !important;}\n`;
      if (t.paddingTop) tabletCSS += `#${rowId} .footer-row-inner{padding-top:${t.paddingTop} !important;}\n`;
      if (t.paddingBottom) tabletCSS += `#${rowId} .footer-row-inner{padding-bottom:${t.paddingBottom} !important;}\n`;
      if (t.headingSize) tabletCSS += `#${rowId} h4{font-size:${t.headingSize} !important;}\n`;
      if (t.fontSize) tabletCSS += `#${rowId}{font-size:${t.fontSize} !important;}\n`;
      if (t.textAlign) tabletCSS += `#${rowId}{text-align:${t.textAlign} !important;}\n`;
      if (t.logoWidth) tabletCSS += `#${rowId} .footer-logo-img{width:${t.logoWidth} !important;}\n`;
      if (t.hiddenColumns?.length) t.hiddenColumns.forEach(c => { tabletCSS += `#${gridId}>:nth-child(${c}){display:none !important;}\n`; });
      if (t.columnOrder) {
        const order = t.columnOrder.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        order.forEach((colNum, idx) => { tabletCSS += `#${gridId}>:nth-child(${colNum}){order:${idx} !important;}\n`; });
      }
      if (tabletCSS) css += `@media(min-width:768px) and (max-width:1023px){${tabletCSS}}\n`;
    }

    // Mobile: <768px
    const m = resp.mobile || {};
    if (Object.keys(m).length > 0) {
      let mobileCss = '';
      if (m.stackColumns) {
        mobileCss += `#${gridId}{grid-template-columns:1fr !important;}\n`;
      } else if (m.columnCount) {
        mobileCss += `#${gridId}{grid-template-columns:repeat(${m.columnCount},1fr) !important;}\n`;
      }
      if (m.columnGap) mobileCss += `#${gridId}{gap:${m.columnGap} !important;}\n`;
      if (m.rowGap && m.stackColumns) mobileCss += `#${gridId}{row-gap:${m.rowGap} !important;}\n`;
      if (m.paddingTop) mobileCss += `#${rowId} .footer-row-inner{padding-top:${m.paddingTop} !important;}\n`;
      if (m.paddingBottom) mobileCss += `#${rowId} .footer-row-inner{padding-bottom:${m.paddingBottom} !important;}\n`;
      if (m.headingSize) mobileCss += `#${rowId} h4{font-size:${m.headingSize} !important;}\n`;
      if (m.fontSize) mobileCss += `#${rowId}{font-size:${m.fontSize} !important;}\n`;
      if (m.textAlign) mobileCss += `#${rowId}{text-align:${m.textAlign} !important;}\n`;
      if (m.logoWidth) mobileCss += `#${rowId} .footer-logo-img{width:${m.logoWidth} !important;}\n`;
      if (m.hiddenColumns?.length) m.hiddenColumns.forEach(c => { mobileCss += `#${gridId}>:nth-child(${c}){display:none !important;}\n`; });
      if (m.columnOrder) {
        const order = m.columnOrder.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        order.forEach((colNum, idx) => { mobileCss += `#${gridId}>:nth-child(${colNum}){order:${idx} !important;}\n`; });
      }
      if (mobileCss) css += `@media(max-width:767px){${mobileCss}}\n`;
    }
  });
  return css;
}

function BuilderFooter({ config }) {
  const g = config;
  const rows = (g.rows || []).filter(r => r.enabled).sort((a, b) => (a.order || 0) - (b.order || 0));
  const responsiveCSS = useMemo(() => generateResponsiveCSS(rows), [rows]);

  return (
    <footer style={{ backgroundColor: g.globalBackgroundColor || '#1b5e35', color: g.globalTextColor || '#ffffff', fontFamily: g.globalFontFamily || undefined }}>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      {rows.map((row, ri) => {
        const colors = {
          textColor: row.textColor || g.globalTextColor || '#ffffff',
          linkColor: row.linkColor || g.globalLinkColor || '#d1d5db',
          linkHoverColor: row.linkHoverColor || g.globalLinkHoverColor || '#ffffff',
          headingColor: row.headingColor || g.globalHeadingColor || '#ffffff',
          headingSize: row.headingSize || '18px',
          fontSize: row.fontSize || '14px',
        };
        const columns = row.columns || [];

        const gridCols = columns.map(col => {
          if (col.width && col.width !== 'auto') {
            if (col.width === 'custom') return col.customWidth || '1fr';
            return COLUMN_WIDTH_MAP[col.width] || '1fr';
          }
          return '1fr';
        }).join(' ');

        return (
          <div key={ri} id={`footer-row-${ri}`} style={{
            backgroundColor: row.backgroundColor || undefined,
            color: colors.textColor,
            borderTop: row.borderTop || undefined,
            borderBottom: row.borderBottom || undefined,
          }}>
            <div className={`footer-row-inner ${row.containerWidth === 'full' ? 'w-full px-4' : 'container-custom'}`}
              style={{ paddingTop: row.paddingTop || '48px', paddingBottom: row.paddingBottom || '48px' }}>
              <div id={`footer-row-grid-${ri}`} className="grid" style={{ gridTemplateColumns: gridCols, gap: row.columnGap || '32px' }}>
                {columns.map((col, ci) => (
                  <div key={ci} style={{ alignSelf: VALIGN_MAP[col.verticalAlign] || 'flex-start', paddingTop: col.paddingTop, paddingBottom: col.paddingBottom, paddingLeft: col.paddingLeft, paddingRight: col.paddingRight }}>
                    <div className="space-y-6">
                      {(col.content || []).map((item, ii) => (
                        <BuilderContentBlock key={ii} item={item} colors={colors} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom bar */}
      {g.bottomBarEnabled !== false && (g.copyrightText || g.showPaymentIcons) && (
        <div style={{
          backgroundColor: g.bottomBarBackgroundColor || undefined,
          borderTop: g.bottomBarBorderTop || '1px solid rgba(255,255,255,0.1)',
          color: g.bottomBarTextColor || g.globalTextColor || '#9ca3af',
        }}>
          <div className="container-custom" style={{ paddingTop: g.bottomBarPaddingTop || '24px', paddingBottom: g.bottomBarPaddingBottom || '24px' }}>
            <div className={`flex flex-col md:flex-row items-center gap-4 ${g.copyrightPosition === 'center' ? 'justify-center' : g.copyrightPosition === 'right' ? 'justify-end' : 'justify-between'}`}>
              {g.copyrightText && <div className="text-sm opacity-70">{g.copyrightText}</div>}
              {g.showPaymentIcons && (g.paymentIcons || []).length > 0 && (
                <div className="flex items-center gap-2">
                  {g.paymentIcons.map((ic, i) => (
                    ic.image ? (
                      <img key={i} src={imgSrc(ic.image)} alt={ic.label} className="h-8 rounded" />
                    ) : (
                      <div key={i} className="px-3 h-8 flex items-center justify-center rounded text-xs font-bold"
                        style={{ backgroundColor: ic.bgColor || '#fff', color: ic.color || '#1e40af' }}>
                        {ic.label}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ── Legacy footer components (menu-based + hardcoded) ─────────────────
// ══════════════════════════════════════════════════════════════════════

// ── Footer Column (renders a group of menu items) ────────────────────
const FooterColumn = ({ item, linkColor, linkHoverClass }) => {
  return (
    <div>
      {item.label && (
        <h4 className="font-bold text-lg mb-4">{item.label}</h4>
      )}
      {item.children && item.children.length > 0 && (
        <ul className="space-y-3">
          {item.children.map((child, i) => (
            <li key={child._id || i}>
              {child.linkType === 'none' ? (
                <span style={{ color: linkColor }} className="text-sm">{child.label}</span>
              ) : (
                <Link
                  to={child.link || '#'}
                  target={child.openInNewTab ? '_blank' : undefined}
                  rel={child.noFollow ? 'nofollow' : undefined}
                  style={{ color: linkColor }}
                  className={`text-sm transition-colors ${linkHoverClass}`}
                >
                  {child.icon && <span className="mr-1.5">{child.icon}</span>}
                  {child.label}
                  {child.badge && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ color: child.badgeColor || '#ef4444', backgroundColor: child.badgeBgColor || '#fef2f2' }}>
                      {child.badge}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main Footer Component ────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail] = useState('');

  // Fetch footer builder config
  const { data: builderResponse } = useQuery('footer-builder-config', () => footerConfigAPI.getPublic(), {
    staleTime: 5 * 60 * 1000,
  });
  const builderConfig = builderResponse?.data?.data;

  // Fetch footer menu from API (always called to satisfy React hooks rules)
  const { data: footerResponse } = useQuery('menu-footer', () => menusAPI.getByLocation('footer'), {
    staleTime: 5 * 60 * 1000,
    enabled: !(builderConfig?.isActive && (builderConfig.rows || []).length > 0),
  });

  // If builder is active and has rows, render it instead of legacy footer
  if (builderConfig?.isActive && (builderConfig.rows || []).length > 0) {
    return <BuilderFooter config={builderConfig} />;
  }

  const menu = footerResponse?.data?.data;
  const menuItems = menu?.items || [];
  const settings = menu?.settings || {};
  const footerSettings = menu?.footerSections || settings?.footer || {};

  // Footer settings
  const bgColor = getSetting(footerSettings, 'backgroundColor', '') || getSetting(settings, 'backgroundColor', '');
  const textColor = getSetting(footerSettings, 'textColor', '');
  const linkColor = getSetting(footerSettings, 'linkColor', '');
  const linkHoverColor = getSetting(footerSettings, 'linkHoverColor', '');
  const columns = getSetting(footerSettings, 'columns', 4);
  const newsletterEnabled = getSetting(footerSettings, 'newsletter.enabled', false);
  const newsletterTitle = getSetting(footerSettings, 'newsletter.title', 'Subscribe to the newsletter');
  const newsletterText = getSetting(footerSettings, 'newsletter.text', 'Stay updated! Subscribe to our mailing list for news, updates, and exclusive offers.');
  const newsletterBtnText = getSetting(footerSettings, 'newsletter.buttonText', 'Submit');
  const newsletterBtnBg = getSetting(footerSettings, 'newsletter.buttonBg', '');
  const newsletterBtnColor = getSetting(footerSettings, 'newsletter.buttonColor', '');
  const socialEnabled = getSetting(footerSettings, 'social.enabled', false);
  const socialLinks = getSetting(footerSettings, 'social.links', {});
  const socialStyle = getSetting(footerSettings, 'social.style', 'circle');
  const socialColor = getSetting(footerSettings, 'social.color', '');
  const socialHoverColor = getSetting(footerSettings, 'social.hoverColor', '');
  const copyrightText = getSetting(footerSettings, 'bottomBar.copyrightText', '');
  const paymentIcons = getSetting(footerSettings, 'bottomBar.paymentIcons', []);
  const showPayment = getSetting(footerSettings, 'bottomBar.showPaymentIcons', false);

  const hasDynamicFooter = menuItems.length > 0;
  const linkHoverClass = 'hover:opacity-80';

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Subscribed successfully!');
      setEmail('');
    }
  };

  // Render social icons from settings
  const renderSocialIcons = (links, style, color, hoverColor) => {
    const entries = typeof links === 'object' ? Object.entries(links).filter(([, url]) => url) : [];
    if (entries.length === 0) return null;
    return (
      <div className="flex items-center gap-3">
        {entries.map(([platform, url]) => {
          const Icon = SOCIAL_ICONS[platform];
          if (!Icon) return null;
          return (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className={`transition-colors ${
                style === 'circle'
                  ? 'w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20'
                  : 'hover:opacity-70'
              }`}
              style={{ color: color || 'inherit' }}>
              <Icon size={20} />
            </a>
          );
        })}
      </div>
    );
  };

  // ── Dynamic footer (from API) ──────────────────────────────────────
  if (hasDynamicFooter) {
    return (
      <footer style={{ backgroundColor: bgColor || undefined, color: textColor || undefined }}>
        {/* Newsletter */}
        {newsletterEnabled && (
          <div className="border-b border-white/10">
            <div className="container-custom py-12">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold mb-2">{newsletterTitle}</h3>
                <p className="opacity-70 mb-6">{newsletterText}</p>
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mx-auto">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white text-black focus:outline-none" required />
                  <button type="submit" className="px-8 py-3 font-medium transition-colors"
                    style={{
                      backgroundColor: newsletterBtnBg || 'var(--color-secondary, #f59e0b)',
                      color: newsletterBtnColor || '#000',
                    }}>
                    {newsletterBtnText}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Main Footer Columns */}
        <div className="container-custom py-12">
          <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min(columns, menuItems.length) || 4}, 1fr)` }}>
            {menuItems.map((item, i) => (
              <FooterColumn key={item._id || i} item={item} linkColor={linkColor} linkHoverClass={linkHoverClass} />
            ))}
          </div>
        </div>

        {/* Social Icons */}
        {socialEnabled && (
          <div className="border-t border-white/10">
            <div className="container-custom py-6 flex justify-center">
              {renderSocialIcons(socialLinks, socialStyle, socialColor, socialHoverColor)}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        {(copyrightText || showPayment) && (
          <div className="border-t border-white/10">
            <div className="container-custom py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {copyrightText && (
                  <div className="text-sm opacity-70">{copyrightText}</div>
                )}
                {showPayment && paymentIcons.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm opacity-70 mr-2">We Accept:</span>
                    {paymentIcons.map((icon, i) => (
                      <div key={i} className="w-12 h-8 bg-white flex items-center justify-center font-bold text-xs rounded"
                        style={{ color: icon.color || '#1e40af' }}>
                        {icon.label || icon}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // ── Fallback footer (hardcoded) ────────────────────────────────────
  return (
    <footer className="bg-primary text-white">
      {/* Newsletter Section */}
      <div className="border-b border-primary-400">
        <div className="container-custom py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">Subscribe to the newsletter</h3>
            <p className="text-primary-100 mb-6">
              Stay updated! Subscribe to our mailing list for news, updates, and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mx-auto">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white text-black focus:outline-none" required />
              <button type="submit"
                className="px-8 py-3 bg-secondary text-black font-medium hover:bg-secondary-600 transition-colors">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Column */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold">Sellzy</span>
            </Link>
            <p className="text-primary-100 text-sm mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className="flex items-center gap-4">
              {['facebook', 'twitter', 'instagram', 'linkedin', 'pinterest'].map(p => {
                const Icon = SOCIAL_ICONS[p];
                return (
                  <a key={p} href="#" className="w-10 h-10 bg-primary-600 hover:bg-secondary hover:text-black rounded-full flex items-center justify-center transition-colors">
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* About Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">About</h4>
            <ul className="space-y-3 text-primary-100">
              {[{ to: '/about', label: 'About us' }, { to: '/terms', label: 'Terms & Conditions' },
                { to: '/privacy', label: 'Privacy Policy' }, { to: '/careers', label: 'Careers' },
                { to: '/blog', label: 'Latest Blog' }, { to: '/contact', label: 'Contact us' }].map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* My Account Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">My Account</h4>
            <ul className="space-y-3 text-primary-100">
              {[{ to: '/account', label: 'Your Account' }, { to: '/account/orders', label: 'Return Policy' },
                { to: '/vendors', label: 'Become a Vendor' }, { to: '/account/wishlist', label: 'Wishlist' },
                { to: '/affiliate', label: 'Affiliate Program' }, { to: '/faq', label: 'FAQs' }].map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Categories Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-3 text-primary-100">
              {[{ to: '/shop/healthcare', label: 'Healthcare' }, { to: '/shop/fashion', label: 'Fashion' },
                { to: '/shop/organic', label: 'Organic' }, { to: '/shop/beauty', label: 'Beauty' },
                { to: '/shop/grocery', label: 'Grocery' }].map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="border-t border-primary-400">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <IoLocationOutline size={24} className="text-secondary mt-1" />
              <div>
                <div className="font-medium mb-1">Address</div>
                <div className="text-primary-100">2715 Ash Dr. San Jose, South Dakota 83475</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IoCallOutline size={24} className="text-secondary mt-1" />
              <div>
                <div className="font-medium mb-1">Call Us</div>
                <div className="text-primary-100">Call Us: (239) 555-0108</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IoMailOutline size={24} className="text-secondary mt-1" />
              <div>
                <div className="font-medium mb-1">Email</div>
                <div className="text-primary-100">sara.cruz@example.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods & Copyright */}
      <div className="border-t border-primary-400">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-primary-100">
              {new Date().getFullYear()} Copyright By Themeforest Powered By Createuiux
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-primary-100 mr-2">We Accept:</div>
              {[{ label: 'VISA', color: '#1e40af' }, { label: 'MC', color: '#d97706' }, { label: 'AMEX', color: '#1e3a5f' },
                { label: 'PayPal', color: '#1e40af' }, { label: 'Pay', color: '#fff', bg: '#000' }].map((p, i) => (
                <div key={i} className="w-12 h-8 flex items-center justify-center font-bold text-xs rounded"
                  style={{ backgroundColor: p.bg || '#fff', color: p.color }}>{p.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
