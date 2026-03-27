import { useEffect, useState, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
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

SplashScreen.preventAutoHideAsync();

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function AppPreloader() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    // Logo pulse + scale
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Dot wave animation
    dotAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={preloaderStyles.container}>
      <StatusBar style="light" />
      <Animated.View style={[preloaderStyles.logoWrap, { opacity: pulseAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.Text style={preloaderStyles.logoText}>P</Animated.Text>
      </Animated.View>
      <Animated.Text style={[preloaderStyles.brandText, { opacity: pulseAnim }]}>
        PesaShop
      </Animated.Text>
      <View style={preloaderStyles.dotsRow}>
        {dotAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              preloaderStyles.dot,
              { transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }], opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const preloaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1b5e35",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
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
