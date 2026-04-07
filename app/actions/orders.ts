"use server";

import { Order, OrderItem } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { handleSupabaseError } from "@/utils/supabase/utils";
import { cache } from "react";

export async function mapOrder(data: Record<string, unknown>): Promise<Order> {
  const items = ((data.order_items as OrderItem[]) ?? []).map((item) => ({
    ...item,
    product_name: item.product_name || "Unknown Product",
  }));
  return {
    ...(data as unknown as Order),
    order_items: items,
  };
}

export const getCustomerOrders = cache(
  async (customerId: string): Promise<Order[]> => {
    const supabase = await createClient();
    const { data, error, status } = await supabase
      .from("orders")
      .select(`*, order_items(*)`)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) {
      handleSupabaseError("GetCustomerOrders", error, status);
      return [];
    }
    const orders = await Promise.all(
      (data as Record<string, unknown>[]).map(mapOrder),
    );
    return orders;
  },
);

export const getOrderById = cache(
  async (orderId: string): Promise<Order | null> => {
    const supabase = await createClient();
    const { data, error, status } = await supabase
      .from("orders")
      .select(`*, order_items(*), customers(*)`)
      .eq("id", orderId)
      .single();
    if (error) {
      handleSupabaseError("getOrderById:", error, status);
      return null;
    }
    return mapOrder(data);
  },
);

export const getAllOrders = cache(async (): Promise<Order[]> => {
  const supabase = await createClient();
  const { data, error, status } = await supabase
    .from("orders")
    .select(`*, order_items(*), customers(*)`)
    .order("created_at", { ascending: false });

  if (error) {
    handleSupabaseError("getAllOrders:", error, status);
    return [];
  }
  const orders = Promise.all((data ?? []).map(mapOrder));
  return orders;
});

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return { success: false, error: "Unauthorized: Admin access required" };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    handleSupabaseError("updateOrderStatus", error, 500);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function confirmPayment(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return { success: false, error: "Unauthorized: Admin access required" };
  }

  // Verify order exists
  const { data: order, error: orderCheckError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .single();

  if (orderCheckError || !order) {
    return { success: false, error: "Order not found" };
  }

  // Update payment_status to confirmed (payment verified)
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    handleSupabaseError("confirmPayment", error, 500);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function uploadPaymentProof(
  orderId: string,
  proofImageBase64: string,
): Promise<{ success: boolean; error?: string; proofUrl?: string }> {
  const supabase = await createClient();

  // Verify user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return { success: false, error: "Unauthorized: Admin access required" };
  }

  // Verify order exists
  const { data: order, error: orderCheckError } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .single();

  if (orderCheckError || !order) {
    return { success: false, error: "Order not found" };
  }

  try {
    // Convert base64 to blob
    const matches = proofImageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: "Invalid image format" };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const bytes = Buffer.from(base64Data, "base64");
    const ext = mimeType.split("/")[1] ?? "jpg";
    const fileName = `payment-proof-${orderId}-${Date.now()}.${ext}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, new Blob([bytes], { type: mimeType }), {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        error: uploadError?.message ?? "Failed to upload proof image",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(uploadData.path);

    const proofUrl = urlData.publicUrl;

    // Update order with proof URL
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_proof_url: proofUrl,
        payment_status: "uploaded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      handleSupabaseError("updateOrderWithProof", updateError, 500);
      return { success: false, error: updateError.message };
    }

    return { success: true, proofUrl };
  } catch (err) {
    console.error("uploadPaymentProof error:", err);
    return {
      success: false,
      error: "An error occurred while uploading the proof image",
    };
  }
}

/**
 * Admin creates an order directly from the dashboard
 * Used for: Phone orders, walk-in orders, special requests
 */
export async function createOrderAsAdmin(input: {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: "cod" | "instapay" | "vodafone_cash";
  paymentStatus?: "pending" | "uploaded" | "confirmed";
}): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
}> {
  const supabase = await createClient();

  // Verify user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return { success: false, error: "Unauthorized: Admin access required" };
  }

  // Validate input
  if (!input.customerId) {
    return { success: false, error: "Customer ID is required" };
  }
  if (!input.items?.length) {
    return { success: false, error: "Order must contain at least one item" };
  }
  if (!input.deliveryAddress?.trim()) {
    return { success: false, error: "Delivery address is required" };
  }
  if (input.totalAmount <= 0) {
    return { success: false, error: "Total amount must be greater than 0" };
  }

  try {
    const orderNumber = `BC-${Date.now()}`;
    const now = new Date().toISOString();

    // Create order
    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: input.customerId,
        order_number: orderNumber,
        total_amount: input.totalAmount,
        delivery_address: input.deliveryAddress.trim(),
        delivery_notes: input.deliveryNotes?.trim() ?? "",
        payment_method: input.paymentMethod,
        payment_status: input.paymentStatus ?? "pending",
        status: "pending",
        created_at: now,
      })
      .select()
      .single();

    if (orderErr || !orderData) {
      console.log("createOrderAsAdmin - insert order", orderErr, 500);
      return { success: false, error: "Failed to create order" };
    }

    // Insert order items
    const lineItems = input.items.map((item) => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: Math.round(item.price * item.quantity * 100) / 100,
      created_at: now,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(lineItems);

    if (itemsErr) {
      handleSupabaseError("createOrderAsAdmin - insert items", itemsErr, 500);
      return { success: false, error: "Failed to add order items" };
    }

    return {
      success: true,
      orderId: orderData.id,
      orderNumber,
    };
  } catch (err) {
    console.error("createOrderAsAdmin error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Customer cancels their order
 * Only allows cancellation if order is in pending state
 */
export async function cancelOrder(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get order and verify ownership
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, customer_id, status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: "Order not found" };
    }

    // Verify user owns this order
    if (order.customer_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized: You can only cancel your own orders",
      };
    }

    // Check if order can be cancelled (only pending and confirmed orders)
    if (!["pending", "confirmed"].includes(order.status)) {
      return {
        success: false,
        error: `Cannot cancel order in ${order.status} status. Only pending or confirmed orders can be cancelled.`,
      };
    }

    // Update order status to cancelled
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (updateErr) {
      handleSupabaseError("cancelOrder", updateErr, 500);
      return { success: false, error: "Failed to cancel order" };
    }

    return { success: true };
  } catch (err) {
    console.error("cancelOrder error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
