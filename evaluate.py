"""
Razorpay RiskShield AI — Evaluation Benchmark Script
Track 02: AI Risk Manager

Evaluates 20 mock disputes against ground truth labels.
Prints a clean CLI table of Precision, Recall, F1-Score, and False Positive Cost Savings.

Usage:
    python evaluate.py

    # Against a running backend:
    python evaluate.py --api http://localhost:8000

    # With verbose per-case output:
    python evaluate.py --verbose
"""

import os
import sys
import argparse
import time
import json
from typing import List, Dict, Tuple

sys.path.insert(0, os.path.dirname(__file__))

from backend.app import TEST_CASES, RuleBasedEngine, ChargebackEvidence, DisputeReason


# ---------------------------------------------------------------------------
# Cost Parameters (configurable)
# ---------------------------------------------------------------------------

AVG_CHARGEBACK_AMOUNT = 15000  # ₹15,000 average chargeback
FALSE_POSITIVE_COST = 500  # ₹500 cost per false positive (customer friction + manual review)
FRAUD_LOST_COST = 15000  # ₹15,000 lost per fraud case not caught


def predict(evidence_dict: dict, use_api: bool = False, api_url: str = "") -> Tuple[str, float, dict]:
    """
    Run prediction on a single test case.
    Returns (prediction, confidence_score, details)
    prediction: 'fraud' or 'legitimate'
    """
    if use_api:
        return predict_via_api(evidence_dict, api_url)
    return predict_local(evidence_dict)


def predict_local(evidence_dict: dict) -> Tuple[str, float, dict]:
    """Use local rule-based engine for prediction."""
    evidence = ChargebackEvidence(
        transaction=evidence_dict["transaction"],
        dispute_reason=DisputeReason(evidence_dict["dispute_reason"]),
        extracted_text=evidence_dict.get("extracted_text", ""),
        delivery_proof=evidence_dict.get("delivery_proof", False),
        customer_signature=evidence_dict.get("customer_signature", False),
        tracking_number=evidence_dict.get("tracking_number"),
    )

    confidence, guardrails, decision_path = RuleBasedEngine.evaluate(evidence)

    # Classify: if confidence < 50 or critical guardrails triggered, predict fraud
    critical_triggered = any(
        g.triggered and g.severity == "critical" for g in guardrails
    )
    blocked = any(g.action == "block" for g in guardrails)

    if blocked or critical_triggered or confidence.overall < 50:
        prediction = "fraud"
    else:
        prediction = "legitimate"

    triggered_guardrails = [g.guardrail_name for g in guardrails if g.triggered]

    return prediction, confidence.overall, {
        "guardrails_triggered": triggered_guardrails,
        "decision": decision_path.split(" -> ")[-1] if decision_path else "unknown",
        "auto_resolvable": confidence.auto_resolvable,
    }


def predict_via_api(evidence_dict: dict, api_url: str) -> Tuple[str, float, dict]:
    """Call the FastAPI backend for prediction."""
    import urllib.request
    import urllib.error

    payload = json.dumps(evidence_dict).encode("utf-8")
    req = urllib.request.Request(
        f"{api_url}/api/analyze",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        print(f"  API Error: {e}")
        return predict_local(evidence_dict)

    confidence = result["confidence"]["overall"]
    # If decision is "block" or confidence is very low, predict fraud
    if result["decision"] == "block" or confidence < 50:
        prediction = "fraud"
    else:
        prediction = "legitimate"

    triggered = [g["guardrail_name"] for g in result["guardrails"] if g["triggered"]]

    return prediction, confidence, {
        "guardrails_triggered": triggered,
        "decision": result["decision"],
        "auto_resolvable": result["confidence"]["auto_resolvable"],
        "engine_used": result["engine_used"],
        "latency_ms": result["model_latency_ms"],
    }


def evaluate(test_cases: List[dict], use_api: bool = False, api_url: str = "", verbose: bool = False) -> Dict:
    """
    Evaluate all test cases and compute metrics.
    """
    results = []
    tp, fp, tn, fn = 0, 0, 0, 0
    total_latency = 0

    for tc in test_cases:
        ground_truth = tc["ground_truth"]
        start = time.time()
        prediction, confidence, details = predict(tc["evidence"], use_api, api_url)
        latency = (time.time() - start) * 1000
        total_latency += latency

        is_correct = prediction == ground_truth

        if prediction == "fraud" and ground_truth == "fraud":
            tp += 1
        elif prediction == "fraud" and ground_truth == "legitimate":
            fp += 1
        elif prediction == "legitimate" and ground_truth == "legitimate":
            tn += 1
        elif prediction == "legitimate" and ground_truth == "fraud":
            fn += 1

        results.append({
            "id": tc["id"],
            "ground_truth": ground_truth,
            "prediction": prediction,
            "confidence": confidence,
            "correct": is_correct,
            "latency_ms": latency,
            "details": details,
        })

        if verbose:
            status = "✓" if is_correct else "✗"
            color = "\033[92m" if is_correct else "\033[91m"
            reset = "\033[0m"
            print(f"  {color}{status}{reset} {tc['id']}: predicted={prediction:12s} actual={ground_truth:12s} confidence={confidence:5.1f}% latency={latency:.0f}ms")
            if details.get("guardrails_triggered"):
                print(f"       guardrails: {', '.join(details['guardrails_triggered'])}")

    # Compute metrics
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    accuracy = (tp + tn) / (tp + fp + tn + fn) if (tp + fp + tn + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0

    # Cost analysis
    fraud_caught_savings = tp * FRAUD_LOST_COST
    fraud_missed_cost = fn * FRAUD_LOST_COST
    false_positive_cost = fp * FALSE_POSITIVE_COST
    net_savings = fraud_caught_savings - fraud_missed_cost - false_positive_cost

    avg_latency = total_latency / len(test_cases) if test_cases else 0

    return {
        "results": results,
        "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
        "precision": precision * 100,
        "recall": recall * 100,
        "f1_score": f1 * 100,
        "accuracy": accuracy * 100,
        "specificity": specificity * 100,
        "npv": npv * 100,
        "fraud_caught_savings": fraud_caught_savings,
        "fraud_missed_cost": fraud_missed_cost,
        "false_positive_cost": false_positive_cost,
        "net_savings": net_savings,
        "avg_latency_ms": avg_latency,
        "total_cases": len(test_cases),
    }


def print_report(metrics: Dict, verbose: bool = False):
    """Print a clean CLI report table."""
    cm = metrics["confusion_matrix"]

    # Header
    print()
    print("=" * 72)
    print("  RAZORPAY RISKSHIELD AI — EVALUATION BENCHMARK REPORT")
    print("  Track 02: AI Risk Manager — Chargeback & Fraud Defense")
    print("=" * 72)
    print()

    # Confusion Matrix
    print("  CONFUSION MATRIX")
    print("  ┌─────────────────┬────────────────┬────────────────┐")
    print("  │                 │  Predicted     │  Predicted     │")
    print("  │                 │  FRAUD         │  LEGITIMATE    │")
    print("  ├─────────────────┼────────────────┼────────────────┤")
    print(f"  │  Actual FRAUD   │  TP: {cm['tp']:>2}        │  FN: {cm['fn']:>2}        │")
    print(f"  │  Actual LEGIT   │  FP: {cm['fp']:>2}        │  TN: {cm['tn']:>2}        │")
    print("  └─────────────────┴────────────────┴────────────────┘")
    print()

    # Core Metrics Table
    print("  CORE METRICS")
    print("  ┌───────────────────────────┬──────────────┬──────────────┐")
    print("  │ Metric                    │    Score     │   Target     │")
    print("  ├───────────────────────────┼──────────────┼──────────────┤")

    def metric_row(name, value, target, unit="%"):
        v = f"{value:.1f}{unit}"
        t = f"{target}{unit}" if unit == "%" else target
        status = "PASS" if value >= float(target) else "FAIL"
        color = "\033[92m" if value >= float(target) else "\033[91m"
        reset = "\033[0m"
        print(f"  │ {name:<25s} │  {v:>10s}   │  {t:>10s}   │ {color}{status}{reset}")

    metric_row("Precision", metrics["precision"], 85)
    metric_row("Recall", metrics["recall"], 80)
    metric_row("F1-Score", metrics["f1_score"], 82)
    metric_row("Accuracy", metrics["accuracy"], 88)
    metric_row("Specificity", metrics["specificity"], 90)
    metric_row("NPV (Negative Pred. Val.)", metrics["npv"], 85)
    print("  └───────────────────────────┴──────────────┴──────────────┘")
    print()

    # Cost Impact Analysis
    print("  COST IMPACT ANALYSIS (INR)")
    print("  ┌───────────────────────────────┬────────────────────┐")
    print(f"  │ Fraud Caught Savings (TP)     │  ₹{metrics['fraud_caught_savings']:>12,}   │")
    print(f"  │ Fraud Missed Cost (FN)        │  ₹{metrics['fraud_missed_cost']:>12,}   │")
    print(f"  │ False Positive Cost (FP)      │  ₹{metrics['false_positive_cost']:>12,}   │")
    net_color = "\033[92m" if metrics["net_savings"] > 0 else "\033[91m"
    reset = "\033[0m"
    print(f"  │ {net_color}NET SAVINGS{reset}                  │  {net_color}₹{metrics['net_savings']:>12,}{reset}   │")
    print("  └───────────────────────────────┴────────────────────┘")
    print()

    # Performance
    print("  PERFORMANCE")
    print(f"  Total Test Cases:    {metrics['total_cases']}")
    print(f"  Avg Latency:         {metrics['avg_latency_ms']:.1f}ms")
    print(f"  Correct Predictions: {sum(1 for r in metrics['results'] if r['correct'])}/{metrics['total_cases']}")
    print()

    # Per-case breakdown (if verbose)
    if verbose:
        print("  PER-CASE BREAKDOWN")
        print("  ┌──────────┬──────────────┬──────────────┬────────────┬───────────┐")
        print("  │ Case ID  │ Predicted    │ Actual       │ Confidence │ Result    │")
        print("  ├──────────┼──────────────┼──────────────┼────────────┼───────────┤")
        for r in metrics["results"]:
            status = "PASS" if r["correct"] else "FAIL"
            color = "\033[92m" if r["correct"] else "\033[91m"
            reset = "\033[0m"
            print(f"  │ {r['id']:<8s} │ {r['prediction']:<12s} │ {r['ground_truth']:<12s} │ {r['confidence']:>8.1f}%  │ {color}{status:<9s}{reset} │")
        print("  └──────────┴──────────────┴──────────────┴────────────┴───────────┘")
        print()

    # Verdict
    all_pass = (
        metrics["precision"] >= 85
        and metrics["recall"] >= 80
        and metrics["f1_score"] >= 82
        and metrics["net_savings"] > 0
    )

    verdict_color = "\033[92m" if all_pass else "\033[93m"
    verdict = "PRODUCTION READY" if all_pass else "NEEDS TUNING"
    print(f"  {verdict_color}VERDICT: {verdict}{reset}")
    print()

    # False positive cost analysis
    fp_rate = (cm["fp"] / (cm["fp"] + cm["tn"]) * 100) if (cm["fp"] + cm["tn"]) > 0 else 0
    print(f"  False Positive Rate: {fp_rate:.1f}% (target < 5%)")
    print(f"  False Positive Cost as % of Savings: {(metrics['false_positive_cost'] / max(metrics['fraud_caught_savings'], 1) * 100):.1f}%")
    print()
    print("=" * 72)
    print()


def main():
    parser = argparse.ArgumentParser(description="RiskShield AI Evaluation Benchmark")
    parser.add_argument("--api", type=str, default="", help="API URL (e.g. http://localhost:8000)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose per-case output")
    args = parser.parse_args()

    use_api = bool(args.api)

    if use_api:
        print(f"\n  Evaluating {len(TEST_CASES)} test cases against API: {args.api}\n")
    else:
        print(f"\n  Evaluating {len(TEST_CASES)} test cases using local rule-based engine\n")

    if args.verbose:
        print("  PER-CASE RESULTS:")
        print()

    metrics = evaluate(TEST_CASES, use_api=use_api, api_url=args.api, verbose=args.verbose)
    print_report(metrics, verbose=args.verbose)

    # Save results to JSON
    output = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "metrics": {k: v for k, v in metrics.items() if k != "results"},
        "results": metrics["results"],
    }
    with open("evaluation_results.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"  Results saved to evaluation_results.json")
    print()

    # Exit code based on pass/fail
    sys.exit(0 if metrics["precision"] >= 85 and metrics["recall"] >= 80 else 1)


if __name__ == "__main__":
    main()
