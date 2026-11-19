#!/usr/bin/env python3
"""Planning estimator for Domo credit consumption.

Rates come from https://www.domo.com/consumption-terms (updated 10/7/2026 on the page).
Inputs the terms do NOT fix (AI model-processing, documents) are supplied by you from your Rate Card.
Usage:
    python3 estimate_credits.py --example > scenario.json
    python3 estimate_credits.py scenario.json
"""
import argparse
import json
import sys

JUPYTER_PER_5MIN = {1: 0.033333333, 2: 0.066666667, 3: 0.125, 4: 0.25, 5: 0.425,
                    6: 0.725, 7: 1.266666667, 8: 2.25, 9: 4.05}
EXEC_WEIGHT = {"ingest": 1, "write": 1, "magic_etl": 1, "redshift": 1, "mysql": 1,
               "adrenaline": 3, "data_science": 2}
EVERYWHERE_ACCOUNT_PER_DAY = 3.2877
WORKFLOW_START = 0.04
WORKFLOW_TASK = 0.04
AUTOML_RUN = 1.0
AI_PRO_OP = 0.01
ROW_LIMIT_PER_DAY = 25_000_000


def daily_cap(updates):
    """Billable executions per table per day (min(updates, cap) per the terms' tier table)."""
    if updates >= 97:
        cap = 25
    elif updates >= 40:
        cap = 20
    elif updates >= 25:
        cap = 15
    elif updates >= 10:
        cap = 10
    else:
        return updates
    return min(updates, cap)


def estimate(s):
    days = s.get("days_in_month", 30)
    out = {}

    # Storage: rounded 1 per million materialized, 1 per 2 million virtual
    out["storage"] = s.get("materialized_rows", 0) / 1_000_000 + s.get("virtual_rows", 0) / 2_000_000

    # Executions
    exec_total = 0.0
    detail = []
    for e in s.get("executions", []):
        kind = e["type"]
        w = EXEC_WEIGHT[kind]
        billable_per_day = daily_cap(e["runs_per_day"])
        credits = e["tables"] * billable_per_day * w * days
        exec_total += credits
        detail.append({"name": e.get("name", kind), "billable_per_table_day": billable_per_day, "credits": round(credits, 2)})
    out["executions"] = exec_total

    # Row overage: 1 credit per 25M rows over 25M/day. The terms' own example (45M rows = 20M over = 1 credit)
    # implies partial blocks count as a full credit, so round each over-limit day up.
    over = 0.0
    for r in s.get("daily_rows_updated", []):
        excess = max(0, r - ROW_LIMIT_PER_DAY)
        over += -(-excess // ROW_LIMIT_PER_DAY)  # ceil
    out["row_overage"] = over

    # Jupyter: 5-minute increments, rounded up
    jup = 0.0
    for j in s.get("jupyter", []):
        increments = -(-int(j["minutes_per_session"]) // 5)  # ceil
        jup += increments * JUPYTER_PER_5MIN[j["tier"]] * j["sessions_per_month"]
    out["jupyter"] = jup

    out["workflows"] = s.get("workflow_starts", 0) * WORKFLOW_START + s.get("workflow_task_completions", 0) * WORKFLOW_TASK
    out["automl"] = s.get("automl_runs", 0) * AUTOML_RUN
    out["ai_pro_ops"] = s.get("ai_pro_operations", 0) * AI_PRO_OP
    out["ai_model_processing_user_supplied"] = s.get("ai_model_processing_credits", 0.0)
    out["ai_documents_user_supplied"] = s.get("ai_documents_credits", 0.0)
    out["everywhere_end_customer_accounts"] = s.get("everywhere_active_accounts", 0) * EVERYWHERE_ACCOUNT_PER_DAY * days

    rounded = {k: round(v) for k, v in out.items()}  # each credit type rounds to nearest whole credit
    total = sum(rounded.values())
    return {"days_in_month": days, "by_type_unrounded": {k: round(v, 4) for k, v in out.items()},
            "by_type_rounded": rounded, "execution_detail": detail, "total_credits": total,
            "notes": ["Card loads are metered against an annual Service Order cap; no per-load rate is published.",
                      "Code Engine consumes no credits (maintainer-confirmed). API calls and AppDB have no listed rate on the terms page.",
                      "Everywhere 'active' account definition: confirm with Domo."]}


EXAMPLE = {
    "days_in_month": 30,
    "materialized_rows": 120_000_000,
    "virtual_rows": 40_000_000,
    "executions": [
        {"name": "CRM ingest hourly", "type": "ingest", "tables": 4, "runs_per_day": 24},
        {"name": "Sales ETL 15-min", "type": "magic_etl", "tables": 3, "runs_per_day": 96},
        {"name": "Forecast DS flow", "type": "data_science", "tables": 1, "runs_per_day": 4}
    ],
    "daily_rows_updated": [18_000_000, 45_000_000],
    "jupyter": [{"tier": 9, "minutes_per_session": 7, "sessions_per_month": 1}],
    "workflow_starts": 3000,
    "workflow_task_completions": 12000,
    "automl_runs": 2,
    "ai_pro_operations": 5000,
    "ai_model_processing_credits": 0,
    "ai_documents_credits": 0,
    "everywhere_active_accounts": 25
}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("scenario", nargs="?", help="scenario JSON file")
    ap.add_argument("--example", action="store_true", help="print an example scenario")
    a = ap.parse_args()
    if a.example:
        print(json.dumps(EXAMPLE, indent=2))
        sys.exit(0)
    if not a.scenario:
        ap.error("scenario file required (or --example)")
    with open(a.scenario) as f:
        print(json.dumps(estimate(json.load(f)), indent=2))
