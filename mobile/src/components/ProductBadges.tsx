import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { badgesAPI } from "@/services/api";
import { resolveImageUrl } from "@/theme";

interface ProductBadgesProps {
  productId: string;
  displayContext?: "productCards" | "productPages";
}

interface Badge {
  _id: string;
  name: string;
  style: {
    badgeType: "text" | "image" | "html";
    text?: string;
    textColor?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontWeight?: string;
    textTransform?: string;
    imageUrl?: string;
    imageWidth?: string;
    imageHeight?: string;
    position?: string;
    borderRadius?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    shape?: string;
    useGradient?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
    opacity?: string;
  };
  displayOn?: {
    productCards?: boolean;
    productPages?: boolean;
  };
  priority?: number;
}

// Simple cache to avoid re-fetching badges for the same product
const badgeCache: Record<string, { badges: Badge[]; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute

export default function ProductBadges({ productId, displayContext = "productCards" }: ProductBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!productId) return;

    // Check cache
    const cached = badgeCache[productId];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setBadges(cached.badges);
      return;
    }

    let cancelled = false;
    badgesAPI.evaluateProduct(productId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || [];
        // Filter by displayContext
        const filtered = data.filter((b: Badge) => {
          if (!b.displayOn) return true;
          return b.displayOn[displayContext] !== false;
        });
        badgeCache[productId] = { badges: filtered, timestamp: Date.now() };
        setBadges(filtered);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [productId, displayContext]);

  if (badges.length === 0) return null;

  return (
    <>
      {badges.map((badge) => {
        const s = badge.style || {};
        const pos = getPositionStyle(s.position || "top-right");

        if (s.badgeType === "image" && s.imageUrl) {
          const imgW = parsePx(s.imageWidth, 48);
          const imgH = parsePx(s.imageHeight, imgW);
          return (
            <View key={badge._id} style={[bs.badgeWrap, pos, getMarginStyle(s)]}>
              <Image
                source={{ uri: resolveImageUrl(s.imageUrl) }}
                style={{ width: imgW, height: imgH }}
                contentFit="contain"
              />
            </View>
          );
        }

        // Text badge
        const bgColor = s.backgroundColor || "#ef4444";
        const txtColor = s.textColor || "#ffffff";
        const borderRadius = parsePx(s.borderRadius, 4);
        const padT = parsePx(s.paddingTop, 3);
        const padR = parsePx(s.paddingRight, 8);
        const padB = parsePx(s.paddingBottom, 3);
        const padL = parsePx(s.paddingLeft, 8);
        const fontSize = parsePx(s.fontSize, 10);

        return (
          <View
            key={badge._id}
            style={[
              bs.badgeWrap,
              pos,
              getMarginStyle(s),
              {
                backgroundColor: bgColor,
                borderRadius,
                paddingTop: padT,
                paddingRight: padR,
                paddingBottom: padB,
                paddingLeft: padL,
                opacity: s.opacity ? parseFloat(s.opacity) : 1,
              },
            ]}
          >
            <Text
              style={{
                color: txtColor,
                fontSize,
                fontWeight: (s.fontWeight as any) || "700",
                textTransform: (s.textTransform as any) || "uppercase",
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {s.text || badge.name}
            </Text>
          </View>
        );
      })}
    </>
  );
}

function parsePx(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

function getPositionStyle(position: string) {
  switch (position) {
    case "top-left": return { top: 0, left: 0 } as const;
    case "top-center": return { top: 0, alignSelf: "center" as const } as const;
    case "top-right": return { top: 0, right: 0 } as const;
    case "middle-left": return { top: "40%" as any, left: 0 } as const;
    case "middle-center": return { top: "40%" as any, alignSelf: "center" as const } as const;
    case "middle-right": return { top: "40%" as any, right: 0 } as const;
    case "bottom-left": return { bottom: 0, left: 0 } as const;
    case "bottom-center": return { bottom: 0, alignSelf: "center" as const } as const;
    case "bottom-right": return { bottom: 0, right: 0 } as const;
    default: return { top: 0, right: 0 } as const;
  }
}

function getMarginStyle(s: any) {
  return {
    marginTop: parsePx(s.marginTop, 6),
    marginRight: parsePx(s.marginRight, 6),
    marginBottom: parsePx(s.marginBottom, 0),
    marginLeft: parsePx(s.marginLeft, 0),
  };
}

const bs = StyleSheet.create({
  badgeWrap: {
    position: "absolute",
    zIndex: 20,
  },
});
