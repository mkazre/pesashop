import { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
  Share,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductCard from "@/components/ProductCard";
import InlineLaybyePlans from "@/components/InlineLaybyePlans";
import RecurringWidget from "@/components/RecurringWidget";
import ServiceRequestWidget from "@/components/ServiceRequestWidget";
import LaybyeApplicationModal from "@/components/LaybyeApplicationModal";
import ProductBadges from "@/components/ProductBadges";
import WriteReview from "@/components/WriteReview";
import ProductQA from "@/components/ProductQA";
import OfferSlot from "@/components/OfferSlot";
import ProductAIAssistant from "@/components/ProductAIAssistant";
import ProductRecommendations from "@/components/ProductRecommendations";
import TikTokVideoSlot from "@/components/social/TikTokVideoSlot";
import BottomTabBar from "@/components/BottomTabBar";
import PulsingArrows from "@/components/PulsingArrows";
import FreeShippingBar from "@/components/FreeShippingBar";
import { useCartSuccessOverlay } from "@/components/CartSuccessOverlay";
import { colors, resolveImageUrl } from "@/theme";
import {
  productsAPI,
  reviewsAPI,
  statsAPI,
  productPageSettingsAPI,
  loyaltyAPI,
  serviceProviderAdsAPI,
} from "@/services/api";
import {
  useCartStore,
  useWishlistStore,
  useCurrencyStore,
  useRecentlyViewedStore,
  useUIStore,
} from "@/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pageSettings, setPageSettings] = useState<any>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [laybyeSelection, setLaybyeSelection] = useState<any>(null);
  const [recurringActive, setRecurringActive] = useState(false);
  const [laybyeModalVisible, setLaybyeModalVisible] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [providerAds, setProviderAds] = useState<any[]>([]);

  const addToCart = useCartStore((s) => s.addItem);
  const setItemLaybye = useCartStore((s) => s.setItemLaybye);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const { openCartSidebar, openCheckoutDrawer } = useUIStore();
  const showCartOverlay = useCartSuccessOverlay((s) => s.show);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getOne(slug!);
        // Extract actual product — handle both { data: product } and { data: { data: product } }
        const p = res.data?.data?._id ? res.data.data
          : res.data?._id ? res.data
          : res.data?.data?.product?._id ? res.data.data.product
          : null;
        if (!p || !p._id) {
          setError(true);
          setLoading(false);
          return;
        }
        setProduct(p);
        addRecentlyViewed(p);
        try { statsAPI.trackEvent({ type: "product_view", productId: p._id, sessionId: "mobile" }); } catch {}
        const [revRes, settingsRes] = await Promise.all([
          reviewsAPI.getForProduct(p._id, { limit: 20 }).catch(() => ({ data: { data: [] } })),
          productPageSettingsAPI.get().catch(() => ({ data: { data: null } })),
        ]);
        setReviews(revRes.data?.data || []);
        const settings = settingsRes.data?.data || settingsRes.data || null;
        setPageSettings(settings);
        // Initialize section collapsed state from settings
        if (settings?.sections) {
          const initial: Record<string, boolean> = {};
          settings.sections.forEach((sec: any) => {
            initial[sec.id] = !sec.collapsed; // open if not collapsed
          });
          setOpenSections(initial);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  // Fetch contextual service provider ads for this product
  useEffect(() => {
    if (!product?._id) return;
    serviceProviderAdsAPI.getContextual({
      slotId: "product_detail_below_buy",
      pageType: "product_detail",
      productId: product._id,
      categorySlug: product.categories?.[0]?.slug,
      maxAds: 6,
    })
      .then((res) => setProviderAds(res.data?.data?.data || res.data?.data || []))
      .catch(() => setProviderAds([]));
  }, [product?._id]);

  // Fetch loyalty points for product
  useEffect(() => {
    if (!product?._id) return;
    loyaltyAPI.calculateProductPoints(product._id, quantity)
      .then((res) => {
        if (res.data?.success && res.data.data?.points > 0) {
          setLoyaltyData(res.data.data);
        } else {
          setLoyaltyData(null);
        }
      })
      .catch(() => setLoyaltyData(null));
  }, [product?._id, quantity]);

  // Product info settings from admin
  const pi = pageSettings?.productInfo || {};
  const ce = pageSettings?.conversionEnhancers || {};
  const urgency = ce.urgency || {};

  // Delivery estimate (hook must be above early return)
  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (pi.estimatedDeliveryDays || 3));
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }, [pi.estimatedDeliveryDays]);

  // Random viewer count & purchase count (stable per product)
  const viewerCount = useMemo(() =>
    Math.floor(Math.random() * ((urgency.viewerCountMax || 18) - (urgency.viewerCountMin || 3) + 1)) + (urgency.viewerCountMin || 3),
    [product?._id]
  );
  const recentPurchases = useMemo(() =>
    Math.floor(Math.random() * ((urgency.recentPurchaseMax || 42) - (urgency.recentPurchaseMin || 5) + 1)) + (urgency.recentPurchaseMin || 5),
    [product?._id]
  );

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !product) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.gray300} />
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray600, marginTop: 12 }}>Product not found</Text>
      <Pressable onPress={() => router.back()} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
      </Pressable>
    </View>
  );

  const images = (() => {
    const raw: string[] = [];
    if (product.featuredImage) raw.push(product.featuredImage);
    if (product.images?.length > 0) {
      for (const img of product.images) {
        if (img && !raw.includes(img)) raw.push(img);
      }
    }
    if (raw.length === 0 && product.image) raw.push(product.image);
    return raw;
  })();
  const hasDiscount = product.salePrice && product.salePrice < product.regularPrice;
  const discountPercent = hasDiscount ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) : 0;
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    if (laybyeSelection) {
      const items = useCartStore.getState().items;
      const idx = items.findIndex((i) => i.product._id === product._id);
      if (idx >= 0) setItemLaybye(idx, laybyeSelection);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Show animated overlay with PesaCoins earned (if feature enabled)
    if (pageSettings?.mobileFeatures?.cartSuccessAnimation !== false) {
      if (loyaltyData?.points > 0) {
        showCartOverlay({
          product,
          points: loyaltyData.points * quantity,
          cashValue: (loyaltyData.cashValueZAR || 0) * quantity,
          coinLabel: loyaltyData.labels?.points || "PESA Coins",
        });
      } else {
        showCartOverlay({ product, points: 0, cashValue: 0 });
      }
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    if (laybyeSelection) {
      const items = useCartStore.getState().items;
      const idx = items.findIndex((i) => i.product._id === product._id);
      if (idx >= 0) setItemLaybye(idx, laybyeSelection);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openCheckoutDrawer(product, quantity, null, laybyeSelection);
  };

  const handleShare = async () => {
    try { await Share.share({ message: `Check out ${product.name}`, url: `https://pesashop.com/product/${product.slug}` }); } catch {}
  };

  return (
    <View style={ps.screen}>
      <View style={[ps.floatingHeader, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={ps.floatBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Pressable
          onPress={() => {
            if (inWishlist) {
              removeFromWishlist(product._id);
              Toast.show({ type: "success", text1: "Removed from wishlist", visibilityTime: 1500 });
            } else {
              addToWishlist(product);
              Toast.show({ type: "success", text1: "Added to wishlist!", visibilityTime: 1500 });
            }
          }}
          style={ps.floatBtn}
        >
          <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={20} color={inWishlist ? colors.red500 : colors.gray800} />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View>
          <FlatList
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(_: any, i: number) => i.toString()}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (idx !== activeImageIndex) setActiveImageIndex(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }: any) => (
              <Image source={{ uri: resolveImageUrl(item) }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#f9fafb' }} contentFit="contain" transition={200} />
            )}
          />
          {images.length > 1 && (
            <View style={ps.dotsRow}>
              {images.map((_: any, i: number) => (
                <View key={i} style={[ps.dot, i === activeImageIndex ? ps.dotActive : ps.dotInactive]} />
              ))}
            </View>
          )}
          {hasDiscount && (
            <View style={ps.discountBadge}>
              <Text style={ps.discountText}>-{discountPercent}% OFF</Text>
            </View>
          )}
          {/* Admin-configured badges */}
          <ProductBadges productId={product._id} displayContext="productPages" />
        </View>

        <View style={ps.infoSection}>
          {/* Breadcrumbs */}
          {product.categories?.[0] && (
            <View style={ps.breadcrumbs}>
              <Pressable onPress={() => router.replace("/(tabs)/shop" as any)}>
                <Text style={ps.breadcrumbLink}>Shop</Text>
              </Pressable>
              <Text style={ps.breadcrumbSep}> › </Text>
              <Pressable onPress={() => router.push(`/category/${product.categories[0].slug}` as any)}>
                <Text style={ps.breadcrumbLink}>{product.categories[0].name}</Text>
              </Pressable>
              <Text style={ps.breadcrumbSep}> › </Text>
              <Text style={ps.breadcrumbCurrent} numberOfLines={1}>{product.name}</Text>
            </View>
          )}
          {product.categories?.[0]?.name && (
            <Text style={ps.category}>{product.categories[0].name}</Text>
          )}
          <Text style={ps.productName}>{product.name}</Text>

          {product.averageRating > 0 && (
            <View style={ps.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name={star <= Math.round(product.averageRating) ? "star" : "star-outline"} size={14} color={colors.amber500} />
              ))}
              <Text style={ps.ratingText}>{product.averageRating?.toFixed(1)} ({product.reviewCount || 0} reviews)</Text>
            </View>
          )}

          <View style={ps.priceRow}>
            <Text style={ps.price}>{formatPrice(product.salePrice || product.regularPrice)}</Text>
            {hasDiscount && <Text style={ps.oldPrice}>{formatPrice(product.regularPrice)}</Text>}
          </View>

          <View style={ps.stockRow}>
            <View style={[ps.stockDot, { backgroundColor: product.stock > 0 ? colors.green500 : colors.red500 }]} />
            <Text style={[ps.stockText, { color: product.stock > 0 ? colors.green600 : colors.red500 }]}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}
            </Text>
            {product.sku && (
              <Text style={ps.skuText}>SKU: <Text style={{ color: colors.gray700 }}>{product.sku}</Text></Text>
            )}
          </View>

          {/* ── Short Description ── */}
          {(product.shortDescription || product.short_description || product.excerpt) ? (
            <View style={ps.shortDescCard}>
              <Text style={ps.shortDescText}>{product.shortDescription || product.short_description || product.excerpt}</Text>
            </View>
          ) : null}

          {/* ── Variant Selectors ── */}
          {(Array.isArray(product.attributes) ? product.attributes : []).map((attr: any) => {
            if (!attr.values?.length) return null;
            const isColor = attr.name?.toLowerCase().includes("color") || attr.name?.toLowerCase().includes("colour");
            return (
              <View key={attr.name} style={{ marginBottom: 12 }}>
                <Text style={ps.variantLabel}>{attr.name}: <Text style={{ fontWeight: "700", color: colors.gray900 }}>{selectedVariant[attr.name] || ""}</Text></Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {attr.values.map((val: string) => {
                    const active = selectedVariant[attr.name] === val;
                    if (isColor) {
                      return (
                        <Pressable
                          key={val}
                          onPress={() => setSelectedVariant(prev => ({ ...prev, [attr.name]: val }))}
                          style={[ps.colorSwatch, active && ps.colorSwatchActive]}
                        >
                          <View style={[ps.colorSwatchInner, { backgroundColor: val.toLowerCase() }]} />
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSelectedVariant(prev => ({ ...prev, [attr.name]: val }))}
                        style={[ps.sizeChip, active ? ps.sizeChipActive : ps.sizeChipInactive]}
                      >
                        <Text style={[ps.sizeChipText, active && { color: colors.white }]}>{val}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* ── Pesa Coins ── */}
          {loyaltyData && loyaltyData.points > 0 && (pi.showPesaCoins !== false) && (
            <View style={ps.pesaCoinsBadge}>
              <Ionicons name="star" size={18} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={ps.pesaCoinsTitle}>
                  Earn <Text style={{ color: "#d97706" }}>{loyaltyData.points}</Text> {loyaltyData.labels?.points || "PESA Coins"}
                </Text>
                <Text style={ps.pesaCoinsSubtitle}>Worth {formatPrice(loyaltyData.cashValueZAR)} in rewards</Text>
              </View>
            </View>
          )}

          {/* ── Delivery Estimate ── */}
          {pi.showEstimatedDelivery !== false && (
            <View style={ps.infoPill}>
              <Ionicons name="car-outline" size={16} color={colors.gray600} />
              <Text style={ps.infoPillText}>Get it by <Text style={{ fontWeight: "700" }}>{deliveryDate}</Text></Text>
            </View>
          )}

          {/* ── Free Shipping Zones ── */}
          {pi.showFreeShippingZones !== false && pi.freeShippingZones?.filter((z: any) => z.enabled).length > 0 && (
            <View style={ps.infoPill}>
              <Ionicons name="airplane-outline" size={16} color={colors.green600} />
              <Text style={[ps.infoPillText, { color: colors.green600, fontWeight: "600" }]}>Free shipping to: </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, flex: 1 }}>
                {pi.freeShippingZones.filter((z: any) => z.enabled).map((z: any) => (
                  <View key={z.code} style={ps.shippingChip}>
                    <Text style={ps.shippingChipText}>{z.label || z.code}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Urgency: Viewer Count & Recent Purchases ── */}
          {urgency.enabled === true && (
            <View style={{ gap: 4, marginBottom: 12 }}>
              {urgency.showViewerCount !== false && (
                <View style={ps.urgencyRow}>
                  <Text style={ps.urgencyIcon}>👁</Text>
                  <Text style={ps.urgencyText}>
                    {(urgency.viewerCountMessage || "{count} people viewing this right now").replace("{count}", String(viewerCount))}
                  </Text>
                </View>
              )}
              {urgency.showRecentPurchaseCount !== false && (
                <View style={[ps.urgencyRow, { backgroundColor: "#fff7ed" }]}>
                  <Text style={ps.urgencyIcon}>🔥</Text>
                  <Text style={[ps.urgencyText, { color: "#c2410c" }]}>
                    {(urgency.recentPurchaseMessage || "{count} sold in last 24 hours").replace("{count}", String(recentPurchases))}
                  </Text>
                </View>
              )}
              {urgency.showLowStockWarning !== false && product.stock > 0 && product.stock <= (pi.lowStockThreshold || 5) && (
                <View style={[ps.urgencyRow, { backgroundColor: "#fef2f2" }]}>
                  <Text style={ps.urgencyIcon}>⚡</Text>
                  <Text style={[ps.urgencyText, { color: "#dc2626" }]}>
                    {(urgency.lowStockMessage || "Only {count} units left — order soon!").replace("{count}", String(product.stock))}
                  </Text>
                </View>
              )}
            </View>
          )}

          <InlineLaybyePlans product={product} onLaybyeSelect={setLaybyeSelection} />

          {laybyeSelection && (
            <Pressable onPress={() => setLaybyeModalVisible(true)} style={ps.laybyeApplyBtn}>
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={ps.laybyeApplyText}>GET IT ON LAYBY</Text>
            </Pressable>
          )}

          <RecurringWidget product={product} onRecurringChange={setRecurringActive} />

          {!recurringActive && <ServiceRequestWidget product={product} />}

          {pageSettings?.mobileFeatures?.freeShippingBarOnProductPage !== false && (
            <FreeShippingBar extraAmount={(product.salePrice || product.regularPrice || 0) * quantity} />
          )}

          <View style={{ height: 20 }} />

          {product.stock > 0 && (
            <>
              <View style={ps.cartRow}>
                <View style={ps.qtyWrap}>
                  <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={ps.qtyBtn}>
                    <Ionicons name="remove" size={18} color={colors.gray700} />
                  </Pressable>
                  <Text style={ps.qtyText}>{quantity}</Text>
                  <Pressable onPress={() => setQuantity(Math.min(product.stock, quantity + 1))} style={ps.qtyBtn}>
                    <Ionicons name="add" size={18} color={colors.gray700} />
                  </Pressable>
                </View>
                <Pressable onPress={handleAddToCart} style={ps.addCartBtn}>
                  <Ionicons name="cart-outline" size={18} color={colors.white} />
                  <Text style={ps.addCartText}>Add to Cart</Text>
                </Pressable>
              </View>
              <Pressable onPress={handleBuyNow} style={ps.buyNowBtn}>
                <Text style={ps.buyNowText}>Buy Now</Text>
                <PulsingArrows color="#fff" size={18} count={3} />
              </Pressable>
            </>
          )}

          {/* ── Trust Badges ── */}
          {pageSettings?.trustBadges?.enabled !== false && pageSettings?.trustBadges?.badges?.length > 0 && (
            <View style={ps.trustRow}>
              {pageSettings.trustBadges.badges.map((badge: any, i: number) => (
                <View key={i} style={ps.trustBadge}>
                  <Ionicons name={(badge.icon || "shield-checkmark-outline") as any} size={16} color={colors.primary} />
                  <Text style={ps.trustBadgeText}>{badge.text || badge.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ════ QUICK SPECS ════ */}
        {Array.isArray(product.specifications) && product.specifications.length > 0 && (
          <View style={ps.quickSpecsCard}>
            <Text style={ps.quickSpecsTitle}>Quick Specs</Text>
            <View style={ps.quickSpecsGrid}>
              {product.specifications.slice(0, 6).map((spec: any, i: number) => (
                <View key={i} style={ps.quickSpecItem}>
                  <Text style={ps.quickSpecKey}>{spec.key || spec.name}</Text>
                  <Text style={ps.quickSpecVal} numberOfLines={1}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ════ PESA AI ASSISTANT ════ */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <ProductAIAssistant product={product} />
        </View>

        {/* ════ COLLAPSIBLE SECTIONS (from Product Page Settings) ════ */}
        {(() => {
          const sortedSections = pageSettings?.sections
            ? [...pageSettings.sections].filter((sec: any) => sec.enabled).sort((a: any, b: any) => a.order - b.order)
            : defaultSections;

          const toggleSection = (id: string) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
          const rc = pageSettings?.reviewsConfig || {};

          return (
            <View style={ps.sectionsContainer}>
              {sortedSections.map((sec: any) => (
                <View key={sec.id} style={ps.sectionCard}>
                  <Pressable onPress={() => toggleSection(sec.id)} style={ps.sectionHeader}>
                    <Text style={ps.sectionHeaderText}>{sec.label}</Text>
                    <Ionicons name={openSections[sec.id] ? "chevron-up" : "chevron-down"} size={18} color={colors.gray500} />
                  </Pressable>

                  {openSections[sec.id] && (
                    <View style={ps.sectionBody}>
                      {/* Description / About */}
                      {sec.id === "about" && (
                        <View>
                          <Text
                            style={ps.descText}
                            numberOfLines={descExpanded ? undefined : 4}
                          >
                            {product.description || "No description available."}
                          </Text>
                          {product.description && product.description.length > 150 && (
                            <Pressable onPress={() => setDescExpanded(!descExpanded)} style={ps.readMoreBtn}>
                              <Text style={ps.readMoreText}>{descExpanded ? "Show Less" : "Read More"}</Text>
                              <Ionicons name={descExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
                            </Pressable>
                          )}
                        </View>
                      )}

                      {/* Specifications */}
                      {sec.id === "specifications" && (
                        Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                          <View>
                            {product.specifications.map((spec: any, i: number) => (
                              <View key={i} style={[ps.specRow, i < product.specifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.gray50 }]}>
                                <Text style={ps.specKey}>{spec.key}</Text>
                                <Text style={ps.specVal}>{spec.value}</Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={ps.emptyText}>No specifications available.</Text>
                        )
                      )}

                      {/* Reviews */}
                      {sec.id === "reviews" && (
                        <View>
                          {/* Rating bar chart */}
                          {reviews.length > 0 && (
                            <View style={ps.reviewSummary}>
                              <View style={ps.reviewBigScore}>
                                <Text style={ps.reviewBigNum}>{(product.averageRating || 0).toFixed(1)}</Text>
                                <View style={{ flexDirection: "row" }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons key={star} name={star <= Math.round(product.averageRating || 0) ? "star" : "star-outline"} size={12} color={colors.amber500} />
                                  ))}
                                </View>
                                <Text style={ps.reviewCount}>{reviews.length} reviews</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                {[5, 4, 3, 2, 1].map((star) => {
                                  const count = reviews.filter((r: any) => r.rating === star).length;
                                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                                  return (
                                    <View key={star} style={ps.barRow}>
                                      <Text style={ps.barStar}>{star}</Text>
                                      <Ionicons name="star" size={10} color={colors.amber500} />
                                      <View style={ps.barTrack}>
                                        <View style={[ps.barFill, { width: `${pct}%` }]} />
                                      </View>
                                      <Text style={ps.barCount}>{count}</Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          )}

                          {/* Individual reviews */}
                          {reviews.length === 0 ? (
                            <Text style={ps.emptyText}>No reviews yet. Be the first to share your experience!</Text>
                          ) : (
                            reviews.slice(0, rc.perPage || 5).map((review: any) => {
                              const reviewerName = review.user
                                ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() || "Customer"
                                : review.guestName || "Guest";
                              return (
                                <View key={review._id} style={ps.reviewItem}>
                                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                      <Text style={ps.reviewAuthor}>{reviewerName}</Text>
                                      {review.isVerifiedPurchase && (
                                        <Text style={ps.verifiedBadge}>✓ Verified</Text>
                                      )}
                                    </View>
                                    <Text style={ps.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                  </View>
                                  <View style={{ flexDirection: "row", marginBottom: 4 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Ionicons key={star} name={star <= review.rating ? "star" : "star-outline"} size={12} color={colors.amber500} />
                                    ))}
                                  </View>
                                  {review.title && <Text style={ps.reviewTitle}>{review.title}</Text>}
                                  <Text style={ps.reviewComment}>{review.content || review.comment}</Text>
                                  {/* Review images */}
                                  {review.images?.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                      {review.images.map((img: any, idx: number) => (
                                        <Image key={idx} source={{ uri: resolveImageUrl(img.url || img) }} style={{ width: 60, height: 60, marginRight: 6, borderWidth: 1, borderColor: colors.gray200 }} contentFit="cover" />
                                      ))}
                                    </ScrollView>
                                  )}
                                  {/* Admin response */}
                                  {review.adminResponse?.content && (
                                    <View style={ps.adminResponse}>
                                      <Text style={ps.adminResponseLabel}>Store Response</Text>
                                      <Text style={ps.adminResponseText}>{review.adminResponse.content}</Text>
                                    </View>
                                  )}
                                </View>
                              );
                            })
                          )}

                          <OfferSlot page="product_detail" />
                          {/* Write review form */}
                          <WriteReview
                            productId={product._id}
                            productName={product.name}
                            onReviewSubmitted={() => {
                              reviewsAPI.getForProduct(product._id, { limit: 20 })
                                .then((res) => setReviews(res.data?.data || []))
                                .catch(() => {});
                            }}
                          />
                        </View>
                      )}

                      {/* Q&A */}
                      {sec.id === "qa" && (
                        <ProductQA productId={product._id} />
                      )}

                      {/* Customers Also Viewed */}
                      {sec.id === "related" && (
                        <ProductRecommendations productId={product._id} type="related" />
                      )}

                      {/* Frequently Bought Together */}
                      {sec.id === "upsells" && (
                        <ProductRecommendations productId={product._id} type="upsells" />
                      )}

                      {/* Customers Also Bought */}
                      {sec.id === "also_bought" && (
                        <ProductRecommendations productId={product._id} type="also_bought" />
                      )}

                      {/* Recommended For You */}
                      {sec.id === "recommended" && (
                        <ProductRecommendations productId={product._id} type="recommended" />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        })()}

        {/* ════ TIKTOK VIDEO CAROUSEL ════ */}
        <TikTokVideoSlot
          keywords={[product.name, ...(product.tags || []).slice(0, 2)].filter(Boolean)}
          pageType="product_detail"
        />

        {/* ════ FEATURED SERVICES (Service Provider Ads Carousel) ════ */}
        {providerAds.length > 0 && (
          <View style={ps.spAdsSection}>
            <View style={ps.spAdsHeader}>
              <Text style={ps.spAdsTitle}>Featured Services</Text>
              <Text style={ps.spAdsSponsored}>SPONSORED</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={ps.spAdsTrack}
            >
              {providerAds.map((ad: any) => (
                <SpAdCard key={ad._id} ad={ad} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ════ RECENTLY VIEWED ════ */}
        <RecentlyViewedRow currentId={product._id} />

        <View style={{ height: 16 }} />
      </ScrollView>

      <LaybyeApplicationModal
        visible={laybyeModalVisible}
        onClose={() => setLaybyeModalVisible(false)}
        product={product}
        selectedPlan={laybyeSelection}
      />

      <BottomTabBar />
    </View>
  );
}

function RecentlyViewedRow({ currentId }: { currentId: string }) {
  const products = useRecentlyViewedStore((s) => s.products).filter((p: any) => p._id !== currentId).slice(0, 6);
  if (products.length === 0) return null;
  return (
    <View style={ps.recentSection}>
      <Text style={ps.recentTitle}>Recently Viewed</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={products}
        keyExtractor={(item: any) => item._id}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
        renderItem={({ item }: any) => (
          <View style={{ width: 150 }}>
            <ProductCard product={item} compact />
          </View>
        )}
      />
    </View>
  );
}

// Default sections when Product Page Settings haven't been configured
const defaultSections = [
  { id: "about", label: "About This Product", enabled: true, order: 1, collapsed: false },
  { id: "specifications", label: "Specifications", enabled: true, order: 2, collapsed: true },
  { id: "reviews", label: "Reviews", enabled: true, order: 3, collapsed: true },
  { id: "qa", label: "Questions & Answers", enabled: true, order: 4, collapsed: true },
  { id: "related", label: "Customers Also Viewed", enabled: true, order: 5, collapsed: true },
  { id: "upsells", label: "Frequently Bought Together", enabled: true, order: 6, collapsed: true },
  { id: "also_bought", label: "Customers Also Bought", enabled: true, order: 7, collapsed: true },
  { id: "recommended", label: "Recommended For You", enabled: true, order: 8, collapsed: true },
];

const ps = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  floatingHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  floatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  dotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 6 },
  dot: { borderRadius: 999 },
  dotActive: { width: 24, height: 6, backgroundColor: colors.primary },
  dotInactive: { width: 6, height: 6, backgroundColor: colors.gray300 },
  discountBadge: { position: "absolute", bottom: 16, left: 16, backgroundColor: colors.red500, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 0 },
  discountText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  infoSection: { paddingHorizontal: 16, paddingTop: 16 },
  category: { fontSize: 12, color: colors.primary, textTransform: "uppercase", letterSpacing: 1, fontWeight: "600", marginBottom: 4 },
  productName: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  ratingText: { fontSize: 12, color: colors.gray500, marginLeft: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 16 },
  price: { fontSize: 24, fontWeight: "700", color: colors.primary },
  oldPrice: { fontSize: 16, color: colors.gray400, textDecorationLine: "line-through" },
  stockRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  stockText: { fontSize: 12, fontWeight: "500" },
  pesaCoinsBadge: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  pesaCoinsTitle: { fontSize: 13, fontWeight: "600", color: "#92400e" },
  pesaCoinsSubtitle: { fontSize: 11, color: "#b45309", marginTop: 1 },
  infoPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.gray50, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  infoPillText: { fontSize: 13, color: colors.gray700 },
  shippingChip: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", paddingHorizontal: 6, paddingVertical: 1 },
  shippingChipText: { fontSize: 11, color: colors.green600 },
  urgencyRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", paddingHorizontal: 10, paddingVertical: 8 },
  urgencyIcon: { fontSize: 14 },
  urgencyText: { fontSize: 12, color: "#dc2626", flex: 1 },
  cartRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  qtyWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.gray100, borderRadius: 0, overflow: "hidden" },
  qtyBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontWeight: "600", color: colors.gray800, paddingHorizontal: 12 },
  addCartBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 0, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  addCartText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  // Collapsible sections
  sectionsContainer: { marginTop: 8 },
  sectionCard: { borderTopWidth: 1, borderTopColor: colors.gray100 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  sectionHeaderText: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  descText: { fontSize: 14, color: colors.gray600, lineHeight: 22 },
  readMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  readMoreText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  specRow: { flexDirection: "row", paddingVertical: 12 },
  specKey: { fontSize: 14, color: colors.gray500, width: "33%" },
  specVal: { fontSize: 14, color: colors.gray800, flex: 1 },
  emptyText: { fontSize: 14, color: colors.gray400, fontStyle: "italic" },
  // Review summary bar chart
  reviewSummary: { flexDirection: "row", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  reviewBigScore: { alignItems: "center", width: 80 },
  reviewBigNum: { fontSize: 32, fontWeight: "800", color: colors.gray900 },
  reviewCount: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  barStar: { fontSize: 11, width: 12, textAlign: "right", color: colors.gray600 },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.gray100, overflow: "hidden" },
  barFill: { height: 6, backgroundColor: colors.amber500 },
  barCount: { fontSize: 10, width: 20, textAlign: "right", color: colors.gray500 },
  // Review items
  reviewItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  reviewAuthor: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  verifiedBadge: { fontSize: 10, color: colors.green600, marginLeft: 6, fontWeight: "600" },
  reviewDate: { fontSize: 11, color: colors.gray400 },
  reviewTitle: { fontSize: 13, fontWeight: "600", color: colors.gray900, marginBottom: 2 },
  reviewComment: { fontSize: 13, color: colors.gray600, lineHeight: 20 },
  adminResponse: { marginTop: 8, padding: 10, backgroundColor: "#f0fdf4", borderLeftWidth: 3, borderLeftColor: colors.green600 },
  adminResponseLabel: { fontSize: 10, fontWeight: "700", color: colors.green600, marginBottom: 2 },
  adminResponseText: { fontSize: 12, color: colors.gray700 },
  buyNowBtn: { backgroundColor: colors.gray900, paddingVertical: 14, borderRadius: 0, alignItems: "center", marginBottom: 12, flexDirection: "row", justifyContent: "center", gap: 8 },
  buyNowText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  laybyeApplyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f59e0b", paddingVertical: 14, borderRadius: 0, marginBottom: 24 },
  laybyeApplyText: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
  // Breadcrumbs
  breadcrumbs: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 8 },
  breadcrumbLink: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  breadcrumbSep: { fontSize: 11, color: colors.gray400 },
  breadcrumbCurrent: { fontSize: 11, color: colors.gray500, flex: 1 },
  // Variant selectors
  variantLabel: { fontSize: 13, color: colors.gray500, fontWeight: "500" },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  colorSwatchActive: { borderColor: colors.primary },
  colorSwatchInner: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  sizeChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: 0 },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeChipInactive: { backgroundColor: colors.white, borderColor: colors.gray300 },
  sizeChipText: { fontSize: 13, fontWeight: "600", color: colors.gray700 },
  // Trust badges
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, marginBottom: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100 },
  trustBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.gray50, paddingHorizontal: 10, paddingVertical: 6 },
  trustBadgeText: { fontSize: 11, color: colors.gray700, fontWeight: "500" },
  // SKU + short desc
  skuText: { fontSize: 11, color: colors.gray400, marginLeft: 12 },
  shortDescCard: { backgroundColor: colors.gray50, borderLeftWidth: 3, borderLeftColor: colors.primary, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  shortDescText: { fontSize: 14, color: colors.gray700, lineHeight: 22 },
  // Quick specs
  quickSpecsCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, padding: 16 },
  quickSpecsTitle: { fontSize: 12, fontWeight: "700", color: colors.gray700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  quickSpecsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickSpecItem: { width: "48%", backgroundColor: colors.gray50, padding: 8 },
  quickSpecKey: { fontSize: 10, color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  quickSpecVal: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  // Recently viewed
  recentSection: { marginTop: 8, paddingVertical: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray100 },
  recentTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, marginBottom: 12 },
  // Service Provider Ads
  spAdsSection: { borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 14, marginTop: 4, backgroundColor: colors.white },
  spAdsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  spAdsTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  spAdsSponsored: { fontSize: 9, fontWeight: "700", color: colors.gray400, letterSpacing: 0.8 },
  spAdsTrack: { paddingHorizontal: 16, paddingRight: 8, gap: 10 },
});

// ─── Service Provider Ad Card + Enquiry Modal (inline) ───────────────────────
function SpAdCard({ ad }: { ad: any }) {
  const trackedRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!trackedRef.current && ad?._id) {
      trackedRef.current = true;
      serviceProviderAdsAPI.recordImpression(ad._id).catch(() => {});
    }
  }, [ad?._id]);

  const handleEnquire = () => {
    serviceProviderAdsAPI.recordClick(ad._id).catch(() => {});
    setModalOpen(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleEnquire}
        activeOpacity={0.85}
        style={{ width: 180, borderWidth: 1, borderColor: colors.gray100, backgroundColor: colors.white, overflow: "hidden", marginBottom: 12 }}
      >
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={{ width: "100%", height: 90 }} contentFit="cover" />
        ) : (
          <View style={{ width: "100%", height: 90, backgroundColor: "#1b5e35", alignItems: "center", justifyContent: "center" }}>
            {ad.provider?.logoUrl
              ? <Image source={{ uri: ad.provider.logoUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
              : <Text style={{ fontSize: 26 }}>🏢</Text>}
          </View>
        )}
        <View style={{ position: "absolute", top: 5, right: 5, backgroundColor: "rgba(255,255,255,0.85)", paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 8, fontWeight: "700", color: colors.gray400, letterSpacing: 0.5 }}>AD</Text>
        </View>
        <View style={{ padding: 10, gap: 3 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gray900, lineHeight: 17 }} numberOfLines={2}>{ad.title}</Text>
          {ad.body && <Text style={{ fontSize: 11, color: colors.gray500, lineHeight: 15 }} numberOfLines={2}>{ad.body}</Text>}
          <View style={{ marginTop: 6, backgroundColor: "#1b5e35", paddingVertical: 7, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#a8ffca", letterSpacing: 0.3 }}>Enquire</Text>
          </View>
        </View>
      </TouchableOpacity>

      <SpEnquiryModal ad={ad} visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function SpEnquiryModal({ ad, visible, onClose }: { ad: any; visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", additionalInfo: "", preferredDate: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleNext = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      Alert.alert("Missing Info", "Please fill in your name, phone and email.");
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await serviceProviderAdsAPI.submitEnquiry(ad._id, form);
      setSuccess(true);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setForm({ name: "", phone: "", email: "", location: "", additionalInfo: "", preferredDate: "" });
    setSuccess(false);
    onClose();
  };

  const inputStyle = { borderWidth: 1, borderColor: "#e5eae6", padding: 12, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fff", marginBottom: 12 };
  const labelStyle = { fontSize: 11, fontWeight: "700" as const, color: "#555", textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 6 };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5eae6" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#1a1a1a" }}>Enquiry</Text>
            <TouchableOpacity onPress={handleClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f6f7f8", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18, color: "#555" }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Ad preview */}
          {ad.imageUrl && <Image source={{ uri: ad.imageUrl }} style={{ width: "100%", height: 140 }} contentFit="cover" />}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f2f0" }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#1a1a1a" }}>{ad.title}</Text>
            {ad.body && <Text style={{ fontSize: 13, color: "#76889a", marginTop: 6, lineHeight: 18 }}>{ad.body}</Text>}
          </View>

          {success ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#16a34a", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 24 }}>✓</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 }}>Enquiry Submitted!</Text>
              <Text style={{ fontSize: 14, color: "#76889a", textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
                Thank you! We've received your enquiry and will review it shortly.
              </Text>
              <TouchableOpacity onPress={handleClose} style={{ backgroundColor: "#1b5e35", paddingVertical: 14, paddingHorizontal: 40 }}>
                <Text style={{ color: "#a8ffca", fontWeight: "700", fontSize: 14 }}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              {/* Step indicator */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                {["Your Details", "Request Info"].map((label, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i <= step ? "#1b5e35" : "#e5eae6", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: i <= step ? "#a8ffca" : "#76889a" }}>{i < step ? "✓" : String(i + 1)}</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: i === step ? "700" : "500", color: i === step ? "#1a1a1a" : "#76889a" }}>{label}</Text>
                    </View>
                    {i < 1 && <View style={{ flex: 1, height: 1, backgroundColor: i < step ? "#1b5e35" : "#e5eae6", marginHorizontal: 8 }} />}
                  </View>
                ))}
              </View>

              {step === 0 ? (
                <>
                  <Text style={labelStyle}>Full Name *</Text>
                  <TextInput style={inputStyle} value={form.name} onChangeText={v => set("name", v)} placeholder="e.g. John Smith" placeholderTextColor="#aaa" />
                  <Text style={labelStyle}>Phone Number *</Text>
                  <TextInput style={inputStyle} value={form.phone} onChangeText={v => set("phone", v)} placeholder="e.g. 0712 345 678" placeholderTextColor="#aaa" keyboardType="phone-pad" />
                  <Text style={labelStyle}>Email Address *</Text>
                  <TextInput style={inputStyle} value={form.email} onChangeText={v => set("email", v)} placeholder="you@example.com" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" />
                  <TouchableOpacity onPress={handleNext} style={{ backgroundColor: "#1b5e35", paddingVertical: 14, alignItems: "center", marginTop: 4 }}>
                    <Text style={{ color: "#a8ffca", fontWeight: "700", fontSize: 14 }}>Next →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={labelStyle}>Your Location</Text>
                  <TextInput style={inputStyle} value={form.location} onChangeText={v => set("location", v)} placeholder="e.g. Sandton, Johannesburg" placeholderTextColor="#aaa" />
                  <Text style={labelStyle}>Preferred Date</Text>
                  <TextInput style={inputStyle} value={form.preferredDate} onChangeText={v => set("preferredDate", v)} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" />
                  <Text style={labelStyle}>Additional Information</Text>
                  <TextInput style={[inputStyle, { height: 80, textAlignVertical: "top" }]} value={form.additionalInfo} onChangeText={v => set("additionalInfo", v)} placeholder="Describe what you need help with…" placeholderTextColor="#aaa" multiline />
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                    <TouchableOpacity onPress={() => setStep(0)} style={{ flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: "#e5eae6", alignItems: "center" }}>
                      <Text style={{ fontWeight: "600", color: "#555", fontSize: 14 }}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ flex: 2, paddingVertical: 14, backgroundColor: loading ? "#76889a" : "#1b5e35", alignItems: "center" }}>
                      <Text style={{ color: "#a8ffca", fontWeight: "700", fontSize: 14 }}>{loading ? "Submitting…" : "Submit Enquiry"}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
