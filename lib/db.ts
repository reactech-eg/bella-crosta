"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin-client";
import type {
  Customer,
  Order,
  OrderItem,
  Payment,
  Product,
  RawMaterial,
  ProductIngredient,
} from "./types";

async function getDB() {
  return await createClient();
}

// Use admin client for operations that need to bypass RLS
function getAdminDB() {
  return createAdminClient();
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  if (error) { console.error("getProducts:", error.message); return []; }
  return data ?? [];
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  if (error) { console.error("getProductsByCategory:", error.message); return []; }
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
  if (error) { console.error("getFeaturedProducts:", error.message); return []; }
  return data ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("products")
    .select(`*, product_ingredients(*, raw_materials(*))`)
    .eq("id", id)
    .single();
  if (error) { console.error("getProductById:", error.message); return null; }
  return data;
}

export async function getAllProducts(): Promise<Product[]> {
  // Admin: get ALL products including unavailable ones
  const db = getAdminDB();
  const { data, error } = await db
    .from("products")
    .select(`*, product_ingredients(*, raw_materials(*))`)
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllProducts:", error.message); return []; }
  return data ?? [];
}

// ─── Raw Materials ─────────────────────────────────────────────────────────────

export async function getAllRawMaterials(): Promise<RawMaterial[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("raw_materials")
    .select("*")
    .order("name", { ascending: true });
  if (error) { console.error("getAllRawMaterials:", error.message); return []; }
  return data ?? [];
}

export async function getRawMaterialById(id: string): Promise<RawMaterial | null> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("raw_materials")
    .select("*")
    .eq("id", id)
    .single();
  if (error) { console.error("getRawMaterialById:", error.message); return null; }
  return data;
}

export async function getProductIngredients(productId: string): Promise<ProductIngredient[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("product_ingredients")
    .select(`*, raw_materials(*)`)
    .eq("product_id", productId);
  if (error) { console.error("getProductIngredients:", error.message); return []; }
  return data ?? [];
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function mapOrder(data: Record<string, unknown>): Order {
  const payment = (data.payments as Payment[] | undefined)?.[0];
  const items = ((data.order_items as OrderItem[]) ?? []).map((item) => ({
    ...item,
    product_name: item.product_name || "Unknown Product",
  }));
  return {
    ...(data as unknown as Order),
    order_items: items,
    payment_method: payment?.payment_method ?? (data.payment_method as Order["payment_method"]) ?? "instapay",
    payment_proof_url: payment?.proof_image_url ?? (data.payment_proof_url as string | null) ?? null,
  };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("orders")
    .select(`*, order_items(*), customers(*), payments(*)`)
    .eq("id", orderId)
    .single();
  if (error) { console.error("getOrderById:", error.message); return null; }
  return mapOrder(data);
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const db = await getDB();
  const { data, error } = await db
    .from("orders")
    .select(`*, order_items(*), payments(*)`)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) { console.error("getCustomerOrders:", error.message); return []; }
  return (data ?? []).map(mapOrder);
}

export async function getAllOrders(): Promise<Order[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("orders")
    .select(`*, order_items(*), customers(*), payments(*)`)
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllOrders:", error.message); return []; }
  return (data ?? []).map(mapOrder);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<Customer[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllCustomers:", error.message); return []; }
  return data ?? [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) { console.error("getCustomerById:", error.message); return null; }
  return data;
}

export async function getLowStockProducts(threshold = 10): Promise<Product[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("products")
    .select("*")
    .lte("stock_qty", threshold)
    .eq("is_available", true)
    .order("stock_qty", { ascending: true });
  if (error) { console.error("getLowStockProducts:", error.message); return []; }
  return data ?? [];
}

export async function getLowStockRawMaterials(): Promise<RawMaterial[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("raw_materials")
    .select("*")
    .order("stock_qty", { ascending: true });
  if (error) { console.error("getLowStockRawMaterials:", error.message); return []; }
  // Filter where stock_qty <= low_threshold
  return (data ?? []).filter((m) => m.stock_qty <= m.low_threshold);
}