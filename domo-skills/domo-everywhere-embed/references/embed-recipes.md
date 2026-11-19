# Embed recipes (from Domo docs)

All [Documented] in https://www.domo.com/docs/portal/embed/ pages unless marked.

## 1. Programmatic filtering flow
1. Iframe `src` points to **your server**; server swaps in the Domo domain and submits a self-posting HTML form.
2. Create an API client for the proxy user; share the cards/pages with that user. Env: `CLIENT_ID`, `CLIENT_SECRET`, `EMBED_ID` (5-char id from the embed dialog, not the URL id), `EMBED_TYPE`.
3. Server obtains an access token, then creates an embed token with filters (Embed Token API, Platform OAuth family: "Create an embed token (Cards)" / "(Dashboard)").
4. Define per-user filters server-side. Never trust a client-sent filter.

Standard filter:
```json
"filters": [{"column": "Region", "operator": "IN", "values": ["West"], "datasourceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}]
```
SQL filter:
```json
"sqlFilters": [{"sqlFilter": "`Region` IN ('WEST')", "datasourceIds": ["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"]}]
```
Limits: ~8 KB JWT; unscoped datasource -> applies to all datasets on page.

## 2. Dataset switching (server-side config)
```js
visualization1: {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  embedId: process.env.EMBED_ID1,
  datasetRedirects: { "<original-dataset-id>": "<target-dataset-id>" },
  filters: [ { "column": "Color", "operator": "IN", "values": ["Red"] } ]
}
```
(The docs' second example is missing a comma between redirect entries; fix when copying.)

## 3. JS API filter message (client-side, exploration only)
Events: `/v1/onFrameSizeChange`, `/v1/onFiltersChange`, `/v1/onAppData` (output; App Studio/Dashboard/Card); `/v1/onAppReady` (output; App Studio only); `/v1/filters/apply` (input; all three); `/v1/appData/apply` (input; App Studio only).
```json
{ "id": "setFilters123", "jsonrpc": "2.0", "method": "/v1/filters/apply",
  "params": { "filters": [ { "column": "name", "operand": "IN", "values": ["ABC"] } ] } }
```
App Studio URL param `overrideFilters=true` makes the nested app wait for the parent's `/v1/filters/apply` (send an explicit empty state if no filters).
Prereq: populate "Embed Authorized Domains".

## 4. Dynamic iframe height
```html
<script>
window.addEventListener("message", (event) => {
  // add: if (event.origin !== "https://public.domo.com") return;   [Inferred hardening; docs omit it]
  const frames = document.getElementsByTagName("iframe");
  for (const f of frames) {
    if (f.contentWindow === event.source && event.data?.params?.height) {
      f.style.height = (parseInt(event.data.params.height, 10) + 15) + "px";
    }
  }
});
</script>
```
Pick the origin that matches your embed (public.domo.com for public, your instance/white-label domain for private).

## 5. App embed authentication
```js
document.body.onload = () => {
  const sessionId = window.__RYUU_SID__;
  fetch(`/domo/environment/v1`, { method: 'GET',
    headers: { 'X-DOMO-Ryuu-Session': sessionId, 'content-type': 'application/json' } })
    .then(r => r.json()).then(console.log);
};
```
File must be under `public-assets/`. Whitelist `*.domoapps.*.domo.com` at the IdP.

## 6. Embedded edit (Identity Broker)
- Gather and send to CSM: instance URL, auth methods, routing attribute, attribute->end-customer-account mapping.
- Domo returns: Identity Broker URL, certificate, JWT signing secret.
- In each end customer account: Admin > Security > SSO > Manual Configuration; IdP endpoint URL and Entity ID = Identity Broker URL; upload cert; enable "Use SAML Relay State to redirect".
- JWT: `/jwt?token=...` (GET or POST body); optional `destination` = `/page/{id}`, `/app-studio/{id}`, `/app-studio/{id}/pages/{pageId}`. Required claims `sub` (email), routing attribute key, `exp` (epoch), `jti` (UUID). Sign HS256 with the provided secret. Role must exactly match a valid Domo role; employee ID alphanumeric; hireDate YYYY-MM-DD.
- SAML2: IdP assertion endpoint `{{identitybrokerURL}}/auth/saml`.

## 7. Provisioning with Code Engine (Instance Management package)
`provisionInstance(customerName, domainPrefix, configId, templateId, region, keyAttribute, additionalUsers)` -> POST `/api/publish/v2/controlcenter/subscribers`; `getInstanceTemplates()` -> GET `/api/publish/v2/org-templates`. Regions: US, EU, OR, CA, AU, JP, AZURE. customerName: starts alphanumeric, letters/numbers/dashes, no double dash; domainPrefix+customerName <= 49 chars; at least one additional user (an admin). Cards-to-PDF package also exists.
