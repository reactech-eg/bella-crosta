# Order & Payment Status System

## Key Distinction: Order Status vs Payment Status

These are **independent** fields that track different aspects:

### Order Status (`orders.status`)

Tracks the **fulfillment workflow** of the order:

- `pending` → `confirmed` → `preparing` → `delivered`
- Can be changed by admin anytime
- Not dependent on payment status
- Represents: Where is this order in the fulfillment process?

### Payment Status (`orders.payment_status`)

Tracks the **payment verification workflow**:

- `pending` → `uploaded` → `confirmed`
- Changes based on customer action (upload) and admin action (verify)
- Can exist independently of order status
- Represents: Has payment been verified?

## Payment Flow

### Customer Perspective (Checkout)

**Cash on Delivery (COD):**

```
1. Place order
2. payment_status = 'pending' (default, no proof needed)
3. Payment handled at delivery
```

**Digital Payment (instapay, vodafone_cash):**

```
1. Place order
2. Upload payment proof screenshot
3. payment_status = 'uploaded'
4. Wait for admin verification
```

### Admin Perspective (Order Details)

**Verify Payment:**

```
1. View order payment_status
2. If 'uploaded': View payment proof image
3. Click "Confirm Payment" to verify
4. payment_status = 'confirmed'
5. Order can proceed to fulfillment
```

**Upload Proof (if missing):**

```
1. View order without payment proof
2. Click "Upload Proof"
3. Select and upload image
4. Image stored in Supabase storage
5. payment_status = 'uploaded'
6. Now can confirm payment
```

**Update Fulfillment Status (independent of payment):**

```
1. Select order status (pending → confirmed → preparing → delivered)
2. payment_status remains unchanged
3. Can update status regardless of payment status
4. Order can display both: "Payment: confirmed, Delivery: preparing"
```

## Database Schema (Relevant Fields)

```sql
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
-- Values: 'pending' | 'uploaded' | 'confirmed'

ALTER TABLE orders ADD COLUMN payment_proof_url TEXT;
-- URL to payment proof image in storage

ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
-- Values: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
```

## Business Rules

1. **COD Orders:** Can be marked as delivered without payment confirmation
2. **Digital Payment Orders:** Should have proof uploaded before delivery
3. **Admin Workflow:** Check payment → Confirm payment → Mark as preparing → Mark as delivered
4. **Customer Visibility:** Can see order status and payment status independently
5. **Order Creation:**
   - If COD: payment_status = 'pending'
   - If digital: payment_status = 'uploaded' (if proof provided)
   - If digital: payment_status = 'pending' (if no proof yet)

## API Examples

### Create Order (Customer)

```typescript
await createOrder(
  customerId,
  items,
  totalAmount,
  address,
  notes,
  "instapay", // paymentMethod
  base64ImageOrUndefined, // proofImage
);
// Result: order.payment_status = 'uploaded' or 'pending'
// Result: order.status = 'pending'
```

### Confirm Payment (Admin)

```typescript
await confirmPayment(orderId);
// Updates: order.payment_status = 'confirmed'
// Does NOT change: order.status
```

### Update Order Status (Admin)

```typescript
await updateOrderStatus(orderId, "preparing");
// Updates: order.status = 'preparing'
// Does NOT change: order.payment_status
```

### Upload Payment Proof (Admin)

```typescript
await uploadPaymentProof(orderId, base64Image);
// Updates: order.payment_proof_url = <storage-url>
// Updates: order.payment_status = 'uploaded'
// Does NOT change: order.status
```
