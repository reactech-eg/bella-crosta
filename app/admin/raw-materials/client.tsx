"use client";

import { useEffect, useState, useTransition, useCallback, Fragment } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useAdminStore } from "@/store/admin-store";
import type { RawMaterial } from "@/lib/types";
import {
  Menu,
  Plus,
  Save,
  X,
  Trash2,
  AlertCircle,
  Package2,
  TrendingDown,
  Search,
  Edit3,
  CheckCircle,
  FlaskConical,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const UNITS = ["g", "kg", "ml", "l", "pcs", "tbsp", "tsp", "cup"];

const DEFAULT_FORM: Omit<RawMaterial, "id" | "created_at" | "updated_at"> = {
  name: "",
  unit: "g",
  stock_qty: 0,
  low_threshold: 100,
  cost_per_unit: 0,
  supplier: "",
  notes: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  const pct = threshold > 0 ? qty / threshold : 1;
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-destructive/15 text-destructive">
        Out of Stock
      </span>
    );
  if (pct <= 1)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-yellow-500/15 text-yellow-400">
        <AlertCircle className="w-3 h-3" /> Low
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-green-500/15 text-green-400">
      OK
    </span>
  );
}

interface MaterialFormProps {
  initial?: Partial<RawMaterial>;
  onSave: (
    data: Omit<RawMaterial, "id" | "created_at" | "updated_at">,
  ) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function MaterialForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: MaterialFormProps) {
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...initial,
    supplier: initial?.supplier ?? "",
    notes: initial?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (form.stock_qty < 0) errs.stock_qty = "Stock cannot be negative.";
    if (form.low_threshold <= 0) errs.low_threshold = "Threshold must be > 0.";
    if (form.cost_per_unit < 0) errs.cost_per_unit = "Cost cannot be negative.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave({
      name: form.name.trim(),
      unit: form.unit,
      stock_qty: Number(form.stock_qty),
      low_threshold: Number(form.low_threshold),
      cost_per_unit: Number(form.cost_per_unit),
      supplier: form.supplier?.trim() || null,
      notes: form.notes?.trim() || null,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Name */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Material Name *
        </label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Mozzarella Cheese"
          className={`w-full px-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
            errors.name ? "border-destructive" : "border-border"
          }`}
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      {/* Unit */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Unit of Measure *
        </label>
        <select
          value={form.unit}
          onChange={(e) => set("unit", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Qty */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Current Stock ({form.unit}) *
        </label>
        <input
          type="number"
          min="0"
          step="0.001"
          value={form.stock_qty}
          onChange={(e) => set("stock_qty", e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
            errors.stock_qty ? "border-destructive" : "border-border"
          }`}
        />
        {errors.stock_qty && (
          <p className="text-xs text-destructive mt-1">{errors.stock_qty}</p>
        )}
      </div>

      {/* Low Threshold */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Low Stock Alert ({form.unit}) *
        </label>
        <input
          type="number"
          min="1"
          step="0.001"
          value={form.low_threshold}
          onChange={(e) => set("low_threshold", e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
            errors.low_threshold ? "border-destructive" : "border-border"
          }`}
        />
        {errors.low_threshold && (
          <p className="text-xs text-destructive mt-1">
            {errors.low_threshold}
          </p>
        )}
      </div>

      {/* Cost */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Cost per {form.unit} ($)
        </label>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={form.cost_per_unit}
          onChange={(e) => set("cost_per_unit", e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
            errors.cost_per_unit ? "border-destructive" : "border-border"
          }`}
        />
        {errors.cost_per_unit && (
          <p className="text-xs text-destructive mt-1">
            {errors.cost_per_unit}
          </p>
        )}
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Supplier
        </label>
        <input
          value={form.supplier ?? ""}
          onChange={(e) => set("supplier", e.target.value)}
          placeholder="Optional"
          className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Notes */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Notes
        </label>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional notes about storage, handling, etc."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Actions */}
      <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent transition disabled:opacity-40"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm hover:bg-muted/80 transition"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRawMaterialsClient() {
  const {
    rawMaterials,
    loading,
    errors,
    fetchRawMaterials,
    addRawMaterial,
    editRawMaterial,
    removeRawMaterial,
  } = useAdminStore();

  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isPending, start] = useTransition();

  useEffect(() => {
    fetchRawMaterials();
  }, [fetchRawMaterials]);

  const showFeedback = useCallback((type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  const filtered = rawMaterials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.unit.toLowerCase().includes(search.toLowerCase()),
  );

  const totalMaterials = rawMaterials.length;
  const lowStockCount = rawMaterials.filter(
    (m) => m.stock_qty <= m.low_threshold && m.stock_qty > 0,
  ).length;
  const outOfStockCount = rawMaterials.filter((m) => m.stock_qty === 0).length;

  const handleAdd = async (
    data: Omit<RawMaterial, "id" | "created_at" | "updated_at">,
  ) => {
    start(async () => {
      const result = await addRawMaterial(data);
      if (result.success) {
        setShowAddForm(false);
        showFeedback("success", "Raw material added successfully.");
      } else {
        showFeedback("error", result.error ?? "Failed to add material.");
      }
    });
  };

  const handleEdit = async (
    id: string,
    data: Omit<RawMaterial, "id" | "created_at" | "updated_at">,
  ) => {
    start(async () => {
      const result = await editRawMaterial(id, data);
      if (result.success) {
        setEditingId(null);
        showFeedback("success", "Raw material updated.");
      } else {
        showFeedback("error", result.error ?? "Failed to update.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    start(async () => {
      const result = await removeRawMaterial(id);
      if (result.success) {
        setDeletingId(null);
        showFeedback("success", "Raw material deleted.");
      } else {
        showFeedback("error", result.error ?? "Failed to delete.");
      }
    });
  };

  return (
    <>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      {/* Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Raw Materials</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent transition"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
          <button
            onClick={() => setMobile(true)}
            className="md:hidden p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Feedback toast */}
        {feedback && (
          <div
            className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              feedback.type === "success"
                ? "bg-green-500/15 border border-green-500/25 text-green-400"
                : "bg-destructive/15 border border-destructive/25 text-destructive"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedback.msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Materials",
              value: totalMaterials,
              icon: FlaskConical,
              color: "text-primary",
            },
            {
              label: "Low Stock",
              value: lowStockCount,
              icon: TrendingDown,
              color: "text-yellow-400",
            },
            {
              label: "Out of Stock",
              value: outOfStockCount,
              icon: AlertCircle,
              color: "text-destructive",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color} opacity-60`} />
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-card border border-primary/30 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Add New Raw Material
            </h3>
            <MaterialForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
              isPending={isPending}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="w-full sm:max-w-xs pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Mobile add button */}
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
          }}
          className="sm:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent transition"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </button>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {errors.rawMaterials && (
            <div className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{errors.rawMaterials}</p>
              <button
                onClick={fetchRawMaterials}
                className="mt-3 text-primary text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!errors.rawMaterials && loading.rawMaterials && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              Loading materials…
            </div>
          )}

          {!errors.rawMaterials &&
            !loading.rawMaterials &&
            filtered.length === 0 && (
              <div className="p-12 text-center">
                <Package2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">
                  {search
                    ? "No materials match your search."
                    : "No raw materials yet. Add your first one."}
                </p>
              </div>
            )}

          {!errors.rawMaterials &&
            !loading.rawMaterials &&
            filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {[
                        "Material",
                        "Unit",
                        "Stock",
                        "Threshold",
                        "Cost/Unit",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <Fragment key={m.id}>
                        <tr
                          className="border-b border-border hover:bg-muted/20 transition"
                        >
                          <td className="px-4 sm:px-5 py-3">
                            <p className="font-medium text-foreground">
                              {m.name}
                            </p>
                            {m.supplier && (
                              <p className="text-xs text-muted-foreground">
                                {m.supplier}
                              </p>
                            )}
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-muted-foreground">
                            {m.unit}
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span
                              className={`font-semibold ${
                                m.stock_qty === 0
                                  ? "text-destructive"
                                  : m.stock_qty <= m.low_threshold
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {Number(m.stock_qty).toLocaleString()} {m.unit}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-muted-foreground">
                            {Number(m.low_threshold).toLocaleString()} {m.unit}
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-muted-foreground">
                            ${Number(m.cost_per_unit).toFixed(4)}
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <StockBadge
                              qty={Number(m.stock_qty)}
                              threshold={Number(m.low_threshold)}
                            />
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingId(
                                    editingId === m.id ? null : m.id,
                                  );
                                  setShowAddForm(false);
                                  setDeletingId(null);
                                }}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeletingId(
                                    deletingId === m.id ? null : m.id,
                                  )
                                }
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Edit form inline */}
                        {editingId === m.id && (
                          <tr
                            className="bg-muted/10 border-b border-primary/20"
                          >
                            <td colSpan={7} className="px-4 sm:px-6 py-4">
                              <div className="max-w-3xl">
                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                                  Editing: {m.name}
                                </h4>
                                <MaterialForm
                                  initial={m}
                                  onSave={(data) => handleEdit(m.id, data)}
                                  onCancel={() => setEditingId(null)}
                                  isPending={isPending}
                                />
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Delete confirm inline */}
                        {deletingId === m.id && (
                          <tr
                            className="bg-destructive/5 border-b border-destructive/20"
                          >
                            <td colSpan={7} className="px-4 sm:px-6 py-3">
                              <div className="flex items-center gap-4">
                                <p className="text-sm text-foreground">
                                  Delete <strong>{m.name}</strong>? This cannot
                                  be undone.
                                </p>
                                <button
                                  onClick={() => handleDelete(m.id)}
                                  disabled={isPending}
                                  className="flex items-center gap-1.5 px-4 py-1.5 bg-destructive text-white rounded-lg text-xs font-semibold hover:bg-destructive/90 transition disabled:opacity-50"
                                >
                                  {isPending ? "Deleting…" : "Confirm Delete"}
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs hover:bg-muted/80 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
