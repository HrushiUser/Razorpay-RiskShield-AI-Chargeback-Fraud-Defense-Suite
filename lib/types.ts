export type DisputeStatus = 'open' | 'under_review' | 'won' | 'lost' | 'auto_resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DisputeReason =
  | 'fraudulent'
  | 'unrecognized_transaction'
  | 'product_not_received'
  | 'credit_not_processed'
  | 'duplicate_charge'
  | 'subscription_canceled'
  | 'service_not_as_described';

export interface Transaction {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  date: string;
  customerEmail: string;
  customerName: string;
  paymentMethod: string;
  cardLast4: string;
  cardBrand: string;
  ipAddress: string;
  billingCountry: string;
  shippingCountry: string;
  avsResult: 'match' | 'mismatch' | 'unavailable';
  cvvResult: 'match' | 'mismatch' | 'unavailable';
  is3DSecure: boolean;
  deviceFingerprint: string;
  purchaseHistory: {
    priorOrders: number;
    avgOrderValue: number;
    firstSeenDays: number;
  };
}

export interface Dispute {
  id: string;
  disputeId: string;
  transaction: Transaction;
  reason: DisputeReason;
  status: DisputeStatus;
  riskLevel: RiskLevel;
  chargebackAmount: number;
  filedDate: string;
  responseDeadline: string;
  evidenceSubmitted: boolean;
  confidenceScore: number;
  autoResolvable: boolean;
  description: string;
  guardrailFlags: string[];
}

export interface GuardrailLog {
  id: string;
  timestamp: string;
  disputeId: string;
  guardrailName: string;
  triggered: boolean;
  severity: 'info' | 'warning' | 'critical';
  detail: string;
  action: 'auto_resolve' | 'flag_human' | 'block' | 'pass';
  latencyMs: number;
  confidenceScore: number;
  decisionPath: string;
}

export interface OcrBoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  field: string;
}

export interface ExtractedEvidence {
  transactionId: string;
  merchantName: string;
  amount: string;
  date: string;
  cardLast4: string;
  customerSignature: boolean;
  deliveryProof: boolean;
  ipAddress: string;
  rawText: string;
  boundingBoxes: OcrBoundingBox[];
}

export interface DefenseLetter {
  recipient: string;
  subject: string;
  body: string;
  keyPoints: string[];
  evidenceReferences: string[];
}

export interface ApiPayload {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface ValidationTrace {
  step: number;
  field: string;
  validator: string;
  status: 'passed' | 'failed' | 'warning';
  detail: string;
  value: string;
}

export interface ConfidenceBreakdown {
  overall: number;
  transactionMatch: number;
  evidenceStrength: number;
  customerHistory: number;
  fraudSignals: number;
  documentQuality: number;
}

export type AnalysisOutcome = 'success' | 'flagged' | 'failed';

export interface SampleDocument {
  name: string;
  description: string;
  outcome: AnalysisOutcome;
  content: string;
  category: 'payment_receipt' | 'delivery_proof' | 'fraudulent_charge' | 'incomplete_evidence';
}

export interface MetricsSummary {
  totalRevenueGuarded: number;
  chargebackWinRate: number;
  autoResolutionRate: number;
  guardrailInterventions: number;
  disputesOpen: number;
  disputesResolved: number;
  fraudBlocked: number;
  falsePositiveRate: number;
  avgResponseTime: number;
  totalSavings: number;
}

export interface TimeSeriesPoint {
  date: string;
  disputes: number;
  won: number;
  lost: number;
  autoResolved: number;
  fraudBlocked: number;
}

export interface RiskDistribution {
  level: RiskLevel;
  count: number;
  percentage: number;
}
