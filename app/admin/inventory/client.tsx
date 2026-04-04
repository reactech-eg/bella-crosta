"use client";

import { useEffect, useState, useTransition } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useAdminStore } from "@/store/admin-store";
import type { Product } from "@/lib/types";
import { Menu, AlertCircle, Save, X, RefreshCw } from "lucide-react";

const LOW = 10;

export default function AdminInventoryPage() {
  const { products, loading, errors, fetchProducts, editProduct } = useAdminStore();
  const [mobile, setMobile] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [qtyError, setQtyError] = useState("");
  const [isPending, start] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setEditQty(String(p.stock_qty));
    setQtyError("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditQty("");
    setQtyError("");
  };

  const saveEdit = (productId: string) => {
    const qty = parseInt(editQty, 10);
    if (!Number.isFinite(qty) || qty < 0 || qty > 99999) {
      setQtyError("Enter a valid quantity (0–99999).");
      return;
    }
    setQtyError("");
    start(async () => {
      const result = await editProduct(productId, { stock_qty: qty });
      cancelEdit();
      if (result.success) {
        setFeedback("Stock updated.");
        setTimeout(() => setFeedback(null), 2500);
      }
    });
  };

  const low = products.filter((p) => p.stock_qty <= LOW && p.is_available);
  const inStock = products.filter((p) => p.stock_qty > LOW && p.is_available);

  return (
    <>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-foreground">Inventory</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProducts()}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Feedback */}
        {feedback && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 text-sm">
            {feedback}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Products</p>
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">In Stock</p>
            <p className="text-2xl font-bold text-green-400">{inStock.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-400">{low.length}</p>
          </div>
        </div>

        {/* Error state */}
        {errors.products && (
          <div className="bg-card border border-border rounded-xl p-6 text-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{errors.products}</p>
            <button onClick={fetchProducts} className="mt-3 text-primary text-sm hover:underline">Try again</button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading.products ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              Loading inventory…
            </div>
          ) : !errors.products && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Product", "Category", "Stock Qty", "Status", "Action"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.stock_qty <= LOW;
                    const isEdit = editId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-border hover:bg-muted/20 transition ${!p.is_available ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 sm:px-6 py-3 font-medium text-foreground">
                          {p.name}
                          {!p.is_available && (
                            <span className="ml-2 text-xs text-muted-foreground">(unavailable)</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-muted-foreground capitalize">{p.category}</td>
                        <td className="px-4 sm:px-6 py-3">
                          {isEdit ? (
                            <div>
                              <input
                                type="number"
                                min="0"
                                max="99999"
                                value={editQty}
                                onChange={(e) => { setEditQty(e.target.value); setQtyError(""); }}
                                className={`w-24 px-2 py-1 border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${qtyError ? "border-destructive" : "border-border"}`}
                                autoFocus
                              />
                              {qtyError && <p className="text-xs text-destructive mt-1">{qtyError}</p>}
                            </div>
                          ) : (
                            <span className={`font-semibold ${isLow ? "text-yellow-400" : "text-green-400"}`}>
                              {p.stock_qty}
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/15 text-yellow-400">
                              <AlertCircle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/15 text-green-400">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {isEdit ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveEdit(p.id)}
                                disabled={isPending}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-accent transition disabled:opacity-50"
                              >
                                <Save className="w-3 h-3" />
                                {isPending ? "…" : "Save"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs hover:bg-muted/80 transition"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(p)}
                              className="text-primary hover:underline text-xs font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}