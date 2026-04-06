import { getAllOrders } from "@/app/actions/orders";
import AdminOrdersClient from "./client";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return <AdminOrdersClient orders={orders} />;
}
