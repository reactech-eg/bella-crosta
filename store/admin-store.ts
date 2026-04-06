"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Customer, Product, Order, RawMaterial } from "@/lib/types";
import { getAllCustomers, getAllRawMaterials } from "@/lib/db";
import {
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  updateProduct,
  createProduct,
  deleteProduct as softDeleteProduct,
  updateProductIngredients,
} from "@/lib/actions";
import type { ProductFormData } from "@/lib/types";
import { getAllProducts } from "@/app/actions/products";
import { getAllOrders, getOrderById } from "@/app/actions/orders";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoadingState {
  customers: boolean;
  products: boolean;
  orders: boolean;
  rawMaterials: boolean;
  currentOrder: boolean;
}

interface ErrorState {
  customers: string | null;
  products: string | null;
  orders: string | null;
  rawMaterials: string | null;
  currentOrder: string | null;
}

interface AdminStore {
  // Data
  customers: Customer[];
  products: Product[];
  orders: Order[];
  rawMaterials: RawMaterial[];
  currentAdminOrder: Order | null;

  // UI State
  loading: LoadingState;
  errors: ErrorState;

  // Customer actions
  fetchCustomers: () => Promise<void>;

  // Product actions
  fetchProducts: () => Promise<void>;
  addProduct: (
    data: ProductFormData,
  ) => Promise<{ success: boolean; error?: string }>;
  editProduct: (
    id: string,
    updates: Partial<Product>,
    ingredients?: Array<{ raw_material_id: string; quantity_needed: number }>,
  ) => Promise<{ success: boolean; error?: string }>;
  removeProduct: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Order actions
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;

  // Raw material actions
  fetchRawMaterials: () => Promise<void>;
  addRawMaterial: (
    data: Omit<RawMaterial, "id" | "created_at" | "updated_at">,
  ) => Promise<{ success: boolean; error?: string }>;
  editRawMaterial: (
    id: string,
    updates: Partial<Omit<RawMaterial, "id" | "created_at" | "updated_at">>,
  ) => Promise<{ success: boolean; error?: string }>;
  removeRawMaterial: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Helpers
  clearError: (key: keyof ErrorState) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminStore>()(
  devtools(
    (set, get) => ({
      // Initial data
      customers: [],
      products: [],
      orders: [],
      rawMaterials: [],
      currentAdminOrder: null,

      // All false on init — pages trigger their own fetches
      loading: {
        customers: false,
        products: false,
        orders: false,
        rawMaterials: false,
        currentOrder: false,
      },
      errors: {
        customers: null,
        products: null,
        orders: null,
        rawMaterials: null,
        currentOrder: null,
      },

      // ── Customers ──────────────────────────────────────────────
      fetchCustomers: async () => {
        set((s) => ({
          loading: { ...s.loading, customers: true },
          errors: { ...s.errors, customers: null },
        }));
        try {
          const data = await getAllCustomers();
          set((s) => ({
            customers: data,
            loading: { ...s.loading, customers: false },
          }));
        } catch {
          set((s) => ({
            loading: { ...s.loading, customers: false },
            errors: { ...s.errors, customers: "Failed to load customers." },
          }));
        }
      },

      // ── Products ───────────────────────────────────────────────
      fetchProducts: async () => {
        set((s) => ({
          loading: { ...s.loading, products: true },
          errors: { ...s.errors, products: null },
        }));
        try {
          const data = await getAllProducts();
          set((s) => ({
            products: data,
            loading: { ...s.loading, products: false },
          }));
        } catch {
          set((s) => ({
            loading: { ...s.loading, products: false },
            errors: { ...s.errors, products: "Failed to load products." },
          }));
        }
      },

      addProduct: async (formData) => {
        const result = await createProduct(formData);
        if (result.success) await get().fetchProducts();
        return result.success
          ? { success: true }
          : {
              success: false,
              error: (result as { success: false; error: string }).error,
            };
      },

      editProduct: async (id, updates, ingredients) => {
        const result = await updateProduct(id, updates);
        if (!result.success)
          return {
            success: false,
            error: (result as { success: false; error: string }).error,
          };

        if (ingredients !== undefined) {
          const ingResult = await updateProductIngredients(id, ingredients);
          if (!ingResult.success)
            return {
              success: false,
              error: (ingResult as { success: false; error: string }).error,
            };
        }

        await get().fetchProducts();
        return { success: true };
      },

      removeProduct: async (id) => {
        const result = await softDeleteProduct(id);
        if (result.success) {
          set((s) => ({
            products: s.products.map((p) =>
              p.id === id ? { ...p, is_available: false } : p,
            ),
          }));
        }
        return result.success
          ? { success: true }
          : {
              success: false,
              error: (result as { success: false; error: string }).error,
            };
      },

      // ── Orders ─────────────────────────────────────────────────
      fetchOrders: async () => {
        set((s) => ({
          loading: { ...s.loading, orders: true },
          errors: { ...s.errors, orders: null },
        }));
        try {
          const data = await getAllOrders();
          set((s) => ({
            orders: data,
            loading: { ...s.loading, orders: false },
          }));
        } catch {
          set((s) => ({
            loading: { ...s.loading, orders: false },
            errors: { ...s.errors, orders: "Failed to load orders." },
          }));
        }
      },

      fetchOrderById: async (id) => {
        set((s) => ({
          currentAdminOrder: null,
          loading: { ...s.loading, currentOrder: true },
          errors: { ...s.errors, currentOrder: null },
        }));
        try {
          const data = await getOrderById(id);
          set((s) => ({
            currentAdminOrder: data,
            loading: { ...s.loading, currentOrder: false },
            orders: data
              ? s.orders.some((o) => o.id === id)
                ? s.orders.map((o) => (o.id === id ? data : o))
                : [...s.orders, data]
              : s.orders,
          }));
        } catch {
          set((s) => ({
            loading: { ...s.loading, currentOrder: false },
            errors: { ...s.errors, currentOrder: "Failed to load order." },
          }));
        }
      },

      // ── Raw Materials ──────────────────────────────────────────
      fetchRawMaterials: async () => {
        set((s) => ({
          loading: { ...s.loading, rawMaterials: true },
          errors: { ...s.errors, rawMaterials: null },
        }));
        try {
          const data = await getAllRawMaterials();
          set((s) => ({
            rawMaterials: data,
            loading: { ...s.loading, rawMaterials: false },
          }));
        } catch {
          set((s) => ({
            loading: { ...s.loading, rawMaterials: false },
            errors: {
              ...s.errors,
              rawMaterials: "Failed to load raw materials.",
            },
          }));
        }
      },

      addRawMaterial: async (data) => {
        const result = await createRawMaterial(data);
        if (result.success) await get().fetchRawMaterials();
        return result.success
          ? { success: true }
          : {
              success: false,
              error: (result as { success: false; error: string }).error,
            };
      },

      editRawMaterial: async (id, updates) => {
        const result = await updateRawMaterial(id, updates);
        if (result.success) {
          set((s) => ({
            rawMaterials: s.rawMaterials.map((m) =>
              m.id === id ? { ...m, ...updates } : m,
            ),
          }));
        }
        return result.success
          ? { success: true }
          : {
              success: false,
              error: (result as { success: false; error: string }).error,
            };
      },

      removeRawMaterial: async (id) => {
        const result = await deleteRawMaterial(id);
        if (result.success) {
          set((s) => ({
            rawMaterials: s.rawMaterials.filter((m) => m.id !== id),
          }));
        }
        return result.success
          ? { success: true }
          : {
              success: false,
              error: (result as { success: false; error: string }).error,
            };
      },

      // ── Helpers ────────────────────────────────────────────────
      clearError: (key) => {
        set((s) => ({ errors: { ...s.errors, [key]: null } }));
      },
    }),
    { name: "admin-store" },
  ),
);
