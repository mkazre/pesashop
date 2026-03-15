import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import CartSidebar from "@/components/CartSidebar";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import { useAuthStore, useCurrencyStore } from "@/store";
import { currenciesAPI } from "@/services/api";
import { useExpoPush } from "@/hooks/useExpoPush";
import NotificationToast from "@/components/NotificationToast";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setCurrencies = useCurrencyStore((s) => s.setCurrencies);
  useExpoPush();

  useEffect(() => {
    const init = async () => {
      await hydrate();
      try {
        const res = await currenciesAPI.getFrontend();
        if (res.data?.data) {
          setCurrencies(res.data.data);
        }
      } catch {}
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[slug]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="category/[slug]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="search"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="auth/login"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="auth/register"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="checkout"
          options={{ headerShown: false, animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="orders"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/loyalty-points"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/laybyes"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/addresses"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/coupons"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/gift-cards"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/track-order"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="page/[slug]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
      </Stack>
      <CartSidebar />
      <CheckoutDrawer />
      <NotificationToast />
      <Toast />
    </>
  );
}
