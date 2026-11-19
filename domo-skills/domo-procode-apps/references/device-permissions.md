# Device permissions for Domo pro-code apps (camera, mic, location, Bluetooth, NFC)

## Confirmed manifest syntax [Confirmed by maintainer, 2026-11-19]

Add these as **top-level booleans** in `manifest.json`, next to `name`, `version`, `mapping`, etc.:

```json
"allowCamera": true,
"allowBluetooth": false,
"allowMic": false,
"allowGeolocation": false,
"allowNFC": false
```

| Key | Enables | Typical use |
|---|---|---|
| `allowCamera` | Camera access | QR/barcode scanning, photo capture |
| `allowMic` | Microphone access | Voice input |
| `allowGeolocation` | Location | Location-based analytics, nearest-site lookups |
| `allowBluetooth` | Bluetooth | Connecting to nearby devices |
| `allowNFC` | NFC | Tag reads |

Rules of thumb: set only what the app needs to `true`; write the unused ones as `false` explicitly (least privilege, self-documenting).
Remember: `bump version -> domo publish -> re-save / recreate the card` so the new design settings apply.

## What Domo documents [Documented]

Sources: https://www.domo.com/product/new-features/pro-code-components-api-updates (GA, March 2026) and https://www.domo.com/docs/s/article/March-2026-Release
- Pro Code components can "request access to browser peripheral APIs through Boolean properties in the manifest" (`allowGeolocation`, `allowCamera`, `allowMic`, `allowBluetooth`, `allowNFC`).
- Cited use cases: camera for QR code scanning, geolocation for location-based analytics, microphone for voice input.
- End users opt in and control their own device permissions (browser/OS prompt still appears).
- Same release: Launch Form + Ask-Reply state syncing, MessageChannel-based app bridge, enforced message typing, timeouts, automatic user context.
- The main manifest guide (App-Framework/Guides/manifest.md) and the Nov 2026 release notes do not list these flags; the syntax above comes from the maintainer.

## Still undocumented [Unverified]

- Default value when a flag is omitted (assume off).
- Which clients honor each flag (desktop browsers, Domo iOS/Android apps, App Studio, embedded/public contexts, Pro-Code Editor preview, `domo dev` on localhost).
- Whether the flags map to the iframe `allow` attribute / Permissions-Policy.

## Using the capabilities in code [Inferred, standard web APIs]

Trigger from a user gesture (button click), handle denial, and feature-detect:

- Camera/mic: `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`
- Location: `navigator.geolocation.getCurrentPosition(ok, err)`
- Bluetooth: Web Bluetooth `navigator.bluetooth.requestDevice(...)`
- NFC: Web NFC `new NDEFReader().scan()`

Errors: `NotAllowedError` (denied or blocked by policy), `NotFoundError` (no device), `NotSupportedError` or undefined API (unsupported browser).
Secure context (https) is required; Domo serves apps over https. Test in a published card, not only on `http://localhost:3000`.

## Browser support reality check (general web platform knowledge, not Domo) [Inferred]

- Camera, mic, geolocation: broadly supported on desktop and mobile browsers.
- Web Bluetooth: Chromium-based browsers only (Chrome, Edge, Opera); not Safari/iOS, not Firefox.
- Web NFC: Chrome on Android only; not iOS, not desktop.
- Mobile in-app web views can restrict these APIs regardless of manifest flags. If the Domo mobile app is a target, test there and provide a fallback (e.g. typed code instead of QR scan).

## Security and privacy guidance

- Each `true` flag widens what the app can ask of the user's device. Keep it minimal.
- Do not send raw camera/mic streams or precise location to third parties without clear purpose and consent; process in the browser where possible.
- Do not store device-derived personal data in AppDB without a retention plan. With sync enabled it becomes dataset content (and a table update that costs credits).
- Explain why each permission is needed in the UI before the browser prompt appears.
