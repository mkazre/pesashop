import { useEffect, useState, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import CartSidebar from "@/components/CartSidebar";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import OnboardingScreen from "@/components/OnboardingScreen";
import { useAuthStore, useCurrencyStore } from "@/store";
import { currenciesAPI } from "@/services/api";
import { useExpoPush } from "@/hooks/useExpoPush";
import NotificationToast from "@/components/NotificationToast";

const LOGO = require("@/../assets/pesashop-logo.png");

SplashScreen.preventAutoHideAsync();

const { width: SCREEN_W } = Dimensions.get("window");

function AppPreloader() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance: fade + spring scale
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    // Progress bar: animate to 85% over 1.4s (leaves room for actual completion)
    Animated.timing(progressWidth, {
      toValue: SCREEN_W * 0.85,
      duration: 1400,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={preloaderStyles.container}>
      <StatusBar style="light" />
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], marginBottom: 48 }}>
        <Image source={LOGO} style={preloaderStyles.logo} contentFit="contain" />
      </Animated.View>
      {/* Progress bar */}
      <View style={preloaderStyles.progressTrack}>
        <Animated.View style={[preloaderStyles.progressFill, { width: progressWidth }]} />
      </View>
    </View>
  );
}

const preloaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F604B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  logo: {
    width: 220,
    height: 70,
  },
  progressTrack: {
    width: SCREEN_W * 0.6,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#E8A838",
    borderRadius: 2,
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setCurrencies = useCurrencyStore((s) => s.setCurrencies);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
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
      // Check if onboarding has been completed
      const completed = await OnboardingScreen.hasCompleted();
      setShowOnboarding(!completed);
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  // Animated preloader while initializing
  if (showOnboarding === null) {
    return <AppPreloader />;
  }

  // Show onboarding if not yet completed
  if (showOnboarding === true) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

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
          name="account/dashboard"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/payments"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account/transactions"
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
