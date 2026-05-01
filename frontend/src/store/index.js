import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { statsAPI } from '@/services/api';

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
      items: [], // Each item: { product, quantity, variant, laybye?: { plan, deposit, installment } }
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
          set({ items: [...items, { product, quantity, variant, laybye: null }] });
        }
        // Trigger cart badge bounce animation
        useUIStore.getState().triggerCartBounce();
        // Track add_to_cart event for stats
        try { statsAPI.trackEvent({ type: 'add_to_cart', productId: product._id, quantity, sessionId: sessionStorage.getItem('pesa_sid') || 'unknown' }); } catch(e) {}
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
        // Track remove_from_cart event for stats
        if (removed?.product?._id) {
          try { statsAPI.trackEvent({ type: 'remove_from_cart', productId: removed.product._id, sessionId: sessionStorage.getItem('pesa_sid') || 'unknown' }); } catch(e) {}
        }
      },
      // Per-item laybye management
      setItemLaybye: (index, laybyeData) => {
        // laybyeData: { plan, deposit, installment } or null to clear
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
      // Per-item recurring management
      setItemRecurring: (index, recurringData) => {
        // recurringData: { frequency, paymentMode, instances, recurringOrderId } or null to clear
        const newItems = [...get().items];
        if (newItems[index]) {
          newItems[index] = { ...newItems[index], recurring: recurringData };
          set({ items: newItems });
        }
      },
      clearItemRecurring: (index) => {
        const newItems = [...get().items];
        if (newItems[index]) {
          newItems[index] = { ...newItems[index], recurring: null };
          set({ items: newItems });
        }
      },
      clearCart: () => set({ items: [], giftCardCode: null, giftCardAmount: 0, giftCardBalance: 0 }),
      setGiftCard: (code, amount, balance) => set({ giftCardCode: code, giftCardAmount: amount, giftCardBalance: balance }),
      clearGiftCard: () => set({ giftCardCode: null, giftCardAmount: 0, giftCardBalance: 0 }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.salePrice || item.product.regularPrice;
          const instances = (item.recurring?.paymentMode === 'upfront' && item.recurring?.instances) ? item.recurring.instances : 1;
          return total + price * item.quantity * instances;
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
      // Helpers for checkout: separate cash vs laybye items
      getCashItems: () => get().items.filter(i => !i.laybye),
      getLaybyeItems: () => get().items.filter(i => !!i.laybye),
      getCashTotal: () => {
        return get().items.filter(i => !i.laybye).reduce((t, item) => {
          const price = item.product.salePrice || item.product.regularPrice;
          const instances = (item.recurring?.paymentMode === 'upfront' && item.recurring?.instances) ? item.recurring.instances : 1;
          return t + price * item.quantity * instances;
        }, 0);
      },
      getLaybyeDepositTotal: () => {
        return get().items.filter(i => !!i.laybye).reduce((t, item) => {
          return t + (item.laybye.deposit || 0) * item.quantity;
        }, 0);
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
  checkoutDrawerOpen: false,
  quickViewProduct: null,
  authModalOpen: false,
  authModalMode: 'login', // 'login', 'register', 'forgot', 'reset'
  cartBadgeBounce: false,
  
  triggerCartBounce: () => {
    set({ cartBadgeBounce: true });
    setTimeout(() => set({ cartBadgeBounce: false }), 600);
  },
  toggleCartSidebar: () => set((state) => ({ cartSidebarOpen: !state.cartSidebarOpen })),
  openCartSidebar: () => set({ cartSidebarOpen: true }),
  closeCartSidebar: () => set({ cartSidebarOpen: false }),
  
  openCheckoutDrawer: () => set({ checkoutDrawerOpen: true, cartSidebarOpen: false }),
  closeCheckoutDrawer: () => set({ checkoutDrawerOpen: false }),
  
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),
  
  openAuthModal: (mode = 'login') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setAuthModalMode: (mode) => set({ authModalMode: mode }),
}));

// Currency Store (base)
const _useCurrencyStoreBase = create(
  persist(
    (set, get) => ({
      currencies: [],
      selectedCurrency: null, // { code, symbol, exchangeRate, ... }
      baseCurrency: null,
      setCurrencies: (currencies) => {
        const base = currencies.find(c => c.isBaseCurrency) || currencies[0];
        const current = get().selectedCurrency;
        const selected = current && currencies.find(c => c.code === current.code)
          ? currencies.find(c => c.code === current.code)
          : (currencies[0] || base);
        set({ currencies, baseCurrency: base, selectedCurrency: selected });
      },
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
      convertFromBase: (amount) => {
        const selected = get().selectedCurrency;
        if (!selected || selected.isBaseCurrency || selected.exchangeRate === 1) return amount;
        return amount / selected.exchangeRate;
      },
      convertToBase: (amount) => {
        const selected = get().selectedCurrency;
        if (!selected || selected.isBaseCurrency || selected.exchangeRate === 1) return amount;
        return amount * selected.exchangeRate;
      },
      formatPrice: (amountInBase) => {
        const selected = get().selectedCurrency;
        if (!selected) return `R${(amountInBase || 0).toFixed(2)}`;
        const converted = (selected.isBaseCurrency || selected.exchangeRate === 1)
          ? amountInBase
          : amountInBase / selected.exchangeRate;
        const formatted = converted.toFixed(selected.decimalDigits || 2)
          .replace('.', selected.decimalSeparator || '.')
          .replace(/\B(?=(\d{3})+(?!\d))/g, selected.thousandSeparator || ',');
        return selected.symbolPosition === 'after' ? `${formatted}${selected.symbol}` : `${selected.symbol}${formatted}`;
      },
    }),
    { name: 'currency-storage' }
  )
);

// Wrapper hook — subscribes to selectedCurrency so components re-render on currency change.
// Components using `const { formatPrice } = useCurrencyStore()` will re-render when
// selectedCurrency changes, and formatPrice (which reads via get()) returns the new value.
export function useCurrencyStore(selectorFn) {
  // If a custom selector is passed, delegate to the base store
  if (typeof selectorFn === 'function') {
    return _useCurrencyStoreBase(selectorFn);
  }
  // Subscribe to selectedCurrency to force re-renders on currency change
  const selectedCurrency = _useCurrencyStoreBase(s => s.selectedCurrency);

  const convertFromBase = useCallback((amount) => {
    if (!selectedCurrency || selectedCurrency.isBaseCurrency || selectedCurrency.exchangeRate === 1) return amount;
    return amount / selectedCurrency.exchangeRate;
  }, [selectedCurrency]);

  const convertToBase = useCallback((amount) => {
    if (!selectedCurrency || selectedCurrency.isBaseCurrency || selectedCurrency.exchangeRate === 1) return amount;
    return amount * selectedCurrency.exchangeRate;
  }, [selectedCurrency]);

  const formatPrice = useCallback((amountInBase) => {
    if (!selectedCurrency) return `R${(amountInBase || 0).toFixed(2)}`;
    const converted = (selectedCurrency.isBaseCurrency || selectedCurrency.exchangeRate === 1)
      ? amountInBase
      : amountInBase / selectedCurrency.exchangeRate;
    const formatted = converted.toFixed(selectedCurrency.decimalDigits || 2)
      .replace('.', selectedCurrency.decimalSeparator || '.')
      .replace(/\B(?=(\d{3})+(?!\d))/g, selectedCurrency.thousandSeparator || ',');
    return selectedCurrency.symbolPosition === 'after' ? `${formatted}${selectedCurrency.symbol}` : `${selectedCurrency.symbol}${formatted}`;
  }, [selectedCurrency]);

  return {
    currencies: _useCurrencyStoreBase(s => s.currencies),
    selectedCurrency,
    baseCurrency: _useCurrencyStoreBase(s => s.baseCurrency),
    setCurrencies: _useCurrencyStoreBase(s => s.setCurrencies),
    setSelectedCurrency: _useCurrencyStoreBase(s => s.setSelectedCurrency),
    convertFromBase,
    convertToBase,
    formatPrice,
  };
}
// Expose .getState() and .subscribe() for non-React usage
useCurrencyStore.getState = _useCurrencyStoreBase.getState;
useCurrencyStore.subscribe = _useCurrencyStoreBase.subscribe;
useCurrencyStore.setState = _useCurrencyStoreBase.setState;

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
