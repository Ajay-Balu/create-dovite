# Domo Developer Skills Pack

Skill files that teach Claude (or any AI coding agent) how Domo works, the best way to build on it,
its limits, and how it bills credits. Built from the Domo Developer Portal
(https://www.domo.com/docs/portal/Getting-Started/overview) and the Consumption Supplemental Terms
(https://www.domo.com/consumption-terms, last updated 10/7/2026 on the page). Research date: 2026-11-19.

## Contents

| Skill | Covers |
|---|---|
| `domo-app-planning/` | Requirements -> recommendations: questions to ask, signal-to-solution rules (Code Engine, Data API vs SQL when embedded, AppDB, Workflows…), hand-off checklist |
| `domo-developer-overview/` | START HERE. Router: which Domo tool for which job, 13 hard rules, terminology, full docs sidebar index, known doc inconsistencies |
| `domo-procode-apps/` | Pro-code / custom apps: App Framework, Pro-Code Editor, manifest, domo.js, AppDB, CLI, sandbox limits, **device permissions (camera, mic, location, Bluetooth, NFC)** |
| `domo-everywhere-embed/` | Domo Everywhere: embed (public/private), programmatic filtering, dataset switching, Publish, embedded edit, app embed auth |
| `domo-apis/` | The 3 API types (App Framework, Platform/OAuth, Product): auth, base URLs, when to use which, catalog |
| `domo-code-engine/` | Code Engine and packages: runtimes, limits, global vs custom, `codeengine` library, invoking from apps/workflows/outside |
| `domo-credit-consumption/` | Credit rules per feature, caps, overages, cost-aware design, plus `scripts/estimate_credits.py` |

## Install

**create-dovite projects get these automatically** in `.claude/skills/`, referenced from `AGENTS.md` / `CLAUDE.md`. The copy in this repo (`domo-skills/`) is the source of truth; edit here and republish.

**Claude Code / Claude (Agent Skills format):** copy each folder into `.claude/skills/` (project) or
`~/.claude/skills/` (personal). Each folder has a `SKILL.md` with `name` + `description` frontmatter;
`references/` files load on demand.

**Other agents (Cursor, Codex, Copilot, Gemini CLI, etc.):** add to `AGENTS.md` / `CLAUDE.md` / rules file:

```
For any Domo task, read domo-skills/domo-developer-overview/SKILL.md first, then the
specific skill it points to. Do not guess Domo manifest keys or API paths; check the skill's
references, and mark anything not covered there as unverified.
```

## Confidence legend (used inside the skills)

- **[Documented]** stated on a Domo docs page we fetched.
- **[Inferred]** reasonable reading of the docs or general web-platform behavior, not stated by Domo.
- **[Unverified]** mentioned by Domo without enough detail. Test before relying on it.
- **[Confirmed]** stated by the project maintainer from hands-on use; overrides conflicting docs.

## Known gaps worth closing

1. Device-permission flags: key names and boolean syntax are confirmed by the maintainer; the default when omitted and the device/browser support matrix are still undocumented. See `domo-procode-apps/references/device-permissions.md`.
2. Code Engine consumes no credits (maintainer-confirmed). Credit rates for raw API calls, AppDB and Pro-Code app hosting are not on the terms page; check your Rate Card.
3. Manifest key spellings are resolved (`mapping`|`datasetsMapping`, `collections`|`collectionsMapping`, `workflowMapping`, `packagesMapping`). See `domo-developer-overview/references/doc-inconsistencies.md`.
