import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  IoHomeOutline,
  IoCubeOutline,
  IoReceiptOutline,
  IoPeopleOutline,
  IoWalletOutline,
  IoStarOutline,
  IoCashOutline,
  IoGiftOutline,
  IoPricetagOutline,
  IoMailOutline,
  IoCodeSlashOutline,
  IoLayersOutline,
  IoSettingsOutline,
  IoCloudUploadOutline,
  IoImagesOutline,
  IoFolderOutline,
  IoCalendarOutline,
  IoRefresh,
  IoMenu,
  IoBusinessOutline,
  IoList,
  IoFlash,
  IoDocumentTextOutline,
  IoSwapHorizontalOutline,
  IoRibbonOutline,
  IoGridOutline,
  IoAnalyticsOutline,
  IoChatbubblesOutline,
  IoNotificationsOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoCarOutline,
  IoPhonePortraitOutline,
  IoMegaphoneOutline,
  IoChevronDownOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';
import { useUIStore } from '@/store';
import classNames from 'classnames';
import pesashopLogo from '@/assets/pesashop-logo.png';

const menuGroups = [
  {
    label: 'Core',
    items: [
      { path: '/', icon: IoHomeOutline, label: 'Dashboard', exact: true },
      { path: '/products', icon: IoCubeOutline, label: 'Products' },
      { path: '/categories', icon: IoFolderOutline, label: 'Categories' },
      { path: '/orders', icon: IoReceiptOutline, label: 'Orders' },
      { path: '/shipping', icon: IoCarOutline, label: 'Shipping' },
      { path: '/customers', icon: IoPeopleOutline, label: 'Customers' },
    ],
  },
  {
    label: 'Offers & Recurring',
    items: [
      { path: '/offers', icon: IoGiftOutline, label: 'Offers' },
      { path: '/recurring-orders', icon: IoRefresh, label: 'Recurring Orders' },
      { path: '/coupons', icon: IoPricetagOutline, label: 'Coupons' },
      { path: '/gift-cards', icon: IoGiftOutline, label: 'Gift Cards' },
    ],
  },
  {
    label: 'Layby',
    items: [
      { path: '/laybyes', icon: IoWalletOutline, label: 'Laybyes' },
      { path: '/layby-plans', icon: IoCalendarOutline, label: 'Layby Plans' },
      { path: '/layby-applications', icon: IoDocumentTextOutline, label: 'Applications' },
      { path: '/layby-transactions', icon: IoSwapHorizontalOutline, label: 'Transaction Log' },
    ],
  },
  {
    label: 'Loyalty & Reviews',
    items: [
      { path: '/loyalty', icon: IoStarOutline, label: 'PESA Coins' },
      { path: '/reviews', icon: IoStarOutline, label: 'Reviews' },
      { path: '/questions', icon: IoChatbubblesOutline, label: 'Q&A' },
      { path: '/badges', icon: IoRibbonOutline, label: 'Badges' },
    ],
  },
  {
    label: 'Service Providers',
    items: [
      { path: '/service-providers', icon: IoBusinessOutline, label: 'All Providers' },
      { path: '/service-provider-ads', icon: IoFlash, label: 'All Ads' },
      { path: '/service-types', icon: IoList, label: 'Service Types' },
      { path: '/service-requests', icon: IoDocumentTextOutline, label: 'Service Requests' },
    ],
  },
  {
    label: 'Customers & Segments',
    items: [
      { path: '/customers/demographics', icon: IoAnalyticsOutline, label: 'Demographics' },
      { path: '/b2bking/customer-groups', icon: IoBusinessOutline, label: 'Customer Groups' },
      { path: '/b2bking/price-lists', icon: IoList, label: 'Price Lists' },
      { path: '/b2bking/pricing-rules', icon: IoFlash, label: 'Pricing Rules' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/emails', icon: IoMailOutline, label: 'Email Templates' },
      { path: '/popups', icon: IoMegaphoneOutline, label: 'Popup Builder' },
      { path: '/notifications', icon: IoNotificationsOutline, label: 'Notifications' },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { path: '/currencies', icon: IoCashOutline, label: 'Currencies' },
      { path: '/home-page-builder', icon: IoHomeOutline, label: 'Home Page Builder' },
      { path: '/product-page-settings', icon: IoLayersOutline, label: 'Product Page' },
      { path: '/product-archive-settings', icon: IoGridOutline, label: 'Product Archive' },
      { path: '/menu-builder', icon: IoMenu, label: 'Menu Builder' },
      { path: '/menu-assignment', icon: IoMenu, label: 'Menu Assignment' },
      { path: '/footer-builder', icon: IoLayersOutline, label: 'Footer Builder' },
      { path: '/page-manager', icon: IoLayersOutline, label: 'Page Manager' },
    ],
  },
  {
    label: 'Content & Media',
    items: [
      { path: '/snippets', icon: IoCodeSlashOutline, label: 'Code Snippets' },
      { path: '/import-export', icon: IoCloudUploadOutline, label: 'Import/Export' },
      { path: '/import-batches', icon: IoCloudUploadOutline, label: 'Import Batches' },
      { path: '/media-library', icon: IoFolderOutline, label: 'Media Library' },
      { path: '/images', icon: IoImagesOutline, label: 'Image Manager' },
      { path: '/images/regenerate', icon: IoRefresh, label: 'Regenerate Images' },
      { path: '/stats', icon: IoAnalyticsOutline, label: 'Stats & Analytics' },
    ],
  },
  {
    label: 'Mobile App',
    items: [
      { path: '/mobile-app/splash', icon: IoPhonePortraitOutline, label: 'Mobile App' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/users', icon: IoPeopleOutline, label: 'Users' },
      { path: '/roles', icon: IoShieldCheckmarkOutline, label: 'Roles & Permissions' },
      { path: '/settings', icon: IoSettingsOutline, label: 'Settings' },
      { path: '/profile', icon: IoPersonOutline, label: 'My Profile' },
    ],
  },
];

// Groups expanded by default
const DEFAULT_OPEN = new Set(['Core', 'Offers & Recurring', 'Layby', 'Loyalty & Reviews', 'Service Providers', 'Customers & Segments']);

const Sidebar = () => {
  const { sidebarOpen } = useUIStore();
  const [logoError, setLogoError] = React.useState(false);
  const [openGroups, setOpenGroups] = useState(DEFAULT_OPEN);

  const toggleGroup = (label) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <aside
      className={classNames(
        'fixed left-0 top-0 h-screen bg-white border-r-2 border-gray-200 transition-all duration-300 z-40',
        {
          'w-64': sidebarOpen,
          'w-20': !sidebarOpen,
        }
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b-2 border-gray-200 bg-white px-2">
        {logoError ? (
          <h1 className={classNames('font-bold text-gray-900 transition-all', {
            'text-xl': sidebarOpen,
            'text-sm': !sidebarOpen,
          })}>
            {sidebarOpen ? 'PESA Admin' : 'PA'}
          </h1>
        ) : (
          <img
            src={pesashopLogo}
            alt="PESASHOP"
            className={classNames('object-contain transition-all', {
              'h-12 w-auto': sidebarOpen,
              'h-10 w-auto': !sidebarOpen,
            })}
            onError={() => setLogoError(true)}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="overflow-y-auto h-[calc(100vh-4rem)]">
        {menuGroups.map((group) => {
          const isOpen = openGroups.has(group.label);
          return (
            <div key={group.label}>
              {/* Group header — only shown when sidebar is expanded */}
              {sidebarOpen ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-4 py-2 mt-2 text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.label}</span>
                  {isOpen
                    ? <IoChevronDownOutline size={12} className="text-gray-400" />
                    : <IoChevronForwardOutline size={12} className="text-gray-400" />}
                </button>
              ) : (
                <div className="border-t border-gray-100 mt-1" />
              )}

              {/* Group items */}
              {(isOpen || !sidebarOpen) && (
                <ul className={sidebarOpen ? 'pb-1' : 'py-1'}>
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) =>
                          classNames(
                            'flex items-center gap-3 px-4 py-2.5 transition-colors text-sm',
                            {
                              'bg-primary text-white': isActive,
                              'text-gray-700 hover:bg-gray-100': !isActive,
                              'justify-center': !sidebarOpen,
                            }
                          )
                        }
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon size={19} className="flex-shrink-0" />
                        {sidebarOpen && <span className="font-medium leading-none">{item.label}</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        <div className="h-8" />
      </nav>
    </aside>
  );
};

export default Sidebar;
