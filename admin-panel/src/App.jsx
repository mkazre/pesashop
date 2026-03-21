import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Components
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import ProductForm from './pages/ProductForm';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import LaybyesPage from './pages/LaybyesPage';
import LaybyeDetailPage from './pages/LaybyeDetailPage';
import LaybyPlansPage from './pages/LaybyPlansPage';
import LoyaltyPage from './pages/LoyaltyPage';
import CouponsPage from './pages/CouponsPage';
import CouponEmailSettingsPage from './pages/CouponEmailSettingsPage';
import GiftCardsPage from './pages/GiftCardsPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewSettingsPage from './pages/ReviewSettingsPage';
import CurrenciesPage from './pages/CurrenciesPage';
import CodeSnippetsPage from './pages/CodeSnippetsPage';
import EmergencyDisablePage from './pages/EmergencyDisablePage';
import PageBuilder from './pages/PageBuilder';
import PageManager from './pages/PageManager';
import MenuBuilder from './pages/MenuBuilder';
import MenuAssignment from './pages/MenuAssignment';
import ImportExportPage from './pages/ImportExportPage';
import ImageManagerPage from './pages/ImageManagerPage';
import RegenerateImagesPage from './pages/RegenerateImagesPage';
import SettingsPage from './pages/SettingsPage';
import CategoriesPage from './pages/CategoriesPage';
import CustomerGroupsPage from './pages/CustomerGroupsPage';
import PriceListsPage from './pages/PriceListsPage';
import PricingRulesPage from './pages/PricingRulesPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import LaybyApplicationsPage from './pages/LaybyApplicationsPage';
import LaybyTransactionsPage from './pages/LaybyTransactionsPage';
import BadgeManagerPage from './pages/BadgeManagerPage';
import ProductPageSettingsPage from './pages/ProductPageSettingsPage';
import ProductArchiveSettingsPage from './pages/ProductArchiveSettingsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import NotificationsPage from './pages/NotificationsPage';
import HomePageBuilderPage from './pages/HomePageBuilderPage';
import StatsPage from './pages/StatsPage';
import QuestionsPage from './pages/QuestionsPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import ProfilePage from './pages/ProfilePage';
import ShippingPage from './pages/ShippingPage';
import WaybillDetailPage from './pages/WaybillDetailPage';
import ShippingHubsPage from './pages/ShippingHubsPage';
import MobileScannerPage from './pages/MobileScannerPage';
import PODCapturePage from './pages/PODCapturePage';
import FooterBuilderPage from './pages/FooterBuilderPage';
import MobileAppSplashPage from './pages/MobileAppSplashPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/emergency-disable" element={<EmergencyDisablePage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="laybyes" element={<LaybyesPage />} />
            <Route path="laybyes/:id" element={<LaybyeDetailPage />} />
            <Route path="layby-plans" element={<LaybyPlansPage />} />
            <Route path="layby-applications" element={<LaybyApplicationsPage />} />
            <Route path="layby-transactions" element={<LaybyTransactionsPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="coupons/email-settings" element={<CouponEmailSettingsPage />} />
            <Route path="gift-cards" element={<GiftCardsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="reviews/settings" element={<ReviewSettingsPage />} />
            <Route path="currencies" element={<CurrenciesPage />} />
            <Route path="page-builder" element={<PageBuilder />} />
            <Route path="page-manager" element={<PageManager />} />
            <Route path="menu-builder" element={<MenuBuilder />} />
            <Route path="menu-assignment" element={<MenuAssignment />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="emails" element={<EmailTemplatesPage />} />
            <Route path="snippets" element={<CodeSnippetsPage />} />
            <Route path="import-export" element={<ImportExportPage />} />
            <Route path="media-library" element={<MediaLibraryPage />} />
            <Route path="images" element={<ImageManagerPage />} />
            <Route path="images/regenerate" element={<RegenerateImagesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="b2bking/customer-groups" element={<CustomerGroupsPage />} />
            <Route path="b2bking/price-lists" element={<PriceListsPage />} />
            <Route path="b2bking/pricing-rules" element={<PricingRulesPage />} />
            <Route path="badges" element={<BadgeManagerPage />} />
            <Route path="product-page-settings" element={<ProductPageSettingsPage />} />
            <Route path="product-archive-settings" element={<ProductArchiveSettingsPage />} />
            <Route path="home-page-builder" element={<HomePageBuilderPage />} />
            <Route path="footer-builder" element={<FooterBuilderPage />} />
            <Route path="mobile-app/splash" element={<MobileAppSplashPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="shipping/waybills/:id" element={<WaybillDetailPage />} />
            <Route path="shipping/hubs" element={<ShippingHubsPage />} />
            <Route path="shipping/mobile" element={<MobileScannerPage />} />
            <Route path="shipping/mobile/:action" element={<MobileScannerPage />} />
            <Route path="shipping/mobile/:action/:waybillNumber" element={<MobileScannerPage />} />
            <Route path="shipping/pod/:waybillNumber" element={<PODCapturePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      <Toaster
        position="top-right"
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            maxWidth: '440px',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
