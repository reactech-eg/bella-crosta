import { getAllOrders } from "@/app/actions/orders";
import { getAllProducts, getAllCustomers } from "@/lib/db";
import AdminOrdersClient from "./client";

export default async function AdminOrdersPage() {
  const [orders, products, customers] = await Promise.all([
    getAllOrders(),
    getAllProducts(),
    getAllCustomers(),
  ]);

  return (
    <AdminOrdersClient
      orders={orders}
      products={products}
      customers={customers}
    />
  );
}
