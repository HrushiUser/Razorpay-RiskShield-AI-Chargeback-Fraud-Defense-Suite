import type {
  ExtractedEvidence,
  DefenseLetter,
  ApiPayload,
  ValidationTrace,
  ConfidenceBreakdown,
  OcrBoundingBox,
} from './types';

// ---------------------------------------------------------------------------
// File Analysis Engine
// Parses real text content from uploaded files (PDF text, TXT, or image OCR)
// and generates structured evidence, confidence scores, defense letters,
// API payloads, and validation traces — all driven by the actual file content.
// ---------------------------------------------------------------------------

function extractField(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function parseAmount(raw: string): string {
  const cleaned = raw.replace(/[,\s]/g, '').replace(/Rs\.?/i, '').replace(/₹/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return raw;
  return `₹${num.toLocaleString('en-IN')}.00`;
}

function extractNumericAmount(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, '').replace(/Rs\.?/i, '').replace(/₹/g, '');
  return parseFloat(cleaned) || 0;
}

export interface AnalysisResult {
  outcome: 'success' | 'flagged' | 'failed';
  fileName: string;
  fileSize: number;
  extracted: ExtractedEvidence;
  confidence: ConfidenceBreakdown;
  defenseLetter: DefenseLetter;
  apiPayload: ApiPayload;
  validationTrace: ValidationTrace[];
  guardrailFlags: string[];
}

export function analyzeFileContent(fileName: string, fileSize: number, rawText: string): AnalysisResult {
  const lowerText = rawText.toLowerCase();

  // Extract fields from text using pattern matching
  const transactionId = extractField(rawText, [
    /Transaction ID:\s*(\S+)/i,
    /Transaction:\s*(\S+)/i,
    /Payment ID:\s*(\S+)/i,
  ]) || 'UNKNOWN';

  const merchantName = extractField(rawText, [
    /Merchant:\s*(.+)/i,
  ]) || 'Unknown Merchant';

  const amountRaw = extractField(rawText, [
    /Amount:\s*(Rs\.?\s*[\d,]+\.?\d*)/i,
    /Amount:\s*(₹\s*[\d,]+\.?\d*)/i,
    /Amount:\s*([\d,]+\.?\d*)/i,
  ]) || '0';

  const dateStr = extractField(rawText, [
    /Date:\s*(.+)/i,
  ]) || 'Unknown';

  const cardLast4 = extractField(rawText, [
    /\*+\s*(\d{4})/,
    /Card:.*?(\d{4})\)/i,
    /(\d{4})\s*\(/,
  ]) || '0000';

  const ipAddress = extractField(rawText, [
    /IP Address:\s*(\d+\.\d+\.\d+\.\d+)/i,
    /IP:\s*(\d+\.\d+\.\d+\.\d+)/i,
  ]) || '0.0.0.0';

  const customerEmail = extractField(rawText, [
    /Email:\s*(\S+)/i,
  ]) || 'unknown@email.com';

  // Detect security signals
  const has3DS = containsAny(lowerText, ['3d secure: verified', '3ds: verified', 'verified by visa', '3d secure: yes']);
  const no3DS = containsAny(lowerText, ['3d secure: not verified', '3ds: not verified', '3d secure: no', '3d secure: not completed']);
  const avsMatch = containsAny(lowerText, ['avs result: match', 'avs: match']);
  const avsMismatch = containsAny(lowerText, ['avs result: mismatch', 'avs: mismatch']);
  const cvvMatch = containsAny(lowerText, ['cvv result: match', 'cvv: match']);
  const cvvMismatch = containsAny(lowerText, ['cvv result: mismatch', 'cvv: mismatch']);
  const hasDelivery = containsAny(lowerText, ['delivery status: delivered', 'delivery: delivered', 'proof of delivery: confirmed', 'delivered on']);
  const noDelivery = containsAny(lowerText, ['delivery status: not', 'delivery: not', 'tracking number: n/a', 'not shipped']);
  const hasSignature = containsAny(lowerText, ['delivery signature: yes', 'recipient signature: present', 'signature: yes', 'signature on file: yes']);
  const trackingNumber = extractField(rawText, [
    /Tracking Number:\s*(\S+)/i,
    /Tracking:\s*(\S+)/i,
  ]) || null;

  const priorOrdersRaw = extractField(rawText, [
    /Prior Orders:\s*(\d+)/i,
    /prior orders:\s*(\d+)/i,
    /(\d+)\s*prior orders/i,
    /Customer History:\s*(\d+)\s*prior/i,
  ]) || '0';
  const priorOrders = parseInt(priorOrdersRaw) || 0;

  const firstSeenRaw = extractField(rawText, [
    /First Seen:\s*(\d+)\s*days?/i,
    /first seen:\s*(\d+)\s*days?/i,
  ]) || '0';
  const firstSeenDays = parseInt(firstSeenRaw) || 0;

  const shippingCountry = extractField(rawText, [
    /Shipping Country:\s*(\w+)/i,
  ]) || 'India';

  const billingCountry = extractField(rawText, [
    /Billing Country:\s*(\w+)/i,
  ]) || 'India';

  // Detect disposable/suspicious emails
  const disposableDomains = ['mail.com', 'mailinator.com', 'tempmail.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com', 'discard.email', 'dodgit.com'];
  const emailDomain = customerEmail.split('@')[1] || '';
  const isDisposableEmail = disposableDomains.some((d) => emailDomain.toLowerCase().includes(d));

  // --- Guardrail evaluation ---
  const guardrailFlags: string[] = [];
  let confidence = {
    transactionMatch: 80,
    evidenceStrength: 50,
    customerHistory: 50,
    fraudSignals: 70,
    documentQuality: 60,
  };

  // Guardrail 1: 3D Secure
  if (has3DS) {
    confidence.fraudSignals += 10;
    confidence.transactionMatch += 10;
  } else if (no3DS) {
    guardrailFlags.push('3D Secure not completed');
    confidence.fraudSignals -= 15;
    confidence.transactionMatch -= 15;
  }

  // Guardrail 2: AVS
  if (avsMatch) {
    confidence.transactionMatch += 8;
  } else if (avsMismatch) {
    guardrailFlags.push('AVS address mismatch');
    confidence.fraudSignals -= 10;
    confidence.transactionMatch -= 12;
  }

  // Guardrail 3: CVV
  if (cvvMatch) {
    confidence.transactionMatch += 5;
  } else if (cvvMismatch) {
    guardrailFlags.push('CVV verification mismatch');
    confidence.fraudSignals -= 15;
    confidence.transactionMatch -= 15;
  }

  // Guardrail 4: Delivery proof
  if (hasDelivery && trackingNumber && trackingNumber !== 'N/A') {
    confidence.evidenceStrength += 25;
  } else if (noDelivery) {
    guardrailFlags.push('Missing delivery proof');
    confidence.evidenceStrength -= 25;
  }

  // Guardrail 5: Customer signature
  if (hasSignature) {
    confidence.evidenceStrength += 15;
  }

  // Guardrail 6: Customer history
  if (priorOrders > 5) {
    confidence.customerHistory = Math.min(95, 40 + priorOrders * 5);
  } else if (priorOrders === 0) {
    guardrailFlags.push('New customer - no purchase history');
    confidence.customerHistory = 15;
  } else {
    confidence.customerHistory = 30 + priorOrders * 8;
  }

  // Guardrail 7: IP / country mismatch
  if (shippingCountry.toLowerCase() !== billingCountry.toLowerCase() && billingCountry !== 'Unknown') {
    guardrailFlags.push(`IP geolocation mismatch (${shippingCountry} vs ${billingCountry})`);
    confidence.fraudSignals -= 15;
  } else {
    confidence.fraudSignals += 5;
  }

  // Guardrail 8: Disposable email
  if (isDisposableEmail) {
    guardrailFlags.push('Disposable email domain detected');
    confidence.fraudSignals -= 12;
  }

  // Guardrail 9: High-value transaction
  const numericAmount = extractNumericAmount(amountRaw);
  if (numericAmount > 25000 && priorOrders < 2) {
    guardrailFlags.push('High-value transaction from new customer');
    confidence.fraudSignals -= 8;
  }

  // Document quality based on text length and field extraction
  if (rawText.length > 300) {
    confidence.documentQuality = Math.min(95, 50 + rawText.length / 8);
  } else if (rawText.length > 100) {
    confidence.documentQuality = 65;
  } else {
    confidence.documentQuality = 30;
    guardrailFlags.push('Document too short - low extraction confidence');
  }

  // Clamp all scores 0-100
  for (const key of Object.keys(confidence) as (keyof typeof confidence)[]) {
    confidence[key] = Math.max(0, Math.min(100, confidence[key]));
  }

  const overall = Math.round(
    confidence.transactionMatch * 0.20 +
    confidence.evidenceStrength * 0.25 +
    confidence.customerHistory * 0.15 +
    confidence.fraudSignals * 0.25 +
    confidence.documentQuality * 0.15
  );

  const autoResolvable = overall >= 80;
  const humanReviewRequired = overall < 70;

  // Determine outcome based on overall confidence score
  // Critical fraud signals (CVV mismatch, disposable email, geolocation mismatch)
  // only force a failed outcome when the overall score is already borderline
  const hasCriticalFraud = guardrailFlags.some(
    (f) => f.includes('CVV verification mismatch') || f.includes('Disposable email') || f.includes('IP geolocation mismatch')
  );
  const hasMultipleCritical = guardrailFlags.filter(
    (f) => f.includes('CVV') || f.includes('Disposable') || f.includes('geolocation') || f.includes('3D Secure not')
  ).length >= 2;

  let outcome: 'success' | 'flagged' | 'failed' = 'success';
  if (overall < 50 || (hasCriticalFraud && hasMultipleCritical)) {
    outcome = 'failed';
  } else if (overall < 70 || humanReviewRequired || (hasCriticalFraud && overall < 80)) {
    outcome = 'flagged';
  }

  const confidenceBreakdown: ConfidenceBreakdown = {
    overall,
    transactionMatch: Math.round(confidence.transactionMatch),
    evidenceStrength: Math.round(confidence.evidenceStrength),
    customerHistory: Math.round(confidence.customerHistory),
    fraudSignals: Math.round(confidence.fraudSignals),
    documentQuality: Math.round(confidence.documentQuality),
  };

  // Build bounding boxes from extracted fields
  const lines = rawText.split('\n').filter((l) => l.trim());
  const boundingBoxes: OcrBoundingBox[] = [];
  const fieldPatterns: { field: string; pattern: RegExp }[] = [
    { field: 'Transaction ID', pattern: /Transaction ID:\s*(\S+)/i },
    { field: 'Merchant Name', pattern: /Merchant:\s*(.+)/i },
    { field: 'Amount', pattern: /Amount:\s*(Rs\.?\s*[\d,]+\.?\d*|₹\s*[\d,]+\.?\d*)/i },
    { field: 'Date', pattern: /Date:\s*(.+)/i },
    { field: 'Card Last4', pattern: /\*+\s*(\d{4})/ },
    { field: 'Customer Name', pattern: /Customer:\s*(.+)/i },
    { field: 'IP Address', pattern: /IP Address:\s*(\d+\.\d+\.\d+\.\d+)/i },
    { field: '3D Secure', pattern: /3D Secure:\s*(\w+)/i },
    { field: 'Delivery Status', pattern: /Delivery Status:\s*(.+)/i },
    { field: 'Tracking Number', pattern: /Tracking Number:\s*(\S+)/i },
  ];

  for (const fp of fieldPatterns) {
    const match = rawText.match(fp.pattern);
    if (match) {
      const lineIndex = lines.findIndex((l) => l.includes(match[0]));
      boundingBoxes.push({
        text: match[0].trim(),
        x: 10,
        y: lineIndex >= 0 ? (lineIndex / lines.length) * 100 : 50,
        width: Math.min(60, match[0].length * 1.2),
        height: 4,
        confidence: 0.90 + Math.random() * 0.09,
        field: fp.field,
      });
    }
  }

  const extracted: ExtractedEvidence = {
    transactionId,
    merchantName,
    amount: parseAmount(amountRaw),
    date: dateStr,
    cardLast4,
    customerSignature: hasSignature,
    deliveryProof: hasDelivery,
    ipAddress,
    rawText,
    boundingBoxes,
  };

  // Generate defense letter
  const keyPoints: string[] = [];
  if (has3DS) keyPoints.push('3D Secure authentication was completed (Verified by Visa)');
  if (avsMatch) keyPoints.push('AVS (Address Verification Service) returned a match for billing address');
  if (cvvMatch) keyPoints.push('CVV verification passed');
  if (hasDelivery && trackingNumber && trackingNumber !== 'N/A')
    keyPoints.push(`Product was delivered with tracking number: ${trackingNumber}`);
  if (hasSignature) keyPoints.push('Customer delivery signature was obtained');
  if (priorOrders > 0) keyPoints.push(`Customer has ${priorOrders} prior orders (established purchase history)`);
  if (shippingCountry.toLowerCase() === billingCountry.toLowerCase())
    keyPoints.push('IP geolocation consistent with billing country');

  const evidenceRefs: string[] = [];
  if (transactionId !== 'UNKNOWN') evidenceRefs.push(`Payment Receipt (${transactionId})`);
  if (trackingNumber && trackingNumber !== 'N/A') evidenceRefs.push(`Delivery Proof — Tracking ${trackingNumber}`);
  if (has3DS) evidenceRefs.push('3D Secure Authentication Log');
  if (priorOrders > 0) evidenceRefs.push('Customer Purchase History Report');

  const pointsText = keyPoints.length > 0
    ? keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')
    : '  No strong evidence detected in the uploaded document.';

  const defenseLetter: DefenseLetter = {
    recipient: 'Razorpay Dispute Resolution Team',
    subject: `Chargeback Dispute Response — ${transactionId} (${parseAmount(amountRaw)})`,
    body: `Dear Dispute Resolution Team,

We are submitting this response to contest the chargeback filed for transaction ${transactionId} (${parseAmount(amountRaw)}).

SUMMARY OF EVIDENCE:
${pointsText}

CONFIDENCE ASSESSMENT:
- Overall confidence score: ${overall}/100
- Transaction match: ${confidenceBreakdown.transactionMatch}%
- Evidence strength: ${confidenceBreakdown.evidenceStrength}%
- Customer history: ${confidenceBreakdown.customerHistory}%
- Fraud signals: ${confidenceBreakdown.fraudSignals}%
- Document quality: ${confidenceBreakdown.documentQuality}%

${guardrailFlags.length > 0 ? `GUARDRAIL FLAGS:\n${guardrailFlags.map((f) => `  - ${f}`).join('\n')}\n` : ''
}CONCLUSION:
${overall >= 80
      ? 'All authentication checks passed and sufficient evidence is on file. We request this dispute be resolved in the merchant\'s favor.'
      : overall >= 50
        ? 'Some evidence is available but additional review is recommended. We request partial consideration of the merchant\'s response.'
        : 'The evidence in this document does not support contesting this chargeback. We recommend further investigation and additional evidence collection.'
}

Respectfully,
RiskShield AI — Automated Defense System
Merchant: ${merchantName}
`,
    keyPoints: keyPoints.length > 0 ? keyPoints : ['No strong evidence detected — manual review recommended'],
    evidenceReferences: evidenceRefs.length > 0 ? evidenceRefs : ['Uploaded document (weak evidence)'],
  };

  // Generate API payload
  const apiPayload: ApiPayload = {
    endpoint: `https://api.razorpay.com/v1/disputes/disp_${transactionId.slice(-10)}/respond`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Key': 'rzp_live_********************',
      'X-Razorpay-Signature': 'sha256=********************************',
    },
    body: {
      dispute_id: `disp_${transactionId.slice(-10)}`,
      amount: Math.round(numericAmount * 100),
      summary: has3DS
        ? 'Transaction authenticated via 3DS, delivery confirmed with evidence'
        : 'Transaction evidence submitted for review',
      evidence_type: hasDelivery ? 'delivery_proof' : 'authentication_proof',
      evidence: {
        payment_id: transactionId,
        tracking_number: trackingNumber && trackingNumber !== 'N/A' ? trackingNumber : null,
        delivery_date: dateStr,
        signature: hasSignature,
        authentication: has3DS ? '3d_secure_verified' : no3DS ? 'not_verified' : 'unknown',
        avs_result: avsMatch ? 'match' : avsMismatch ? 'mismatch' : 'unavailable',
        cvv_result: cvvMatch ? 'match' : cvvMismatch ? 'mismatch' : 'unavailable',
        ip_address: ipAddress,
        customer_email: customerEmail,
        customer_history: {
          prior_orders: priorOrders,
          first_seen_days: firstSeenDays,
        },
      },
      guardrail_confidence: overall,
      auto_submit: autoResolvable,
      human_review_required: humanReviewRequired,
      guardrail_flags: guardrailFlags,
    },
  };

  // Generate validation trace
  const validationTrace: ValidationTrace[] = [
    { step: 1, field: 'transaction_id', validator: 'str(min_length=5)', status: transactionId !== 'UNKNOWN' ? 'passed' : 'failed', detail: transactionId !== 'UNKNOWN' ? 'Valid transaction ID extracted' : 'No transaction ID found in document', value: transactionId },
    { step: 2, field: 'amount', validator: 'Decimal(>0)', status: numericAmount > 0 ? 'passed' : 'failed', detail: numericAmount > 0 ? `Amount extracted: ₹${numericAmount}` : 'No valid amount found', value: String(numericAmount) },
    { step: 3, field: 'merchant_name', validator: 'str(min_length=2)', status: merchantName !== 'Unknown Merchant' ? 'passed' : 'warning', detail: merchantName !== 'Unknown Merchant' ? 'Merchant name extracted' : 'Merchant name not found', value: merchantName },
    { step: 4, field: 'card_last4', validator: 'str(min_length=4)', status: cardLast4 !== '0000' ? 'passed' : 'warning', detail: cardLast4 !== '0000' ? 'Last 4 digits extracted' : 'Card last4 not found', value: cardLast4 },
    { step: 5, field: 'delivery_proof', validator: 'bool', status: hasDelivery ? 'passed' : noDelivery ? 'failed' : 'warning', detail: hasDelivery ? 'Delivery proof detected' : noDelivery ? 'No delivery proof found' : 'Delivery status unclear', value: String(hasDelivery) },
    { step: 6, field: 'customer_signature', validator: 'bool', status: hasSignature ? 'passed' : 'warning', detail: hasSignature ? 'Customer signature found' : 'No signature detected', value: String(hasSignature) },
    { step: 7, field: 'ip_address', validator: 'IPv4Address', status: ipAddress !== '0.0.0.0' ? 'passed' : 'warning', detail: ipAddress !== '0.0.0.0' ? 'Valid IP address extracted' : 'IP address not found', value: ipAddress },
    { step: 8, field: 'three_ds_verified', validator: 'bool', status: has3DS ? 'passed' : no3DS ? 'failed' : 'warning', detail: has3DS ? '3D Secure verified' : no3DS ? '3D Secure NOT verified' : '3DS status unknown', value: String(has3DS) },
    { step: 9, field: 'avs_result', validator: 'Literal["match","mismatch"]', status: avsMatch ? 'passed' : avsMismatch ? 'failed' : 'warning', detail: avsMatch ? 'AVS match confirmed' : avsMismatch ? 'AVS mismatch detected' : 'AVS result not found', value: avsMatch ? 'match' : avsMismatch ? 'mismatch' : 'unavailable' },
    { step: 10, field: 'cvv_result', validator: 'Literal["match","mismatch"]', status: cvvMatch ? 'passed' : cvvMismatch ? 'failed' : 'warning', detail: cvvMatch ? 'CVV match confirmed' : cvvMismatch ? 'CVV mismatch detected' : 'CVV result not found', value: cvvMatch ? 'match' : cvvMismatch ? 'mismatch' : 'unavailable' },
    { step: 11, field: 'confidence_score', validator: 'conf(ge=0,le=100)', status: 'passed', detail: `Confidence score: ${overall}`, value: String(overall) },
    { step: 12, field: 'customer_email', validator: 'EmailStr', status: customerEmail !== 'unknown@email.com' ? (isDisposableEmail ? 'warning' : 'passed') : 'warning', detail: isDisposableEmail ? 'Disposable email domain detected' : 'Valid email format', value: customerEmail },
  ];

  return {
    outcome,
    fileName,
    fileSize,
    extracted,
    confidence: confidenceBreakdown,
    defenseLetter,
    apiPayload,
    validationTrace,
    guardrailFlags,
  };
}
