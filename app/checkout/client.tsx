"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { AuthForm } from "@/components/auth-form";
import { useCartStore } from "@/store/cart-store";
import { createOrder } from "@/lib/actions";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  X,
  MapPin,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import type { CartItem, PaymentMethod } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const totalPrice = getTotalPrice();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    altPhone: "",
    address: "",
    deliveryNotes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [proofImage, setProofImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchSession() {
      try {
        const u = await getCurrentUser();
        setUser(u as SessionUser | null);
      } finally {
        setCheckingAuth(false);
      }
    }
    fetchSession();
  }, []);

  const handleProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setProofImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Please sign in to place an order.");
      return;
    }
    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      setError("Please fill in all required fields marked with *");
      return;
    }
    if (paymentMethod !== "cod" && !proofImage) {
      setError("Please upload a payment screenshot for digital transfers.");
      return;
    }

    startTransition(async () => {
      const result = await createOrder(
        user.id,
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          name: i.name,
        })),
        totalPrice,
        formData.address.trim(),
        formData.deliveryNotes.trim(),
        paymentMethod,
        paymentMethod === "cod" ? undefined : proofImage,
      );

      if (!result.success) {
        setError((result as { success: false; error: string }).error);
        return;
      }

      clearCart();
      router.push(`/order/${result.data!.orderId}`);
    });
  };

  if (checkingAuth)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background/50 pb-20">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <Button variant="ghost" asChild className="-ml-2 mb-4">
            <Link href="/cart" className="flex items-center gap-2 font-bold">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Link>
          </Button>
          <h1 className="text-4xl font-black tracking-tight italic">
            Checkout
          </h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            {!user ? (
              <Card className="border-2 border-primary/20 rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      First, let&apos;s get you signed in
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <AuthForm
                    mode="signup"
                    onSuccess={async () => setUser(await getCurrentUser())}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Step 1: Delivery */}
                <Card className="rounded-3xl border-border shadow-sm">
                  <CardHeader className="p-6 sm:p-8">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" /> 1. Delivery
                      Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-sm font-bold">Full Name *</Label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          placeholder="John Doe"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">
                          Phone Number *
                        </Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="01xxxxxxxxx"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">
                          Alternative Phone
                        </Label>
                        <Input
                          value={formData.altPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              altPhone: e.target.value,
                            })
                          }
                          placeholder="Optional"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-sm font-bold">
                          Full Address *
                        </Label>
                        <Textarea
                          className="resize-none h-24 rounded-xl"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          placeholder="Building number, Street, Floor, Apt..."
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-sm font-bold">
                          Delivery Notes
                        </Label>
                        <Textarea
                          className="resize-none h-20 rounded-xl"
                          value={formData.deliveryNotes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveryNotes: e.target.value,
                            })
                          }
                          placeholder="Any special instructions for the driver..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Payment */}
                <Card className="rounded-3xl border-border shadow-sm">
                  <CardHeader className="p-6 sm:p-8">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary" /> 2. Payment
                      Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 pt-0 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "cod",
                          label: "Cash",
                        },
                        { id: "instapay", label: "Instapay" },
                        { id: "vodafone_cash", label: "V-Cash" },
                      ].map((method) => (
                        <Button
                          key={method.id}
                          variant={
                            paymentMethod === method.id ? "default" : "outline"
                          }
                          onClick={() =>
                            setPaymentMethod(method.id as PaymentMethod)
                          }
                          className={cn(
                            "h-auto py-4 rounded-2xl border-2 font-bold flex flex-col gap-2 transition-all",
                            paymentMethod === method.id
                              ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                              : "border-border hover:border-primary/40 text-muted-foreground",
                          )}
                        >
                          <span>{method.label}</span>
                        </Button>
                      ))}
                    </div>

                    {paymentMethod === "cod" ? (
                      <div className="bg-muted/50 rounded-2xl p-6 border border-dashed border-border text-center">
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                          Simple! Pay our driver in cash when your pizza
                          arrives. Please have exact change ready if possible.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                            Transfer Details
                          </p>
                          <p className="text-lg font-black text-foreground">
                            {paymentMethod === "instapay"
                              ? "bellacrosta@instapay"
                              : "01098765432"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Transfer{" "}
                            <span className="font-bold text-foreground">
                              ${totalPrice.toFixed(2)}
                            </span>{" "}
                            then upload the receipt below.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-bold">
                            Payment Receipt *
                          </Label>
                          {proofImage ? (
                            <div className="relative group aspect-video bg-muted rounded-2xl overflow-hidden border-2 border-primary">
                              <Image
                                src={proofImage}
                                alt="Receipt"
                                fill
                                className="object-cover"
                              />
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => setProofImage(undefined)}
                                className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl py-12 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all">
                              <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                              <span className="font-bold text-sm">
                                Upload Screenshot
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                PNG, JPG up to 5MB
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProof}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="w-full py-8 bg-primary text-primary-foreground rounded-2xl font-black text-xl hover:brightness-110 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin w-6 h-6" />
                  ) : (
                    "Place My Order"
                  )}
                </Button>
              </>
            )}
          </div>

          <aside className="lg:col-span-5 h-fit lg:sticky lg:top-24">
            <OrderSummaryCard items={items} total={totalPrice} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function OrderSummaryCard({
  items,
  total,
}: {
  items: CartItem[];
  total: number;
}) {
  return (
    <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black italic">Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <ScrollArea className="max-h-[40vh] pr-4">
          <div className="space-y-5">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-start gap-4"
              >
                <div className="flex-1">
                  <p className="font-bold text-foreground leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-sm">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator className="bg-border" />

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>Delivery</span>
            <span className="text-foreground font-bold uppercase text-[10px] tracking-widest bg-primary px-2 py-0.5 rounded-full">
              Free
            </span>
          </div>
          <div className="flex justify-between items-end pt-4">
            <span className="text-lg font-black italic">Total</span>
            <span className="text-3xl font-black text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
