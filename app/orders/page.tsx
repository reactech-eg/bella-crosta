import { getCurrentUser } from "@/utils/supabase/server";
import { getCustomerOrders } from "@/app/actions/orders";
import OrdersClient from "./client";
import { redirect } from "next/navigation";
import type { Order } from "@/lib/types";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  let orders: Order[] = [];
  try {
    orders = await getCustomerOrders(user.id);
  } catch (err) {
    console.error("Failed to fetch orders:", err);
  }

  return <OrdersClient initialOrders={orders} />;
}
