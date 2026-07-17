import { createContext, useContext } from "react";
import { Animated } from "react-native";

// Provided by the app-page screen's outer ScrollView so a handful of blocks
// (Reading Progress Bar, Back to Top) can react to page scroll position
// without every block needing its own scroll listener. Optional — a block
// using this falls back to a no-op/hidden state if no provider is present.
interface PageScrollContextValue {
  scrollY: Animated.Value;
  contentHeight: number;
  layoutHeight: number;
  scrollToTop: () => void;
}

export const PageScrollContext = createContext<PageScrollContextValue | null>(null);
export const usePageScroll = () => useContext(PageScrollContext);
