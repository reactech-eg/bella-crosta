-- ============================================================
-- BELLA CROSTA — Complete Database Migration Script
-- Combines all migrations into a single comprehensive setup
-- ============================================================
-- This script includes:
-- - Initial schema setup (setup-database.sql)
-- - Migration V2 (Raw Materials System)
-- - Migration V3 (Authentication & Customer Profile)
-- - Migration V4 (Enhanced Admin RLS Policies)
-- ============================================================

-- ============================================================
-- SECTION 1: INITIAL SETUP & SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  stock_qty INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'pizza',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table (stock management)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table (extends auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  alt_phone TEXT,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method TEXT DEFAULT 'instapay',
  payment_proof_url TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items (line items in each order)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table (for manual bank transfer verification)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  bank_account VARCHAR(255),
  proof_image_url TEXT,
  proof_uploaded_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table (for Telegram notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(50),
  message TEXT,
  telegram_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SECTION 2: RAW MATERIALS SYSTEM (Migration V2)
-- ============================================================

CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g',
  stock_qty NUMERIC(10,3) NOT NULL DEFAULT 0,
  low_threshold NUMERIC(10,3) NOT NULL DEFAULT 100,
  cost_per_unit NUMERIC(10,4) DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each product can have multiple raw material ingredients
CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_needed NUMERIC(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, raw_material_id)
);

-- Track raw material deductions per order (audit trail)
CREATE TABLE IF NOT EXISTS raw_material_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_deducted NUMERIC(10,3) NOT NULL,
  deducted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_material ON product_ingredients(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_raw_material_deductions_order ON raw_material_deductions(order_id);

-- ============================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) — ENABLE
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_deductions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 5: RLS POLICIES — CATEGORIES & PRODUCTS
-- ============================================================

CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (TRUE);

CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 6: RLS POLICIES — INVENTORY
-- ============================================================

DROP POLICY IF EXISTS "Inventory viewable by authenticated users" ON inventory;
CREATE POLICY "Inventory viewable by authenticated users" ON inventory FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory;
CREATE POLICY "Admins can manage inventory" ON inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 7: RLS POLICIES — CUSTOMERS
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own data" ON customers;
CREATE POLICY "Users can view their own data" ON customers FOR SELECT USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Users can update their own data" ON customers;
CREATE POLICY "Users can update their own data" ON customers FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON customers FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 8: RLS POLICIES — ORDERS
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (
  auth.uid() = customer_id
  OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" ON orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 9: RLS POLICIES — ORDER ITEMS
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
  OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 10: RLS POLICIES — PAYMENTS
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Admins can update payments" ON payments;
CREATE POLICY "Admins can update payments" ON payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Admins can delete payments" ON payments;
CREATE POLICY "Admins can delete payments" ON payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 11: RLS POLICIES — NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "Admins can view notifications" ON notifications;
CREATE POLICY "Admins can view notifications" ON notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 12: RLS POLICIES — RAW MATERIALS & INGREDIENTS
-- ============================================================

CREATE POLICY "raw_materials_read" ON raw_materials FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "raw_materials_write" ON raw_materials;
DROP POLICY IF EXISTS "raw_materials_admin_write" ON raw_materials;
CREATE POLICY "raw_materials_admin_write" ON raw_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

CREATE POLICY "product_ingredients_read" ON product_ingredients FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "product_ingredients_write" ON product_ingredients;
DROP POLICY IF EXISTS "product_ingredients_admin_write" ON product_ingredients;
CREATE POLICY "product_ingredients_admin_write" ON product_ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

DROP POLICY IF EXISTS "deductions_admin" ON raw_material_deductions;
DROP POLICY IF EXISTS "deductions_admin_only" ON raw_material_deductions;
CREATE POLICY "deductions_admin_only" ON raw_material_deductions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SECTION 13: HELPER FUNCTIONS
-- ============================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_raw_materials_updated_at ON raw_materials;
CREATE TRIGGER set_raw_materials_updated_at
  BEFORE UPDATE ON raw_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create customer profile on new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 14: SEED DATA — CATEGORIES
-- ============================================================

INSERT INTO categories (name, description, icon, display_order) VALUES
  ('Pizzas', 'Classic and specialty pizzas', '🍕', 1),
  ('Appetizers', 'Starters and sides', '🥗', 2),
  ('Beverages', 'Drinks and beverages', '🥤', 3),
  ('Desserts', 'Sweet treats', '🍰', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SECTION 15: SEED DATA — PRODUCTS
-- ============================================================

INSERT INTO products (name, description, price, category_id, is_featured)
SELECT
  'Margherita',
  'Classic Margherita with fresh mozzarella and basil',
  12.99,
  (SELECT id FROM categories WHERE name = 'Pizzas'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Margherita');

INSERT INTO products (name, description, price, category_id, is_featured)
SELECT
  'Pepperoni',
  'Loaded with pepperoni and mozzarella',
  13.99,
  (SELECT id FROM categories WHERE name = 'Pizzas'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pepperoni');

INSERT INTO products (name, description, price, category_id)
SELECT
  'Vegetarian',
  'Fresh vegetables and cheese',
  11.99,
  (SELECT id FROM categories WHERE name = 'Pizzas')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Vegetarian');

INSERT INTO products (name, description, price, category_id)
SELECT
  'Caesar Salad',
  'Fresh romaine with Caesar dressing',
  8.99,
  (SELECT id FROM categories WHERE name = 'Appetizers')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Caesar Salad');

INSERT INTO products (name, description, price, category_id)
SELECT
  'Garlic Bread',
  'Crispy bread with garlic butter',
  4.99,
  (SELECT id FROM categories WHERE name = 'Appetizers')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Garlic Bread');

INSERT INTO products (name, description, price, category_id)
SELECT
  'Coca Cola',
  'Cold refreshing cola drink',
  2.49,
  (SELECT id FROM categories WHERE name = 'Beverages')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Coca Cola');

INSERT INTO products (name, description, price, category_id)
SELECT
  'Tiramisu',
  'Classic Italian dessert with mascarpone',
  6.99,
  (SELECT id FROM categories WHERE name = 'Desserts')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Tiramisu');

-- ============================================================
-- SECTION 16: SEED DATA — INVENTORY
-- ============================================================

INSERT INTO inventory (product_id, quantity_in_stock, low_stock_threshold)
SELECT id, 50, 5 FROM products
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================
-- SECTION 17: SEED DATA — RAW MATERIALS
-- ============================================================

INSERT INTO raw_materials (name, unit, stock_qty, low_threshold, cost_per_unit) VALUES
  ('Flour', 'g', 50000, 5000, 0.002),
  ('Mozzarella Cheese', 'g', 20000, 2000, 0.015),
  ('Tomato Sauce', 'ml', 30000, 3000, 0.003),
  ('Pepperoni', 'g', 10000, 1000, 0.025),
  ('Olive Oil', 'ml', 5000, 500, 0.008),
  ('Fresh Basil', 'g', 2000, 200, 0.05),
  ('Yeast', 'g', 3000, 300, 0.01),
  ('Salt', 'g', 10000, 1000, 0.001),
  ('Black Pepper', 'g', 2000, 200, 0.012),
  ('Garlic', 'g', 5000, 500, 0.005),
  ('Bell Peppers', 'g', 8000, 800, 0.006),
  ('Mushrooms', 'g', 6000, 600, 0.008),
  ('Onions', 'g', 10000, 1000, 0.003),
  ('Butter', 'g', 5000, 500, 0.01),
  ('Eggs', 'pcs', 200, 20, 0.3),
  ('Heavy Cream', 'ml', 5000, 500, 0.007),
  ('Parmesan', 'g', 4000, 400, 0.02),
  ('Sugar', 'g', 10000, 1000, 0.001),
  ('Cocoa Powder', 'g', 3000, 300, 0.015),
  ('Sparkling Water', 'ml', 50000, 5000, 0.001)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Database is now fully set up with all required tables,
-- relationships, security policies, and sample data.
-- ============================================================
