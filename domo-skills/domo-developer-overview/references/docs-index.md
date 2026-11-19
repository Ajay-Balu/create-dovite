# Domo Developer Portal: sidebar index (English, 536 pages)

Source: https://www.domo.com/docs/_llms/en/developer-portal.txt (fetched 2026-11-19).
Append `.md` to portal URLs for markdown. Base: https://www.domo.com/docs/portal/

The sidebar sections: Getting Started, API Reference, Build Apps, Automate Actions, Partner Developers,
AI Resources Guide, Connect Data, Embed Domo Everywhere, Govern Your Domo Instance, Other Resources,
Developer Topics, Domo SDK. Plus OpenAPI specs under https://www.domo.com/docs/openapi/.

## Getting Started
- Overview: Getting-Started/overview.md | SDKs: Getting-Started/sdks.md | Tools: Getting-Started/tools.md

## API Reference (3 families, see `domo-apis`)
- Overview: API-Reference/overview.md
- **App Framework APIs** (`API-Reference/app-framework-apis/`): AI-Service-Layer-API, Code-Engine-API, Data-API, Files-API, Documents-API, Groups-API, Queues-and-Tasks-API (Task Center), User-API, Workflows-API, AppDB-API (+ document/collection/sync endpoint pages under /docs/api-reference/appdb-api/)
- **Platform (OAuth) APIs**: API Authentication (`1845fc11bbe5d-api-authentication.md`), Get Access Token, Account, Activity Log, Cards, DataSet (+PDP), Embed Token (cards and dashboard), Group, Page, Projects and Tasks, Simple, Stream, User
- **Product APIs**: Activity Log, AI Services (classification, data extraction, embeddings, image-to-text, chat messages/streaming/tool calling, sentiment, text-to-BeastMode, text generation, text-to-SQL, summarization), Alerts, AppDB, Beast Modes, Cards, Certified Content, Code Engine (`Product-APIs/Code-Engine.md`), Connectors, Data Accounts, DataSets, Dataset Schema, Documents, Export to S3, Federated V1<->V2 migration, Files, Groups, Managing Dataset History, Pages, Query Dataset, KPI Card Image, Roles Governance, Remote Domostats, Scheduled Reports, SCIM, Search, Task Center, Users, Workflows

## Build Apps
- Overview: Apps/Overview.md | App Catalyst: Apps/App-Catalyst.md
- **App Framework** (`Apps/App-Framework/`): Welcome; Quickstart (Prerequisites, Key-Terminology, Setup-and-Installation, Starter-Kits, Best-Practices); Tutorials (React: Todo/AppDB, Mapbox, AI Book Recommender, Cross-App Broadcasting; JavaScript: HelloWorld, SugarForce, ReturnFlow, DynamicInfographic, Game Night Planner); Tools (domo-CLI, da-cli generator, domo-publish-CICD, domo-js, query, phoenix, toolkit); Guides (manifest, app-sessions, querying-data, appdb-inventory-tracker, Local-Development-with-Domo-CLI, public-assets, swap-designs, handling-data-updates, broadcasting, hitting-a-workflow, hitting-code-engine-from-an-app, design-guide, workflow-appdb-sync, clearing-out-collections, copy-assets-to-other-instances); Help (Troubleshooting, faq)
- **Pro-Code Editor** (`Apps/Pro-Code-Editor/`): getting-started-pro-code; Tutorials: manage-save-pro-code, pdf-export, stacked-bars
- **Domo Bricks** (`Apps/DDX-Bricks/`): Quickstart/overview, getting-started, Tutorials/intro; Guides: getting-data, DDX-Pro-Code (convert Bricks to pro-code)

## Automate Actions
- Overview: Automate-Actions/overview.md
- **Workflows**: overview, authentication, troubleshooting
- **Code Engine** (`Automate-Actions/Code-Engine/`): overview, global-vs-custom-packages, creating-packages, code-editor-overview, javascript-libraries, python-packages, common-use-cases, limitations-and-troubleshooting; Packages/Instance-Management, Packages/Cards-to-PDF

## Partner Developers
- Appstore: Partner-Developers/Domo-Marketplace/ (overview, marketplace-submission, marketplace-requirements, marketplace-data-resources, marketplace-support)
- Guides: submission-checklist, video-recording, partner-app-submission, paid-apps, getting-paid, building-an-app-overview, getting-data-overview, start-a-remote-workflow

## AI Resources Guide (`data-science/`)
- overview, ai-services (Domo.AI), jupyter, accelerators, scripting-tiles, data-science-tiles, autoML, webinars

## Connect Data (`Connectors/`)
- overview; Custom Connectors (connector-dev-studio, configure-authentication, configure-reports, process-data, publish-connector, examples, reference, ide-limitations); Writeback connectors; Connect via API (api-connections/overview, quickstart, format-data-to-import, import-and-export-data); on-premises-data; federated-queries; Cloud Amplifier

## Embed Domo Everywhere (`embed/`)
- overview, publishing-to-other-domo-users, embedded-edit-experiences
- `embed-in-sites-and-apps/`: overview, programmatic-filtering, filtering-options, url-parameters-in-embedded-content, dataset-switching, dynamic-iframe-height, code-examples, necessary-dependencies, embedded-scheduled-reports, app-embed-authentication, embedding-into-sites-and-web-portals

## Govern Your Domo Instance (`Governance/`)
- overview; Security: pdp, security, sso; Administration: data-management, content-management (Page API), user-management, activity-log

## Other
- Other-Resources: api-status, Developer-Forum, sample-projects
- Developer Topics (KB): custom connectors 360043439773, writeback 1500003318001, Domo APIs 360043439793
- Domo SDK: Python SDKs 360042936554, R SDK 360042923734 (https://www.domo.com/docs/s/article/<id>.md)
- OpenAPI: https://www.domo.com/docs/openapi/{framework,platform,product}/<name>.yaml (e.g. framework/codeengine.yaml, framework/appdb.yaml, product/codeengine.yaml)
- Release notes: https://www.domo.com/docs/s/article/Current-Release-Notes.md ; March 2026: https://www.domo.com/docs/s/article/March-2026-Release
- Other indexes: Knowledge Base (1,794 pages) https://www.domo.com/docs/_llms/en/knowledge-base.txt ; community https://community-forums.domo.com/main
