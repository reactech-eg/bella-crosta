export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_featured: boolean;
  is_available: boolean;
  stock_qty: number;
  created_at: string;
  // Populated via join when needed
  product_ingredients?: ProductIngredient[];
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;               // g, kg, ml, l, pcs, etc.
  stock_qty: number;
  low_threshold: number;
  cost_per_unit: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity_needed: number;
  created_at: string;
  // Populated via join
  raw_materials?: RawMaterial;
}

export interface RawMaterialDeduction {
  id: string;
  order_id: string;
  raw_material_id: string;
  quantity_deducted: number;
  deducted_at: string;
  raw_materials?: RawMaterial;
}

export interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  alt_phone: string | null;
  address: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: "instapay" | "vodafone_cash";
  bank_account: string | null;
  proof_image_url: string | null;
  proof_uploaded_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  status: "pending" | "confirmed" | "preparing" | "delivered" | "cancelled";
  total_amount: number;
  delivery_address: string | null;
  delivery_notes: string | null;
  payment_method: "instapay" | "vodafone_cash";
  payment_status: "pending" | "uploaded" | "confirmed";
  payment_proof_url: string | null;
  created_at: string;
  order_items?: OrderItem[];
  customers?: Customer;
  payments?: Payment[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export type UserRole = "admin" | "customer";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export type AuthResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

// Form types for admin product management
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_featured: boolean;
  stock_qty: number;
  ingredients: IngredientFormItem[];
}

export interface IngredientFormItem {
  raw_material_id: string;
  raw_material_name: string;
  unit: string;
  quantity_needed: number;
}