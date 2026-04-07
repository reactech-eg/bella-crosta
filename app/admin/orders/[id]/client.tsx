"use client";

import { useState, useTransition, useCallback } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import type { Order } from "@/lib/types";
import {
  Menu,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  updateOrderStatus,
  confirmPayment,
  uploadPaymentProof,
} from "@/app/actions/orders";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

const STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "delivered",
  "cancelled",
] as Order["status"][];

export default function AdminOrderDetailPage({
  order: initialOrder,
}: {
  order: Order;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [mobile, setMobile] = useState(false);
  const [selStatus, setSelStatus] = useState<Order["status"]>(
    initialOrder.status,
  );

  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    setOrder(updatedOrder);
    setSelStatus(updatedOrder.status);
  }, []);
  useOrderRealtime(initialOrder.id, handleOrderUpdate);
  const [isPendingStatus, startStatusTransition] = useTransition();
  const [isPendingPayment, startPaymentTransition] = useTransition();
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const router = useRouter();

  const handleStatusChange = async () => {
    if (!selStatus || selStatus === order.status) return;

    startStatusTransition(async () => {
      const result = await updateOrderStatus(order.id, selStatus);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Error updating status: ${result.error}`);
      }
    });
  };

  const handleConfirmPayment = async () => {
    startPaymentTransition(async () => {
      const result = await confirmPayment(order.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Error confirming payment: ${result.error}`);
      }
    });
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setProofPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProofSubmit = async () => {
    if (!proofPreview) return;

    setIsUploadingProof(true);
    try {
      const result = await uploadPaymentProof(order.id, proofPreview);
      if (result.success) {
        setProofPreview(null);
        router.refresh();
      } else {
        alert(`Error uploading proof: ${result.error}`);
      }
    } finally {
      setIsUploadingProof(false);
    }
  };

  const statusColor = (s: string) =>
    ({
      pending: "bg-yellow-500/15 text-yellow-400",
      confirmed: "bg-blue-500/15 text-blue-400",
      preparing: "bg-primary/15 text-primary",
      delivered: "bg-green-500/15 text-green-400",
      cancelled: "bg-destructive/15 text-destructive",
    })[s] ?? "bg-muted text-muted-foreground";
  const payColor = (s: string) =>
    ({
      confirmed: "bg-green-500/15 text-green-400",
      uploaded: "bg-yellow-500/15 text-yellow-400",
      pending: "bg-muted text-muted-foreground",
    })[s] ?? "bg-muted text-muted-foreground";

  return (
    <>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-bold text-foreground">
            {order?.order_number ?? "…"}
          </h1>
        </div>
        <button
          onClick={() => setMobile(true)}
          className="md:hidden p-2 hover:bg-muted rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex-1 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-4">
                Order Summary
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Order #
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.order_number}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Date</p>
                  <p className="text-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Total</p>
                  <p className="font-bold text-primary text-lg">
                    ${Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Method</p>
                  <p className="font-medium text-foreground capitalize">
                    {order.payment_method?.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-4">Items</h2>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start pb-3 border-b border-border last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      ${Number(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3">Delivery</h2>
              <p className="text-muted-foreground text-xs mb-0.5">Address</p>
              <p className="text-foreground text-sm">
                {order.delivery_address ?? "—"}
              </p>
              {order.delivery_notes && (
                <>
                  <p className="text-muted-foreground text-xs mb-0.5 mt-3">
                    Notes
                  </p>
                  <p className="text-foreground text-sm">
                    {order.delivery_notes}
                  </p>
                </>
              )}
            </div>

            {/* Customer */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3">Customer</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-14">Name</span>
                  <span className="font-medium text-foreground">
                    {order.customers?.full_name ?? "—"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-14">Email</span>
                  <span className="text-foreground">
                    {order.customers?.email ?? "—"}
                  </span>
                </div>
                {order.customers?.phone && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-14">Phone</span>
                    <span className="text-foreground">
                      {order.customers.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="col-span-1 space-y-5">
            {/* Order status */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">
                Order Status
              </h3>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(order.status)}`}
              >
                Current: {order.status}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full mt-3 px-3 py-2 border border-border rounded-xl bg-input text-foreground text-sm hover:bg-input/80 transition flex items-center justify-between">
                  {selStatus || "Select status"}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuRadioGroup
                    value={selStatus}
                    onValueChange={(value) =>
                      setSelStatus(value as Order["status"])
                    }
                  >
                    {STATUSES.map((status) => (
                      <DropdownMenuRadioItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={handleStatusChange}
                disabled={
                  isPendingStatus || selStatus === order.status || !selStatus
                }
                className="w-full mt-3 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold hover:bg-accent transition disabled:opacity-40"
              >
                {isPendingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Payment</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${payColor(order.payment_status)}`}
                  >
                    {order.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    ${Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="text-foreground capitalize">
                    {order.payment_method?.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Proof Upload Preview */}
              {proofPreview && (
                <div className="mb-4 space-y-2">
                  <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                    <img
                      src={proofPreview}
                      alt="Payment proof preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUploadProofSubmit}
                      disabled={isUploadingProof}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40"
                    >
                      {isUploadingProof ? "Uploading..." : "Confirm Upload"}
                    </button>
                    <button
                      onClick={() => setProofPreview(null)}
                      className="px-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Proof Display */}
              {order.payment_proof_url && !proofPreview && (
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline text-xs mb-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  View payment proof
                </a>
              )}

              {/* Upload/Confirm Section */}
              {order.payment_status !== "confirmed" && !proofPreview && (
                <div className="space-y-2">
                  {!order.payment_proof_url && (
                    <label className="flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed border-border rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition text-sm font-medium text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      Upload Proof
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isPendingPayment || !order.payment_proof_url}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isPendingPayment ? "Confirming..." : "Confirm Payment"}
                  </button>
                </div>
              )}

              {order.payment_status === "confirmed" && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Payment confirmed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
