"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { useCartStore } from "@/store/cart-store";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Truck,
} from "lucide-react";
import Image from "next/image";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalPrice = useCartStore((state) => state.getTotalPrice());
  const clearCart = useCartStore((state) => state.clearCart);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center animate-bounce">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Your cart is hungry.
          </h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto">
            Looks like you haven&apos;t added any of our handcrafted pizzas to
            your order yet.
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
    );
  }

  return (
    <div className="min-h-screen bg-background/50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              My Order
            </h1>
            <p className="text-wrap text-muted-foreground mt-1 font-medium">
              Review your items before we start the oven.
            </p>
          </div>
          <button
            onClick={() => clearCart()}
            className="min-w-fit text-sm font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="group relative bg-card border border-border/50 rounded-2xl p-4 sm:p-6 transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Image */}
                  <div className="relative w-full sm:w-32 h-32 rounded-xl bg-muted overflow-hidden shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col text-3xl">
                        🍕
                        <span className="text-xs text-muted-foreground">
                          No image available
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl text-foreground mb-1">
                          {item.name}
                        </h3>
                        <p className="text-primary font-bold">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Control */}
                      <div className="flex items-center bg-secondary/50 rounded-full p-1 border border-border/50">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-1.5 rounded-full hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 active:scale-90"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="p-1.5 rounded-full hover:bg-background hover:shadow-sm transition-all active:scale-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="font-black text-xl text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                Summary
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Subtotal</span>
                  <span className="text-foreground">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Delivery</span>
                  </div>
                  <span className="text-green-600 font-bold uppercase text-xs tracking-widest">
                    Free
                  </span>
                </div>
                <div className="h-px bg-border/50 my-2" />
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">Total Amount</span>
                  <span className="text-3xl font-black text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="w-full bg-primary text-primary-foreground py-4 rounded-full font-black text-center flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout
                </Link>
                <Link
                  href="/menu"
                  className="w-full bg-secondary text-secondary-foreground py-4 rounded-full font-bold text-center block border border-border/40 hover:bg-secondary/80 transition-colors"
                >
                  Add more food
                </Link>
              </div>

              {/* Trust Badge */}
              <p className="mt-6 text-[11px] text-center text-muted-foreground font-medium uppercase tracking-tighter">
                Secure checkout powered by Bella Crosta Pay
              </p>
            </div>

            {/* Extra Info Card */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Fast Delivery
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated arrival in 35-45 mins to your current location.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
