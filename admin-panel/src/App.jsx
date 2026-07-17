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
import AppPageBuilderPage from './pages/AppPageBuilderPage';
import FormBuilderPage from './pages/FormBuilderPage';
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
import PopupBuilderPage from './pages/PopupBuilderPage';
// New feature modules
import CustomerDemographicsDashboard from './pages/CustomerDemographicsDashboard';
import OffersPage from './pages/OffersPage';
import OfferBuilderPage from './pages/OfferBuilderPage';
import OfferCustomersPage from './pages/OfferCustomersPage';
import RecurringOrdersPage from './pages/RecurringOrdersPage';
import RecurringPlansPage from './pages/RecurringPlansPage';
import ServiceProvidersPage from './pages/ServiceProvidersPage';
import ServiceProviderCategoriesPage from './pages/ServiceProviderCategoriesPage';
import ServiceProviderPlansPage from './pages/ServiceProviderPlansPage';
import ServiceProviderAdSlotsPage from './pages/ServiceProviderAdSlotsPage';
import ServiceProviderAdsPage from './pages/ServiceProviderAdsPage';
import ServiceProviderAdOrdersPage from './pages/ServiceProviderAdOrdersPage';
import ServiceProviderDetailPage from './pages/ServiceProviderDetailPage';
import ServiceTypesPage from './pages/ServiceTypesPage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import ImportBatchesPage from './pages/ImportBatchesPage';
import PriceFixToolPage from './pages/PriceFixToolPage';
import KioskSettingsPage from './pages/digitalKiosks/SettingsPage';
import KioskScreensaverMediaPage from './pages/digitalKiosks/ScreensaverMediaPage';
import KioskFeaturedContentPage from './pages/digitalKiosks/FeaturedContentPage';
import KioskRegisteredDevicesPage from './pages/digitalKiosks/RegisteredDevicesPage';
// 2026-05 batch: Returns, Referrals, WhatsApp, Live, Bundles
import ReturnsPage from './pages/ReturnsPage';
import ReferralsPage from './pages/ReferralsPage';
import WhatsAppPage from './pages/WhatsAppPage';
import LiveStreamsPage from './pages/LiveStreamsPage';
import LiveStreamControlPage from './pages/LiveStreamControlPage';
import BundlesPage from './pages/BundlesPage';
import AutoposterAccountsPage from './pages/AutoposterAccountsPage';
import AutoposterComposePage from './pages/AutoposterComposePage';
import AutoposterProfilesPage from './pages/AutoposterProfilesPage';
import AutoposterCaptionTemplatesPage from './pages/AutoposterCaptionTemplatesPage';
import AutoposterDesignsPage from './pages/AutoposterDesignsPage';
import AutoposterDesignerPage from './pages/AutoposterDesignerPage';
import AutoposterApprovalQueuePage from './pages/AutoposterApprovalQueuePage';
import AutoposterTrendDashboardPage from './pages/AutoposterTrendDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ADMIN_ROLES = ['admin', 'shop_manager', 'superadmin', 'super_admin'];

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!ADMIN_ROLES.includes(user?.role)) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<LoginPage />} />
          
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
            <Route path="popups" element={<PopupBuilderPage />} />
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
            <Route path="mobile-app/menu" element={<MenuBuilder lockedLocation="mobile-menu" />} />
            <Route path="mobile-app/pages" element={<AppPageBuilderPage />} />
            <Route path="mobile-app/forms" element={<FormBuilderPage />} />
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
            {/* Demographics */}
            <Route path="customers/demographics" element={<CustomerDemographicsDashboard />} />
            {/* Offers */}
            <Route path="offers" element={<OffersPage />} />
            <Route path="offers/new" element={<OfferBuilderPage />} />
            <Route path="offers/:id/customers" element={<OfferCustomersPage />} />
            <Route path="offers/:id" element={<OfferBuilderPage />} />
            {/* Recurring Orders */}
            <Route path="recurring-orders" element={<RecurringOrdersPage />} />
            <Route path="recurring-orders/plans" element={<RecurringPlansPage />} />
            {/* Service Providers — static sub-routes MUST come before :id */}
            <Route path="service-providers" element={<ServiceProvidersPage />} />
            <Route path="service-providers/categories" element={<ServiceProviderCategoriesPage />} />
            <Route path="service-providers/plans" element={<ServiceProviderPlansPage />} />
            <Route path="service-providers/ad-slots" element={<ServiceProviderAdSlotsPage />} />
            <Route path="service-providers/ad-orders" element={<ServiceProviderAdOrdersPage />} />
            <Route path="service-providers/:id" element={<ServiceProviderDetailPage />} />
            <Route path="service-provider-ads" element={<ServiceProviderAdsPage />} />
            <Route path="service-types" element={<ServiceTypesPage />} />
            <Route path="service-requests" element={<ServiceRequestsPage />} />
            <Route path="import-batches" element={<ImportBatchesPage />} />
            <Route path="price-fix-tool" element={<PriceFixToolPage />} />
            {/* Digital Kiosks */}
            <Route path="digital-kiosks/settings" element={<KioskSettingsPage />} />
            <Route path="digital-kiosks/screensaver" element={<KioskScreensaverMediaPage />} />
            <Route path="digital-kiosks/featured" element={<KioskFeaturedContentPage />} />
            <Route path="digital-kiosks/devices" element={<KioskRegisteredDevicesPage />} />
            {/* 2026-05 batch */}
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="whatsapp" element={<WhatsAppPage />} />
            <Route path="live-streams" element={<LiveStreamsPage />} />
            <Route path="live-streams/:id/control" element={<LiveStreamControlPage />} />
            <Route path="bundles" element={<BundlesPage />} />
            <Route path="autoposter/accounts" element={<AutoposterAccountsPage />} />
            <Route path="autoposter/compose" element={<AutoposterComposePage />} />
            <Route path="autoposter/profiles" element={<AutoposterProfilesPage />} />
            <Route path="autoposter/caption-templates" element={<AutoposterCaptionTemplatesPage />} />
            <Route path="autoposter/designs" element={<AutoposterDesignsPage />} />
            <Route path="autoposter/designer" element={<AutoposterDesignerPage />} />
            <Route path="autoposter/approval-queue" element={<AutoposterApprovalQueuePage />} />
            <Route path="autoposter/trend-dashboard" element={<AutoposterTrendDashboardPage />} />
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
