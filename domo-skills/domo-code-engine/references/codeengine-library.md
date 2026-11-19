# Code Engine library and recipes

Sources: javascript-libraries.md, creating-packages.md, global-vs-custom-packages.md, python-packages.md. [Documented unless marked]

## Preinstalled JavaScript libraries
| Library | Import | Purpose |
|---|---|---|
| `codeengine` | `require("codeengine")` | Accounts, execution details, user lookups, Domo API calls |
| `axios` | `require("axios")` or `codeengine.axios` | External HTTP |
| `googleAuthLibrary` | `require("google-auth-library")` or `codeengine.googleAuthLibrary` | Google auth (JWT, GoogleAuth, OAuth2Client) |
No versions listed. Only this limited set exists.

## Method details
- `getAccount(accountAlias)`: mapped account with decrypted credentials and a current access token; caller must have access; expired tokens are refreshed first; for Account-type inputs pass the account's ID instead of an alias. Credentials are in `account.properties` (property names depend on the account type; the docs' two examples differ: check yours).
- `getExecutionInformation()`: synchronous (not a Promise).
- `getUserAuthorization(accountTemplateId)`: 404 if the user never authorized that template.
- `sendRequest(method, url, body, headers, contentType)`: product APIs as the running user.

## Recipe A: Domo API as the user
```javascript
const codeengine = require('codeengine');
async function getDatasetStatus(dataSetId) {
  return codeengine.sendRequest('GET',
    `/api/data/v3/datasources/${dataSetId}?part=core,permission,status`);   // part list from docs example
}
```

## Recipe B: external API with stored credentials (pattern from the Twilio example; adapt names to your Account type)
```javascript
const codeengine = require('codeengine');
async function sendSms(to, from, body) {
  const props = await codeengine.getAccount('Twilio').then(a => a.properties);   // docs example reads SID and TOKEN
  const auth = Buffer.from(`${props.SID}:${props.TOKEN}`).toString('base64');
  const res = await codeengine.axios(
    `https://api.twilio.com/2010-04-01/Accounts/${props.SID}/Messages.json`,
    { method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({ To: to, From: from, Body: body }).toString() });
  return res.data;     // axios rejects non-2xx; wrap in try/catch if you need custom errors
}
```
[Inferred]: the exact `axios` option names (`data` vs `body`) follow normal axios; the docs describe the call but not every option. Test.

## Recipe C: Google service account
Load private key from account properties; if newlines are escaped (`\\n`), replace with real newlines before constructing `JWT`/`GoogleAuth`. OAuth user-consent and API-key flows are not covered by the Domo page.

## Recipe D: return one structured object
```javascript
async function summarize(dataSetId) {
  const meta = await codeengine.sendRequest('GET', `/api/data/v3/datasources/${dataSetId}?part=core`);
  // Inspect the real response shape first (console.log it); field names below are placeholders.
  return { id: dataSetId, details: meta };   // set Output type = Object (open) or define children
}
```

## Python
Standard library plus boto3, botocore, certifi, numpy, pandas, requests. Heavy pandas work is still bound by 1 GB / 5 min; move large jobs to Jupyter. List of stdlib modules available includes asyncio, base64, collections, csv, datetime, decimal, hashlib, itertools, json, logging, math, os, pathlib, re, socket, sqlite3, statistics, subprocess, threading, time, urllib, uuid, xml, zipfile.

## Typing cheat sheet
Function params and outputs support exactly these 15 types [Confirmed by maintainer]:
`ACCOUNT, BOOLEAN, DATASET, DATE, DATE-TIME, DECIMAL, DOCUMENT COLLECTION, DURATION, FILE, GROUP, NUMBER, OBJECT, PERSON, TEXT, TIME`.
- Arrays: set the parameter as a list of one of the types. Structures: OBJECT (open or with defined children).
- ACCOUNT/DATASET/GROUP/PERSON arrive as ID strings; treat DOCUMENT COLLECTION and FILE the same way until verified [Inferred].
- The Domo docs' editor page omits DOCUMENT COLLECTION and FILE; trust the list above.
- In app manifests (`packagesMapping`) the docs show lower-camel names: `boolean, date, dateTime, decimal, duration, number, object, person, dataset, group, text, time`. The manifest spellings for account, file and document collection are not documented. [Unverified]

## Troubleshooting
1. Function missing in editor list -> **Rescan Functions**.
2. Cannot save function -> missing data types.
3. Workflow mapping errors -> lists/objects typing; native types need ID strings.
4. 403/404 on accounts -> caller lacks access to the Account or template authorization.
5. Silent failure -> a `.catch(console.error)` swallowed the error; rethrow.
6. App call returns nothing -> not wired on card, or alias/param names differ from manifest.
7. Timeout -> 5-minute cap; split work or use Jupyter/DataFlow.

## Global packages worth knowing
Instance Management (Publish/Managed Embed provisioning: region + additional users) and Export Domo cards to PDF; a global package that starts a DataFlow; a global package to start a Workflow in a remote instance (see Partner guide `start-a-remote-workflow.md`).
