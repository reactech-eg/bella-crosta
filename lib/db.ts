"use server";

import { createClient } from "@/utils/supabase/server";
import { Customer, Order, OrderItem, Product } from "./types";

async function getDB() {
  return await createClient();
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProducts:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProductsByCategory:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("getFeaturedProducts:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getProductById:", error.message);
    return null;
  }
  return data;
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllProducts:", error.message);
    return [];
  }
  return data ?? [];
}

// Helper to map DB order structure with payments relation to the Order interface
function mapOrder(data: Order): Order | null {
  if (!data) return null;
  const payment = data.payments?.[0];
  const items = data.order_items?.map((item: OrderItem) => ({
    ...item,
    product_name: item.product_name || "Unknown Product",
  }));
  return {
    ...data,
    order_items: items,
    payment_method: payment?.payment_method ?? "instapay",
    payment_proof_url: payment?.proof_image_url ?? null,
  };
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("orders")
    .select(
      `
      *,
      order_items(*, products(name)),
      customers(*),
      payments(*)
    `,
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("getOrderById:", error.message);
    return null;
  }
  return mapOrder(data);
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("orders")
    .select(
      `
      *,
      order_items(*, products(name)),
      payments(*)
    `,
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCustomerOrders:", error.message);
    return [];
  }
  return (data ?? []).map(mapOrder) as Order[];
}

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("orders")
    .select(
      `
      *,
      order_items(*, products(name)),
      customers(*),
      payments(*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllOrders:", error.message);
    return [];
  }
  return (data ?? []).map(mapOrder) as Order[];
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllCustomers:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getCustomerById:", error.message);
    return null;
  }
  return data;
}

export async function getLowStockProducts(threshold = 10): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .lte("stock_qty", threshold)
    .eq("is_available", true)
    .order("stock_qty", { ascending: true });

  if (error) {
    console.error("getLowStockProducts:", error.message);
    return [];
  }
  return data ?? [];
}
