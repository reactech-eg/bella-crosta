"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth";
import { updateProfile } from "@/app/actions/profile";
import type { UpdateProfileInput } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import {
  User,
  Package,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Pencil,
  X,
  Check,
  Phone,
  MapPin,
  MailIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { Customer } from "@/lib/types";

interface Props {
  customer: Customer | null;
}

export default function ProfileClient({ customer: initialCustomer }: Props) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // ── Edit state ───────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [form, setForm] = useState<UpdateProfileInput>({
    full_name: initialCustomer?.full_name ?? "",
    phone: initialCustomer?.phone ?? "",
    alt_phone: initialCustomer?.alt_phone ?? "",
    address: initialCustomer?.address ?? "",
  });

  const handleEdit = () => {
    setForm({
      full_name: customer?.full_name ?? "",
      phone: customer?.phone ?? "",
      alt_phone: customer?.alt_phone ?? "",
      address: customer?.address ?? "",
    });
    setSaveError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = () => {
    setSaveError(null);
    startTransition(async () => {
      const result = await updateProfile(form);
      if (result.success) {
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                full_name: form.full_name.trim() || null,
                phone: form.phone.trim() || null,
                alt_phone: form.alt_phone.trim() || null,
                address: form.address.trim() || null,
              }
            : prev,
        );
        setEditing(false);
      } else {
        setSaveError(result.error);
      }
    });
  };

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") router.push("/auth/login");
    return null;
  }

  const displayName =
    customer?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joinedDate = customer?.created_at
    ? new Date(customer.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Menu
        </Link>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* ── Left Column ── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="h-24 bg-linear-to-r from-primary/20 to-accent/20" />
              <div className="relative px-6 pb-6">
                <div className="absolute -top-12 left-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-card bg-primary text-3xl font-black text-primary-foreground shadow-xl">
                    {initials}
                  </div>
                </div>
                <div className="pt-14">
                  <h2 className="text-xl font-black tracking-tight text-foreground truncate">
                    {displayName}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    {user.role || "Standard"} Member
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Status
                </p>
                <p className="mt-1 font-black text-foreground">Active</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Joined
                </p>
                <p className="mt-1 font-black text-foreground text-sm">
                  {joinedDate}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Account Details Card */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-foreground">
                      Account Details
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      Your profile and contact information
                    </p>
                  </div>
                </div>
                {!editing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-5">
                  {[
                    {
                      label: "Full Name",
                      key: "full_name" as const,
                      placeholder: "Your full name",
                      icon: <User className="w-4 h-4" />,
                    },
                    {
                      label: "Phone",
                      key: "phone" as const,
                      placeholder: "+20 1XX XXX XXXX",
                      icon: <Phone className="w-4 h-4" />,
                    },
                    {
                      label: "Alt. Phone",
                      key: "alt_phone" as const,
                      placeholder: "Alternative number",
                      icon: <Phone className="w-4 h-4" />,
                    },
                    {
                      label: "Delivery Address",
                      key: "address" as const,
                      placeholder: "Your full delivery address",
                      icon: <MapPin className="w-4 h-4" />,
                    },
                  ].map(({ label, key, placeholder, icon }) => (
                    <div key={key}>
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 px-0.5 block">
                        {label}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {icon}
                        </span>
                        <input
                          type="text"
                          value={form[key]}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={placeholder}
                          className="w-full rounded-2xl border border-border bg-background pl-11 pr-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  ))}

                  {saveError && (
                    <p className="text-sm text-destructive font-medium px-1">
                      {saveError}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60 transition-all active:scale-95"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {isPending ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isPending}
                      className="flex items-center gap-2 rounded-2xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Email Address",
                      value: user.email,
                      icon: (
                        <MailIcon className="w-4 h-4 text-muted-foreground" />
                      ),
                    },
                    {
                      label: "Full Name",
                      value: customer?.full_name || "—",
                      icon: <User className="w-4 h-4 text-muted-foreground" />,
                    },
                    {
                      label: "Phone",
                      value: customer?.phone || "—",
                      icon: <Phone className="w-4 h-4 text-muted-foreground" />,
                    },
                    {
                      label: "Alt. Phone",
                      value: customer?.alt_phone || "—",
                      icon: <Phone className="w-4 h-4 text-muted-foreground" />,
                    },
                    {
                      label: "Delivery Address",
                      value: customer?.address || "—",
                      icon: (
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      ),
                      full: true,
                    },
                  ].map(({ label, value, icon, full }) => (
                    <div
                      key={label}
                      className={`group relative${full ? " sm:col-span-2" : ""}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 px-0.5">
                        {label}
                      </p>
                      <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-all duration-300 group-hover:border-primary/20 group-hover:bg-muted/50">
                        {icon}
                        <p className="text-sm font-bold text-foreground truncate">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/menu"
                className="group flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white/20 p-2">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">Order Now</p>
                    <p className="text-xs opacity-80">Fresh pizzas await</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/orders"
                className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-secondary p-2">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-foreground">
                      My Orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Track your orders
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-bold text-destructive transition-all hover:bg-destructive hover:text-white disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-8" />
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="h-24 bg-muted" />
            <div className="p-6 pt-14 relative">
              <div className="absolute -top-12 left-6 h-24 w-24 rounded-3xl bg-muted border-4 border-card" />
              <div className="h-6 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-muted rounded-2xl" />
            <div className="h-20 bg-muted rounded-2xl" />
          </div>
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="h-80 bg-muted rounded-3xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-20 bg-muted rounded-2xl" />
            <div className="h-20 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
