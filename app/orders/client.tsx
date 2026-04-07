"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useOrdersRealtime } from "@/hooks/use-order-realtime";
import Link from "next/link";
import { Header } from "@/components/header";
import { Order } from "@/lib/types";
import { cancelOrder } from "@/app/actions/orders";
import {
  PackageOpen,
  CheckCircle,
  Clock,
  Truck,
  ArrowRight,
  ArrowLeft,
  XCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrdersClientProps {
  orders: Order[];
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
    borderColor: "border-yellow-200 dark:border-yellow-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    borderColor: "border-blue-200 dark:border-blue-500/20",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparing",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
    borderColor: "border-orange-200 dark:border-orange-500/20",
    icon: PackageOpen,
  },
  delivered: {
    label: "Delivered",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-500/10",
    borderColor: "border-green-200 dark:border-green-500/20",
    icon: Truck,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-500/10",
    borderColor: "border-red-200 dark:border-red-500/20",
    icon: XCircle,
  },
};

export default function OrdersClient({
  orders: initialOrders,
}: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "status">(
    "newest",
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const customerId = initialOrders[0]?.customer_id ?? null;
  const handleOrdersUpdate = useCallback((updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  }, []);
  useOrdersRealtime(customerId, handleOrdersUpdate);

  const sorted = useMemo(() => {
    let result = [...orders];

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((order) => order.status === filterStatus);
    }

    // Sort
    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    } else if (sortBy === "status") {
      const statusOrder = [
        "pending",
        "confirmed",
        "preparing",
        "delivered",
        "cancelled",
      ];
      result.sort(
        (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
      );
    }

    return result;
  }, [orders, sortBy, filterStatus]);

  const statuses = [
    "all",
    "pending",
    "confirmed",
    "preparing",
    "delivered",
    "cancelled",
  ] as const;

  const handleCancelOrder = (orderId: string) => {
    setCancelError(null);
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (!result.success) {
        setCancelError(result.error || "Failed to cancel order");
      }
    });
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center animate-bounce">
                <PackageOpen className="w-12 h-12 text-muted-foreground/40" />
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4">
              No orders yet.
            </h1>
            <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Start by exploring our
              delicious menu!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Explore the Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2">
            My <span className="text-primary italic">Orders</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your delicious pizza orders in one place.
          </p>
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Sort Dropdown */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
              Sort:
            </span>
            <div className="flex gap-2">
              {(["newest", "oldest", "status"] as const).map((option) => (
                <Button
                  key={option}
                  variant={sortBy === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option)}
                  className="rounded-full capitalize font-bold text-xs"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
              Filter:
            </span>
            <div className="flex gap-2 flex-wrap">
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="rounded-full capitalize font-bold text-xs"
                >
                  {status === "all" ? "All Orders" : status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 text-sm text-muted-foreground font-medium italic">
          Showing {sorted.length} of {orders.length} order
          {orders.length !== 1 ? "s" : ""}
        </div>

        {/* Orders List */}
        {sorted.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No orders found with current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const statusConfig =
                STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ||
                STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const orderDate = new Date(order.created_at);
              const formattedDate = orderDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = orderDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              const itemCount = order.order_items?.length ?? 0;
              const canCancel = ["pending", "confirmed"].includes(order.status);

              return (
                <div
                  key={order.id}
                  className={cn(
                    "group rounded-2xl border transition-all duration-200",
                    isExpanded
                      ? `${statusConfig.borderColor} ${statusConfig.bgColor}`
                      : "border-border bg-card hover:border-primary/30 hover:shadow-md",
                  )}
                >
                  {/* Order Header - Always Visible */}
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div
                          className={cn(
                            "p-3 rounded-xl shrink-0",
                            statusConfig.bgColor,
                          )}
                        >
                          <StatusIcon
                            className={cn("w-6 h-6", statusConfig.color)}
                          />
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground text-sm sm:text-base">
                              Order #{order.order_number}
                            </h3>
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold capitalize whitespace-nowrap",
                                statusConfig.bgColor,
                                statusConfig.color,
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {formattedDate} at {formattedTime}
                          </p>
                        </div>
                      </div>

                      {/* Right Side Info */}
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                          <p className="text-sm font-bold text-foreground">
                            ${order.total_amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                    </div>

                    {/* Mobile Display - Total & Items */}
                    <div className="sm:hidden flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </span>
                      <span className="font-bold text-primary">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-6 pb-6 pt-4 space-y-4">
                      {cancelError && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                          {cancelError}
                        </div>
                      )}

                      {/* Order Items */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Items ({itemCount})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {order.order_items?.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-start text-sm gap-2"
                            >
                              <div>
                                <p className="font-semibold text-foreground">
                                  {item.product_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × $
                                  {item.unit_price.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-bold text-foreground whitespace-nowrap">
                                ${item.subtotal.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address - if available */}
                      {order.delivery_address && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            Delivery Address
                          </h4>
                          <p className="text-sm text-foreground">
                            {order.delivery_address}
                          </p>
                          {order.delivery_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Notes: {order.delivery_notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Order Summary */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-foreground">
                            Total Amount
                          </span>
                          <span className="text-lg font-black text-primary">
                            ${order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4">
                        <Link
                          href={`/order/${order.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 text-sm"
                        >
                          View Full Details
                          <ArrowRight className="w-4 h-4" />
                        </Link>

                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={isPending}
                            className="px-4 py-3 bg-destructive/10 text-destructive rounded-xl font-bold hover:bg-destructive/20 transition-all active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
