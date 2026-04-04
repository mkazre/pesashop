import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '@/utils/tokenStorage';
import { statsAPI } from '@/services/api';

// ─── Auth Store ──────────────────────────────────────────────────
interface User {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  addresses?: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: async (user, token) => {
    await tokenStorage.set(token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  clearAuth: async () => {
    await tokenStorage.remove();
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  hydrate: async () => {
    try {
      const token = await tokenStorage.get();
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

// ─── Cart Store ──────────────────────────────────────────────────
interface CartItem {
  product: any;
  quantity: number;
  variant: any;
  laybye: any;
}

interface CartState {
  items: CartItem[];
  giftCardCode: string | null;
  giftCardAmount: number;
  giftCardBalance: number;
  addItem: (product: any, quantity?: number, variant?: any, isLaybye?: boolean) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  setItemLaybye: (index: number, laybyeData: any) => void;
  clearItemLaybye: (index: number) => void;
  clearCart: () => void;
  setGiftCard: (code: string, amount: number, balance: number) => void;
  clearGiftCard: () => void;
  getTotal: () => number;
  getTotalAfterGiftCard: () => number;
  getItemCount: () => number;
  getCashItems: () => CartItem[];
  getLaybyeItems: () => CartItem[];
  getCashTotal: () => number;
  getLaybyeDepositTotal: () => number;
  getCheckoutTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      giftCardCode: null,
      giftCardAmount: 0,
      giftCardBalance: 0,
      addItem: (product, quantity = 1, variant = null, isLaybye = false) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.product._id === product._id &&
            JSON.stringify(item.variant) === JSON.stringify(variant) &&
            !!item.laybye === isLaybye
        );
        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({
            items: [...items, { product, quantity, variant, laybye: null }],
          });
        }
        useUIStore.getState().triggerCartBounce();
        try {
          statsAPI.trackEvent({
            type: 'add_to_cart',
            productId: product._id,
            quantity,
            sessionId: 'mobile',
          });
        } catch {}
      },
      updateQuantity: (index, quantity) => {
        const items = get().items;
        if (quantity <= 0) {
          set({ items: items.filter((_, i) => i !== index) });
        } else {
          const newItems = [...items];
          newItems[index].quantity = quantity;
          set({ items: newItems });
        }
      },
      removeItem: (index) => {
        const removed = get().items[index];
        set({ items: get().items.filter((_, i) => i !== index) });
        if (removed?.product?._id) {
          try {
            statsAPI.trackEvent({
              type: 'remove_from_cart',
              productId: removed.product._id,
              sessionId: 'mobile',
            });
          } catch {}
        }
      },
      setItemLaybye: (index, laybyeData) => {
        const newItems = [...get().items];
        if (newItems[index]) {
          newItems[index] = { ...newItems[index], laybye: laybyeData };
          set({ items: newItems });
        }
      },
      clearItemLaybye: (index) => {
        const newItems = [...get().items];
        if (newItems[index]) {
          newItems[index] = { ...newItems[index], laybye: null };
          set({ items: newItems });
        }
      },
      clearCart: () =>
        set({
          items: [],
          giftCardCode: null,
          giftCardAmount: 0,
          giftCardBalance: 0,
        }),
      setGiftCard: (code, amount, balance) =>
        set({
          giftCardCode: code,
          giftCardAmount: amount,
          giftCardBalance: balance,
        }),
      clearGiftCard: () =>
        set({ giftCardCode: null, giftCardAmount: 0, giftCardBalance: 0 }),
      getTotal: () =>
        get().items.reduce((total, item) => {
          const price = item.product.salePrice || item.product.regularPrice;
          return total + price * item.quantity;
        }, 0),
      getTotalAfterGiftCard: () => {
        const total = get().getTotal();
        const giftCardAmount = get().giftCardAmount || 0;
        return Math.max(0, total - giftCardAmount);
      },
      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
      getCashItems: () => get().items.filter((i) => !i.laybye),
      getLaybyeItems: () => get().items.filter((i) => !!i.laybye),
      getCashTotal: () =>
        get()
          .items.filter((i) => !i.laybye)
          .reduce((t, item) => {
            const price = item.product.salePrice || item.product.regularPrice;
            return t + price * item.quantity;
          }, 0),
      getLaybyeDepositTotal: () =>
        get()
          .items.filter((i) => !!i.laybye)
          .reduce((t, item) => t + (item.laybye.deposit || 0) * item.quantity, 0),
      getCheckoutTotal: () => get().getCashTotal() + get().getLaybyeDepositTotal(),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Wishlist Store ──────────────────────────────────────────────
interface WishlistState {
  items: any[];
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        if (!items.find((item: any) => item._id === product._id)) {
          set({ items: [...items, product] });
        }
      },
      removeItem: (productId) => {
        set({
          items: get().items.filter((item: any) => item._id !== productId),
        });
      },
      isInWishlist: (productId) =>
        get().items.some((item: any) => item._id === productId),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── UI Store ────────────────────────────────────────────────────
interface UIState {
  cartBadgeBounce: boolean;
  searchOpen: boolean;
  cartSidebarOpen: boolean;
  checkoutDrawerOpen: boolean;
  checkoutDrawerProduct: any;
  checkoutDrawerQuantity: number;
  checkoutDrawerVariant: any;
  checkoutDrawerLaybye: any;
  triggerCartBounce: () => void;
  setSearchOpen: (open: boolean) => void;
  openCartSidebar: () => void;
  closeCartSidebar: () => void;
  openCheckoutDrawer: (product?: any, quantity?: number, variant?: any, laybye?: any) => void;
  closeCheckoutDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartBadgeBounce: false,
  searchOpen: false,
  cartSidebarOpen: false,
  checkoutDrawerOpen: false,
  checkoutDrawerProduct: null,
  checkoutDrawerQuantity: 1,
  checkoutDrawerVariant: null,
  checkoutDrawerLaybye: null,
  triggerCartBounce: () => {
    set({ cartBadgeBounce: true });
    setTimeout(() => set({ cartBadgeBounce: false }), 600);
  },
  setSearchOpen: (open) => set({ searchOpen: open }),
  openCartSidebar: () => set({ cartSidebarOpen: true }),
  closeCartSidebar: () => set({ cartSidebarOpen: false }),
  openCheckoutDrawer: (product, quantity, variant, laybye) =>
    set({
      checkoutDrawerOpen: true,
      cartSidebarOpen: false,
      checkoutDrawerProduct: product || null,
      checkoutDrawerQuantity: quantity || 1,
      checkoutDrawerVariant: variant || null,
      checkoutDrawerLaybye: laybye || null,
    }),
  closeCheckoutDrawer: () =>
    set({
      checkoutDrawerOpen: false,
      checkoutDrawerProduct: null,
      checkoutDrawerQuantity: 1,
      checkoutDrawerVariant: null,
      checkoutDrawerLaybye: null,
    }),
}));

// ─── Currency Store ──────────────────────────────────────────────
interface Currency {
  _id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
  isBaseCurrency?: boolean;
  decimalDigits?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  symbolPosition?: string;
  showInFrontend?: boolean;
  sortOrder?: number;
}

interface CurrencyState {
  currencies: Currency[];
  selectedCurrency: Currency | null;
  baseCurrency: Currency | null;
  setCurrencies: (currencies: Currency[]) => void;
  setSelectedCurrency: (currency: Currency) => void;
  convertFromBase: (amount: number) => number;
  formatPrice: (amountInBase: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currencies: [],
      selectedCurrency: null,
      baseCurrency: null,
      setCurrencies: (currencies) => {
        const base =
          currencies.find((c) => c.isBaseCurrency) || currencies[0];
        const current = get().selectedCurrency;
        const selected =
          current && currencies.find((c) => c.code === current.code)
            ? currencies.find((c) => c.code === current.code)!
            : currencies[0] || base;
        set({ currencies, baseCurrency: base, selectedCurrency: selected });
      },
      setSelectedCurrency: (currency) =>
        set({ selectedCurrency: currency }),
      convertFromBase: (amount) => {
        const selected = get().selectedCurrency;
        if (
          !selected ||
          selected.isBaseCurrency ||
          selected.exchangeRate === 1
        )
          return amount;
        return amount / selected.exchangeRate;
      },
      formatPrice: (amountInBase) => {
        const selected = get().selectedCurrency;
        if (!selected) return `R${(amountInBase || 0).toFixed(2)}`;
        const converted =
          selected.isBaseCurrency || selected.exchangeRate === 1
            ? amountInBase
            : amountInBase / selected.exchangeRate;
        const formatted = converted
          .toFixed(selected.decimalDigits || 2)
          .replace('.', selected.decimalSeparator || '.')
          .replace(/\B(?=(\d{3})+(?!\d))/g, selected.thousandSeparator || ',');
        return selected.symbolPosition === 'after'
          ? `${formatted}${selected.symbol}`
          : `${selected.symbol}${formatted}`;
      },
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Recently Viewed Store ───────────────────────────────────────
interface RecentlyViewedState {
  products: any[];
  addProduct: (product: any) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const products = get().products;
        const filtered = products.filter((p: any) => p._id !== product._id);
        set({ products: [product, ...filtered].slice(0, 10) });
      },
    }),
    {
      name: 'recently-viewed',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Compare Store ───────────────────────────────────────────────
interface CompareState {
  products: any[];
  addProduct: (product: any) => void;
  removeProduct: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearAll: () => void;
}

export const useCompareStore = create<CompareState>()((set, get) => ({
  products: [],
  addProduct: (product) => {
    const products = get().products;
    if (products.find((p) => p._id === product._id)) return;
    if (products.length >= 4) return; // max 4 for compare
    set({ products: [...products, product] });
  },
  removeProduct: (id) =>
    set({ products: get().products.filter((p) => p._id !== id) }),
  isInCompare: (id) => get().products.some((p) => p._id === id),
  clearAll: () => set({ products: [] }),
}));
