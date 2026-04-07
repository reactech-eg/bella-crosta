# Supabase Storage Setup Guide

## Payment Proofs Bucket

The application uses a Supabase storage bucket to store payment proof images.

### Setup Instructions

1. **Create the bucket in Supabase Dashboard:**
   - Go to Supabase Dashboard → Storage
   - Click "Create a new bucket"
   - Name: `payment-proofs`
   - Make it **Public** (allow list access)

2. **Set Bucket Policies:**
   - Allow authenticated users to upload
   - Allow authenticated users to read
   - Allow public read access

3. **Bucket Configuration:**
   ```
   Name: payment-proofs
   Visibility: Public
   Max upload size: 10 MB (recommended)
   ```

### How It Works

**Customer (Checkout):**

- Uploads payment proof as base64 when placing order
- Image is stored in `payment-proofs` bucket
- URL is saved to `orders.payment_proof_url`
- Payment status set to `uploaded`

**Admin (Order Details):**

- Can view existing payment proof
- Can upload new proof if missing
- Once proof is uploaded, can confirm payment
- Confirming payment sets `payment_status` to `confirmed`

### Payment Status Values

| Status      | Meaning                         | Next Action                        |
| ----------- | ------------------------------- | ---------------------------------- |
| `pending`   | No proof uploaded yet           | Requires COD or another way to pay |
| `uploaded`  | Proof received but not verified | Admin reviews and confirms         |
| `confirmed` | Payment verified by admin       | Order ready for fulfillment        |

### Order Status Values (Independent)

| Status      | Meaning                                         |
| ----------- | ----------------------------------------------- |
| `pending`   | Order created, waiting for payment confirmation |
| `confirmed` | Order confirmed, ready to prepare               |
| `preparing` | Kitchen is preparing the order                  |
| `delivered` | Order delivered to customer                     |
| `cancelled` | Order cancelled                                 |

### Payment Method Support

- **COD** (Cash on Delivery): No proof required, payment_status stays `pending` until manually confirmed
- **instapay**: Requires payment proof upload
- **vodafone_cash**: Requires payment proof upload

## API Overview

### Upload Payment Proof (Admin)

```
POST /app/actions/orders.ts -> uploadPaymentProof()
- Requires: admin authentication
- Input: orderId, proofImageBase64
- Output: proofUrl or error
- Side effects: Updates payment_proof_url, sets payment_status to 'uploaded'
```

### Confirm Payment (Admin)

```
POST /app/actions/orders.ts -> confirmPayment()
- Requires: admin authentication
- Input: orderId
- Precondition: payment_proof_url must exist
- Output: success or error
- Side effects: Sets payment_status to 'confirmed'
```
