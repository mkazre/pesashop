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
import DynamicPage from './pages/DynamicPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ChatAdmin from './pages/chat/ChatAdmin';
import ChatWidget from './components/chat/ChatWidget';
import PopupRenderer from './components/common/PopupRenderer';

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

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Chat Admin - separate login route (outside Layout) - MUST be before catch-all */}
        <Route path="/chat-admin" element={<ChatAdmin />} />
        
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
          </Route>
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="page/:slug" element={<DynamicPage />} />
          {/* Catch-all: try to render as a dynamic page by slug */}
          <Route path=":slug" element={<DynamicPage />} />
        </Route>
      </Routes>

      {/* Chat Widget - visible on all pages */}
      <ChatWidget />

      {/* Popup Renderer - evaluates and displays active popups */}
      <PopupRenderer isApp={false} />

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
