-- ============================================================
-- Bella Crosta — Migration V4
-- Enhanced RLS Policies for Admin Users
-- ============================================================

-- ============================================================
-- ORDERS TABLE — Enhanced Admin Access
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = customer_id 
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- ORDER ITEMS TABLE — Enhanced Admin Access
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- CUSTOMERS TABLE — Enhanced Admin Access
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own data" ON customers;
CREATE POLICY "Users can view their own data" ON customers
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- PAYMENTS TABLE — Enhanced Admin Access
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admins can update payments" ON payments;
CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admins can delete payments" ON payments;
CREATE POLICY "Admins can delete payments" ON payments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- PRODUCTS TABLE — Admin Write Access
-- ============================================================

DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- INVENTORY TABLE — Enhanced Admin Access
-- ============================================================

DROP POLICY IF EXISTS "Inventory viewable by authenticated users" ON inventory;
CREATE POLICY "Inventory viewable by authenticated users" ON inventory
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory;
CREATE POLICY "Admins can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- ADMIN USERS TABLE — Profile Management (No RLS - Server-side auth)
-- ============================================================

-- Disable RLS on admin_users — it's an internal authorization table
-- All access control is handled server-side via admin_client (uses service_role)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- RAW MATERIALS — Enhanced Admin Write Access
-- ============================================================

DROP POLICY IF EXISTS "raw_materials_write" ON raw_materials;
CREATE POLICY "raw_materials_admin_write" ON raw_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- PRODUCT INGREDIENTS — Enhanced Admin Write Access
-- ============================================================

DROP POLICY IF EXISTS "product_ingredients_write" ON product_ingredients;
CREATE POLICY "product_ingredients_admin_write" ON product_ingredients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- RAW MATERIAL DEDUCTIONS — Admin Only (No Change)
-- ============================================================

DROP POLICY IF EXISTS "deductions_admin" ON raw_material_deductions;
CREATE POLICY "deductions_admin_only" ON raw_material_deductions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================
-- NOTIFICATIONS — Admin Only with Enhanced Permissions
-- ============================================================

DROP POLICY IF EXISTS "Admins can view notifications" ON notifications;
CREATE POLICY "Admins can view notifications" ON notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications" ON notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );
