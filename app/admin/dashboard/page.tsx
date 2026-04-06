import { getProductStats } from "@/lib/db";
import AdminDashboardClient from "./client";
import { getAllOrders } from "@/app/actions/orders";

export const dynamic = "force-dynamic";

// Server component: auth guard runs on server — no redirect flash
export default async function AdminDashboard() {
  const [orders, productStats] = await Promise.all([
    getAllOrders(),
    getProductStats(),
  ]);

  return <AdminDashboardClient orders={orders} productStats={productStats} />;
}
