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
import LaybyeApplicationModal from "@/components/LaybyeApplicationModal";
import ProductBadges from "@/components/ProductBadges";
import WriteReview from "@/components/WriteReview";
import ProductQA from "@/components/ProductQA";
import ProductAIAssistant from "@/components/ProductAIAssistant";
import ProductRecommendations from "@/components/ProductRecommendations";
import BottomTabBar from "@/components/BottomTabBar";
import PulsingArrows from "@/components/PulsingArrows";
import { colors, resolveImageUrl } from "@/theme";
import {
  productsAPI,
  reviewsAPI,
  statsAPI,
  productPageSettingsAPI,
  loyaltyAPI,
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
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pageSettings, setPageSettings] = useState<any>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [laybyeSelection, setLaybyeSelection] = useState<any>(null);
  const [laybyeModalVisible, setLaybyeModalVisible] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const addToCart = useCartStore((s) => s.addItem);
  const setItemLaybye = useCartStore((s) => s.setItemLaybye);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const { openCartSidebar, openCheckoutDrawer } = useUIStore();
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getOne(slug!);
        const p = res.data?.data || res.data;
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
        Toast.show({ type: "error", text1: "Product not found" });
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

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

  if (loading || !product) return <LoadingSpinner fullScreen />;

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
    Toast.show({ type: "success", text1: "Added to cart", text2: `${product.name} x${quantity}`, visibilityTime: 2000 });
    openCartSidebar();
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
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={handleShare} style={ps.floatBtn}>
            <Ionicons name="share-outline" size={20} color={colors.gray800} />
          </Pressable>
          <Pressable onPress={() => inWishlist ? removeFromWishlist(product._id) : addToWishlist(product)} style={ps.floatBtn}>
            <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={20} color={inWishlist ? colors.red500 : colors.gray800} />
          </Pressable>
        </View>
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
          </View>

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
        </View>

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
                        product.specifications?.length > 0 ? (
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
});
