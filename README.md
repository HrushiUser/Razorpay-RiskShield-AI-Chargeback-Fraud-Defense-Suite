# Razorpay RiskShield AI — Chargeback & Fraud Defense Suite

> **Track 02: AI Risk Manager** — Razorpay AI Buildathon
>
> *Stop the merchant losing money to fraud, returns and chargebacks.*

> > **Live Demo:** https://razorpay-riskshield-c6iq.bolt.host

RiskShield AI is a production-ready, full-stack chargeback defense platform that detects fraud, scores dispute risk, generates evidence packages, and produces measured precision/recall benchmarks — all with a strict defense-only posture.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     RAZORPAY RISKSHIELD AI                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────── FRONTEND ────────────────────────┐    │
│  │  Next.js 14 · Tailwind CSS · Framer Motion · shadcn/ui  │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │Dashboard │  │   Live   │  │Document  │  │Guardrail│ │    │
│  │  │Overview  │  │ Disputes │  │Extraction│  │  Logs   │ │    │
│  │  │          │  │          │  │  Suite   │  │         │ │    │
│  │  │• Metrics │  │• Filter  │  │• Upload  │  │• Audit  │ │    │
│  │  │• Charts  │  │• Search  │  │• OCR     │  │  Trail  │ │    │
│  │  │• Trends  │  │• Detail  │  │• Gauge   │  │• Expand  │ │    │
│  │  │          │  │• Drawer  │  │• Evidence│  │• Filter  │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  │                     ┌──────────┐                         │    │
│  │                     │ Metrics  │                         │    │
│  │                     │Analytics │                         │    │
│  │                     │• Radar   │                         │    │
│  │                     │• Costs   │                         │    │
│  │                     └──────────┘                         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼ REST API                          │
│  ┌─────────────────────── BACKEND ────────────────────────┐     │
│  │           FastAPI · Pydantic · SQLite Audit             │     │
│  │                                                          │     │
│  │  ┌─────────────────────────────────────────────────┐   │     │
│  │  │              DUAL-ENGINE PIPELINE               │   │     │
│  │  │                                                   │   │     │
│  │  │  ┌──────────┐         ┌──────────────────┐      │   │     │
│  │  │  │   LLM    │  OR     │  Rule-Based      │      │   │     │
│  │  │  │  Engine  │────┐    │  Fallback Engine │      │   │     │
│  │  │  │(Instructor)│   │    │  (7 guardrails)  │      │   │     │
│  │  │  └──────────┘    │    └──────────────────┘      │   │     │
│  │  │                  └──────────┬───────────┘       │   │     │
│  │  │                             ▼                    │   │     │
│  │  │  ┌──────────────────────────────────────┐       │   │     │
│  │  │  │  Pydantic Schema Validation           │       │   │     │
│  │  │  │  ChargebackEvidence · ConfidenceScore │       │   │     │
│  │  │  │  GuardrailMetrics · GuardrailResult   │       │   │     │
│  │  │  └──────────────────────────────────────┘       │   │     │
│  │  │                             │                    │   │     │
│  │  │                             ▼                    │   │     │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │   │     │
│  │  │  │Defense Letter│  │ API Payload  │  │Validation│ │   │     │
│  │  │  │  Generator   │  │  Generator   │  │  Trace   │ │   │     │
│  │  │  └─────────────┘  └──────────────┘  └─────────┘ │   │     │
│  │  └─────────────────────────────────────────────────┘   │     │
│  │                             │                            │     │
│  │                             ▼                            │     │
│  │  ┌─────────────────────────────────────────────────┐   │     │
│  │  │              SQLite AUDIT TRAIL                  │   │     │
│  │  │  • transaction_id  • raw_text  • prompt_params   │   │     │
│  │  │  • model_latency   • confidence • decision_path  │   │     │
│  │  │  • guardrail_flags • response_payload • hash     │   │     │
│  │  └─────────────────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────── EVALUATION ───────────────────────┐       │
│  │  evaluate.py — 20 mock disputes vs ground truth      │       │
│  │  Precision · Recall · F1 · False Positive Cost       │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
razorpay-riskshield-ai/
├── app/                          # Next.js frontend
│   ├── layout.tsx               # Root layout (Razorpay dark theme)
│   ├── page.tsx                 # Main portal shell + view routing
│   └── globals.css              # Theme tokens (Razorpay color system)
│
├── components/
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── metric-card.tsx          # Animated metric cards
│   ├── confidence-gauge.tsx     # Animated SVG confidence gauge
│   └── views/
│       ├── dashboard-view.tsx       # Real-time metrics + charts
│       ├── live-disputes-view.tsx   # Dispute queue + detail drawer
│       ├── extraction-view.tsx      # Document upload + OCR + evidence
│       ├── guardrail-logs-view.tsx  # Guardrail audit trail
│       ├── analytics-view.tsx       # Benchmark charts + cost analysis
│       └── benchmark-card.tsx       # Reusable metric card
│
├── lib/
│   ├── types.ts                 # TypeScript type definitions
│   ├── mock-data.ts             # Dispute data, guardrail logs, evidence
│   └── utils.ts                 # Shared utilities
│
├── backend/
│   ├── app.py                   # FastAPI server (Pydantic + SQLite + dual-engine)
│   └── requirements.txt         # Python dependencies
│
├── evaluate.py                  # Benchmark evaluation script (20 test cases)
├── README.md                    # This file
└── package.json                 # Frontend dependencies
```

---

## Key Features

### 1. Dashboard Overview
- **Real-Time Metrics Row**: Total Revenue Guarded (₹4.72 Cr), Chargeback Win-Rate (78.5%), Auto-Resolution Rate (64.2%), Guardrail Interventions (1,284)
- **Interactive Charts**: 30-day dispute resolution trend (Area chart), Risk distribution (Pie chart), Fraud blocked by day (Bar chart)
- **Recent Disputes Feed**: Live-updating list with risk level indicators

### 2. Live Disputes
- Searchable, filterable dispute queue (28 mock disputes)
- Filter by status (open, under review, won, lost, auto-resolved) and risk level (low → critical)
- Slide-out detail drawer with full transaction metadata, guardrail flags, and action buttons

### 3. Document Extraction Suite (Centerpiece)
- **Drag-and-drop upload** zone (PDF/PNG/JPG)
- **OCR Extraction Panel** with animated bounding boxes over extracted fields
- **Guardrail Confidence Meter** — animated SVG gauge (0-100%) with human-in-the-loop intervention trigger at < 70%
- **Generated Evidence Inspector** — tabbed viewer with:
  - **Defense Letter**: Formatted chargeback response with key points and evidence references
  - **API Payload**: Razorpay Sandbox API JSON with copy-to-clipboard
  - **Validation Trace**: Pydantic schema validation audit (12-step trace)

### 4. AI Guardrail Logs
- 50 logged guardrail events with expandable detail rows
- 7 guardrail rules: Velocity Check, IP Geolocation, Device Fingerprint, 3D Secure, BIN Match, Customer History, Evidence Completeness
- Filter by triggered/passed, stats bar (total, triggered, auto-resolved, blocked, avg latency)

### 5. Metric Analytics
- **Radar Chart**: Model performance vs target across 6 metrics
- **Cost Impact Analysis**: Horizontal bar chart showing fraud savings vs false positive cost
- **14-Day Breakdown**: Composed chart (line + bars) for dispute resolution trends
- **Summary Cards**: Net Savings (₹28.45L), Avg Response Time (340ms), False Positive Cost (₹0.85L)

---

## Backend (FastAPI)

### Dual-Engine Architecture

| Engine | When | How |
|--------|------|-----|
| **LLM Engine** | `OPENAI_API_KEY` or `GEMINI_API_KEY` set | Instructor → structured Pydantic output from GPT-4o-mini or Gemini 1.5 Flash |
| **Rule-Based Fallback** | No API key, or LLM error | 7 deterministic guardrail rules with weighted confidence scoring |

### Pydantic Schemas (Strict Enforcement)

- **`ChargebackEvidence`**: Transaction metadata + dispute reason + extracted text + delivery proof
- **`ConfidenceScore`**: 5-dimensional confidence (0-100) with auto-resolvable/human-review flags
- **`GuardrailMetrics`**: Full response — confidence + guardrails + decision + defense letter + API payload + validation trace
- **`GuardrailResult`**: Individual rule evaluation with severity, action, confidence contribution

### SQLite Audit Trail

Every API call logs:
- Transaction ID, dispute ID, timestamp
- Raw extracted text, prompt parameters
- Model latency (ms), confidence score
- Decision path, engine used (llm/rule_based)
- Guardrail flags, full response payload, SHA-256 hash

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check + active engine |
| POST | `/api/analyze` | Analyze dispute → confidence + guardrails + evidence |
| POST | `/api/extract` | OCR document extraction (simulated) |
| GET | `/api/audit/{transaction_id}` | Audit trail for a transaction |
| GET | `/api/guardrails` | Recent guardrail logs |
| GET | `/api/metrics` | Aggregate metrics |
| GET | `/api/test-cases` | 20 test cases with ground truth |

---

## Evaluation Benchmark (`evaluate.py`)

Evaluates 20 mock disputes (10 fraud, 10 legitimate) against ground truth labels.

### Metrics Computed
- **Precision**: TP / (TP + FP)
- **Recall**: TP / (TP + FN)
- **F1-Score**: Harmonic mean of precision and recall
- **Accuracy**: (TP + TN) / Total
- **Specificity**: TN / (TN + FP)
- **NPV**: TN / (TN + FN)
- **False Positive Cost**: FP × ₹500 (customer friction + manual review)
- **Fraud Caught Savings**: TP × ₹15,000
- **Net Savings**: Caught savings − Missed cost − FP cost

### Running the Evaluation

```bash
# Local rule-based engine (no API key needed)
python evaluate.py

# Verbose mode with per-case breakdown
python evaluate.py --verbose

# Against a running FastAPI backend
python evaluate.py --api http://localhost:8000
```

### Sample Output

```
========================================================================
  RAZORPAY RISKSHIELD AI — EVALUATION BENCHMARK REPORT
  Track 02: AI Risk Manager — Chargeback & Fraud Defense
========================================================================

  CONFUSION MATRIX
  ┌─────────────────┬────────────────┬────────────────┐
  │                 │  Predicted     │  Predicted     │
  │                 │  FRAUD         │  LEGITIMATE    │
  ├─────────────────┼────────────────┼────────────────┤
  │  Actual FRAUD   │  TP: 10        │  FN:  0        │
  │  Actual LEGIT   │  FP:  1        │  TN:  9        │
  └─────────────────┴────────────────┴────────────────┘

  CORE METRICS
  ┌───────────────────────────┬──────────────┬──────────────┐
  │ Precision                 │     90.9%    │      85%     │ PASS
  │ Recall                    │    100.0%    │      80%     │ PASS
  │ F1-Score                  │     95.2%    │      82%     │ PASS
  │ Accuracy                  │     95.0%    │      88%     │ PASS
  │ Specificity               │     90.0%    │      90%     │ PASS
  └───────────────────────────┴──────────────┴──────────────┘

  COST IMPACT ANALYSIS (INR)
  ┌───────────────────────────────┬────────────────────┐
  │ Fraud Caught Savings (TP)     │  ₹     1,50,000    │
  │ Fraud Missed Cost (FN)        │  ₹          0       │
  │ False Positive Cost (FP)      │  ₹        500       │
  │ NET SAVINGS                   │  ₹     1,49,500    │
  └───────────────────────────────┴────────────────────┘

  VERDICT: PRODUCTION READY
========================================================================
```

---

## Setup & Installation

### Frontend (Next.js)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The frontend runs on `http://localhost:3000`.

### Backend (FastAPI)

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Set API keys for LLM engine
export OPENAI_API_KEY="sk-..."
# OR
export GEMINI_API_KEY="..."

# Start the server
python app.py
# OR
uvicorn app:app --reload --port 8000
```

The backend runs on `http://localhost:8000`.

Without API keys, the system automatically uses the rule-based fallback engine.

### Evaluation

```bash
# From project root
python evaluate.py --verbose
```

---

## Design System

### Color Palette (Razorpay Dark Merchant Portal)

| Token | HSL | Usage |
|-------|-----|-------|
| Background | `217 60% 7%` | App background (#0C1A30) |
| Card | `217 58% 9%` | Cards, panels (#0B1426) |
| Primary | `210 98% 43%` | Razorpay Blue (#2B6CB0) |
| Success | `160 84% 39%` | Guardrail passed (#10B981) |
| Destructive | `0 84% 60%` | Flagged fraud (#EF4444) |
| Warning | `38 92% 50%` | Human review needed |
| Border | `217 40% 16%` | Subtle borders |

### Typography
- **Font**: Inter (Google Fonts)
- **Body**: 150% line height
- **Headings**: 120% line height
- **Weights**: 400 (body), 600 (semibold), 700 (bold)

### Spacing
- 8px base unit system
- Consistent padding/margins across components

### Animations
- Framer Motion for view transitions, card entrances, and layout animations
- Animated SVG confidence gauge with spring physics
- Pulse-glow effects for status indicators
- Staggered list animations for data feeds

---

## Guardrail Rules (Defense-Only)

| # | Guardrail | Trigger | Severity |
|---|-----------|---------|----------|
| 1 | IP Geolocation Match | Shipping ≠ Billing country | Critical |
| 2 | 3D Secure Verification | 3DS not completed | Warning |
| 3 | AVS Address Match | AVS mismatch | Warning |
| 4 | Customer History Score | 0 prior orders, < 7 days | Warning |
| 5 | Evidence Completeness | Missing delivery proof | Critical |
| 6 | High-Value Transaction | Amount > ₹25,000 + new customer | Warning |
| 7 | CVV Verification | CVV mismatch | Critical (Block) |

> **Strictly defense-only**: No offense-capable features. The system only blocks, flags, and generates evidence — it cannot initiate charges, access other merchants' data, or perform any offensive action.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS 3, shadcn/ui components |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI, Python 3.10+ |
| Validation | Pydantic v2 |
| LLM (optional) | OpenAI GPT-4o-mini / Gemini 1.5 Flash via Instructor |
| Database | SQLite (audit_trail.db) |
| Evaluation | Custom benchmark script with confusion matrix |

---

## License

Built for Razorpay AI Buildathon — Track 02: AI Risk Manager.
