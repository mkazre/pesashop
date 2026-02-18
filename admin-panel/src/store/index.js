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
      
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// UI Store
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modal state
  modals: {},
  openModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: true }
  })),
  closeModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: false }
  })),
}));

// Cart Store (for creating orders)
export const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existingItem = items.find(item => item.product._id === product._id);
    
    if (existingItem) {
      set({
        items: items.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      });
    } else {
      set({ items: [...items, { product, quantity }] });
    }
  },
  
  updateQuantity: (productId, quantity) => {
    set({
      items: get().items.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    });
  },
  
  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.product._id !== productId) });
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotal: () => {
    return get().items.reduce((total, item) => {
      const price = item.product.salePrice || item.product.basePrice;
      return total + (price * item.quantity);
    }, 0);
  },
}));

// Settings Store
export const useSettingsStore = create(
  persist(
    (set) => ({
      currency: 'ZAR',
      dateFormat: 'dd/MM/yyyy',
      timeZone: 'Africa/Johannesburg',
      
      setCurrency: (currency) => set({ currency }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setTimeZone: (tz) => set({ timeZone: tz }),
    }),
    {
      name: 'settings-storage',
    }
  )
);

// Page Builder Store
export const usePageBuilderStore = create((set, get) => ({
  currentPage: null,
  sections: [],
  selectedElement: null,
  history: [],
  historyIndex: -1,
  
  setCurrentPage: (page) => set({ currentPage: page, sections: page?.structure?.sections || [] }),
  
  setSections: (sections) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(sections);
    set({ sections, history: newHistory, historyIndex: newHistory.length - 1 });
  },
  
  addSection: (section) => {
    const sections = [...get().sections, section];
    get().setSections(sections);
  },
  
  updateSection: (sectionId, updates) => {
    const sections = get().sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    get().setSections(sections);
  },
  
  deleteSection: (sectionId) => {
    const sections = get().sections.filter(section => section.id !== sectionId);
    get().setSections(sections);
  },
  
  reorderSections: (startIndex, endIndex) => {
    const sections = Array.from(get().sections);
    const [removed] = sections.splice(startIndex, 1);
    sections.splice(endIndex, 0, removed);
    get().setSections(sections);
  },
  
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({ 
        sections: history[historyIndex - 1],
        historyIndex: historyIndex - 1
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ 
        sections: history[historyIndex + 1],
        historyIndex: historyIndex + 1
      });
    }
  },
  
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));
