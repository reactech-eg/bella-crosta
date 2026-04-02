import { create } from 'zustand';
import { Customer, Product, Order } from '@/lib/types';
import { getAllCustomers, getAllProducts, getAllOrders, getOrderById } from '@/lib/db';

interface AdminStore {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  currentAdminOrder: Order | null;
  
  loadingCustomers: boolean;
  loadingProducts: boolean;
  loadingOrders: boolean;
  
  fetchCustomers: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set) => ({
  customers: [],
  products: [],
  orders: [],
  currentAdminOrder: null,
  
  loadingCustomers: true,
  loadingProducts: true,
  loadingOrders: true,
  
  fetchCustomers: async () => {
    set({ loadingCustomers: true });
    const data = await getAllCustomers();
    set({ customers: data, loadingCustomers: false });
  },
  
  fetchProducts: async () => {
    set({ loadingProducts: true });
    const data = await getAllProducts();
    set({ products: data, loadingProducts: false });
  },
  
  fetchOrders: async () => {
    set({ loadingOrders: true });
    const data = await getAllOrders();
    set({ orders: data, loadingOrders: false });
  },
  
  fetchOrderById: async (id: string) => {
    set({ currentAdminOrder: null });
    const data = await getOrderById(id);
    if (!data) return;
    
    set((state) => {
      const existingIdx = state.orders.findIndex(o => o.id === id);
      if (existingIdx !== -1) {
        const newOrders = [...state.orders];
        newOrders[existingIdx] = data;
        return { orders: newOrders, currentAdminOrder: data };
      }
      return { orders: [...state.orders, data], currentAdminOrder: data };
    });
  }
}));
