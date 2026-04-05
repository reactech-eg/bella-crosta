"use server";

import { createAdminClient } from "@/utils/supabase/admin-client";
import { createClient as createServerClient } from "@/utils/supabase/server";
import type { RawMaterial, ProductFormData } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Authed Supabase client (RLS applies) ────────────────────────────────────
async function authedClient() {
  return await createServerClient();
}

// ─── Admin client (bypasses RLS for admin-only operations) ───────────────────
function adminClient() {
  return createAdminClient();
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateOrderInput(
  customerId: string,
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }>,
  totalAmount: number,
  deliveryAddress: string,
): string | null {
  if (!customerId?.trim()) return "Customer ID is required.";
  if (!deliveryAddress?.trim()) return "Delivery address is required.";
  if (!Number.isFinite(totalAmount) || totalAmount <= 0)
    return "Invalid order total.";
  if (!Array.isArray(items) || items.length === 0)
    return "Order must contain at least one item.";
  for (const item of items) {
    if (!item.productId?.trim()) return `Invalid product ID.`;
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 999
    )
      return `Invalid quantity for "${item.name}".`;
    if (!Number.isFinite(item.price) || item.price <= 0)
      return `Invalid price for "${item.name}".`;
  }
  return null;
}

// ─── Create Order ──────────────────────────────────────────────────────────────
// NOTE: Raw materials are NOT deducted here.
//       They are deducted only when admin confirms payment (confirmPayment action).
export async function createOrder(
  customerId: string,
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }>,
  totalAmount: number,
  deliveryAddress: string,
  deliveryNotes: string,
  paymentMethod: "instapay" | "vodafone_cash" | "cod",
  paymentProofBase64?: string, // base64 image from client
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  const validationError = validateOrderInput(
    customerId,
    items,
    totalAmount,
    deliveryAddress,
  );
  if (validationError) return { success: false, error: validationError };

  try {
    const db = await authedClient();

    // Idempotency: avoid duplicate orders within 2 minutes
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
    const { data: existing } = await db
      .from("orders")
      .select("id, order_number")
      .eq("customer_id", customerId)
      .eq("status", "pending")
      .gte("created_at", twoMinAgo)
      .maybeSingle();
    if (existing) {
      return {
        success: true,
        data: { orderId: existing.id, orderNumber: existing.order_number },
      };
    }

    // Upload payment proof to Supabase Storage if provided
    let paymentProofUrl: string | null = null;
    if (paymentProofBase64) {
      try {
        // Convert base64 to blob
        const matches = paymentProofBase64.match(
          /^data:([A-Za-z-+/]+);base64,(.+)$/,
        );
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const bytes = Buffer.from(base64Data, "base64");
          const blob = new Blob([bytes], { type: mimeType });
          const ext = mimeType.split("/")[1] ?? "jpg";
          const fileName = `payment-proof-${customerId}-${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadError } = await db.storage
            .from("payment-proofs")
            .upload(fileName, blob, { contentType: mimeType, upsert: false });

          if (!uploadError && uploadData) {
            const { data: urlData } = db.storage
              .from("payment-proofs")
              .getPublicUrl(uploadData.path);
            paymentProofUrl = urlData.publicUrl;
          }
        }
      } catch (uploadErr) {
        console.error("Payment proof upload error (non-fatal):", uploadErr);
        // Non-fatal — order proceeds without proof URL
      }
    }

    const orderNumber = `BC-${Date.now()}`;

    const { data: orderData, error: orderErr } = await db
      .from("orders")
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalAmount,
        delivery_address: deliveryAddress.trim(),
        delivery_notes: deliveryNotes?.trim() ?? "",
        payment_method: paymentMethod,
        payment_status: paymentProofBase64 ? "uploaded" : "pending",
        payment_proof_url: paymentProofUrl,
        status: "pending",
      })
      .select()
      .single();

    if (orderErr || !orderData)
      return {
        success: false,
        error: orderErr?.message ?? "Failed to create order.",
      };

    // Insert line items
    const lineItems = items.map((item) => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: Math.round(item.price * item.quantity * 100) / 100,
    }));
    const { error: itemsErr } = await db.from("order_items").insert(lineItems);
    if (itemsErr) return { success: false, error: itemsErr.message };

    return { success: true, data: { orderId: orderData.id, orderNumber } };
  } catch (e) {
    console.error("createOrder:", e);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// ─── Update Order Status (admin only) ────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "preparing" | "delivered" | "cancelled",
): Promise<ActionResult> {
  try {
    const db = adminClient();
    const { error } = await db
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error("updateOrderStatus:", e);
    return { success: false, error: "Failed to update order status." };
  }
}

// ─── Confirm Payment + Deduct Raw Materials (admin only) ─────────────────────
// This is the CRITICAL business logic:
// 1. Mark order as confirmed
// 2. Deduct raw materials based on product ingredients × quantities ordered
// 3. Record deduction audit trail
export async function confirmPayment(orderId: string): Promise<ActionResult> {
  const db = adminClient();

  try {
    // 1. Get order items with product ingredients
    const { data: orderItems, error: itemsErr } = await db
      .from("order_items")
      .select(
        `
        quantity,
        product_id
      `,
      )
      .eq("order_id", orderId);

    if (itemsErr) {
      console.error("confirmPayment — fetch order items:", itemsErr);
      // Non-fatal: continue to confirm payment even if we can't deduct
    }

    // 2. Update order status and payment status
    const { error: updateErr } = await db
      .from("orders")
      .update({ payment_status: "confirmed", status: "confirmed" })
      .eq("id", orderId);
    if (updateErr) return { success: false, error: updateErr.message };

    // 3. Calculate raw material deductions
    const deductionMap = new Map<string, number>(); // raw_material_id → total qty to deduct

    if (orderItems && orderItems.length > 0) {
      for (const orderItem of orderItems) {
        if (!orderItem.product_id) continue;

        // Fetch product ingredients directly
        const { data: ingredients } = await db
          .from("product_ingredients")
          .select("raw_material_id, quantity_needed")
          .eq("product_id", orderItem.product_id);

        if (!ingredients || ingredients.length === 0) continue;

        for (const ing of ingredients) {
          const totalNeeded = ing.quantity_needed * orderItem.quantity;
          const existing = deductionMap.get(ing.raw_material_id) ?? 0;
          deductionMap.set(ing.raw_material_id, existing + totalNeeded);
        }
      }
    }

    // 4. Apply deductions with optimistic locking (SELECT then UPDATE)
    const deductionRecords: Array<{
      order_id: string;
      raw_material_id: string;
      quantity_deducted: number;
    }> = [];

    for (const [materialId, totalDeduct] of deductionMap.entries()) {
      // Get current stock
      const { data: material, error: fetchErr } = await db
        .from("raw_materials")
        .select("id, stock_qty, name")
        .eq("id", materialId)
        .single();

      if (fetchErr || !material) {
        console.error(
          `confirmPayment — could not fetch material ${materialId}:`,
          fetchErr,
        );
        continue;
      }

      const newQty = Math.max(0, Number(material.stock_qty) - totalDeduct);

      const { error: deductErr } = await db
        .from("raw_materials")
        .update({ stock_qty: newQty })
        .eq("id", materialId)
        .eq("stock_qty", material.stock_qty); // Optimistic lock

      if (deductErr) {
        console.error(
          `confirmPayment — failed to deduct ${material.name}:`,
          deductErr,
        );
        // Retry without optimistic lock as fallback
        await db
          .from("raw_materials")
          .update({ stock_qty: newQty })
          .eq("id", materialId);
      }

      deductionRecords.push({
        order_id: orderId,
        raw_material_id: materialId,
        quantity_deducted: totalDeduct,
      });
    }

    // 5. Insert audit trail
    if (deductionRecords.length > 0) {
      const { error: auditErr } = await db
        .from("raw_material_deductions")
        .insert(deductionRecords);
      if (auditErr)
        console.error("confirmPayment — audit trail insert failed:", auditErr);
    }

    return { success: true };
  } catch (e) {
    console.error("confirmPayment:", e);
    return { success: false, error: "Failed to confirm payment." };
  }
}

// ─── Update Product (admin only) ──────────────────────────────────────────────
export async function updateProduct(
  productId: string,
  updates: Partial<{
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    category: string;
    is_featured: boolean;
    is_available: boolean;
    stock_qty: number;
  }>,
): Promise<ActionResult> {
  try {
    const db = adminClient();
    const { error } = await db
      .from("products")
      .update(updates)
      .eq("id", productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error("updateProduct:", e);
    return { success: false, error: "Failed to update product." };
  }
}

// ─── Create Product with Ingredients (admin only) ─────────────────────────────
export async function createProduct(
  product: ProductFormData,
): Promise<ActionResult<{ id: string }>> {
  const db = adminClient();
  try {
    // Insert product
    const { data, error } = await db
      .from("products")
      .insert({
        name: product.name.trim(),
        description: product.description?.trim() || null,
        price: product.price,
        image_url: product.image_url || null,
        category: product.category.trim(),
        is_featured: product.is_featured ?? false,
        is_available: true,
        stock_qty: product.stock_qty ?? 0,
      })
      .select("id")
      .single();

    if (error || !data)
      return {
        success: false,
        error: error?.message ?? "Failed to create product.",
      };

    // Insert ingredients
    if (product.ingredients && product.ingredients.length > 0) {
      const ingredients = product.ingredients
        .filter((i) => i.raw_material_id && i.quantity_needed > 0)
        .map((i) => ({
          product_id: data.id,
          raw_material_id: i.raw_material_id,
          quantity_needed: i.quantity_needed,
        }));

      if (ingredients.length > 0) {
        const { error: ingErr } = await db
          .from("product_ingredients")
          .insert(ingredients);
        if (ingErr)
          console.error("createProduct — ingredients insert:", ingErr);
      }
    }

    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error("createProduct:", e);
    return { success: false, error: "Failed to create product." };
  }
}

// ─── Update Product Ingredients (admin only) ──────────────────────────────────
export async function updateProductIngredients(
  productId: string,
  ingredients: Array<{ raw_material_id: string; quantity_needed: number }>,
): Promise<ActionResult> {
  const db = adminClient();
  try {
    // Delete existing and replace
    await db.from("product_ingredients").delete().eq("product_id", productId);

    if (ingredients.length > 0) {
      const rows = ingredients
        .filter((i) => i.raw_material_id && i.quantity_needed > 0)
        .map((i) => ({ product_id: productId, ...i }));

      if (rows.length > 0) {
        const { error } = await db.from("product_ingredients").insert(rows);
        if (error) return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (e) {
    console.error("updateProductIngredients:", e);
    return { success: false, error: "Failed to update ingredients." };
  }
}

// ─── Soft-delete Product (admin only) ────────────────────────────────────────
export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const db = adminClient();
    const { error } = await db
      .from("products")
      .update({ is_available: false })
      .eq("id", productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error("deleteProduct:", e);
    return { success: false, error: "Failed to delete product." };
  }
}

// ─── Raw Materials CRUD (admin only) ─────────────────────────────────────────

export async function createRawMaterial(
  material: Omit<RawMaterial, "id" | "created_at" | "updated_at">,
): Promise<ActionResult<{ id: string }>> {
  try {
    const db = adminClient();
    const { data, error } = await db
      .from("raw_materials")
      .insert(material)
      .select("id")
      .single();
    if (error || !data)
      return {
        success: false,
        error: error?.message ?? "Failed to create raw material.",
      };
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error("createRawMaterial:", e);
    return { success: false, error: "Failed to create raw material." };
  }
}

export async function updateRawMaterial(
  id: string,
  updates: Partial<Omit<RawMaterial, "id" | "created_at" | "updated_at">>,
): Promise<ActionResult> {
  try {
    const db = adminClient();
    const { error } = await db
      .from("raw_materials")
      .update(updates)
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error("updateRawMaterial:", e);
    return { success: false, error: "Failed to update raw material." };
  }
}

export async function deleteRawMaterial(id: string): Promise<ActionResult> {
  try {
    const db = adminClient();
    // Check if used in any product
    const { data: usages } = await db
      .from("product_ingredients")
      .select("id")
      .eq("raw_material_id", id)
      .limit(1);

    if (usages && usages.length > 0) {
      return {
        success: false,
        error:
          "This raw material is used in one or more products. Remove it from products first.",
      };
    }

    const { error } = await db.from("raw_materials").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error("deleteRawMaterial:", e);
    return { success: false, error: "Failed to delete raw material." };
  }
}

// ─── Upload Image to Supabase Storage ────────────────────────────────────────
export async function uploadProductImage(
  base64Data: string,
  fileName: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const db = adminClient();
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) return { success: false, error: "Invalid image data." };

    const mimeType = matches[1];
    const b64 = matches[2];
    const bytes = Buffer.from(b64, "base64");
    const blob = new Blob([bytes], { type: mimeType });
    const ext = mimeType.split("/")[1] ?? "jpg";
    const path = `products/${fileName}-${Date.now()}.${ext}`;

    const { data, error } = await db.storage
      .from("product-images")
      .upload(path, blob, { contentType: mimeType, upsert: true });

    if (error) return { success: false, error: error.message };

    const { data: urlData } = db.storage
      .from("product-images")
      .getPublicUrl(data.path);
    return { success: true, data: { url: urlData.publicUrl } };
  } catch (e) {
    console.error("uploadProductImage:", e);
    return { success: false, error: "Failed to upload image." };
  }
}
