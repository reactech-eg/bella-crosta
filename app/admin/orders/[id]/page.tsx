import { getOrderById } from "@/app/actions/orders";
import AdminOrderDetailClient from "./client";
import OrderDetailSkeleton from "@/components/orders/order-detail-skeleton";
import { Suspense } from "react";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch the order data based on the ID
  const order = await getOrderById(id);

  if (!order) {
    return <div className="p-4">Order not found.</div>;
  }

  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <AdminOrderDetailClient order={order} />
    </Suspense>
  );
}
