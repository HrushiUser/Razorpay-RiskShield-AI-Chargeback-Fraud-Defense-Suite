# Sample Documents for Testing

These files can be uploaded directly in the **Document Extraction Suite** to test different analysis outcomes.

## Successful Documents (High Confidence — Auto-Resolved)

| File | Description | Expected Outcome |
|------|-------------|------------------|
| `successful_payment_receipt.txt` | Complete receipt with 3DS, AVS match, delivery proof | Confidence 85-95%, Auto-Resolved |
| `successful_delivery_proof.txt` | Delivery proof with tracking and signature | Confidence 80-90%, Auto-Resolved |
| `successful_subscription_cancelled.txt` | Subscription cancellation with refund trail | Confidence 85-95%, Auto-Resolved |

## Flagged Documents (Medium Confidence — Human Review)

| File | Description | Expected Outcome |
|------|-------------|------------------|
| `flagged_missing_delivery.txt` | Payment receipt without delivery proof | Confidence 55-65%, Flagged for Human Review |
| `flagged_high_value_new_customer.txt` | High-value transaction from relatively new customer | Confidence 60-70%, Flagged for Human Review |

## Failed Documents (Low Confidence — High Risk)

| File | Description | Expected Outcome |
|------|-------------|------------------|
| `failed_fraudulent_charge.txt` | Fraudulent transaction — IP mismatch, no 3DS, CVV mismatch | Confidence < 50%, Blocked |
| `failed_suspicious_transaction.txt` | Suspicious charge with disposable email, country mismatch | Confidence < 50%, Blocked |

## How to Test

1. Open the RiskShield AI portal
2. Navigate to **Document Extraction Suite**
3. Either:
   - Click **"Select Files"** to upload one of these `.txt` files from your computer
   - Or drag and drop a file onto the upload zone
   - Or click **"Sample Documents"** to load them directly without downloading
4. The system will analyze the file content and generate:
   - OCR extraction with field bounding boxes
   - Confidence score with breakdown
   - Defense letter
   - Razorpay API payload (JSON)
   - Pydantic validation trace

You can also download these files using the download icon next to each sample in the portal.
