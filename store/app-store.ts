import { create } from "zustand";
import type { Product, Order } from "@/lib/types";
import { getProducts, getOrderById } from "@/lib/db";

interface AppStore {
  products: Product[];
  featuredProducts: Product[];
  currentOrder: Order | null;

  loadingProducts: boolean;
  loadingFeatured: boolean;
  loadingOrder: boolean;

  fetchProducts: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  products: [],
  featuredProducts: [],
  currentOrder: null,

  // ✅ Fixed: start as false, pages set true when fetching
  loadingProducts: false,
  loadingFeatured: false,
  loadingOrder: false,

  fetchProducts: async () => {
    set({ loadingProducts: true });
    try {
      const data = await getProducts();
      set({ products: data });
    } catch (e) {
      console.error("fetchProducts:", e);
    } finally {
      set({ loadingProducts: false });
    }
  },

  fetchOrderById: async (id: string) => {
    set({ loadingOrder: true, currentOrder: null });
    try {
      const data = await getOrderById(id);
      set({ currentOrder: data });
    } catch (e) {
      console.error("fetchOrderById:", e);
    } finally {
      set({ loadingOrder: false });
    }
  },
}));
