"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import type { Order } from "@/lib/types";
import {
  Menu,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Package,
  Clock,
  ArrowRight,
  FlaskConical,
  ChefHat,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ProductStats = {
  totalProducts: number;
  availableProducts: number;
  featuredProducts: number;
  outOfStock: number;
  salesByCategory: Array<{ category: string; sold: number; revenue: number }>;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
    price: number;
  }>;
};

export default function AdminDashboardClient({
  orders,
  productStats,
}: {
  orders: Order[];
  productStats: ProductStats | null;
}) {
  const [mobile, setMobile] = useState(false);

  // Stats
  const total = orders.length;
  const revenue = orders
    .filter((o) => o.payment_status === "confirmed")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const awaitingPayment = orders.filter(
    (o) => o.payment_status === "uploaded",
  ).length;
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const statusColor = (s: string) =>
    ({
      pending: "bg-yellow-500/15 text-yellow-400",
      confirmed: "bg-blue-500/15 text-blue-400",
      preparing: "bg-primary/15 text-primary",
      delivered: "bg-green-500/15 text-green-400",
      cancelled: "bg-destructive/15 text-destructive",
    })[s] ?? "bg-muted text-muted-foreground";

  const kpis = [
    {
      label: "Total Orders",
      value: total,
      icon: ShoppingCart,
      color: "text-primary",
      sub: `${todayOrders} today`,
    },
    {
      label: "Confirmed Revenue",
      value: `$${revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-400",
      sub: "from confirmed payments",
    },
    {
      label: "Pending Orders",
      value: pending,
      icon: Package,
      color: "text-yellow-400",
      sub: "awaiting processing",
    },
    {
      label: "Awaiting Payment",
      value: awaitingPayment,
      icon: CreditCard,
      color: "text-orange-400",
      sub: "proofs uploaded",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/orders",
      icon: ShoppingCart,
      label: "Manage Orders",
      desc: "View and update order statuses",
    },
    {
      href: "/admin/payments",
      icon: CreditCard,
      label: "Verify Payments",
      desc: "Review uploaded proof screenshots",
      badge: awaitingPayment > 0 ? awaitingPayment : null,
    },
    {
      href: "/admin/products",
      icon: ChefHat,
      label: "Manage Products",
      desc: "Add, edit, or remove menu items",
    },
    {
      href: "/admin/raw-materials",
      icon: FlaskConical,
      label: "Raw Materials",
      desc: "Track and manage ingredient stock",
    },
  ];

  // Theme-aligned color palette: Primary orange, accent deeper orange, with complementary colors
  const COLORS = [
    "#e8652a", // primary - burnished terracotta
    "#c4501e", // accent - deeper ember
    "#f59e0b", // amber
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#8b5cf6", // violet
  ];

  return (
    <>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setMobile(true)}
          className="md:hidden p-2 hover:bg-muted rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Icon, color, sub }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-muted-foreground text-xs">{label}</p>
                <Icon className={`w-5 h-5 opacity-30 ${color}`} />
              </div>
              <p className={`text-2xl font-bold mb-1 ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        {/* Product Stats KPIs */}
        {productStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-muted-foreground text-xs">Total Products</p>
                <Package className="w-5 h-5 opacity-30 text-primary" />
              </div>
              <p className="text-2xl font-bold mb-1 text-primary">
                {productStats.totalProducts}
              </p>
              <p className="text-xs text-muted-foreground">
                {productStats.availableProducts} available
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-muted-foreground text-xs">Featured</p>
                <TrendingUp className="w-5 h-5 opacity-30 text-blue-400" />
              </div>
              <p className="text-2xl font-bold mb-1 text-blue-400">
                {productStats.featuredProducts}
              </p>
              <p className="text-xs text-muted-foreground">promoted items</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-muted-foreground text-xs">Out of Stock</p>
                <AlertCircle className="w-5 h-5 opacity-30 text-destructive" />
              </div>
              <p className="text-2xl font-bold mb-1 text-destructive">
                {productStats.outOfStock}
              </p>
              <p className="text-xs text-muted-foreground">need restocking</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-muted-foreground text-xs">Product Revenue</p>
                <TrendingDown className="w-5 h-5 opacity-30 text-green-400" />
              </div>
              <p className="text-2xl font-bold mb-1 text-green-400">
                $
                {(
                  productStats.salesByCategory.reduce(
                    (sum, cat) => sum + cat.revenue,
                    0,
                  ) || 0
                ).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                from confirmed sales
              </p>
            </div>
          </div>
        )}

        {/* Attention Banner */}
        {awaitingPayment > 0 && (
          <Link
            href="/admin/payments"
            className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl hover:bg-yellow-500/15 transition group"
          >
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400">
                {awaitingPayment} payment{awaitingPayment > 1 ? "s" : ""}{" "}
                awaiting review
              </p>
              <p className="text-xs text-muted-foreground">
                Click to verify payment proofs
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-yellow-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Charts Section */}
        {productStats && productStats.salesByCategory.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sales by Category Chart */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground text-sm mb-6">
                Sales by Category
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productStats.salesByCategory}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={`${COLORS[1]}80`}
                  />
                  <XAxis
                    dataKey="category"
                    stroke="currentColor"
                    className="text-xs"
                  />
                  <YAxis stroke="currentColor" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sold" fill={COLORS[3]} name="Units Sold" />
                  <Bar dataKey="revenue" fill={COLORS[1]} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution Pie Chart */}
            {productStats.salesByCategory.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-foreground text-sm mb-6">
                  Category Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productStats.salesByCategory}
                      dataKey="sold"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {productStats.salesByCategory.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-foreground text-sm mb-3">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickLinks.map(({ href, icon: Icon, label, desc, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-muted/30 transition group"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {label}
                      </p>
                      {badge && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {desc}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Top Selling Products */}
          {productStats && productStats.topProducts.length > 0 && (
            <div className="lg:col-span-1">
              <h2 className="font-semibold text-foreground text-sm mb-3">
                Top Selling
              </h2>
              <div className="space-y-2">
                {productStats.topProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{product.sold} sold</span>
                      <span className="text-green-400 font-semibold">
                        ${product.revenue.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-foreground text-sm">
                  Recent Orders
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm flex-1 flex items-center justify-center">
                  No orders yet.
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <div className="divide-y divide-border">
                    {orders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        className="px-5 py-3 hover:bg-muted/30 transition"
                      >
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-primary hover:underline font-medium text-xs block mb-1"
                        >
                          {o.order_number}
                        </Link>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            ${Number(o.total_amount).toFixed(2)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${statusColor(o.status)}`}
                          >
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
