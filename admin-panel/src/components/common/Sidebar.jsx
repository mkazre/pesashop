import React from 'react';
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
} from 'react-icons/io5';
import { useUIStore } from '@/store';
import classNames from 'classnames';
import pesashopLogo from '@/assets/pesashop-logo.png';

const Sidebar = () => {
  const { sidebarOpen } = useUIStore();
  const [logoError, setLogoError] = React.useState(false);

  const menuItems = [
    { path: '/', icon: IoHomeOutline, label: 'Dashboard' },
    { path: '/products', icon: IoCubeOutline, label: 'Products' },
    { path: '/categories', icon: IoFolderOutline, label: 'Categories' },
    { path: '/orders', icon: IoReceiptOutline, label: 'Orders' },
    { path: '/shipping', icon: IoCarOutline, label: 'Shipping' },
    { path: '/customers', icon: IoPeopleOutline, label: 'Customers' },
    { path: '/laybyes', icon: IoWalletOutline, label: 'Laybyes' },
    { path: '/layby-plans', icon: IoCalendarOutline, label: 'Layby Plans' },
    { path: '/layby-applications', icon: IoDocumentTextOutline, label: 'Layby Applications' },
    { path: '/layby-transactions', icon: IoSwapHorizontalOutline, label: 'Transaction Log' },
    { path: '/loyalty', icon: IoStarOutline, label: 'PESA Coins' },
    { path: '/coupons', icon: IoPricetagOutline, label: 'Coupons' },
    { path: '/gift-cards', icon: IoGiftOutline, label: 'Gift Cards' },
    { path: '/reviews', icon: IoStarOutline, label: 'Reviews' },
    { path: '/questions', icon: IoChatbubblesOutline, label: 'Q&A' },
    { path: '/currencies', icon: IoCashOutline, label: 'Currencies' },
    { path: '/b2bking/customer-groups', icon: IoBusinessOutline, label: 'Customer Groups' },
    { path: '/b2bking/price-lists', icon: IoList, label: 'Price Lists' },
    { path: '/b2bking/pricing-rules', icon: IoFlash, label: 'Pricing Rules' },
    { path: '/badges', icon: IoRibbonOutline, label: 'Badges' },
    { path: '/product-page-settings', icon: IoLayersOutline, label: 'Product Page' },
    { path: '/product-archive-settings', icon: IoGridOutline, label: 'Product Archive' },
    { path: '/stats', icon: IoAnalyticsOutline, label: 'Stats & Analytics' },
    { path: '/home-page-builder', icon: IoHomeOutline, label: 'Home Page Builder' },
    { path: '/footer-builder', icon: IoLayersOutline, label: 'Footer Builder' },
    { path: '/mobile-app/splash', icon: IoPhonePortraitOutline, label: 'Mobile App' },
    { path: '/page-manager', icon: IoLayersOutline, label: 'Page Manager' },
    { path: '/menu-builder', icon: IoMenu, label: 'Menu Builder' },
    { path: '/menu-assignment', icon: IoMenu, label: 'Menu Assignment' },
    { path: '/notifications', icon: IoNotificationsOutline, label: 'Notifications' },
    { path: '/users', icon: IoPeopleOutline, label: 'Users' },
    { path: '/roles', icon: IoShieldCheckmarkOutline, label: 'Roles & Permissions' },
    { path: '/profile', icon: IoPersonOutline, label: 'My Profile' },
    { path: '/emails', icon: IoMailOutline, label: 'Email Templates' },
    { path: '/snippets', icon: IoCodeSlashOutline, label: 'Code Snippets' },
    { path: '/popups', icon: IoMegaphoneOutline, label: 'Popup Builder' },
    { path: '/import-export', icon: IoCloudUploadOutline, label: 'Import/Export' },
    { path: '/media-library', icon: IoFolderOutline, label: 'Media Library' },
    { path: '/images', icon: IoImagesOutline, label: 'Image Manager' },
    { path: '/images/regenerate', icon: IoRefresh, label: 'Regenerate Images' },
    { path: '/settings', icon: IoSettingsOutline, label: 'Settings' },
  ];

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
          <h1 className={classNames('font-bold text-white transition-all', {
            'text-xl': sidebarOpen,
            'text-sm': !sidebarOpen,
          })}>
            {sidebarOpen ? 'E-Commerce Admin' : 'EA'}
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
      <nav className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    {
                      'bg-primary text-white': isActive,
                      'text-gray-700 hover:bg-gray-100': !isActive,
                      'justify-center': !sidebarOpen,
                    }
                  )
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
