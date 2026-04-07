"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createOrderAsAdmin } from "@/app/actions/orders";
import type { Product, PaymentMethod, Order, Customer } from "@/lib/types";

interface AdminAddOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  products: Product[];
  customers: Customer[];
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function AdminAddOrderModal({
  open,
  onClose,
  onSuccess,
  products,
  customers,
}: AdminAddOrderModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "uploaded" | "confirmed"
  >("pending");

  // Add item state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddItem = () => {
    if (!selectedProductId || !selectedProduct) {
      setError("Please select a product");
      return;
    }
    if (itemQuantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    const newItem: OrderItem = {
      productId: selectedProductId,
      productName: selectedProduct.name,
      quantity: itemQuantity,
      price: selectedProduct.price,
    };

    // Check if product already in items
    const existingIndex = items.findIndex(
      (i) => i.productId === selectedProductId,
    );
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += itemQuantity;
      setItems(updated);
    } else {
      setItems([...items, newItem]);
    }

    setSelectedProductId("");
    setItemQuantity(1);
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedCustomerId.trim()) {
      setError("Please select a customer");
      return;
    }
    if (items.length === 0) {
      setError("Order must contain at least one item");
      return;
    }
    if (!deliveryAddress.trim()) {
      setError("Delivery address is required");
      return;
    }
    if (totalAmount <= 0) {
      setError("Order total must be greater than 0");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createOrderAsAdmin({
          customerId: selectedCustomerId,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.productName,
          })),
          totalAmount,
          deliveryAddress,
          deliveryNotes,
          paymentMethod,
          paymentStatus,
        });

        if (!result.success) {
          setError(result.error || "Failed to create order");
          return;
        }

        // Reset form
        setSelectedCustomerId("");
        setItems([]);
        setDeliveryAddress("");
        setDeliveryNotes("");
        setPaymentMethod("cod");
        setPaymentStatus("pending");

        // Close modal and call success callback
        onClose();
        onSuccess?.();
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      }
    });
  };

  const handleClose = () => {
    setError(null);
    setSelectedCustomerId("");
    setItems([]);
    setDeliveryAddress("");
    setDeliveryNotes("");
    setPaymentMethod("cod");
    setPaymentStatus("pending");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customerSelect">Customer *</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
            >
              <SelectTrigger
                id="customerSelect"
                disabled={isPending}
                className="w-full"
              >
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name || "Unnamed"} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Delivery Address *</Label>
            <Textarea
              id="deliveryAddress"
              placeholder="Enter full delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          {/* Delivery Notes */}
          <div className="space-y-2">
            <Label htmlFor="deliveryNotes">Delivery Notes</Label>
            <Textarea
              id="deliveryNotes"
              placeholder="Any special instructions..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              disabled={isPending}
              rows={2}
            />
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger
                  id="paymentMethod"
                  disabled={isPending}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="instapay">Instapay</SelectItem>
                  <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status *</Label>
              <Select
                value={paymentStatus}
                onValueChange={(v) =>
                  setPaymentStatus(v as Order["payment_status"])
                }
              >
                <SelectTrigger
                  id="paymentStatus"
                  disabled={isPending}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Items Section */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Add Items</h3>

            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger disabled={isPending} className="w-full">
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${Number(product.price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={itemQuantity}
                  onChange={(e) =>
                    setItemQuantity(parseInt(e.target.value) || 1)
                  }
                  disabled={isPending}
                  placeholder="Qty"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={isPending || !selectedProductId}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {items.length} item{items.length !== 1 ? "s" : ""} added
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/40 p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ${Number(item.price).toFixed(2)} = $
                          {Number(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={isPending}
                        className="p-2 text-destructive hover:bg-destructive/15 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">
                  Order Total:
                </span>
                <span className="text-2xl font-bold text-primary">
                  ${Number(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || items.length === 0}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
