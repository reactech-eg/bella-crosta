import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Order } from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useOrderRealtime(
  orderId: string | null,
  onUpdate: (order: Order) => void,
) {
  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const subscribe = async () => {
      channel = supabase
        .channel(`order:${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new) {
              onUpdate(payload.new as Order);
            }
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [orderId, onUpdate]);
}

export function useOrdersRealtime(
  customerId: string | null,
  onUpdate: (orders: Order[]) => void,
) {
  useEffect(() => {
    if (!customerId) return;

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const subscribe = async () => {
      channel = supabase
        .channel(`customer-orders:${customerId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `customer_id=eq.${customerId}`,
          },
          async (payload) => {
            // Refetch all orders for this customer
            const { data } = await supabase
              .from("orders")
              .select(`*, order_items(*)`)
              .eq("customer_id", customerId)
              .order("created_at", { ascending: false });

            if (data) {
              onUpdate(data as Order[]);
            }
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [customerId, onUpdate]);
}

export function useAdminOrdersRealtime(
  isAdmin: boolean,
  onUpdate: (orders: Order[]) => void,
) {
  useEffect(() => {
    if (!isAdmin) return;

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const subscribe = async () => {
      channel = supabase
        .channel("admin-all-orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          async (payload) => {
            // Refetch all orders for admin
            const { data } = await supabase
              .from("orders")
              .select(`*, order_items(*), customers(*)`)
              .order("created_at", { ascending: false });

            if (data) {
              onUpdate(data as Order[]);
            }
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAdmin, onUpdate]);
}
