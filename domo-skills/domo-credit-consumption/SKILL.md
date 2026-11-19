---
name: domo-credit-consumption
description: How Domo credits are consumed - storage, data ingest and ETL executions, execution caps and row limits, Jupyter, Workflows, AutoML, AI features, Domo Everywhere end-customer accounts, card loads - with formulas, examples, cost-aware design rules and an estimator script. Use when estimating, explaining, or reducing Domo cost, or when designing pipelines, apps, AI features or embeds.
---

# Domo Credit Consumption

Source: Domo Consumption Supplemental Terms, https://www.domo.com/consumption-terms (page "last updated 10/7/2026"; fetched 2026-11-19).
Terms can change: pricing changes apply at renewal/new Service Order; other changes (including new features) take effect immediately. Re-fetch before quoting.
Your authoritative live numbers: **Admin > Company Settings > Credit Utilization** (includes **Rate Card** with your contract-rate-adjusted AI prices).
Not legal/financial advice; contract and Service Order govern.

## Rules of the system

- Credits apply across **Domo Platform, Domo Everywhere, and apps**. Combined usage must not exceed the credits in the Service Order.
- At the end of each billing statement period credits are totaled and **each credit type is rounded to the nearest whole credit**.
- The page does **not** state: credit expiration, consequences of exceeding the Service Order, or rates for raw API calls, AppDB, or Pro-Code app hosting. Do not invent them. **Code Engine consumes no credits** [Confirmed by maintainer]. Check the Rate Card or CSM.

## Storage (monthly)
| Type | Credits |
|---|---|
| Materialized rows (stored in Domo) | 1 per **million** rows |
| Virtual rows (Views / Fusion) | 1 per **two million** rows |
Row count uses the **3rd lowest usage day** of the month (spikes on a few days are forgiven).

## Executions
| Execution | Credits |
|---|---|
| Data ingest (connectors, file upload, API, CLI, SDK, Workbench, webhooks, other imports, custom pipelines) | **1 per table created or updated** |
| Data written (writeback to external systems) | 1 per table written |
| Magic ETL dataflow | 1 per **output table** |
| Redshift dataflow | 1 per output table |
| MySQL dataflow | 1 per output table |
| Adrenaline dataflow | **3** per output table |
| Data Science dataflow (Magic ETL with Data Science tiles or R/Python tiles) | **2** per output table |

### Daily execution caps (per table per day, by number of updates/writes)
| Updates or writes that day | Billable cap per table per day |
|---|---|
| 10-24 | 10 |
| 25-39 | 15 |
| 40-96 | 20 |
| 97+ | 25 |
(Under 10 updates you pay for each. Reading: billable = min(updates, cap).) [Interpretation of the table; confirm on your invoice.]

### Row-volume overage
Rows updated/written cost **no credits** unless the daily total exceeds **25,000,000 rows**; then **1 credit per 25M rows over the limit** (45M rows in a day = 20M over = 1 credit; the estimator rounds each over-limit day up to match this example).

## Jupyter
Billed in **5-minute increments** from workspace open to stop, rounded up. Credits per 5 min by tier:
T1 0.033333333, T2 0.066666667, T3 0.125, T4 0.25, T5 0.425, T6 0.725, T7 1.266666667, T8 2.25, T9 4.05.
Example: Tier 9 for 7 min -> 10 min -> 2 x 4.05 = 8.1 credits. **Stop idle workspaces.**

## Workflows, AutoML
- Workflow start: **0.04** credits per start. Workflow task completion: **0.04** per task.
- AutoML: **1 credit** per completed training or retraining run.

## AI features
- **AI Agent Chat**: 0.2 credits per chat request through **Oct 31, 2026**; from **Nov 1, 2026** chat consumes credits as part of **Domo AI Pro**.
- **Domo AI Pro operations**: **0.01 credit per operation** (including chat requests).
- **Model processing**: Domo-provided models bill credits per 1M tokens = model's per-unit price / Contract Rate (varies by model; see Domo AI Pro Pricing page and your Rate Card). **Customer-provided models consume no credits.**
- **Documents** (effective Aug 1, 2026): File and Agent Knowledge **storage** (credits per GB per day, price / Contract Rate; Agent Knowledge storage only if enabled); Agent Knowledge **processing** (credits per GB; rates differ by type: plain text txt/md/csv/css/json/html; video mp4/mov; image jpg/jpeg/png; audio mp3/wav; document doc/docx/xls/xlsx/pdf); Agent Knowledge **queries** (credits per query).
- **Contract Rate**: the standard credit rate in the Service Order (else per-credit price as of the Initial Term Start Date).
- App-side AI (`domo.ai.*`, `/domo/ai/v1/...`) is an AI Pro feature and consumes AI credits (no per-call credit amount on the AI Service Layer page).

## Domo Everywhere
- **Active End Customer Account: 3.2877 credits per day per account** (3.2877 x 365 = ~1,200 credits/year). Storage, activities, executions inside those accounts also consume credits per the tables above.
- **Card loads**: any load, refresh, drill, or filter of a card, app, or visual (platform or embedded) counts. Combined platform + Everywhere loads cannot exceed the **annual amount in the Service Order**. No per-load credit rate is listed.
- Programmatic-filter embeds shift pricing from per-user to **impression/view-based** (embed docs), because one service account proxies viewers.

## Cost-aware design rules for agents

1. **Batch and consolidate table updates.** Ingest cost is per table updated, and caps start at 10+ updates/day/table. Prefer hourly over every-minute refresh unless needed; avoid fan-out of many small tables.
2. **Minimize output tables** in Magic ETL; each output table is 1 credit per run. One dataflow with 6 outputs = 6 credits per run.
3. **Avoid Adrenaline (3x) and Data Science dataflows (2x)** unless required; prefer plain Magic ETL / SQL where adequate.
4. **Do not exceed 25M rows/day** updated/written per the overage rule; partition/delta-load instead of full reloads.
5. **Consider virtual rows (Views/Fusion) for storage**: they cost half the credits per row (1 per 2 million vs 1 per million). Execution and card-load costs still apply; the terms page does not say how federated queries are metered, so confirm before relying on it.
6. **Delete stale datasets/versions** to cut materialized rows (storage is sampled on the 3rd lowest day, so one-off spikes are cheap; sustained bloat is not).
7. **Jupyter**: right-size tier, shut down idle; schedule notebooks as DataFlows only when needed (5-min rounding).
8. **Workflows**: 0.04/start + 0.04/task adds up in high-frequency or loop-heavy designs; batch inside Code Engine functions where it keeps within 5 min / 1 GB.
9. **AI**: use customer-provided models where acceptable (no credits), cache repeated prompts, keep context small, avoid per-keystroke calls, prefer batch operations; watch the Nov 1, 2026 AI Chat change.
10. **AppDB sync**: syncing a collection to a dataset is a table update; do not sync on every write; use `export()` or workflow schedules deliberately.
11. **Embeds**: card loads are metered. Avoid auto-refresh intervals, over-eager filter-triggered reloads (pfilter URL changes reload the iframe), and loading many cards per page when one dashboard works.
12. **Everywhere accounts**: the 3.2877 credits/day rate applies to "Active" End Customer Accounts. The terms page does not define "active", so confirm the definition with Domo before sizing, and decommission unused end-customer accounts.

## Quick estimate script

`scripts/estimate_credits.py` computes a monthly estimate from a JSON scenario (storage rows, ingest/ETL runs per table per day with caps, row overage, Jupyter, workflows, AutoML, AI ops, Everywhere accounts).

```bash
python3 scripts/estimate_credits.py --example > scenario.json   # edit numbers
python3 scripts/estimate_credits.py scenario.json
```
Treat output as a planning estimate; AI model-processing and document costs depend on your Rate Card and are inputs you supply.

Related: `domo-code-engine` (consumes no credits), `domo-everywhere-embed`, `domo-procode-apps` (AppDB sync).
