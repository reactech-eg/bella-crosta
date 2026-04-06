import { getOrderById } from "@/app/actions/orders";
import OrderClient from "./client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { OrderSkeleton } from "../../../components/orders/order-skeleton";
import { Suspense } from "react";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const order = await getOrderById(id);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Order not found
          </h1>
          <Link href="/" className="text-primary hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderClient order={order} />
    </Suspense>
  );
}
