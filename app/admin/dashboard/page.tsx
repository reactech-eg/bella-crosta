import { getAllOrders, getProductStats } from "@/lib/db";
import AdminDashboardClient from "./client";
import { Suspense } from "react";
import {
  DashboardKpiSkeleton,
  DashboardTableSkeleton,
  ChartSkeleton,
  ProductStatsCardSkeleton,
} from "@/components/admin-dashboard-skeleton";

export const dynamic = "force-dynamic";

// Server component: auth guard runs on server — no redirect flash
export default async function AdminDashboard() {
  const [orders, productStats] = await Promise.all([
    getAllOrders(),
    getProductStats(),
  ]);

  return <AdminDashboardClient orders={orders} productStats={productStats} />;
}
