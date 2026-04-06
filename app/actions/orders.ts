"use server";

import { Order, OrderItem, Payment } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { handleSupabaseError } from "@/utils/supabase/utils";
import { cache } from "react";

export async function mapOrder(data: Record<string, unknown>): Promise<Order> {
  const payment = (data.payments as Payment[] | undefined)?.[0];
  const items = ((data.order_items as OrderItem[]) ?? []).map((item) => ({
    ...item,
    product_name: item.product_name || "Unknown Product",
  }));
  return {
    ...(data as unknown as Order),
    order_items: items,
    payment_method:
      payment?.payment_method ??
      (data.payment_method as Order["payment_method"]) ??
      "instapay",
    payment_proof_url:
      payment?.proof_image_url ??
      (data.payment_proof_url as string | null) ??
      null,
  };
}

export const getCustomerOrders = cache(
  async (customerId: string): Promise<Order[]> => {
    const supabase = await createClient();
    const { data, error, status } = await supabase
      .from("orders")
      .select(`*, order_items(*), payments(*)`)
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
