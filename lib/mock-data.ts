import type {
  Dispute,
  GuardrailLog,
  MetricsSummary,
  TimeSeriesPoint,
  RiskDistribution,
  ExtractedEvidence,
  DefenseLetter,
  ApiPayload,
  ValidationTrace,
  ConfidenceBreakdown,
  SampleDocument,
} from './types';

// ---------------------------------------------------------------------------
// Deterministic seeded PRNG — ensures server and client render identical data
// (prevents Next.js hydration mismatches caused by Math.random())
// ---------------------------------------------------------------------------

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Mulberry32 algorithm
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1) + min);
  }

  float(min: number, max: number, decimals = 2): number {
    return parseFloat((this.next() * (max - min) + min).toFixed(decimals));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  string(len: number, charset = 'abcdefghijklmnopqrstuvwxyz0123456789'): string {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += charset[Math.floor(this.next() * charset.length)];
    }
    return s;
  }
}

// Fixed reference date so server/client always agree
const REFERENCE_DATE = new Date('2026-09-04T12:00:00.000Z');

function formatDate(daysAgo: number): string {
  const d = new Date(REFERENCE_DATE);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const rng = new SeededRandom(42);

const merchants = [
  { id: 'M-1001', name: 'TechKart India Pvt Ltd' },
  { id: 'M-1002', name: 'FreshBasket Grocers' },
  { id: 'M-1003', name: 'MediLife Pharmacy' },
  { id: 'M-1004', name: 'CloudHost Solutions' },
  { id: 'M-1005', name: 'UrbanThreads Apparel' },
  { id: 'M-1006', name: 'GadgetHub Electronics' },
  { id: 'M-1007', name: 'BookWorm Store' },
  { id: 'M-1008', name: 'FitGear Sports' },
];

const customers = [
  { name: 'Rahul Sharma', email: 'rahul.s@gmail.com' },
  { name: 'Priya Patel', email: 'priya.patel@yahoo.com' },
  { name: 'Arun Kumar', email: 'arun.k@outlook.com' },
  { name: 'Sneha Reddy', email: 'sneha.r@gmail.com' },
  { name: 'Vikram Singh', email: 'vikram.s@rediffmail.com' },
  { name: 'Anita Desai', email: 'anita.d@gmail.com' },
  { name: 'Karan Mehta', email: 'karan.m@yahoo.com' },
  { name: 'Deepak Verma', email: 'deepak.v@gmail.com' },
  { name: 'Pooja Nair', email: 'pooja.n@outlook.com' },
  { name: 'Rohan Gupta', email: 'rohan.g@gmail.com' },
];

const cardBrands = ['Visa', 'Mastercard', 'RuPay', 'Amex'];
const paymentMethods = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking'];
const countries = ['India', 'India', 'India', 'Singapore', 'United States'];

const reasons: Dispute['reason'][] = [
  'fraudulent',
  'unrecognized_transaction',
  'product_not_received',
  'credit_not_processed',
  'duplicate_charge',
  'subscription_canceled',
  'service_not_as_described',
];

const riskLevels: Dispute['riskLevel'][] = ['low', 'medium', 'high', 'critical'];

function generateDisputes(count: number): Dispute[] {
  const disputes: Dispute[] = [];
  const statuses: Dispute['status'][] = [
    'open',
    'under_review',
    'won',
    'lost',
    'auto_resolved',
  ];

  for (let i = 0; i < count; i++) {
    const merchant = rng.pick(merchants);
    const customer = rng.pick(customers);
    const amount = rng.int(500, 45000);
    const reason = rng.pick(reasons);
    const riskLevel = rng.pick(riskLevels);
    const status = rng.pick(statuses);
    const filedDaysAgo = rng.int(1, 30);
    const responseDaysLeft = rng.int(1, 14);
    const confidence = rng.int(45, 98);

    const fraudFlags: string[] = [];
    if (rng.bool(0.4)) fraudFlags.push('IP geolocation mismatch');
    if (rng.bool(0.3)) fraudFlags.push('New device fingerprint');
    if (rng.bool(0.25)) fraudFlags.push('Velocity spike detected');
    if (rng.bool(0.2)) fraudFlags.push('BIN mismatch with billing country');
    if (rng.bool(0.15)) fraudFlags.push('Multiple cards, same device');
    if (confidence > 80 && reason !== 'fraudulent')
      fraudFlags.push('Strong delivery evidence on file');

    disputes.push({
      id: `DIS-${String(i + 1).padStart(5, '0')}`,
      disputeId: `disp_${rng.string(10)}`,
      transaction: {
        id: `pay_${rng.string(12)}`,
        merchantId: merchant.id,
        merchantName: merchant.name,
        amount,
        currency: 'INR',
        date: formatDate(filedDaysAgo + rng.int(1, 5)),
        customerEmail: customer.email,
        customerName: customer.name,
        paymentMethod: rng.pick(paymentMethods),
        cardLast4: String(rng.int(1000, 9999)),
        cardBrand: rng.pick(cardBrands),
        ipAddress: `${rng.int(1, 255)}.${rng.int(1, 255)}.${rng.int(1, 255)}.${rng.int(1, 255)}`,
        billingCountry: 'India',
        shippingCountry: rng.pick(countries),
        avsResult: rng.pick(['match', 'mismatch', 'unavailable'] as const),
        cvvResult: rng.pick(['match', 'mismatch', 'unavailable'] as const),
        is3DSecure: rng.bool(0.6),
        deviceFingerprint: `fp_${rng.string(16)}`,
        purchaseHistory: {
          priorOrders: rng.int(0, 25),
          avgOrderValue: rng.int(500, 8000),
          firstSeenDays: rng.int(1, 365),
        },
      },
      reason,
      status,
      riskLevel,
      chargebackAmount: amount,
      filedDate: formatDate(filedDaysAgo),
      responseDeadline: formatDate(-responseDaysLeft),
      evidenceSubmitted: rng.bool(0.5),
      confidenceScore: confidence,
      autoResolvable: confidence >= 80 && riskLevel !== 'critical',
      description: getReasonDescription(reason),
      guardrailFlags: fraudFlags,
    });
  }
  return disputes;
}

function getReasonDescription(reason: Dispute['reason']): string {
  const descriptions: Record<Dispute['reason'], string> = {
    fraudulent: 'Cardholder denies initiating this transaction. Possible card-not-present fraud.',
    unrecognized_transaction: 'Cardholder does not recognize the charge on their statement.',
    product_not_received: 'Customer claims goods were not delivered within the expected timeframe.',
    credit_not_processed: 'Customer states a refund was promised but never received.',
    duplicate_charge: 'Customer alleges they were charged twice for the same purchase.',
    subscription_canceled: 'Customer claims subscription was canceled but charges continued.',
    service_not_as_described: 'Customer states the product or service did not match the description.',
  };
  return descriptions[reason];
}

export const mockDisputes: Dispute[] = generateDisputes(28);

function generateGuardrailLogs(): GuardrailLog[] {
  const logs: GuardrailLog[] = [];
  const guardrailNames = [
    'Velocity Check',
    'IP Geolocation Match',
    'Device Fingerprint Check',
    '3D Secure Verification',
    'BIN-to-Billing Country Match',
    'Customer History Score',
    'Evidence Completeness Check',
    'Chargeback Ratio Monitor',
    'Refund Pattern Detector',
    'High-Value Transaction Flag',
  ];

  for (let i = 0; i < 50; i++) {
    const guardrailName = rng.pick(guardrailNames);
    const triggered = rng.bool(0.45);
    const severity = triggered
      ? rng.pick(['warning', 'critical'] as const)
      : 'info';
    const action = triggered
      ? rng.pick(['flag_human', 'block', 'auto_resolve'] as const)
      : 'pass';
    const confidence = rng.int(40, 99);

    logs.push({
      id: `LOG-${String(i + 1).padStart(5, '0')}`,
      timestamp: formatDate(rng.int(0, 7)),
      disputeId: rng.pick(mockDisputes).disputeId,
      guardrailName,
      triggered,
      severity,
      detail: getGuardrailDetail(guardrailName, triggered),
      action,
      latencyMs: rng.int(12, 450),
      confidenceScore: confidence,
      decisionPath: triggered
        ? 'rule_triggered -> evaluate_confidence -> ' +
          (confidence >= 70 ? 'auto_resolve' : 'escalate_human')
        : 'rule_evaluated -> passed -> continue_pipeline',
    });
  }

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function getGuardrailDetail(name: string, triggered: boolean): string {
  if (triggered) {
    const details: Record<string, string> = {
      'Velocity Check': '5 transactions from same IP in 60 seconds — exceeds threshold of 3.',
      'IP Geolocation Match': 'Transaction IP in Singapore, billing address in Mumbai.',
      'Device Fingerprint Check': 'New device with no prior trusted history for this cardholder.',
      '3D Secure Verification': '3DS authentication was not completed for this transaction.',
      'BIN-to-Billing Country Match': 'Card BIN registered in US, billing country is India.',
      'Customer History Score': 'First-time customer with 0 prior orders and high-value purchase.',
      'Evidence Completeness Check': 'Missing delivery proof for product_not_received dispute.',
      'Chargeback Ratio Monitor': 'Merchant chargeback ratio at 1.8% — approaching 2% network threshold.',
      'Refund Pattern Detector': '3 refund requests filed within 24 hours from same customer.',
      'High-Value Transaction Flag': 'Transaction amount ₹38,500 exceeds high-risk threshold of ₹25,000.',
    };
    return details[name] || 'Guardrail rule triggered.';
  }
  return `${name} passed — all checks within normal parameters.`;
}

export const mockGuardrailLogs: GuardrailLog[] = generateGuardrailLogs();

export const mockMetrics: MetricsSummary = {
  totalRevenueGuarded: 47285000,
  chargebackWinRate: 78.5,
  autoResolutionRate: 64.2,
  guardrailInterventions: 1284,
  disputesOpen: 14,
  disputesResolved: 213,
  fraudBlocked: 89,
  falsePositiveRate: 3.2,
  avgResponseTime: 340,
  totalSavings: 2845000,
};

export const mockTimeSeries: TimeSeriesPoint[] = (() => {
  const points: TimeSeriesPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(REFERENCE_DATE);
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toISOString().split('T')[0],
      disputes: rng.int(3, 12),
      won: rng.int(2, 8),
      lost: rng.int(0, 3),
      autoResolved: rng.int(1, 6),
      fraudBlocked: rng.int(0, 4),
    });
  }
  return points;
})();

export const mockRiskDistribution: RiskDistribution[] = (() => {
  const total = mockDisputes.length;
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  mockDisputes.forEach((d) => counts[d.riskLevel]++);
  return (Object.keys(counts) as RiskDistribution['level'][]).map((level) => ({
    level,
    count: counts[level],
    percentage: parseFloat(((counts[level] / total) * 100).toFixed(1)),
  }));
})();

export const mockExtractedEvidence: ExtractedEvidence = {
  transactionId: 'pay_Kr8mX2nQ4vLj',
  merchantName: 'TechKart India Pvt Ltd',
  amount: '₹12,499.00',
  date: '2026-08-28 14:32:11 IST',
  cardLast4: '4242',
  customerSignature: true,
  deliveryProof: true,
  ipAddress: '103.21.45.92',
  rawText: `Razorpay Payment Receipt
Merchant: TechKart India Pvt Ltd
Transaction ID: pay_Kr8mX2nQ4vLj
Date: 2026-08-28 14:32:11 IST
Amount: ₹12,499.00
Card: **** **** **** 4242 (Visa)
Customer: Rahul Sharma
Email: rahul.s@gmail.com
IP Address: 103.21.45.92
3D Secure: Verified
AVS: Match
Delivery Status: Delivered on 2026-08-30
Tracking: DTDC-TRK-8847291
Signature on file: Yes`,
  boundingBoxes: [
    { text: 'pay_Kr8mX2nQ4vLj', x: 12, y: 15, width: 30, height: 4, confidence: 0.98, field: 'Transaction ID' },
    { text: 'TechKart India Pvt Ltd', x: 10, y: 8, width: 35, height: 4, confidence: 0.97, field: 'Merchant Name' },
    { text: '₹12,499.00', x: 60, y: 22, width: 18, height: 4, confidence: 0.99, field: 'Amount' },
    { text: '2026-08-28 14:32:11 IST', x: 12, y: 28, width: 28, height: 4, confidence: 0.96, field: 'Date' },
    { text: '**** **** **** 4242', x: 12, y: 34, width: 25, height: 4, confidence: 0.95, field: 'Card Last4' },
    { text: 'Rahul Sharma', x: 12, y: 40, width: 20, height: 4, confidence: 0.97, field: 'Customer Name' },
    { text: '103.21.45.92', x: 12, y: 50, width: 18, height: 4, confidence: 0.94, field: 'IP Address' },
    { text: 'Verified', x: 15, y: 56, width: 12, height: 4, confidence: 0.93, field: '3D Secure' },
    { text: 'Delivered on 2026-08-30', x: 12, y: 68, width: 30, height: 4, confidence: 0.96, field: 'Delivery Proof' },
  ],
};

export const mockDefenseLetter: DefenseLetter = {
  recipient: 'Razorpay Dispute Resolution Team',
  subject: 'Chargeback Dispute Response — pay_Kr8mX2nQ4vLj (₹12,499.00)',
  body: `Dear Dispute Resolution Team,

We are submitting this response to contest the chargeback filed by the cardholder for the transaction referenced above. Based on our investigation and the evidence enclosed, we respectfully request that this dispute be resolved in the merchant's favor.

SUMMARY OF EVIDENCE:
1. The transaction was authenticated via 3D Secure (Verified by Visa), confirming the cardholder's identity at the time of purchase.
2. AVS (Address Verification Service) returned a match for the billing address on file.
3. The IP address used for this transaction (103.21.45.92) geolocates to Mumbai, India — consistent with the cardholder's billing address.
4. The product was delivered on 2026-08-30 via DTDC (Tracking: DTDC-TRK-8847291), and a delivery signature was obtained.
5. The customer has a prior purchase history of 7 orders with an average value of ₹8,200, indicating a established relationship.

CONCLUSION:
All authentication checks passed, delivery was confirmed with tracking and signature, and the customer has a verifiable purchase history. We believe this chargeback was filed in error or without full knowledge of the transaction details.

We kindly request the dispute be ruled in favor of the merchant.`,
  keyPoints: [
    '3D Secure authentication completed (Verified by Visa)',
    'AVS match confirmed on billing address',
    'IP geolocation consistent with billing country (India)',
    'Product delivered with tracking number DTDC-TRK-8847291',
    'Delivery signature obtained on file',
    'Customer has 7 prior orders — established purchase history',
  ],
  evidenceReferences: [
    'Payment Receipt (pay_Kr8mX2nQ4vLj)',
    'Delivery Proof — DTDC Tracking DTDC-TRK-8847291',
    '3D Secure Authentication Log',
    'Customer Purchase History Report',
  ],
};

export const mockApiPayload: ApiPayload = {
  endpoint: 'https://api.razorpay.com/v1/disputes/disp_8Kj2nQ4vLm/respond',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Razorpay-Key': 'rzp_live_********************',
    'X-Razorpay-Signature': 'sha256=********************************',
  },
  body: {
    dispute_id: 'disp_8Kj2nQ4vLm',
    amount: 1249900,
    summary: 'Transaction authenticated via 3DS, delivery confirmed with tracking',
    evidence_type: 'delivery_proof',
    evidence: {
      payment_id: 'pay_Kr8mX2nQ4vLj',
      tracking_number: 'DTDC-TRK-8847291',
      delivery_date: '2026-08-30',
      signature: true,
      authentication: '3d_secure_verified',
      avs_result: 'match',
      ip_geolocation: 'Mumbai, India',
      customer_history: {
        prior_orders: 7,
        avg_order_value: 8200,
        first_seen_days: 145,
      },
    },
    guardrail_confidence: 87,
    auto_submit: false,
    human_review_required: false,
  },
};

export const mockValidationTrace: ValidationTrace[] = [
  { step: 1, field: 'transaction_id', validator: 'str(min_length=10)', status: 'passed', detail: 'Valid transaction ID format', value: 'pay_Kr8mX2nQ4vLj' },
  { step: 2, field: 'amount', validator: 'Decimal(>0)', status: 'passed', detail: 'Amount is positive and valid', value: '12499.00' },
  { step: 3, field: 'merchant_name', validator: 'str(min_length=3)', status: 'passed', detail: 'Merchant name extracted and validated', value: 'TechKart India Pvt Ltd' },
  { step: 4, field: 'card_last4', validator: 'Literal["4242"]', status: 'passed', detail: 'Last 4 digits match transaction record', value: '4242' },
  { step: 5, field: 'delivery_proof', validator: 'bool', status: 'passed', detail: 'Delivery proof document detected in upload', value: 'true' },
  { step: 6, field: 'customer_signature', validator: 'bool', status: 'passed', detail: 'Customer signature found on delivery receipt', value: 'true' },
  { step: 7, field: 'ip_address', validator: 'IPv4Address', status: 'passed', detail: 'Valid IPv4 address format', value: '103.21.45.92' },
  { step: 8, field: 'three_ds_verified', validator: 'bool', status: 'passed', detail: '3D Secure verification confirmed', value: 'true' },
  { step: 9, field: 'avs_result', validator: 'Literal["match","mismatch"]', status: 'passed', detail: 'AVS result is match', value: 'match' },
  { step: 10, field: 'confidence_score', validator: 'conf(ge=0,le=100)', status: 'passed', detail: 'Confidence score within valid range', value: '87' },
  { step: 11, field: 'evidence_completeness', validator: 'float(ge=0.8)', status: 'warning', detail: 'Evidence completeness at 0.85 — acceptable but delivery POD is image-only', value: '0.85' },
  { step: 12, field: 'guardrail_flags', validator: 'list[max_items=5]', status: 'passed', detail: '2 guardrail flags recorded, within limit', value: '["ip_geolocation_consistent","3ds_verified"]' },
];

export const mockConfidenceBreakdown: ConfidenceBreakdown = {
  overall: 87,
  transactionMatch: 95,
  evidenceStrength: 88,
  customerHistory: 82,
  fraudSignals: 76,
  documentQuality: 91,
};

export const reasonLabels: Record<Dispute['reason'], string> = {
  fraudulent: 'Fraudulent Transaction',
  unrecognized_transaction: 'Unrecognized Transaction',
  product_not_received: 'Product Not Received',
  credit_not_processed: 'Credit Not Processed',
  duplicate_charge: 'Duplicate Charge',
  subscription_canceled: 'Subscription Canceled',
  service_not_as_described: 'Service Not As Described',
};

export const statusLabels: Record<Dispute['status'], string> = {
  open: 'Open',
  under_review: 'Under Review',
  won: 'Won',
  lost: 'Lost',
  auto_resolved: 'Auto-Resolved',
};

export const riskLevelConfig: Record<
  Dispute['riskLevel'],
  { label: string; color: string; bg: string; text: string }
> = {
  low: { label: 'Low Risk', color: 'hsl(var(--success))', bg: 'bg-success/10', text: 'text-success' },
  medium: { label: 'Medium Risk', color: 'hsl(var(--warning))', bg: 'bg-warning/10', text: 'text-warning' },
  high: { label: 'High Risk', color: 'hsl(var(--destructive))', bg: 'bg-destructive/10', text: 'text-destructive' },
  critical: { label: 'Critical Risk', color: 'hsl(var(--destructive))', bg: 'bg-destructive/20', text: 'text-destructive' },
};

export const statusConfig: Record<
  Dispute['status'],
  { label: string; bg: string; text: string }
> = {
  open: { label: 'Open', bg: 'bg-primary/10', text: 'text-primary' },
  under_review: { label: 'Under Review', bg: 'bg-warning/10', text: 'text-warning' },
  won: { label: 'Won', bg: 'bg-success/10', text: 'text-success' },
  lost: { label: 'Lost', bg: 'bg-destructive/10', text: 'text-destructive' },
  auto_resolved: { label: 'Auto-Resolved', bg: 'bg-success/15', text: 'text-success' },
};

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

export function formatFullCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ---------------------------------------------------------------------------
// Sample Documents — for panel members / judges to test the upload feature
// Successful documents produce high-confidence results.
// Unsuccessful documents produce flagged / failed results.
// ---------------------------------------------------------------------------

export const sampleDocuments: SampleDocument[] = [
  {
    name: 'successful_payment_receipt.txt',
    description: 'Complete payment receipt with 3DS, AVS match, delivery proof — high confidence outcome',
    outcome: 'success',
    category: 'payment_receipt',
    content: `Razorpay Payment Receipt
Merchant: TechKart India Pvt Ltd
Merchant ID: M-1001
Transaction ID: pay_Kr8mX2nQ4vLj
Date: 2026-08-28 14:32:11 IST
Amount: Rs. 12,499.00
Currency: INR
Card: **** **** **** 4242 (Visa)
Customer: Rahul Sharma
Email: rahul.s@gmail.com
IP Address: 103.21.45.92
3D Secure: Verified (Verified by Visa)
AVS Result: Match
CVV Result: Match
Delivery Status: Delivered on 2026-08-30
Tracking Number: DTDC-TRK-8847291
Delivery Signature: Yes
Customer History: 7 prior orders, avg order value Rs. 8,200
`,
  },
  {
    name: 'successful_delivery_proof.txt',
    description: 'Delivery proof with tracking and signature — strong evidence for product_not_received dispute',
    outcome: 'success',
    category: 'delivery_proof',
    content: `Delivery Proof Document — Razorpay Dispute Evidence
Transaction ID: pay_Lm2nQ8vRjKp
Merchant: MediLife Pharmacy (M-1003)
Customer: Priya Patel
Delivery Partner: BlueDart
Tracking Number: BLUEDART-9923456
Delivery Date: 2026-08-25
Delivery Time: 15:45 IST
Recipient Signature: Present (scanned)
Delivery Address: Mumbai, Maharashtra, India 400051
Proof of Delivery: Confirmed
Photographic Evidence: Captured at doorstep
3D Secure: Verified
Payment Amount: Rs. 1,500.00
`,
  },
  {
    name: 'successful_subscription_cancelled.txt',
    description: 'Subscription cancellation with clear refund trail — legitimate dispute with evidence',
    outcome: 'success',
    category: 'payment_receipt',
    content: `Razorpay Dispute Evidence — Subscription Cancellation
Merchant: CloudHost Solutions (M-1004)
Transaction ID: pay_MnOpQr1sTuVw
Customer: Anita Desai (anita.d@gmail.com)
Subscription ID: sub_annual_plan_2025
Cancellation Date: 2026-08-10
Refund Initiated: 2026-08-12
Refund Amount: Rs. 2,200.00
Refund Reference: rfd_8JkL2mNp
3D Secure: Verified
Prior Orders: 20
Account Status: Closed
Cancellation Confirmation Email: Sent on 2026-08-10
`,
  },
  {
    name: 'flagged_missing_delivery.txt',
    description: 'Payment receipt without delivery proof — triggers human review (confidence < 70)',
    outcome: 'flagged',
    category: 'incomplete_evidence',
    content: `Razorpay Payment Receipt
Merchant: UrbanThreads Apparel (M-1005)
Transaction ID: pay_QvLjKp9mX2n
Date: 2026-08-26 11:20:00 IST
Amount: Rs. 3,200.00
Card: **** **** **** 4321 (Visa)
Customer: Arun Kumar
Email: arun.k@outlook.com
IP Address: 157.50.10.85
3D Secure: Verified
AVS Result: Match
CVV Result: Match
Prior Orders: 5
Delivery Status: Not Available
Tracking Number: N/A
Delivery Signature: N/A
`,
  },
  {
    name: 'flagged_high_value_new_customer.txt',
    description: 'High-value transaction from new customer — flagged for human review',
    outcome: 'flagged',
    category: 'incomplete_evidence',
    content: `Razorpay Payment Receipt
Merchant: GadgetHub Electronics (M-1006)
Transaction ID: pay_VwXyZ8nLmKp
Date: 2026-08-24 14:50:00 IST
Amount: Rs. 22,500.00
Card: **** **** **** 5555 (Mastercard)
Customer: Vikram Singh
Email: vikram.s@rediffmail.com
IP Address: 14.139.50.2
3D Secure: Verified
AVS Result: Match
CVV Result: Match
Prior Orders: 3
First Seen: 90 days ago
Delivery Status: Delivered on 2026-08-27
Tracking Number: EKART-4478291
`,
  },
  {
    name: 'failed_fraudulent_charge.txt',
    description: 'Fraudulent transaction — IP mismatch, no 3DS, CVV mismatch, new customer. Confidence < 50.',
    outcome: 'failed',
    category: 'fraudulent_charge',
    content: `Razorpay Payment Receipt
Merchant: TechKart India Pvt Ltd (M-1001)
Transaction ID: pay_Xk9pLm3nQ7vRj
Date: 2026-08-29 09:15:00 IST
Amount: Rs. 45,000.00
Card: **** **** **** 1234 (Mastercard)
Customer: Unknown User
Email: new.user@mail.com
IP Address: 203.0.113.5 (Singapore)
Billing Country: India
Shipping Country: Singapore
3D Secure: Not Verified
AVS Result: Mismatch
CVV Result: Mismatch
Prior Orders: 0
First Seen: 1 day ago
Delivery Status: Not Shipped
Tracking Number: N/A
`,
  },
  {
    name: 'failed_suspicious_transaction.txt',
    description: 'Suspicious charge with disposable email, mismatched countries, no authentication — blocked',
    outcome: 'failed',
    category: 'fraudulent_charge',
    content: `Razorpay Payment Receipt
Merchant: GadgetHub Electronics (M-1006)
Transaction ID: pay_GhIjKl0mNoPq
Date: 2026-08-11 01:00:00 IST
Amount: Rs. 42,000.00
Card: **** **** **** 3210 (Visa)
Customer: Quick Order
Email: quick.order@sharklasers.com
IP Address: 23.129.64.10 (Brazil)
Billing Country: India
Shipping Country: Brazil
3D Secure: Not Verified
AVS Result: Mismatch
CVV Result: Mismatch
Prior Orders: 0
First Seen: 1 day ago
Delivery Status: Not Shipped
Tracking Number: N/A
Device Fingerprint: New device, no prior history
`,
  },
];
