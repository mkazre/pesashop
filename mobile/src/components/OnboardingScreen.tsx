import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileAppConfigAPI } from '@/services/api';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Slide {
  _id?: string;
  image: string;
  heading: string;
  text: string;
  order: number;
}

interface SplashConfig {
  enabled: boolean;
  style: 'centered' | 'fullImage' | 'bottomCard' | 'gradient' | 'split';
  slides: Slide[];
  backgroundColor: string;
  headingColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  skipButtonText: string;
  nextButtonText: string;
  finishButtonText: string;
  showDots: boolean;
  dotColor: string;
  dotActiveColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const DEFAULTS: SplashConfig = {
  enabled: true,
  style: 'centered',
  slides: [
    { image: '', heading: 'Welcome to Pesa Shop', text: 'Discover amazing products at great prices', order: 0 },
    { image: '', heading: 'Fast Delivery', text: 'Get your orders delivered quickly and safely', order: 1 },
    { image: '', heading: 'Start Shopping', text: 'Browse our collection and find what you love', order: 2 },
  ],
  backgroundColor: '#ffffff',
  headingColor: '#1f2937',
  textColor: '#6b7280',
  buttonColor: '#0F604B',
  buttonTextColor: '#ffffff',
  skipButtonText: 'Skip',
  nextButtonText: 'Next',
  finishButtonText: 'Get Started',
  showDots: true,
  dotColor: '#d1d5db',
  dotActiveColor: '#0F604B',
  gradientFrom: '#0F604B',
  gradientTo: '#1a8a6a',
};

const ONBOARDING_KEY = 'onboarding_completed';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [config, setConfig] = useState<SplashConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await mobileAppConfigAPI.getSplash();
      const data = res.data?.data;
      if (data && data.enabled && data.slides?.length > 0) {
        const merged = { ...DEFAULTS, ...data };
        // Prefetch all slide images so they display instantly (no blank flash)
        const urls = merged.slides
          .map((s: Slide) => s.image ? (s.image.startsWith('http') ? s.image : `${API_URL}${s.image}`) : null)
          .filter(Boolean) as string[];
        if (urls.length > 0) {
          await Promise.all(urls.map(url => Image.prefetch(url)));
        }
        setConfig(merged);
      } else {
        // No config or disabled — skip onboarding
        await markComplete();
        return;
      }
    } catch {
      // API error — use defaults
      setConfig(DEFAULTS);
    }
    setLoading(false);
  };

  const markComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    onComplete();
  };

  const goNext = () => {
    if (!config) return;
    if (currentIndex < config.slides.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      markComplete();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prev, animated: true });
      setCurrentIndex(prev);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#0F604B' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!config) return null;

  const isLast = currentIndex === config.slides.length - 1;
  const imgUrl = (url: string) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    const src = imgUrl(item.image);

    // ─── Full Image Style ───
    if (config.style === 'fullImage') {
      return (
        <View style={[styles.slide, { width }]}>
          {src && <Image source={{ uri: src }} style={StyleSheet.absoluteFillObject} contentFit="cover" cachePolicy="memory-disk" />}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.fullImageOverlay}>
            <Text style={[styles.heading, { color: '#ffffff' }]}>{item.heading}</Text>
            <Text style={[styles.text, { color: '#e5e7eb' }]}>{item.text}</Text>
          </LinearGradient>
        </View>
      );
    }

    // ─── Bottom Card Style ───
    if (config.style === 'bottomCard') {
      return (
        <View style={[styles.slide, { width }]}>
          <View style={[styles.bottomCardTop, { backgroundColor: config.gradientFrom }]}>
            {src && <Image source={{ uri: src }} style={styles.bottomCardImage} contentFit="contain" cachePolicy="memory-disk" />}
          </View>
          <View style={styles.bottomCardContent}>
            <Text style={[styles.heading, { color: config.headingColor }]}>{item.heading}</Text>
            <Text style={[styles.text, { color: config.textColor }]}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // ─── Gradient Style ───
    if (config.style === 'gradient') {
      return (
        <View style={[styles.slide, { width }]}>
          <LinearGradient colors={[config.gradientFrom, config.gradientTo]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.centeredContent}>
            {src && <Image source={{ uri: src }} style={styles.centeredImage} contentFit="contain" cachePolicy="memory-disk" />}
            <Text style={[styles.heading, { color: '#ffffff' }]}>{item.heading}</Text>
            <Text style={[styles.text, { color: 'rgba(255,255,255,0.8)' }]}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // ─── Split Style ───
    if (config.style === 'split') {
      return (
        <View style={[styles.slide, { width, backgroundColor: config.backgroundColor }]}>
          <View style={styles.splitImageArea}>
            {src && <Image source={{ uri: src }} style={styles.splitImage} contentFit="contain" cachePolicy="memory-disk" />}
          </View>
          <View style={styles.splitTextArea}>
            <Text style={[styles.heading, { color: config.headingColor }]}>{item.heading}</Text>
            <Text style={[styles.text, { color: config.textColor }]}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // ─── Centered Style (default) ───
    return (
      <View style={[styles.slide, { width, backgroundColor: config.backgroundColor }]}>
        <View style={styles.centeredContent}>
          {src && <Image source={{ uri: src }} style={styles.centeredImage} contentFit="contain" cachePolicy="memory-disk" />}
          <Text style={[styles.heading, { color: config.headingColor }]}>{item.heading}</Text>
          <Text style={[styles.text, { color: config.textColor }]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const useGradientBg = config.style === 'gradient';

  const Container = useGradientBg ? LinearGradient : View;
  const containerProps = useGradientBg
    ? { colors: [config.gradientFrom, config.gradientTo], style: styles.container }
    : { style: [styles.container, { backgroundColor: config.backgroundColor }] };

  return (
    <Container {...(containerProps as any)}>
      <FlatList
        ref={flatListRef}
        data={config.slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        bounces={false}
      />

      {/* Dots */}
      {config.showDots && config.slides.length > 1 && (
        <View style={styles.dotsContainer}>
          {config.slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? config.dotActiveColor : config.dotColor,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={goPrev} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: config.buttonColor }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={markComplete} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: config.buttonColor }]}>{config.skipButtonText}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={goNext}
            style={[styles.nextButton, { backgroundColor: config.buttonColor }]}
          >
            <Text style={[styles.nextText, { color: config.buttonTextColor }]}>
              {isLast ? config.finishButtonText : config.nextButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}

// Static helper to check if onboarding has been completed
OnboardingScreen.hasCompleted = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

// Reset onboarding (for testing)
OnboardingScreen.reset = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {}
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Centered
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 160,
  },
  centeredImage: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Full Image
  fullImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 160,
    paddingTop: 60,
    justifyContent: 'flex-end',
  },
  // Bottom Card
  bottomCardTop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCardImage: {
    width: '70%',
    height: '70%',
  },
  bottomCardContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 160,
    marginTop: -30,
    alignItems: 'center',
  },
  // Split
  splitImageArea: {
    height: '55%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  splitImage: {
    width: '80%',
    height: '80%',
  },
  splitTextArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 40,
    paddingTop: 30,
    alignItems: 'center',
  },
  // Dots
  dotsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  // Buttons
  buttonsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
