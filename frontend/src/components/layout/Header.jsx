import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  IoSearch,
  IoPersonOutline,
  IoCartOutline,
  IoHeartOutline,
  IoChevronDown,
  IoChevronForward,
  IoMenu,
  IoClose,
  IoCallOutline,
  IoLocationOutline,
} from 'react-icons/io5';
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '@/store';
import { useQuery } from 'react-query';
import { menusAPI, categoriesAPI } from '@/services/api';
const PageRenderer = React.lazy(() => import('@/components/pagebuilder/PageRenderer'));

// ── Helper: get nested setting ───────────────────────────────────────
const getSetting = (settings, path, fallback = '') => {
  if (!settings) return fallback;
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : fallback), settings);
};

// ── Mega Menu Body — renders Craft.js content or falls back to child links ──
const MegaMenuBody = ({ item, hasChildren, onClose }) => {
  const megaContent = item.megaMenu?.content;

  // Check if there's Craft.js serialized content
  const hasCraftContent = React.useMemo(() => {
    if (!megaContent) return false;
    if (typeof megaContent === 'string') {
      try {
        const parsed = JSON.parse(megaContent);
        return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
      } catch { return false; }
    }
    return typeof megaContent === 'object' && Object.keys(megaContent).length > 0;
  }, [megaContent]);

  const parsedContent = React.useMemo(() => {
    if (!hasCraftContent) return null;
    if (typeof megaContent === 'string') {
      try { return JSON.parse(megaContent); } catch { return null; }
    }
    return megaContent;
  }, [megaContent, hasCraftContent]);

  // Render Craft.js content if available
  if (hasCraftContent && parsedContent) {
    return (
      <React.Suspense fallback={<div className="text-center py-4 text-sm text-gray-400">Loading...</div>}>
        <PageRenderer components={parsedContent} className="mega-menu-content" />
      </React.Suspense>
    );
  }

  // Fallback: render child menu items as links in a grid
  if (!hasChildren) return null;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${item.megaMenu?.columns || 4}, 1fr)` }}>
      {item.children.map((child, i) => (
        <div key={child._id || i} className="space-y-2">
          <Link to={child.link || '#'} className="font-semibold text-sm hover:text-primary transition-colors block"
            onClick={onClose}>{child.label}</Link>
          {child.description && <p className="text-xs text-gray-500">{child.description}</p>}
          {child.children?.length > 0 && (
            <div className="space-y-1 pl-1">
              {child.children.map((sub, j) => (
                <Link key={sub._id || j} to={sub.link || '#'} className="block text-sm text-gray-600 hover:text-primary transition-colors"
                  onClick={onClose}>{sub.label}</Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Dropdown / Mega Menu Item ────────────────────────────────────────
const MenuItemLink = ({ item, settings, isActive, onClose, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasChildren = item.children && item.children.length > 0;
  const hasMega = item.megaMenu?.enabled;
  const trigger = getSetting(settings, 'dropdown.trigger', 'hover');
  const ddAnim = getSetting(settings, 'dropdown.animation', 'fade');
  const ddDuration = getSetting(settings, 'dropdown.animationDuration', '200ms');
  const ddBg = getSetting(settings, 'dropdown.backgroundColor', '#ffffff');
  const ddText = getSetting(settings, 'dropdown.textColor', '#374151');
  const ddRadius = getSetting(settings, 'dropdown.borderRadius', '8px');
  const ddMinWidth = getSetting(settings, 'dropdown.minWidth', '200px');

  const handleEnter = () => { if (trigger === 'hover') setOpen(true); };
  const handleLeave = () => { if (trigger === 'hover') setOpen(false); };
  const handleClick = (e) => {
    if (trigger === 'click' && (hasChildren || hasMega)) { e.preventDefault(); setOpen(!open); }
  };

  // Item style overrides
  const itemStyle = item.itemStyle || {};
  const linkStyle = {
    color: itemStyle.textColor || undefined,
    fontSize: itemStyle.fontSize || undefined,
    fontWeight: itemStyle.fontWeight || undefined,
    fontFamily: itemStyle.fontFamily || undefined,
    letterSpacing: itemStyle.letterSpacing || undefined,
    textTransform: itemStyle.textTransform || undefined,
    padding: itemStyle.padding || undefined,
    borderRadius: itemStyle.borderRadius || undefined,
    backgroundColor: itemStyle.backgroundColor || undefined,
  };

  const linkProps = item.linkType === 'none' ? {} : {
    to: item.link || '#',
    target: item.openInNewTab ? '_blank' : undefined,
    rel: item.noFollow ? 'nofollow' : undefined,
  };

  const LinkOrSpan = item.linkType === 'none' ? 'span' : Link;

  // Animation classes
  const animClass = open
    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
    : 'opacity-0 translate-y-1 scale-95 pointer-events-none';

  // Badge element — above/below use absolute positioning so menu stays aligned
  const badgePos = item.badgePosition || 'right';
  const badgeAnimClass = item.badgeAnimation && item.badgeAnimation !== 'none'
    ? `badge-anim-${item.badgeAnimation}` : '';
  const badgeBaseStyle = item.badge ? {
    color: item.badgeColor || '#ef4444',
    backgroundColor: item.badgeBgColor || '#fef2f2',
    fontSize: item.badgeFontSize || '10px',
    fontWeight: item.badgeFontWeight || '600',
    fontStyle: item.badgeFontStyle || 'normal',
    textTransform: item.badgeTextTransform || 'none',
    letterSpacing: item.badgeLetterSpacing || undefined,
    paddingTop: item.badgePaddingTop || '2px',
    paddingRight: item.badgePaddingRight || '8px',
    paddingBottom: item.badgePaddingBottom || '2px',
    paddingLeft: item.badgePaddingLeft || '8px',
    borderRadius: item.badgeBorderRadius || '9999px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  } : null;

  // Inline badge (left/right) — sits in the normal flow
  const inlineBadge = item.badge && (badgePos === 'left' || badgePos === 'right') ? (
    <span className={badgeAnimClass} style={{
      ...badgeBaseStyle,
      display: 'inline-block',
      marginTop: item.badgeMarginTop || '0px',
      marginRight: item.badgeMarginRight || '0px',
      marginBottom: item.badgeMarginBottom || '0px',
      marginLeft: item.badgeMarginLeft || '0px',
    }}>
      {item.badge}
    </span>
  ) : null;

  // Absolute badge (above/below) — positioned without affecting layout
  const absBadge = item.badge && (badgePos === 'above' || badgePos === 'below') ? (
    <span className={badgeAnimClass} style={{
      ...badgeBaseStyle,
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      ...(badgePos === 'above' ? { bottom: '100%', marginBottom: item.badgeMarginBottom || '2px' } : {}),
      ...(badgePos === 'below' ? { top: '100%', marginTop: item.badgeMarginTop || '2px' } : {}),
      marginLeft: item.badgeMarginLeft || '0px',
      marginRight: item.badgeMarginRight || '0px',
    }}>
      {item.badge}
    </span>
  ) : null;

  return (
    <div ref={ref} className="relative group" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <LinkOrSpan
        {...linkProps}
        onClick={(e) => { handleClick(e); if (!hasChildren && !hasMega && onClose) onClose(); }}
        className={`flex items-center gap-1.5 transition-colors cursor-pointer relative ${
          isActive ? 'text-primary' : ''
        } ${itemStyle.customClass || ''}`}
        style={linkStyle}
      >
        {inlineBadge && badgePos === 'left' && inlineBadge}
        {item.icon && item.iconPosition !== 'right' && (
          <span className="text-sm">{item.icon}</span>
        )}
        {item.image && (
          <img src={item.image} alt="" className="w-5 h-5 object-cover rounded" style={{ width: item.imageWidth || '20px', height: item.imageHeight || '20px' }} />
        )}
        <span>{item.label}</span>
        {item.description && level === 0 && (
          <span className="text-xs opacity-60 ml-0.5 hidden lg:inline">{item.description}</span>
        )}
        {item.icon && item.iconPosition === 'right' && (
          <span className="text-sm">{item.icon}</span>
        )}
        {inlineBadge && badgePos === 'right' && inlineBadge}
        {(hasChildren || hasMega) && (
          <IoChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
        {absBadge}
      </LinkOrSpan>

      {/* Mega Menu Panel */}
      {hasMega && (
        <div className={`absolute left-0 top-full z-50 transition-all ${animClass}`}
          style={{
            transitionDuration: ddDuration,
            width: item.megaMenu.width === 'full-width' ? '100vw' : item.megaMenu.width === 'custom' ? (item.megaMenu.customWidth || '800px') : '100%',
            minWidth: '600px',
            backgroundColor: item.megaMenu.backgroundColor || ddBg,
            borderRadius: item.megaMenu.borderRadius || ddRadius,
            boxShadow: item.megaMenu.boxShadow || '0 10px 40px rgba(0,0,0,0.12)',
            padding: item.megaMenu.padding || '24px',
            backgroundImage: item.megaMenu.backgroundImage ? `url(${item.megaMenu.backgroundImage})` : undefined,
            backgroundSize: item.megaMenu.backgroundSize || 'cover',
            backgroundPosition: item.megaMenu.backgroundPosition || 'center',
          }}>
          <MegaMenuBody item={item} hasChildren={hasChildren} onClose={onClose} />
        </div>
      )}

      {/* Standard Dropdown */}
      {hasChildren && !hasMega && (
        <div className={`absolute ${level > 0 ? 'left-full top-0' : 'left-0 top-full'} z-50 transition-all ${animClass}`}
          style={{
            transitionDuration: ddDuration,
            backgroundColor: ddBg,
            color: ddText,
            borderRadius: ddRadius,
            minWidth: ddMinWidth,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
          <div className="py-1">
            {item.children.map((child, i) => (
              <MenuItemLink key={child._id || i} item={child} settings={settings} level={level + 1}
                isActive={false} onClose={onClose} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Mobile Menu Item ─────────────────────────────────────────────────
const MobileMenuItem = ({ item, onClose, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = (item.children && item.children.length > 0) || item.megaMenu?.enabled;

  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      <div className="flex items-center justify-between">
        {item.linkType === 'none' ? (
          <span className="flex-1 py-3 px-4 text-sm font-medium">{item.label}</span>
        ) : (
          <Link to={item.link || '#'} className="flex-1 py-3 px-4 text-sm hover:text-primary transition-colors"
            onClick={onClose}>
            {item.label}
            {item.badge && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ color: item.badgeColor || '#ef4444', backgroundColor: item.badgeBgColor || '#fef2f2' }}>
                {item.badge}
              </span>
            )}
          </Link>
        )}
        {hasChildren && (
          <button onClick={() => setOpen(!open)} className="p-3 text-gray-400 hover:text-gray-600">
            {open ? <IoChevronDown size={16} /> : <IoChevronForward size={16} />}
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="border-l-2 border-gray-100 ml-4">
          {item.children?.map((child, i) => (
            <MobileMenuItem key={child._id || i} item={child} onClose={onClose} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Header Component ────────────────────────────────────────────
export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal, openCartSidebar } = useUIStore();

  // Fetch header menu from API
  const { data: menuResponse } = useQuery('menu-header', () => menusAPI.getByLocation('header'), {
    staleTime: 5 * 60 * 1000,
  });
  const menu = menuResponse?.data?.data;
  const menuItems = menu?.items || [];
  const settings = menu?.settings || {};

  // Fallback categories for when no menu is configured
  const { data: categoriesResponse } = useQuery('categories', categoriesAPI.getAll);
  const categoryList = categoriesResponse?.data?.data ?? [];

  // Settings
  const stickyEnabled = getSetting(settings, 'sticky', false);
  const transparentEnabled = getSetting(settings, 'transparent', false);
  const logoEnabled = getSetting(settings, 'logo.enabled', false);
  const logoSrc = getSetting(settings, 'logo.src', '');
  const logoWidth = getSetting(settings, 'logo.width', '120px');
  const logoLink = getSetting(settings, 'logo.link', '/');
  const ctaEnabled = getSetting(settings, 'ctaButton.enabled', false);
  const searchEnabled = getSetting(settings, 'search.enabled', false);
  const searchStyle = getSetting(settings, 'search.style', 'icon');

  // Top Bar settings
  const topBarEnabled = getSetting(settings, 'topBar.enabled', true);
  const topBarBg = getSetting(settings, 'topBar.backgroundColor', '');
  const topBarTextColor = getSetting(settings, 'topBar.textColor', '');
  const topBarPhone = getSetting(settings, 'topBar.phone', '');
  const topBarPhoneLabel = getSetting(settings, 'topBar.phoneLabel', 'Need Support? Call Us:');
  const topBarLocation = getSetting(settings, 'topBar.location', '');
  const topBarAnnouncement = getSetting(settings, 'topBar.announcement', '');
  const topBarShowLang = getSetting(settings, 'topBar.showLanguage', false);
  const topBarLanguages = getSetting(settings, 'topBar.languages', 'English,Afrikaans');
  const topBarShowCurrency = getSetting(settings, 'topBar.showCurrency', false);
  const topBarCurrencies = getSetting(settings, 'topBar.currencies', 'ZAR,USD,EUR');
  const topBarPadding = getSetting(settings, 'topBar.padding', '8px 0');
  const topBarFontSize = getSetting(settings, 'topBar.fontSize', '13px');

  // Header Row settings
  const headerRowEnabled = getSetting(settings, 'headerRow.enabled', true);
  const headerRowBg = getSetting(settings, 'headerRow.backgroundColor', '');
  const headerRowBorder = getSetting(settings, 'headerRow.borderColor', '#e5e7eb');
  const headerRowPadding = getSetting(settings, 'headerRow.padding', '16px 0');
  const headerRowShowSearch = getSetting(settings, 'headerRow.showSearch', true);
  const headerRowShowAccount = getSetting(settings, 'headerRow.showAccount', true);
  const headerRowShowWishlist = getSetting(settings, 'headerRow.showWishlist', true);
  const headerRowShowCart = getSetting(settings, 'headerRow.showCart', true);
  const headerRowIconStyle = getSetting(settings, 'headerRow.iconStyle', 'circle');
  const headerRowIconColor = getSetting(settings, 'headerRow.iconColor', '');
  const headerRowIconBg = getSetting(settings, 'headerRow.iconBgColor', '');
  const headerRowBadgeColor = getSetting(settings, 'headerRow.badgeColor', '');
  const headerRowBadgeText = getSetting(settings, 'headerRow.badgeTextColor', '');
  const menuBg = getSetting(settings, 'backgroundColor', '#ffffff');
  const menuTextColor = getSetting(settings, 'textColor', '#374151');
  const menuFontSize = getSetting(settings, 'fontSize', '14px');
  const menuFontWeight = getSetting(settings, 'fontWeight', '500');
  const menuItemPadding = getSetting(settings, 'itemPadding', '12px 18px');
  const menuItemGap = getSetting(settings, 'itemGap', '0px');
  const mobileBreakpoint = getSetting(settings, 'mobile.breakpoint', '768px');
  const tabletBreakpoint = getSetting(settings, 'tablet.breakpoint', '1024px');
  const mobileMenuStyle = getSetting(settings, 'mobile.menuStyle', 'slide-left');
  const mobileBg = getSetting(settings, 'mobile.backgroundColor', '#ffffff');
  const mobileTextColor = getSetting(settings, 'mobile.textColor', '#374151');
  const mobileOverlay = getSetting(settings, 'mobile.overlayColor', 'rgba(0,0,0,0.5)');
  const mobileFontSize = getSetting(settings, 'mobile.fontSize', '14px');
  const tabletFontSize = getSetting(settings, 'tablet.fontSize', menuFontSize);
  const tabletItemPadding = getSetting(settings, 'tablet.itemPadding', '8px 12px');
  const hamburgerStyle = getSetting(settings, 'mobile.hamburgerStyle', 'default');
  const hamburgerColor = getSetting(settings, 'mobile.hamburgerColor', '#374151');
  const mobileSubmenuAnim = getSetting(settings, 'mobile.submenuAnimation', 'slide');

  // Dynamic responsive CSS injection
  useEffect(() => {
    const mbp = parseInt(mobileBreakpoint) || 768;
    const tbp = parseInt(tabletBreakpoint) || 1024;
    const styleId = 'pesa-menu-responsive';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      /* Desktop nav visible above mobile breakpoint */
      @media (max-width: ${mbp - 1}px) {
        .pesa-desktop-nav { display: none !important; }
        .pesa-mobile-toggle { display: flex !important; }
        .pesa-desktop-only { display: none !important; }
      }
      @media (min-width: ${mbp}px) {
        .pesa-mobile-toggle { display: none !important; }
        .pesa-mobile-panel { display: none !important; }
        .pesa-mobile-overlay { display: none !important; }
      }
      /* Tablet adjustments */
      @media (min-width: ${mbp}px) and (max-width: ${tbp - 1}px) {
        .pesa-desktop-nav .pesa-nav-item { font-size: ${tabletFontSize}; padding: ${tabletItemPadding}; }
        .pesa-desktop-nav .pesa-cta-btn { display: none; }
      }
      /* Hamburger animation */
      .pesa-hamburger { color: ${hamburgerColor}; transition: transform 0.3s ease; }
      .pesa-hamburger--active { transform: rotate(${hamburgerStyle === 'rotate' ? '90deg' : hamburgerStyle === 'cross' ? '45deg' : '0deg'}); }
      /* Mobile submenu animation */
      .pesa-mobile-submenu { overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; }
      .pesa-mobile-submenu--closed { max-height: 0; opacity: 0; }
      .pesa-mobile-submenu--open { max-height: 1000px; opacity: 1; }
      /* Mobile panel slide animation */
      .pesa-mobile-panel { transition: transform 0.3s ease; }
    `;
    return () => { if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); };
  }, [mobileBreakpoint, tabletBreakpoint, tabletFontSize, tabletItemPadding, hamburgerColor, hamburgerStyle]);

  // Sticky scroll handler
  useEffect(() => {
    if (!stickyEnabled) return;
    const offset = parseInt(getSetting(settings, 'stickyOffset', '0')) || 0;
    const handleScroll = () => setIsSticky(window.scrollY > offset);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stickyEnabled, settings]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery}`);
      setSearchQuery('');
      setSearchExpanded(false);
    }
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  // Sticky styles
  const stickyStyle = isSticky ? {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    backgroundColor: getSetting(settings, 'stickyBackgroundColor', '') || menuBg,
    color: getSetting(settings, 'stickyTextColor', '') || menuTextColor,
    boxShadow: getSetting(settings, 'stickyBoxShadow', '0 2px 10px rgba(0,0,0,0.1)'),
  } : {};

  // Determine if we have a dynamic menu or need fallback
  const hasDynamicMenu = menuItems.length > 0;

  // Fallback nav items when no menu is configured
  const fallbackItems = [
    { label: 'Home', link: '/', linkType: 'manual', children: [] },
    { label: 'Shop', link: '/shop', linkType: 'manual', children: [] },
    { label: 'About Us', link: '/about', linkType: 'manual', children: [] },
    { label: 'Contact', link: '/contact', linkType: 'manual', children: [] },
  ];

  const displayItems = hasDynamicMenu ? menuItems : fallbackItems;

  return (
    <>
      <header ref={headerRef} className={`z-40 bg-white shadow-sm ${stickyEnabled ? 'sticky top-0' : ''}`}
        style={stickyEnabled && isSticky ? stickyStyle : {}}>
        {/* Top Bar */}
        {topBarEnabled && (
          <div style={{ backgroundColor: topBarBg || undefined, color: topBarTextColor || undefined, padding: topBarPadding, fontSize: topBarFontSize }}
            className={`${!topBarBg ? 'bg-primary text-white' : ''}`}>
            <div className="container-custom">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {(topBarPhone || !hasDynamicMenu) && (
                    <div className="flex items-center gap-2">
                      <IoCallOutline />
                      <span>{topBarPhoneLabel} <strong>{topBarPhone || '(480) 555-0103'}</strong></span>
                    </div>
                  )}
                  {topBarAnnouncement && (
                    <div className="flex items-center gap-2">
                      <span>{topBarAnnouncement}</span>
                    </div>
                  )}
                  {(topBarLocation || !hasDynamicMenu) && (
                    <div className="hidden md:flex items-center gap-2">
                      <IoLocationOutline />
                      <span>{topBarLocation || 'Johannesburg, South Africa'}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {(topBarShowLang || !hasDynamicMenu) && (
                    <select className="bg-transparent border-0 text-inherit text-sm cursor-pointer" style={{ fontSize: topBarFontSize }}>
                      {(topBarLanguages || 'English,Afrikaans').split(',').map(l => (
                        <option key={l.trim()} className="text-black">{l.trim()}</option>
                      ))}
                    </select>
                  )}
                  {(topBarShowCurrency || !hasDynamicMenu) && (
                    <select className="bg-transparent border-0 text-inherit text-sm cursor-pointer" style={{ fontSize: topBarFontSize }}>
                      {(topBarCurrencies || 'ZAR,USD,EUR').split(',').map(c => (
                        <option key={c.trim()} className="text-black">{c.trim()}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Header Row */}
        {headerRowEnabled && (
          <div style={{ backgroundColor: headerRowBg || undefined, borderBottom: `1px solid ${headerRowBorder}`, padding: headerRowPadding }}>
            <div className="container-custom">
              <div className="flex items-center justify-between gap-8">
                {/* Logo */}
                <Link to={logoLink} className="flex items-center gap-2 shrink-0">
                  {logoEnabled && logoSrc ? (
                    <img src={isSticky && getSetting(settings, 'logo.stickyLogo', '') ? getSetting(settings, 'logo.stickyLogo') : logoSrc}
                      alt="Logo" style={{ width: logoWidth, height: getSetting(settings, 'logo.height', 'auto') }} />
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">S</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">Sellzy</span>
                    </>
                  )}
                </Link>

                {/* Search Bar */}
                {headerRowShowSearch && (
                  <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
                    <div className="relative">
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for items..."
                        className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors" />
                      <button type="submit" className="absolute right-0 top-0 h-full px-6 bg-primary text-white hover:bg-primary-600 transition-colors">
                        <IoSearch size={20} />
                      </button>
                    </div>
                  </form>
                )}

                {/* Right Icons */}
                <div className="flex items-center gap-4">
                  {headerRowShowAccount && (
                    <button onClick={() => isAuthenticated ? navigate('/account') : openAuthModal('login')}
                      className="hidden md:flex items-center gap-2 hover:text-primary transition-colors">
                      <div className={`w-10 h-10 flex items-center justify-center ${
                        headerRowIconStyle === 'circle' ? 'rounded-full' : headerRowIconStyle === 'outline' ? 'rounded-full border-2 border-current' : ''
                      }`} style={{
                        backgroundColor: headerRowIconStyle === 'circle' ? (headerRowIconBg || 'var(--color-secondary, #f59e0b)') : 'transparent',
                        color: headerRowIconColor || undefined,
                      }}>
                        <IoPersonOutline size={20} />
                      </div>
                      <div className="text-left text-sm">
                        <div className="text-gray-600">Account</div>
                        <div className="font-medium">{isAuthenticated ? user?.name : 'Login'}</div>
                      </div>
                    </button>
                  )}

                  {headerRowShowWishlist && (
                    <Link to="/wishlist" className="relative hover:text-primary transition-colors" style={{ color: headerRowIconColor || undefined }}>
                      <IoHeartOutline size={28} />
                      {wishlistCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center"
                          style={{ backgroundColor: headerRowBadgeColor || 'var(--color-secondary, #f59e0b)', color: headerRowBadgeText || '#000' }}>
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {headerRowShowCart && (
                    <button onClick={openCartSidebar} className="relative hover:text-primary transition-colors flex items-center gap-2"
                      style={{ color: headerRowIconColor || undefined }}>
                      <div className="relative">
                        <IoCartOutline size={28} />
                        {cartItemCount > 0 && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center"
                            style={{ backgroundColor: headerRowBadgeColor || 'var(--color-secondary, #f59e0b)', color: headerRowBadgeText || '#000' }}>
                            {cartItemCount}
                          </span>
                        )}
                      </div>
                      <div className="hidden lg:block text-left text-sm">
                        <div className="text-gray-600">Cart</div>
                        <div className="font-medium">{cartItemCount} Items</div>
                      </div>
                    </button>
                  )}

                  {/* Mobile Menu Toggle */}
                  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className={`pesa-mobile-toggle pesa-hamburger ${mobileMenuOpen ? 'pesa-hamburger--active' : ''}`}>
                    {mobileMenuOpen ? <IoClose size={28} /> : <IoMenu size={28} />}
                  </button>
                </div>
              </div>

              {/* Mobile Search */}
              {headerRowShowSearch && (
                <form onSubmit={handleSearch} className="mt-4 md:hidden">
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for items..." className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 focus:border-primary focus:outline-none" />
                    <button type="submit" className="absolute right-0 top-0 h-full px-4 bg-primary text-white">
                      <IoSearch size={20} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="pesa-desktop-nav border-b border-gray-200"
          style={{ backgroundColor: menuBg, color: menuTextColor }}>
          <div className="container-custom">
            <div className="flex items-center" style={{ gap: menuItemGap }}>
              {/* Dynamic Menu Items */}
              <nav className="flex items-center flex-1" style={{ gap: menuItemGap, fontSize: menuFontSize, fontWeight: menuFontWeight }}>
                {displayItems.map((item, i) => (
                  <div key={item._id || i} className="pesa-nav-item" style={{ padding: menuItemPadding }}>
                    <MenuItemLink item={item} settings={settings}
                      isActive={location.pathname === item.link}
                      onClose={() => {}} level={0} />
                  </div>
                ))}
              </nav>

              {/* CTA Button */}
              {ctaEnabled && (
                <Link to={getSetting(settings, 'ctaButton.link', '#')}
                  className="pesa-cta-btn shrink-0 font-medium transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: getSetting(settings, 'ctaButton.backgroundColor', '#3b82f6'),
                    color: getSetting(settings, 'ctaButton.textColor', '#ffffff'),
                    padding: getSetting(settings, 'ctaButton.padding', '10px 20px'),
                    borderRadius: getSetting(settings, 'ctaButton.borderRadius', '6px'),
                  }}>
                  {getSetting(settings, 'ctaButton.text', 'Get Started')}
                </Link>
              )}

              {/* Menu Search */}
              {searchEnabled && searchStyle === 'icon' && (
                <button onClick={() => setSearchExpanded(!searchExpanded)} className="p-2 hover:text-primary transition-colors">
                  <IoSearch size={18} />
                </button>
              )}

              {/* Support Info (fallback) */}
              {!hasDynamicMenu && (
                <div className="hidden lg:flex items-center gap-2 text-sm">
                  <IoCallOutline className="text-primary" size={20} />
                  <div>
                    <div className="text-gray-600">24/7 Support</div>
                    <div className="font-medium">888-777-999</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay + Panel */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div className="pesa-mobile-overlay fixed inset-0 z-50" style={{ backgroundColor: mobileOverlay }}
            onClick={closeMobile} />

          {/* Panel */}
          <div className={`pesa-mobile-panel fixed z-50 overflow-y-auto ${
            mobileMenuStyle === 'fullscreen' ? 'inset-0' :
            mobileMenuStyle === 'slide-right' ? 'top-0 right-0 bottom-0 w-80' :
            mobileMenuStyle === 'dropdown' ? 'top-auto left-0 right-0 bottom-auto max-h-[70vh]' :
            'top-0 left-0 bottom-0 w-80'
          }`} style={{ backgroundColor: mobileBg, color: mobileTextColor }}>
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-lg">Menu</span>
              <button onClick={closeMobile} className="p-1 hover:bg-gray-100 rounded">
                <IoClose size={24} />
              </button>
            </div>

            {/* Mobile menu items */}
            <div className="py-2">
              {displayItems.map((item, i) => (
                <MobileMenuItem key={item._id || i} item={item} onClose={closeMobile} />
              ))}
            </div>

            {/* Mobile search */}
            {getSetting(settings, 'mobile.showSearch', false) && (
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={(e) => { handleSearch(e); closeMobile(); }}>
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..." className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded text-sm" />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      <IoSearch size={18} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Auth link */}
            {!isAuthenticated && (
              <div className="p-4 border-t border-gray-200">
                <button onClick={() => { closeMobile(); openAuthModal('login'); }}
                  className="w-full py-2 text-center text-primary font-medium border border-primary rounded">
                  Login / Register
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
