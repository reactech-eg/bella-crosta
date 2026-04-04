-- ============================================================
-- Bella Crosta — Migration V2
-- Raw Materials System + Product Ingredients + Fixes
-- ============================================================

-- 1. Ensure products table has the correct columns (flat category + stock_qty)
--    The live DB uses category TEXT and stock_qty INT directly on products.
--    This migration is idempotent and safe to run multiple times.

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'pizza';

-- 2. Ensure customers table has alt_phone column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alt_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Ensure orders table has payment_method and payment_proof_url
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'instapay';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- ============================================================
-- RAW MATERIALS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS raw_materials (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'g',           -- g, kg, ml, l, pcs, etc.
  stock_qty    NUMERIC(10,3) NOT NULL DEFAULT 0,
  low_threshold NUMERIC(10,3) NOT NULL DEFAULT 100,
  cost_per_unit NUMERIC(10,4) DEFAULT 0,            -- cost tracking
  supplier     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Each product can have multiple raw material ingredients
CREATE TABLE IF NOT EXISTS product_ingredients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id  UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_needed  NUMERIC(10,3) NOT NULL DEFAULT 0,  -- per 1 unit of product
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, raw_material_id)
);

-- Track raw material deductions per order (audit trail)
CREATE TABLE IF NOT EXISTS raw_material_deductions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  raw_material_id  UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_deducted NUMERIC(10,3) NOT NULL,
  deducted_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_material ON product_ingredients(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_raw_material_deductions_order ON raw_material_deductions(order_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_deductions ENABLE ROW LEVEL SECURITY;

-- Raw materials: everyone can read, only service role (admin) can write
DROP POLICY IF EXISTS "raw_materials_read" ON raw_materials;
CREATE POLICY "raw_materials_read" ON raw_materials
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "raw_materials_write" ON raw_materials;
CREATE POLICY "raw_materials_write" ON raw_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Product ingredients: everyone can read
DROP POLICY IF EXISTS "product_ingredients_read" ON product_ingredients;
CREATE POLICY "product_ingredients_read" ON product_ingredients
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "product_ingredients_write" ON product_ingredients;
CREATE POLICY "product_ingredients_write" ON product_ingredients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Deductions: only admins
DROP POLICY IF EXISTS "deductions_admin" ON raw_material_deductions;
CREATE POLICY "deductions_admin" ON raw_material_deductions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ============================================================
-- UPDATED_AT TRIGGER FOR RAW MATERIALS
-- ============================================================

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

-- ============================================================
-- SAMPLE RAW MATERIALS DATA
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
-- SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================================
-- Run this separately in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);