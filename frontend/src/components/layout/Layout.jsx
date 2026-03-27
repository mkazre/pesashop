import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import CodeSnippetInjector from '@/components/common/CodeSnippetInjector';
import { useCurrencyStore } from '@/store';
import { loyaltyAPI, settingsAPI } from '@/services/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWebPush } from '@/hooks/useWebPush';
import NotificationToast from '@/components/common/NotificationToast';

export default function Layout() {
  const { setCurrencies } = useCurrencyStore();
  useAnalytics(); // Auto-tracks page views on route changes
  useWebPush(); // Register web push subscription

  useEffect(() => {
    loyaltyAPI.getCurrencies()
      .then(res => {
        if (res.data?.success && res.data.data?.length > 0) {
          setCurrencies(res.data.data);
        }
      })
      .catch(() => {});

    settingsAPI.getPublic()
      .then(res => {
        const storeName = res.data?.data?.storeName;
        if (storeName) {
          document.title = storeName;
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <CodeSnippetInjector environment="frontend" />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <NotificationToast />
    </div>
  );
}
