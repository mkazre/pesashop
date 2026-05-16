import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import GiftCardPurchasePage from './pages/GiftCardPurchasePage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AccountPage from './pages/AccountPage';
import DashboardPage from './pages/account/DashboardPage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import LaybyesPage from './pages/account/LaybyesPage';
import PaymentsPage from './pages/account/PaymentsPage';
import TransactionsPage from './pages/account/TransactionsPage';
import LoyaltyPointsPage from './pages/account/LoyaltyPointsPage';
import MyCouponsPage from './pages/account/MyCouponsPage';
import MyGiftCardsPage from './pages/account/MyGiftCardsPage';
import AccountSettingsPage from './pages/account/AccountSettingsPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import CategoriesPage from './pages/CategoriesPage';
import AddressesPage from './pages/account/AddressesPage';
import RecurringOrdersAccountPage from './pages/account/RecurringOrdersPage';
import MyOffersPage from './pages/account/MyOffersPage';
import MyServiceRequestsPage from './pages/account/MyServiceRequestsPage';
// 2026-05 batch
import AccountReturnsPage from './pages/account/ReturnsPage';
import RequestReturnPage from './pages/account/RequestReturnPage';
import AccountReferralsPage from './pages/account/ReferralsPage';
import ReferLandingPage from './pages/ReferLandingPage';
import LivePage from './pages/LivePage';
import ServiceProvidersPage from './pages/ServiceProvidersPage';
import ProviderPortalPage from './pages/ProviderPortalPage';
import DynamicPage from './pages/DynamicPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ChatAdmin from './pages/chat/ChatAdmin';
import ChatWidget from './components/chat/ChatWidget';
import PopupRenderer from './components/common/PopupRenderer';

// Kiosk
import KioskLayout from './pages/kiosk/KioskLayout';
import KioskHome from './pages/kiosk/KioskHome';
import KioskShop from './pages/kiosk/KioskShop';
import KioskProductDetail from './pages/kiosk/KioskProductDetail';
import KioskSearch from './pages/kiosk/KioskSearch';
import KioskCart from './pages/kiosk/KioskCart';
import KioskCheckout from './pages/kiosk/KioskCheckout';
import KioskOrderSuccess from './pages/kiosk/KioskOrderSuccess';
import KioskAuth from './pages/kiosk/KioskAuth';
import KioskAccountLayout from './pages/kiosk/KioskAccountLayout';
import KioskOrderTracking from './pages/kiosk/KioskOrderTracking';

// Modals
import QuickViewModal from './components/modals/QuickViewModal';
import AuthModal from './components/modals/AuthModal';
import CartSidebar from './components/cart/CartSidebar';
import CheckoutDrawer from './components/product/CheckoutDrawer';

// Store & Hooks
import { useUIStore } from './store';
import { useProductPageSettings } from './hooks/useProductPageSettings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const { quickViewProduct, authModalOpen, cartSidebarOpen, checkoutDrawerOpen, closeCheckoutDrawer } = useUIStore();
  const { settings: pageSettings } = useProductPageSettings();
  const isKioskRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/kiosk');

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Chat Admin - separate login route (outside Layout) - MUST be before catch-all */}
        <Route path="/chat-admin" element={<ChatAdmin />} />

        {/* Digital Kiosk — fullscreen, no Header/Footer */}
        <Route path="/kiosk" element={<KioskLayout />}>
          <Route index element={<KioskHome />} />
          <Route path="shop" element={<KioskShop />} />
          <Route path="shop/:category" element={<KioskShop />} />
          <Route path="product/:slug" element={<KioskProductDetail />} />
          <Route path="search" element={<KioskSearch />} />
          <Route path="track" element={<KioskOrderTracking />} />
          <Route path="cart" element={<KioskCart />} />
          <Route path="checkout" element={<KioskCheckout />} />
          <Route path="order-success/:orderId" element={<KioskOrderSuccess />} />
          <Route path="auth" element={<KioskAuth />} />
          <Route path="account" element={<KioskAccountLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="laybyes" element={<LaybyesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="loyalty-points" element={<LoyaltyPointsPage />} />
            <Route path="coupons" element={<MyCouponsPage />} />
            <Route path="gift-cards" element={<MyGiftCardsPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="recurring-orders" element={<RecurringOrdersAccountPage />} />
            <Route path="my-offers" element={<MyOffersPage />} />
            <Route path="service-requests" element={<MyServiceRequestsPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="provider-portal" element={<ProviderPortalPage />} />
            <Route path="returns" element={<AccountReturnsPage />} />
            <Route path="returns/new/:orderId" element={<RequestReturnPage />} />
            <Route path="referrals" element={<AccountReferralsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:category" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="gift-cards" element={<GiftCardPurchasePage />} />
          <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="laybyes" element={<LaybyesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="loyalty-points" element={<LoyaltyPointsPage />} />
            <Route path="coupons" element={<MyCouponsPage />} />
            <Route path="gift-cards" element={<MyGiftCardsPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="recurring-orders" element={<RecurringOrdersAccountPage />} />
            <Route path="my-offers" element={<MyOffersPage />} />
            <Route path="service-requests" element={<MyServiceRequestsPage />} />
            <Route path="returns" element={<AccountReturnsPage />} />
            <Route path="returns/new/:orderId" element={<RequestReturnPage />} />
            <Route path="referrals" element={<AccountReferralsPage />} />
          </Route>
          <Route path="refer/:code" element={<ReferLandingPage />} />
          <Route path="live/:id" element={<LivePage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="service-providers" element={<ServiceProvidersPage />} />
          <Route path="service-providers/portal" element={<ProviderPortalPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="page/:slug" element={<DynamicPage />} />
          {/* Catch-all: try to render as a dynamic page by slug */}
          <Route path=":slug" element={<DynamicPage />} />
        </Route>
      </Routes>

      {/* Chat Widget — hidden on kiosk routes */}
      {!isKioskRoute && <ChatWidget />}

      {/* Popup Renderer — disabled on kiosk routes (kiosk has its own screensaver) */}
      {!isKioskRoute && <PopupRenderer isApp={false} />}

      {/* Global Modals */}
      {quickViewProduct && <QuickViewModal />}
      {authModalOpen && <AuthModal />}
      {cartSidebarOpen && <CartSidebar />}
      {checkoutDrawerOpen && (
        <CheckoutDrawer
          open={checkoutDrawerOpen}
          onClose={closeCheckoutDrawer}
          product={null}
          quantity={1}
          selectedVariant={null}
          laybyeSelection={null}
          settings={pageSettings}
        />
      )}
    </>
  );
}

export default App;
