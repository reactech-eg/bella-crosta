"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin-client";
import type {
  Customer,
  Order,
  Product,
  RawMaterial,
  ProductIngredient,
} from "./types";
import { mapOrder } from "@/app/actions/orders";

async function getDB() {
  return await createClient();
}

// Use admin client for operations that need to bypass RLS
function getAdminDB() {
  return createAdminClient();
}
// ─── Raw Materials ─────────────────────────────────────────────────────────────

export async function getAllRawMaterials(): Promise<RawMaterial[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("raw_materials")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    console.error("getAllRawMaterials:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getRawMaterialById(
  id: string,
): Promise<RawMaterial | null> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("raw_materials")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("getRawMaterialById:", error.message);
    return null;
  }
  return data;
}

export async function getProductIngredients(
  productId: string,
): Promise<ProductIngredient[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("product_ingredients")
    .select(`*, raw_materials(*)`)
    .eq("product_id", productId);
  if (error) {
    console.error("getProductIngredients:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = await getDB();
  const { data, error } = await db
    .from("orders")
    .select(`*, order_items(*), customers(*), payments(*)`)
    .eq("id", orderId)
    .single();
  if (error) {
    console.error("getOrderById:", error.message);
    return null;
  }
  return mapOrder(data);
}

export async function getAllOrders(): Promise<Order[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("orders")
    .select(`*, order_items(*), customers(*), payments(*)`)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllOrders:", error.message);
    return [];
  }
  const orders = Promise.all((data ?? []).map(mapOrder));
  return orders;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<Customer[]> {
  const db = getAdminDB();
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
  const db = getAdminDB();
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

export async function getLowStockRawMaterials(): Promise<RawMaterial[]> {
  const db = getAdminDB();
  const { data, error } = await db
    .from("raw_materials")
    .select("*")
    .order("stock_qty", { ascending: true });
  if (error) {
    console.error("getLowStockRawMaterials:", error.message);
    return [];
  }
  // Filter where stock_qty <= low_threshold
  return (data ?? []).filter((m) => m.stock_qty <= m.low_threshold);
}

// ─── Product Stats ────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const db = getAdminDB();
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

export async function getProductStats() {
  const db = getAdminDB();
  const { data: products, error: productsError } = await db
    .from("products")
    .select("*");

  if (productsError) {
    console.error("getProductStats:", productsError.message);
    return null;
  }

  const productList = products ?? [];

  // Get order items to calculate sales data
  const { data: orderItems, error: orderItemsError } = await db
    .from("order_items")
    .select("*, orders(status, payment_status)");

  if (orderItemsError) {
    console.error("getProductStats (order items):", orderItemsError.message);
    return null;
  }

  const items = orderItems ?? [];

  // Calculate stats
  const totalProducts = productList.length;
  const availableProducts = productList.filter((p) => p.is_available).length;
  const featuredProducts = productList.filter((p) => p.is_featured).length;
  const outOfStock = productList.filter((p) => p.stock_qty === 0).length;

  // Calculate sales by category
  const salesByCategory = productList.reduce(
    (acc: Record<string, { sold: number; revenue: number }>, product) => {
      const productSales = items.filter(
        (item) => item.product_id === product.id,
      );
      const confirmedSales = productSales.filter(
        (item) =>
          item.orders &&
          typeof item.orders === "object" &&
          "payment_status" in item.orders &&
          item.orders.payment_status === "confirmed",
      );

      if (!acc[product.category]) {
        acc[product.category] = { sold: 0, revenue: 0 };
      }

      acc[product.category].sold += productSales.length;
      acc[product.category].revenue += confirmedSales.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      return acc;
    },
    {},
  );

  // Top selling products
  const productSalesMap = items.reduce(
    (
      acc: Record<
        string,
        { name: string; sold: number; revenue: number; price: number }
      >,
      item,
    ) => {
      const product = productList.find((p) => p.id === item.product_id);
      if (!product) return acc;

      const confirmedSale =
        item.orders &&
        typeof item.orders === "object" &&
        "payment_status" in item.orders &&
        item.orders.payment_status === "confirmed";

      if (!acc[item.product_id]) {
        acc[item.product_id] = {
          name: product.name,
          sold: 0,
          revenue: 0,
          price: product.price,
        };
      }

      acc[item.product_id].sold += item.quantity;
      if (confirmedSale) {
        acc[item.product_id].revenue += item.subtotal;
      }

      return acc;
    },
    {},
  );

  const topProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1].sold - a[1].sold)
    .slice(0, 5)
    .map(([, product]) => product);

  return {
    totalProducts,
    availableProducts,
    featuredProducts,
    outOfStock,
    salesByCategory: Object.entries(salesByCategory).map(
      ([category, stats]) => ({
        category,
        ...stats,
      }),
    ),
    topProducts,
  };
}
