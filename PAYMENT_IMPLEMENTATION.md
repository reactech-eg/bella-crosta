# Payment Proof Upload System Implementation

## Overview

The system handles payment proof uploads with clear distinction between:

- **Order Status**: Fulfillment workflow (pending → confirmed → preparing → delivered)
- **Payment Status**: Payment verification (pending → uploaded → confirmed)

## Components

### 1. Storage Bucket

**File**: `STORAGE_SETUP.md`

- Bucket name: `payment-proofs`
- Visibility: Public
- For: Payment proof images from customers and admins

### 2. Database

**File**: `scripts/migration-v5-payment-proof-system.sql`

Tables: `orders` table with columns:

- `payment_status` - VARCHAR(50): pending | uploaded | confirmed
- `payment_proof_url` - TEXT: URL to image in storage
- `payment_method` - VARCHAR(50): cod | instapay | vodafone_cash
- `status` - VARCHAR(50): pending | confirmed | preparing | delivered | cancelled

### 3. Server Actions

**File**: `app/actions/orders.ts`

Functions:

```typescript
// Confirm payment after proof is uploaded
confirmPayment(orderId: string)
✓ Requires admin auth
✓ Sets payment_status to 'confirmed'

// Upload payment proof image
uploadPaymentProof(orderId: string, proofImageBase64: string)
✓ Requires admin auth
✓ Uploads to storage bucket
✓ Sets payment_proof_url
✓ Sets payment_status to 'uploaded'
```

### 4. UI Components

**Customer Checkout** (`app/checkout/client.tsx`):

- File input for payment proof
- Base64 encoding for upload
- Validation (max 5MB)

**Admin Order Details** (`app/admin/orders/[id]/client.tsx`):

- Payment section with proof preview
- Upload button with drag-drop style
- Confirm Payment button (enabled only with proof)
- Clear distinction between:
  - Order Status (fulfillment)
  - Payment Status (verification)

## Implementation Steps

### Step 1: Create Storage Bucket

```
1. Go to Supabase Dashboard → Storage
2. Create bucket: "payment-proofs"
3. Make it Public
4. Set max file size: 10MB
```

### Step 2: Run Database Migration

```sql
-- Execute: scripts/migration-v5-payment-proof-system.sql
-- Adds: payment_status, payment_proof_url, payment_method columns
-- Creates: Indexes and RLS policies
```

### Step 3: Verify Server Actions

- ✅ `uploadPaymentProof()` - implemented
- ✅ `confirmPayment()` - implemented
- ✅ `updateOrderStatus()` - independent of payment

### Step 4: Test Customer Flow

1. Go to checkout
2. Select "instapay" payment method
3. Upload payment screenshot
4. Complete order
5. Verify payment_proof_url in database

### Step 5: Test Admin Flow

1. Go to admin order details
2. View payment proof if exists
3. If not exists, upload new proof
4. Click "Confirm Payment"
5. Verify payment_status changed to "confirmed"

## Key Features

✅ **Customer Upload**: Customers upload proof with order (checkout)
✅ **Admin Upload**: Admins can upload proof for verification
✅ **Image Storage**: Stored in Supabase storage bucket
✅ **Public URLs**: Images accessible via public URL
✅ **Admin Verification**: Clear confirm payment workflow
✅ **Status Distinction**: payment_status vs order status independent
✅ **COD Support**: Cash on delivery doesn't need proof
✅ **Error Handling**: File size, format, and upload error handling

## File References

| File                                            | Purpose                          |
| ----------------------------------------------- | -------------------------------- |
| `STORAGE_SETUP.md`                              | Bucket setup instructions        |
| `PAYMENT_FLOW.md`                               | Payment flow documentation       |
| `scripts/migration-v5-payment-proof-system.sql` | Database migration               |
| `app/actions/orders.ts`                         | Server-side payment operations   |
| `app/checkout/client.tsx`                       | Customer payment proof upload    |
| `app/admin/orders/[id]/client.tsx`              | Admin payment management UI      |
| `lib/actions.ts`                                | Order creation with proof upload |

## Testing Checklist

- [ ] Supabase storage bucket created
- [ ] Migration script executed
- [ ] Customer can upload proof at checkout
- [ ] Payment proof URL saved in database
- [ ] Admin can view payment proof
- [ ] Admin can upload missing proof
- [ ] Admin can confirm payment
- [ ] Order status independent from payment status
- [ ] COD orders work without proof
- [ ] File size validation (max 5MB)
- [ ] Error messages display correctly
- [ ] Payment proof images accessible via public URL

## Troubleshooting

### Storage bucket not found

```
Error: "Bucket 'payment-proofs' not found"
Solution: Create bucket in Supabase Dashboard → Storage
```

### Permission denied uploading

```
Error: "row-level security policy violation"
Solution:
1. Ensure user is authenticated
2. Ensure user is in admin_users table with is_active = true
3. Check RLS policies in admin/orders/[id]/client.tsx
```

### Images not loading

```
Problem: Payment proof URL shows 404
Solution:
1. Verify bucket is set to "Public"
2. Check getPublicUrl() returns correct URL
3. Verify image was actually uploaded
```

## Performance Considerations

- Image files limited to 5MB
- One proof image per order
- Async upload doesn't block UI
- Indexed queries on payment_status
- Public URL caching by CDN

## Security Considerations

✅ Admin authentication required for uploads
✅ RLS policies enforce authorization
✅ File type validation (images only)
✅ File size limits
✅ Stored in dedicated bucket
✅ Public read (can view), authenticated write only
