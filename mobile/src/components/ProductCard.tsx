import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCurrencyStore, useWishlistStore, useCartStore, useUIStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";
import Toast from "react-native-toast-message";
import ProductBadges from "./ProductBadges";
import { useLaybyEligibility } from "@/hooks/useLaybyEligibility";

interface ProductCardProps {
  product: any;
  compact?: boolean;
}

export default function ProductCard({ product, compact }: ProductCardProps) {
  const router = useRouter();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const openCartSidebar = useUIStore((s) => s.openCartSidebar);

  const inWishlist = isInWishlist(product._id);
  const hasDiscount = product.salePrice && product.salePrice < product.regularPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : 0;
  const inStock = product.stock === undefined || product.stock > 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;
  const laybyEligible = useLaybyEligibility(product?._id);
  const hasLayby = laybyEligible === true;
  const categoryName = product.categories?.[0]?.name || product.category?.name || "";

  const imageUrl = resolveImageUrl(product.images?.[0]) || resolveImageUrl(product.image);

  const handlePress = () => {
    router.push(`/product/${product.slug || product._id}`);
  };

  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product._id);
      Toast.show({ type: "success", text1: "Removed from wishlist", visibilityTime: 1500 });
    } else {
      addToWishlist(product);
      Toast.show({ type: "success", text1: "Added to wishlist!", visibilityTime: 1500 });
    }
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, 1);
    openCartSidebar();
  };

  return (
    <Pressable onPress={handlePress} style={[s.card, compact && { width: 160 }]}>
      <View style={s.imageWrap}>
        <Image
          source={{ uri: imageUrl }}
          style={[s.image, compact ? { height: 144 } : { height: 176 }]}
          contentFit="cover"
          transition={200}
          placeholder={require("../../assets/placeholder.png")}
        />

        {/* Badges — top left */}
        <View style={s.badgeCol}>
          {hasDiscount && (
            <View style={s.badgeSale}>
              <Text style={s.badgeText}>SALE</Text>
            </View>
          )}
          {product.isNew && (
            <View style={s.badgeNew}>
              <Text style={s.badgeText}>NEW</Text>
            </View>
          )}
          {!inStock && (
            <View style={s.badgeOos}>
              <Text style={s.badgeText}>OUT OF STOCK</Text>
            </View>
          )}
          {hasDiscount && discountPercent > 0 && (
            <View style={s.badgeDiscount}>
              <Text style={s.badgeDiscountText}>{discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Layby badge */}
        {hasLayby && inStock && (
          <View style={s.laybyBadge}>
            <Text style={s.laybyBadgeText}>Layby Available</Text>
          </View>
        )}

        {/* Admin-configured badges */}
        <ProductBadges productId={product._id} displayContext="productCards" />

        {/* Wishlist button — top right */}
        <Pressable onPress={toggleWishlist} style={s.wishBtn}>
          <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={16} color={inWishlist ? colors.red500 : colors.gray700} />
        </Pressable>

        {/* Add to cart bar — bottom */}
        {inStock && (
          <Pressable onPress={handleAddToCart} style={s.cartBar}>
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={s.cartBarText}>Add to Cart</Text>
          </Pressable>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <View style={s.oosOverlay} />
        )}
      </View>

      {/* Content */}
      <View style={s.info}>
        {categoryName ? (
          <Text style={s.category} numberOfLines={1}>{categoryName}</Text>
        ) : null}
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>

        {(product.averageRating > 0 || product.rating > 0) && (
          <View style={s.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons key={star} name={star <= Math.round(product.averageRating || product.rating || 0) ? "star" : "star-outline"} size={10} color={colors.amber500} />
            ))}
            <Text style={s.ratingCount}>({product.reviewCount || 0})</Text>
          </View>
        )}

        <View style={s.priceRow}>
          <Text style={s.price}>{formatPrice(product.salePrice || product.regularPrice)}</Text>
          {hasDiscount && (
            <Text style={s.oldPrice}>{formatPrice(product.regularPrice)}</Text>
          )}
          {hasDiscount && discountPercent > 0 && (
            <Text style={s.discountLabel}>{discountPercent}% OFF</Text>
          )}
        </View>

        {/* Stock status */}
        {product.stock !== undefined && (
          <Text style={[s.stockText, !inStock ? s.stockOos : isLowStock ? s.stockLow : s.stockIn]}>
            {!inStock ? "Out of Stock" : isLowStock ? `Only ${product.stock} left!` : "In Stock"}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.white, borderRadius: 0, overflow: "hidden", borderWidth: 1, borderColor: colors.gray200, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  imageWrap: { position: "relative", overflow: "hidden" },
  image: { width: "100%" },
  badgeCol: { position: "absolute", top: 6, left: 6, gap: 4, zIndex: 10 },
  badgeSale: { backgroundColor: colors.red500, paddingHorizontal: 6, paddingVertical: 2 },
  badgeNew: { backgroundColor: colors.green500, paddingHorizontal: 6, paddingVertical: 2 },
  badgeOos: { backgroundColor: colors.gray500, paddingHorizontal: 6, paddingVertical: 2 },
  badgeDiscount: { backgroundColor: "#dc2626", paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  badgeDiscountText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  laybyBadge: { position: "absolute", bottom: 32, left: 6, backgroundColor: colors.amber500, paddingHorizontal: 6, paddingVertical: 2, zIndex: 10 },
  laybyBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  wishBtn: { position: "absolute", top: 6, right: 6, width: 30, height: 30, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2, zIndex: 10 },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 7, zIndex: 10 },
  cartBarText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  oosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  info: { padding: 10 },
  category: { fontSize: 9, color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  name: { fontSize: 13, fontWeight: "500", color: colors.gray900, marginBottom: 4, minHeight: 36, lineHeight: 18 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  ratingCount: { fontSize: 10, color: colors.gray400, marginLeft: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  price: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
  oldPrice: { fontSize: 11, color: colors.gray400, textDecorationLine: "line-through" },
  discountLabel: { fontSize: 9, color: "#dc2626", fontWeight: "600", backgroundColor: "#fef2f2", paddingHorizontal: 4, paddingVertical: 1 },
  stockText: { fontSize: 10, marginTop: 4 },
  stockIn: { color: colors.green600 },
  stockLow: { color: colors.amber500, fontWeight: "500" },
  stockOos: { color: colors.red600, fontWeight: "500" },
});
