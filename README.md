# EVES Reporting

A React 19 / TypeScript dashboard using Next.js App Router conventions. Sites runs the app through Vinext on Cloudflare Workers; the included Vercel configuration builds it with Next.js 16.

## Routes

- `/reports/project-tags`: persistent project tag CRUD, site and charger mappings, search, filtering and CSV export.
- `/reports/regulatory`: agency/report/funding selection; quarter, month and custom periods; real XLSX and CSV/ZIP downloads.
- `/reports/charging-sessions`: sessions, metrics, filters, chart, exports and record details.
- `/reports/interval-load-profile`: interval data, weighted power metrics and chart.
- `/reports/throughput`: infrastructure and throughput snapshot.
- `/`: uptime summary and downtime event details.

## Architecture

- `app/globals.css`: EVES semantic tokens and responsive product styles.
- `components/ui`: existing accessible UI primitives.
- `components/eves`: shell, reusable reporting UI and feature components.
- `lib/eves`: types, validation, report logic, exports, reference data and storage adapter.
- `app/api/tags/route.ts`: validated persistent tag operations, origin checks and optimistic concurrency.
- `db/schema.ts`, `drizzle/`: schema and generated migrations.

## Data provenance and limits

Report records were read from the user-provided original UI on September 7, 2026. They are explicitly labeled reference data; there is no live charger, OCPP, billing, email or agency-submission integration. The original sample values are preserved even when internally inconsistent. Summary metrics in the new UI are recomputed from the included rows and describe their calculation.

Snapshot sizes: 25 charging sessions, 42 intervals, 48 infrastructure rows, 48 uptime rows, and 21 downtime events. The three original tags and their mapped site capacities are initial reference records. Tag changes persist in D1; report snapshots are immutable. Mapping charger numbers are selection labels, not inferred live OCPP IDs.

The original interval column labeled `Energy Delivered (kW)` is displayed as `Energy delivered (kWh)`, with a visible disclosure. No numeric conversion is performed. Operational summary snapshots are included in regulatory exports only when the complete September 1–7, 2026 period is selected. Events missing a year are interpreted within the captured 2026 reference year. Site/chart averages are explicitly labeled as unweighted where applicable.

Regulatory files are working exports, not certified agency submissions. Contact records and official agency templates were not provided. Excel files contain a Read me sheet with scope and limitations. Multiple CSVs include the same metadata in a ZIP. No email is sent or simulated.

## Local development

Install dependencies with `npm ci`. Configure the local DB binding and apply generated migrations to the local D1 database before exercising saved tag operations. Use `npm run dev` in a standard development environment. In ChatGPT Work use the supported Sites preview workflow.

Validation commands: `npm run typecheck`, `npm run build` (Sites), `npm run build:vercel` (Vercel).

## Deploy to Vercel

Import this source as a Next.js project. `vercel.json` chooses the Next.js build. Supply the three server-only values listed in `.env.example` to connect an existing Cloudflare D1 database over HTTPS, then apply the generated schema migrations to that database. Use a narrowly scoped D1 token. Without a configured database, tag operations show an unavailable state rather than silently discarding changes.

The Sites deployment is owner-private. When deploying elsewhere, configure deployment access protection or replace it with your organization's authentication before exposing stored records. This project does not implement user accounts or multi-tenant authorization.

For production EVES data, replace the reference dataset adapter with your authenticated service client and validate existing report schemas/calculations against the actual business contract. The original application source and APIs were unavailable, so this new implementation cannot establish backend parity with that deployment.
