import { create } from 'zustand';
import { Product, Order } from '@/lib/types';
import { getProducts, getFeaturedProducts, getOrderById } from '@/lib/db';

interface AppStore {
  products: Product[];
  featuredProducts: Product[];
  currentOrder: Order | null;
  
  loadingProducts: boolean;
  loadingFeatured: boolean;
  loadingOrder: boolean;
  
  fetchProducts: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  products: [],
  featuredProducts: [],
  currentOrder: null,
  
  loadingProducts: true,
  loadingFeatured: true,
  loadingOrder: true,
  
  fetchProducts: async () => {
    set({ loadingProducts: true });
    const data = await getProducts();
    set({ products: data, loadingProducts: false });
  },
  
  fetchFeaturedProducts: async () => {
    set({ loadingFeatured: true });
    const data = await getFeaturedProducts();
    set({ featuredProducts: data, loadingFeatured: false });
  },
  
  fetchOrderById: async (id: string) => {
    set({ loadingOrder: true, currentOrder: null });
    const data = await getOrderById(id);
    set({ currentOrder: data, loadingOrder: false });
  }
}));
