---
name: domo-everywhere-embed
description: Domo Everywhere for sharing Domo content outside your company - embedding cards, dashboards and apps (public and private), programmatic filtering, dataset switching, Domo Publish, embedded edit experiences, app embed authentication, and how Everywhere is billed. Use when a task involves external users, customer portals, white-labeling, or iframe embedding of Domo content.
---

# Domo Everywhere (embed, publish, white-label)

Tags: **[Documented]**, **[Inferred]**, **[Unverified]**. Researched 2026-11-19. Recipes and code: `references/embed-recipes.md`.

## The four delivery modes

| Mode | Who sees it | Auth | Use when |
|---|---|---|---|
| **Public embed** | Anyone with URL | None | Public sites/blogs; non-sensitive data only |
| **Private embed** | Authenticated viewers of your site/portal | SSO + PDP (cookies) or **programmatic filters** (cookie-less, single service account) | Customer portals, SaaS products |
| **Publish** | Customers get content copied into their own subscriber Domo instance | Domo accounts in subscriber instance | Per-customer instances, managed content distribution |
| **Embedded edit** | External users create/edit/save their own content in your embed | Identity Broker (SAML2, OIDC, JWT, OAuth2) | Self-service analytics for customers |

Domo Everywhere is a separately purchased capability (via CSM); Publish explicitly requires it. [Documented]

## Best way to embed privately

Prefer **server-side programmatic filtering** over PDP+cookie SSO: [Documented]
- Cookie-less, so unaffected by third-party cookie blocking (Safari already blocks; others following).
- One proxy "service account" (API client for that user) gets a token; **your server** creates the embed token with filters; viewers never need Domo accounts and never see client id/secret. Client-side token requests fail on CORS.
- No dedicated external instance needed (PDP+cookies path recommends embedding from a dedicated external instance with Whitelabel V1).
- Trade-off: **pricing shifts from user-based to impression/view-based** because one account proxies all viewers.

Three filter tiers (inner tiers can only narrow what outer tiers allow): [Documented]
1. Secure and invisible: PDP or server-side programmatic filters (the only tier safe for security).
2. Client-side, viewer-editable: JS API filters or `pfilters` URL params (exploration only, never security).
3. Domo interactions: page filters, named views, card-to-card filters.

## Hard limits and gotchas

- **Safari / iOS / cross-site-cookie blocking [Confirmed by maintainer]:** Domo's classic embed and app auth rely on third-party cookies. In Safari (all versions), iOS apps/WKWebViews, and any browser where cross-site cookies or cross-site tracking are disabled, **most cookie-based features stop working** (SSO+PDP embeds, app sessions via `ryuu_sid` cookie, embedded edit, nested Domo iframes). Design for that from day one: cookie-less **programmatic filtering** for embeds, header-based app auth (domo.js does it; keep ryuu.js current), `public-assets` + `ryuu_sid` for static files, and **test on Safari and on an iPhone/iPad** before go-live.
- Programmatic filters travel in a **JWT; browsers cap ~8 KB**. Huge `IN` lists overflow. Fix: add an aggregated/entitlement column in the data. [Documented]
- Omit `datasourceId`/`datasourceIds` and the filter hits **every dataset on the page**; if a dataset lacks the column, its cards fail to render. Always scope. [Documented]
- Inline Dataset Editor and Form Viewer apps cannot use programmatic filters (they rely on OAuth). [Documented]
- Standard filter operators: IN, NOT_IN, EQUALS, NOT_EQUALS, GREATER_THAN, GREAT_THAN_EQUALS_TO (sic), LESS_THAN, LESS_THAN_EQUALS_TO. SQL filters (`sqlFilters`) use WHERE syntax, backticked columns, single-quoted values. [Documented]
- To keep filters while linking between embedded dashboards, links must point to **your host domain**, not a Domo domain. [Documented]
- JS API filters need the **"Embed Authorized Domains" whitelist** (drives CSP). Messages are JSON-RPC 2.0. Pfilter URL changes force an iframe refresh (slower). [Documented]
- Previous embed framework URL is **deprecated March 31, 2027**; update embedded cards before then. [Documented]
- Embedded edit mapping changes (instances/attributes) are not self-service: they need a support ticket/engineering. [Documented]
- Dataset-switching targets must have a schema consistent with the original. [Documented]

## Embedding Domo *apps* (custom apps) inside other sites

Safari/iOS (and browsers with cross-site cookies disabled) block third-party cookies, so most cookie-based behavior breaks there [Confirmed]. Do not rely on cookie auth. Combine: [Documented]
1. **Header auth**: read `window.__RYUU_SID__`, send `X-DOMO-Ryuu-Session`. The JS file must live in a `public-assets` folder. (domo.js does this automatically.)
2. **public-assets** folder for static, non-sensitive files (no auth; no Domo API access; no business logic).
3. **`ryuu_sid` query param** appended inside app code for non-sensitive resource URLs.
4. Ask the host site's IdP admin to whitelist `*.domoapps.*.domo.com` as a trusted origin (Okta, Azure AD, Ping, SailPoint, OneLogin, ForgeRock, Centrify, etc.).

## Iframe sizing

Embedded Domo posts `event.data.params.height` to the parent; set the iframe height from it (add a few px to avoid double scrollbars; match `event.source` when several iframes exist; validate `event.origin` yourself, the docs do not). See recipes.

## Credits and billing for Everywhere [Documented, Consumption Terms 10/7/2026]

- **Active End Customer Account: 3.2877 credits/day per account** (about 1,200/yr). Storage, activity and executions inside those accounts also consume credits.
- **Card loads** (load, refresh, drill, filter of a card/app/visual, platform or embedded) are combined and capped at the annual amount in the Service Order. No per-load rate is listed.
- See `domo-credit-consumption`.

## Decision shortcuts

- External viewers, no Domo accounts, row-level rules in your code -> private embed + programmatic filters.
- Each customer needs its own data silo/instance -> Publish (+ Instance Management package for provisioning).
- Customers must build/alter content -> embedded edit with Identity Broker.
- Same dashboard, different data per tenant without a combined master dataset -> dataset switching.
- Public marketing page -> public embed, aggregate data only.

Sources: https://www.domo.com/docs/portal/embed/overview.md and subpages (programmatic-filtering, filtering-options, dataset-switching,
dynamic-iframe-height, app-embed-authentication, publishing-to-other-domo-users, embedded-edit-experiences);
https://www.domo.com/consumption-terms
