import { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import BlockWrapper from "./BlockWrapper";
import ProductCard from "@/components/ProductCard";
import { useBlockProducts } from "./useBlockProducts";
import { colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

export default function ProductCarouselTabs({ block }: { block: any }) {
  const tabs = block.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const currentTab = tabs[activeTab] || tabs[0] || { source: "featured" };
  const tabActiveColor = block.tabActiveColor || block.primaryColor || colors.primary;

  const { data: products, isLoading } = useBlockProducts(currentTab.source, {
    categoryId: currentTab.categoryId,
    limit: block.productLimit || 10,
  });

  return (
    <BlockWrapper block={block}>
      {tabs.length > 1 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ gap: 8, marginBottom: 14 }}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setActiveTab(index)}
              style={[
                s.tab,
                {
                  backgroundColor:
                    index === activeTab ? tabActiveColor : colors.gray100,
                },
              ]}
            >
              <Text
                style={[
                  s.tabText,
                  {
                    color: index === activeTab ? "#fff" : colors.gray600,
                  },
                ]}
              >
                {item.label || "Tab"}
              </Text>
            </Pressable>
          )}
        />
      ) : null}

      {isLoading ? (
        <View style={s.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : products.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={products}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <ProductCard product={item} compact />
            </View>
          )}
        />
      ) : (
        <Text style={s.empty}>No products found</Text>
      )}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingRow: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    textAlign: "center",
    color: colors.gray400,
    paddingVertical: 32,
  },
});
