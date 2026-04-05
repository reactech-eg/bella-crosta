"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useAdminStore } from "@/store/admin-store";
import { uploadProductImage } from "@/lib/actions";
import type { Product, IngredientFormItem } from "@/lib/types";
import {
  Menu,
  Plus,
  X,
  Save,
  Trash2,
  AlertCircle,
  Search,
  Edit3,
  CheckCircle,
  ImagePlus,
  ChefHat,
  Package,
  Star,
  ToggleLeft,
  ToggleRight,
  FlaskConical,
  Minus,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "pizza",
  "appetizer",
  "beverage",
  "dessert",
  "salad",
  "side",
  "other",
];

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  imagePreview: string;
  is_featured: boolean;
  stock_qty: string;
  ingredients: IngredientFormItem[];
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  price: "",
  category: "pizza",
  image_url: "",
  imagePreview: "",
  is_featured: false,
  stock_qty: "0",
  ingredients: [],
};

// ─── Image Uploader ───────────────────────────────────────────────────────────

function ImageUploader({
  preview,
  onImageSelected,
  uploading,
}: {
  preview: string;
  onImageSelected: (base64: string, preview: string) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelected(result, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        Product Image
      </label>
      {preview ? (
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border group">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onImageSelected("", "")}
            className="absolute top-2 right-2 p-1.5 bg-card/90 border border-border rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-muted"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <label
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-primary/50 transition-colors group"
        >
          <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition" />
          <span className="text-sm text-muted-foreground">
            Click to upload image
          </span>
          <span className="text-xs text-muted-foreground/60">
            PNG, JPG up to 5MB
          </span>
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// ─── Ingredient Picker ────────────────────────────────────────────────────────

function IngredientPicker({
  ingredients,
  rawMaterials,
  onChange,
}: {
  ingredients: IngredientFormItem[];
  rawMaterials: Array<{ id: string; name: string; unit: string }>;
  onChange: (items: IngredientFormItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const available = rawMaterials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      !ingredients.some((i) => i.raw_material_id === m.id),
  );

  const addIngredient = (m: { id: string; name: string; unit: string }) => {
    onChange([
      ...ingredients,
      {
        raw_material_id: m.id,
        raw_material_name: m.name,
        unit: m.unit,
        quantity_needed: 100,
      },
    ]);
    setSearch("");
  };

  const updateQty = (materialId: string, qty: number) => {
    onChange(
      ingredients.map((i) =>
        i.raw_material_id === materialId
          ? { ...i, quantity_needed: Math.max(0, qty) }
          : i,
      ),
    );
  };

  const removeIngredient = (materialId: string) => {
    onChange(ingredients.filter((i) => i.raw_material_id !== materialId));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Ingredients (Raw Materials)
      </label>

      {/* Current ingredients */}
      {ingredients.length > 0 && (
        <div className="space-y-2 mb-3">
          {ingredients.map((ing) => (
            <div
              key={ing.raw_material_id}
              className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2"
            >
              <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm text-foreground flex-1 font-medium">
                {ing.raw_material_name}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateQty(ing.raw_material_id, ing.quantity_needed - 10)
                  }
                  className="p-1 hover:bg-muted rounded-lg transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={ing.quantity_needed}
                  onChange={(e) =>
                    updateQty(ing.raw_material_id, Number(e.target.value))
                  }
                  className="w-16 text-center px-2 py-1 bg-input border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground w-6">
                  {ing.unit}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateQty(ing.raw_material_id, ing.quantity_needed + 10)
                  }
                  className="p-1 hover:bg-muted rounded-lg transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(ing.raw_material_id)}
                className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search to add */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search to add ingredient…"
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {search && available.length > 0 && (
        <div className="mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
          {available.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => addIngredient(m)}
              className="w-full text-left px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
              {m.name}
              <span className="text-xs text-muted-foreground ml-auto">
                {m.unit}
              </span>
            </button>
          ))}
        </div>
      )}
      {search && available.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground pl-1">
          No matching materials. All already added or none found.
        </p>
      )}
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function ProductForm({
  initial,
  rawMaterials,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<Product>;
  rawMaterials: Array<{ id: string; name: string; unit: string }>;
  onSave: (form: ProductFormState, imageBase64: string) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<ProductFormState>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
    category: initial?.category ?? "pizza",
    image_url: initial?.image_url ?? "",
    imagePreview: initial?.image_url ?? "",
    is_featured: initial?.is_featured ?? false,
    stock_qty: initial?.stock_qty?.toString() ?? "0",
    ingredients:
      (
        initial as Product & {
          product_ingredients?: Array<{
            raw_material_id: string;
            quantity_needed: number;
            raw_materials?: { name: string; unit: string };
          }>;
        }
      )?.product_ingredients?.map((pi) => ({
        raw_material_id: pi.raw_material_id,
        raw_material_name: pi.raw_materials?.name ?? "",
        unit: pi.raw_materials?.unit ?? "",
        quantity_needed: pi.quantity_needed,
      })) ?? [],
  });
  const [imageBase64, setImageBase64] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const set = (field: keyof ProductFormState, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    const price = parseFloat(form.price);
    if (!form.price || !Number.isFinite(price) || price <= 0)
      errs.price = "Valid price required.";
    const qty = parseInt(form.stock_qty);
    if (isNaN(qty) || qty < 0) errs.stock_qty = "Stock must be ≥ 0.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Name */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Product Name *
        </label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Quattro Formaggi"
          className={`w-full px-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all ${formErrors.name ? "border-destructive" : "border-border"}`}
        />
        {formErrors.name && (
          <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the product…"
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Price (USD) *
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
            className={`w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.price ? "border-destructive" : "border-border"}`}
          />
        </div>
        {formErrors.price && (
          <p className="text-xs text-destructive mt-1">{formErrors.price}</p>
        )}
      </div>

      {/* Stock */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Stock Qty *
        </label>
        <input
          type="number"
          min="0"
          value={form.stock_qty}
          onChange={(e) => set("stock_qty", e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.stock_qty ? "border-destructive" : "border-border"}`}
        />
        {formErrors.stock_qty && (
          <p className="text-xs text-destructive mt-1">
            {formErrors.stock_qty}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Category *
        </label>
        <select
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Featured toggle */}
      <div className="flex items-center gap-3 pt-5">
        <button
          type="button"
          onClick={() => set("is_featured", !form.is_featured)}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          {form.is_featured ? (
            <ToggleRight className="w-6 h-6 text-primary" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-muted-foreground" />
          )}
          <Star
            className={`w-4 h-4 ${form.is_featured ? "text-yellow-400" : "text-muted-foreground"}`}
          />
          Featured on homepage
        </button>
      </div>

      {/* Image */}
      <div className="sm:col-span-2">
        <ImageUploader
          preview={form.imagePreview}
          onImageSelected={(base64, preview) => {
            setImageBase64(base64);
            set("imagePreview", preview);
          }}
          uploading={false}
        />
      </div>

      {/* Ingredients */}
      <div className="sm:col-span-2 border-t border-border pt-4">
        <IngredientPicker
          ingredients={form.ingredients}
          rawMaterials={rawMaterials}
          onChange={(items) => set("ingredients", items)}
        />
      </div>

      {/* Submit */}
      <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => validate() && onSave(form, imageBase64)}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent transition disabled:opacity-40"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending
            ? "Saving…"
            : initial
              ? "Update Product"
              : "Create Product"}
        </button>
        <button
          type="button"
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

export default function AdminProductsClient() {
  const {
    products,
    rawMaterials,
    loading,
    fetchProducts,
    fetchRawMaterials,
    addProduct,
    editProduct,
    removeProduct,
  } = useAdminStore();

  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isPending, start] = useTransition();

  useEffect(() => {
    fetchProducts();
    fetchRawMaterials();
  }, [fetchProducts, fetchRawMaterials]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async (
    isEdit: boolean,
    productId: string | null,
    form: ProductFormState,
    imageBase64: string,
  ) => {
    start(async () => {
      // 1. Upload image if new one selected
      let finalImageUrl = form.image_url;
      if (imageBase64) {
        const uploadResult = await uploadProductImage(
          imageBase64,
          form.name.replace(/\s+/g, "-").toLowerCase(),
        );
        if (uploadResult.success && uploadResult.data) {
          finalImageUrl = uploadResult.data.url;
        } else {
          // Non-fatal: continue without new image
          finalImageUrl = form.image_url || "";
        }
      }

      const productData = {
        name: form.name.trim(),
        description: form.description.trim() || "",
        price: parseFloat(form.price),
        category: form.category,
        image_url: finalImageUrl,
        is_featured: form.is_featured,
        stock_qty: parseInt(form.stock_qty),
        ingredients: form.ingredients,
      };

      const ingredients = form.ingredients.map((i) => ({
        raw_material_id: i.raw_material_id,
        quantity_needed: i.quantity_needed,
      }));

      let result: { success: boolean; error?: string };

      if (isEdit && productId) {
        result = await editProduct(productId, productData, ingredients);
      } else {
        result = await addProduct(productData);
      }

      if (result.success) {
        setShowAddForm(false);
        setEditingId(null);
        showFeedback(
          "success",
          isEdit ? "Product updated." : "Product created.",
        );
      } else {
        showFeedback("error", result.error ?? "Failed to save product.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    start(async () => {
      const result = await removeProduct(id);
      if (result.success) {
        setDeletingId(null);
        showFeedback("success", "Product removed from store.");
      } else {
        showFeedback("error", result.error ?? "Failed to delete.");
      }
    });
  };

  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const materialOptions = rawMaterials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
  }));

  return (
    <>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ChefHat className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Products</h1>
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
            Add Product
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
        {/* Feedback */}
        {feedback && (
          <div
            className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: products.length, color: "text-primary" },
            {
              label: "Available",
              value: products.filter((p) => p.is_available).length,
              color: "text-green-400",
            },
            {
              label: "Featured",
              value: products.filter((p) => p.is_featured).length,
              color: "text-yellow-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="bg-card border border-primary/30 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Add New Product
            </h3>
            <ProductForm
              rawMaterials={materialOptions}
              onSave={(form, b64) => handleSave(false, null, form, b64)}
              onCancel={() => setShowAddForm(false)}
              isPending={isPending}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition capitalize ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile add */}
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
          }}
          className="sm:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>

        {/* Products grid */}
        {loading.products && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-52 bg-card border border-border rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading.products && filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">
              {search ? "No products match your search." : "No products yet."}
            </p>
          </div>
        )}

        {!loading.products && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const isEditing = editingId === p.id;
              const isDeleting = deletingId === p.id;
              const ingredients =
                (
                  p as Product & {
                    product_ingredients?: Array<{
                      raw_material_id: string;
                      quantity_needed: number;
                      raw_materials?: { name: string; unit: string };
                    }>;
                  }
                ).product_ingredients ?? [];

              return (
                <div
                  key={p.id}
                  className={`bg-card border rounded-xl overflow-hidden transition-all ${
                    isEditing
                      ? "border-primary/50 col-span-full"
                      : "border-border"
                  } ${!p.is_available ? "opacity-60" : ""}`}
                >
                  {/* Edit form (full width) */}
                  {isEditing ? (
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-primary" /> Editing:{" "}
                        {p.name}
                      </h3>
                      <ProductForm
                        initial={p}
                        rawMaterials={materialOptions}
                        onSave={(form, b64) =>
                          handleSave(true, p.id, form, b64)
                        }
                        onCancel={() => setEditingId(null)}
                        isPending={isPending}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Product card */}
                      <div className="relative h-40 bg-muted overflow-hidden">
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🍕
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white capitalize">
                          {p.category}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary rounded-full text-xs font-bold text-white">
                          ${Number(p.price).toFixed(2)}
                        </span>
                        {p.is_featured && (
                          <Star className="absolute bottom-2 right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <div className="p-3.5">
                        <h3 className="font-semibold text-foreground text-sm mb-0.5">
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {p.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-medium ${p.stock_qty <= 10 ? "text-yellow-400" : "text-green-400"}`}
                          >
                            Stock: {p.stock_qty}
                          </span>
                          {ingredients.length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FlaskConical className="w-3 h-3" />{" "}
                              {ingredients.length} ingredients
                            </span>
                          )}
                        </div>

                        {/* Delete confirm */}
                        {isDeleting ? (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={isPending}
                              className="flex-1 py-1.5 bg-destructive text-white rounded-lg text-xs font-semibold hover:bg-destructive/90 transition disabled:opacity-50"
                            >
                              {isPending ? "…" : "Confirm Delete"}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="py-1.5 px-3 bg-muted text-foreground rounded-lg text-xs hover:bg-muted/80 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingId(p.id);
                                setShowAddForm(false);
                                setDeletingId(null);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => setDeletingId(p.id)}
                              className="py-1.5 px-3 text-destructive hover:bg-destructive/10 rounded-lg text-xs transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
