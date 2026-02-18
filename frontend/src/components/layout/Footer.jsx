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
import { menusAPI } from '@/services/api';
import toast from 'react-hot-toast';

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

  // Fetch footer menu from API
  const { data: footerResponse } = useQuery('menu-footer', () => menusAPI.getByLocation('footer'), {
    staleTime: 5 * 60 * 1000,
  });
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
