import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Sync token to localStorage on rehydration so axios interceptor can read it
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
      },
    }
  )
);

// Cart Store (Client-side cart)
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      giftCardCode: null,
      giftCardAmount: 0,
      giftCardBalance: 0,
      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.product._id === product._id && JSON.stringify(item.variant) === JSON.stringify(variant)
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, quantity, variant }] });
        }
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
        set({ items: get().items.filter((_, i) => i !== index) });
      },
      clearCart: () => set({ items: [], giftCardCode: null, giftCardAmount: 0, giftCardBalance: 0 }),
      setGiftCard: (code, amount, balance) => set({ giftCardCode: code, giftCardAmount: amount, giftCardBalance: balance }),
      clearGiftCard: () => set({ giftCardCode: null, giftCardAmount: 0, giftCardBalance: 0 }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.salePrice || item.product.regularPrice;
          return total + price * item.quantity;
        }, 0);
      },
      getTotalAfterGiftCard: () => {
        const total = get().getTotal();
        const giftCardAmount = get().giftCardAmount || 0;
        return Math.max(0, total - giftCardAmount);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);

// Wishlist Store
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        if (!items.find((item) => item._id === product._id)) {
          set({ items: [...items, product] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item._id !== productId) });
      },
      isInWishlist: (productId) => {
        return get().items.some((item) => item._id === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'wishlist-storage' }
  )
);

// Compare Store
export const useCompareStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        if (items.length >= 4) {
          alert('You can only compare up to 4 products');
          return;
        }
        if (!items.find((item) => item._id === product._id)) {
          set({ items: [...items, product] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item._id !== productId) });
      },
      clearCompare: () => set({ items: [] }),
    }),
    { name: 'compare-storage' }
  )
);

// UI Store
export const useUIStore = create((set) => ({
  cartSidebarOpen: false,
  quickViewProduct: null,
  authModalOpen: false,
  authModalMode: 'login', // 'login', 'register', 'forgot', 'reset'
  
  toggleCartSidebar: () => set((state) => ({ cartSidebarOpen: !state.cartSidebarOpen })),
  openCartSidebar: () => set({ cartSidebarOpen: true }),
  closeCartSidebar: () => set({ cartSidebarOpen: false }),
  
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),
  
  openAuthModal: (mode = 'login') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setAuthModalMode: (mode) => set({ authModalMode: mode }),
}));

// Currency Store
export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currencies: [],
      selectedCurrency: null, // { code, symbol, exchangeRate, ... }
      baseCurrency: null,
      setCurrencies: (currencies) => {
        const base = currencies.find(c => c.isBaseCurrency) || currencies.find(c => c.code === 'ZAR') || currencies[0];
        const current = get().selectedCurrency;
        // Keep selected if still valid, otherwise default to base
        const selected = current && currencies.find(c => c.code === current.code) ? currencies.find(c => c.code === current.code) : base;
        set({ currencies, baseCurrency: base, selectedCurrency: selected });
      },
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
      // Convert ZAR amount to selected currency
      convertFromZAR: (amountInZAR) => {
        const selected = get().selectedCurrency;
        if (!selected || selected.code === 'ZAR') return amountInZAR;
        return amountInZAR / selected.exchangeRate;
      },
      // Format amount in selected currency
      formatPrice: (amountInZAR) => {
        const selected = get().selectedCurrency;
        if (!selected) return `R${(amountInZAR || 0).toFixed(2)}`;
        const converted = selected.code === 'ZAR' ? amountInZAR : amountInZAR / selected.exchangeRate;
        const formatted = converted.toFixed(selected.decimalDigits || 2)
          .replace('.', selected.decimalSeparator || '.')
          .replace(/\B(?=(\d{3})+(?!\d))/g, selected.thousandSeparator || ',');
        return selected.symbolPosition === 'after' ? `${formatted}${selected.symbol}` : `${selected.symbol}${formatted}`;
      },
    }),
    { name: 'currency-storage' }
  )
);

// Recently Viewed Store
export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const products = get().products;
        const filtered = products.filter((p) => p._id !== product._id);
        set({ products: [product, ...filtered].slice(0, 10) });
      },
    }),
    { name: 'recently-viewed' }
  )
);
