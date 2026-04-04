# Bella Crosta — Full System Upgrade
## Implementation Guide

---

## 🔴 PHASE 1 — Analysis Findings

### Bugs Fixed
1. **Payment proof not uploaded** — `createOrder` now accepts `paymentProofBase64` and uploads to Supabase Storage
2. **Raw materials not deducted** — `confirmPayment` now deducts raw materials with optimistic locking + audit trail
3. **loadingOrder starts true** — Fixed in `app-store.ts` (now starts `false`)
4. **Admin store loading states** — All start as `false`, flip to `true` during fetch
5. **Payments page re-checks auth** — Redundant client-side check removed (handled by `admin-layout.tsx`)
6. **ProductCard Image** — Needs `fill` prop (Supabase Storage images have unknown dimensions)

---

## 📁 Files Created / Modified

### New Files
```
app/admin/raw-materials/page.tsx        ← Raw materials page
app/admin/raw-materials/client.tsx      ← Full CRUD UI
app/admin/products/page.tsx             ← Products management page  
app/admin/products/client.tsx           ← Full CRUD with image upload + ingredients
app/admin/dashboard/client.tsx          ← Improved dashboard with quick links
app/admin/inventory/client.tsx          ← Fixed inventory page (uses new store)
app/auth/callback/route.ts              ← Google OAuth callback handler
app/auth/login/page.tsx                 ← Login with Google OAuth button
app/checkout/client.tsx                 ← Fixed: payment proof properly sent
```

### Updated Files
```
lib/types.ts                            ← Added RawMaterial, ProductIngredient, ProductFormData types
lib/db.ts                               ← Added raw materials queries, fixed admin client usage
lib/actions.ts                          ← Full rewrite: raw material CRUD, deduction logic, image upload
lib/auth.ts                             ← Added getGoogleAuthUrl, handleOAuthCallback
store/admin-store.ts                    ← Full rewrite: Zustand with devtools, all entities
store/app-store.ts                      ← Fixed loading state initialization
components/admin-sidebar.tsx            ← Added Products + Raw Materials nav links
scripts/migration-v2.sql                ← DB migration: raw_materials, product_ingredients, deductions
```

---

## 🟠 PHASE 2 — Raw Materials System

### Database Tables
```sql
raw_materials (
  id, name, unit, stock_qty, low_threshold, cost_per_unit, supplier, notes,
  created_at, updated_at
)

product_ingredients (
  id, product_id, raw_material_id, quantity_needed, created_at,
  UNIQUE(product_id, raw_material_id)
)

raw_material_deductions (
  id, order_id, raw_material_id, quantity_deducted, deducted_at
)
```

### Business Logic — Order Approval Flow
```
Customer places order
    ↓
Order created with status='pending', payment_status='uploaded'
    ↓ (raw materials NOT deducted)
Admin reviews payment proof in /admin/payments
    ↓
Admin clicks "Confirm Payment"
    ↓ confirmPayment() action:
    1. Update order: status='confirmed', payment_status='confirmed'
    2. For each order_item:
       - Fetch product_ingredients for that product
       - Calculate: quantity_needed × order_item.quantity
    3. For each raw material needed:
       - SELECT current stock (optimistic lock)
       - UPDATE stock_qty = MAX(0, current - needed)
       - Record deduction in raw_material_deductions
```

### Race Condition Protection
- Optimistic locking: `UPDATE WHERE stock_qty = current_value`
- Fallback: if optimistic lock fails, retry without lock
- `MAX(0, ...)` prevents negative stock

---

## 🟡 PHASE 3 — Product Management

### Features
- Full product CRUD (create, edit, soft-delete)
- Image upload to Supabase Storage bucket `product-images`
- Dynamic ingredient selection (search + add)
- Per-ingredient quantity input with +/- controls
- Category filter + search
- Featured toggle
- Stock quantity management

---

## 🟢 PHASE 6 — Google OAuth

### Setup in Supabase Dashboard
1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Add your Google Client ID and Secret
4. Set redirect URL: `https://yourapp.com/auth/callback`

### Environment Variables Needed
```env
NEXT_PUBLIC_SITE_URL=https://yourapp.com  # or http://localhost:3000 in dev
```

### Flow
```
User clicks "Continue with Google"
    ↓
getGoogleAuthUrl() → returns Supabase OAuth URL
    ↓
Browser navigates to Google consent screen
    ↓
Google redirects to /auth/callback?code=...
    ↓
handleOAuthCallback(code) → exchanges code for session
    ↓
Creates customer profile if first login
    ↓
Redirects to /admin/dashboard (admin) or / (customer)
```

---

## 🗄️ Database Setup

### Step 1: Run Migration
```sql
-- Run migration-v2.sql in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXIST)
```

### Step 2: Create Storage Buckets
Run in Supabase SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images (public read)
CREATE POLICY "product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Storage policies for payment proofs (admin only)
CREATE POLICY "payment proofs admin read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Allow service role to upload (used via admin client)
CREATE POLICY "service role upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### Step 3: Enable Realtime (Optional)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

## 🔧 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth
NEXT_PUBLIC_SITE_URL=https://yourapp.com

# Telegram (existing)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

## 🧪 Testing Checklist

### Raw Materials
- [ ] Add a raw material
- [ ] Edit name/stock/threshold
- [ ] Delete (should fail if used in a product)
- [ ] Low stock badge appears correctly

### Product Management
- [ ] Add product with image
- [ ] Add product with ingredients
- [ ] Edit product + update ingredients
- [ ] Soft-delete product (marks unavailable)

### Order → Approval Flow
- [ ] Place order with payment proof
- [ ] Verify proof URL saved in DB
- [ ] Admin confirms payment → stock deducted
- [ ] Deduction audit trail in raw_material_deductions

### Google OAuth
- [ ] Click "Continue with Google"
- [ ] Complete Google consent
- [ ] Customer profile auto-created
- [ ] Admin users redirect to /admin/dashboard

---

## ⚡ Performance Notes

- Admin client (`createAdminClient`) bypasses RLS for admin-only reads
- Product images use Supabase CDN (public bucket)
- Payment proofs use private bucket (signed URLs for security)
- Zustand devtools enabled in admin store (disable in production)

---

## 🔒 Security Notes

- Service role key NEVER exposed to client
- Payment proofs in private Supabase bucket
- Admin routes protected by both middleware + `requireAdmin()` server guard
- OAuth callback validates code server-side
- All admin mutations use `adminClient()` with service role

---

*Generated for Bella Crosta v2.0 — April 2026*